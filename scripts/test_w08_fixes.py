import os
import sys
import unittest
import numpy as np
from PIL import Image

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT_DIR, "backend-ai"))
sys.path.insert(0, os.path.join(ROOT_DIR, "scripts"))

from app.services.catvton_mask_refiner import (  # noqa: E402
    ATR_MAPPING,
    DENSE_INDEX_MAP,
    LIP_MAPPING,
    preprocess_cloth_for_tryon,
    refined_cloth_agnostic_mask,
)
from w08_frozen_manifest import verify_manifest  # noqa: E402


class TestW08ReproAndMaskRefiner(unittest.TestCase):
    def test_frozen_manifest_sha256_integrity(self):
        ok, errs = verify_manifest()
        self.assertTrue(ok, f"Manifest SHA-256 verification failed: {errs}")

    def test_refined_mask_preserves_hand_bag_hair_and_hip_boundary(self):
        h, w = 256, 192
        dp = np.zeros((h, w), dtype=np.uint8)
        lip = np.zeros((h, w), dtype=np.uint8)
        atr = np.zeros((h, w), dtype=np.uint8)

        # Mo phong vung than ao (y: 60..145, x: 55..135)
        dp[60:145, 55:135] = 1  # torso
        lip[60:145, 55:135] = LIP_MAPPING["Upper-clothes"]
        atr[60:145, 55:135] = ATR_MAPPING["Upper-clothes"]

        # Mo phong toc ru xuong vai trai (y: 55..95, x: 55..72)
        lip[55:95, 55:72] = LIP_MAPPING["Hair"]
        atr[55:95, 55:72] = ATR_MAPPING["Hair"]

        # Mo phong tui xach che truoc nguc (y: 95..130, x: 95..125)
        atr[95:130, 95:125] = ATR_MAPPING["Bag"]

        # Mo phong ban tay cam tui (y: 85..102, x: 100..118)
        dp[85:102, 100:118] = DENSE_INDEX_MAP["right hand"][0]

        # Mo phong quan toi mau bi SCHP nhan nham thanh Dress o phan dui (y: 155..220)
        dp[155:220, 60:130] = DENSE_INDEX_MAP["right thigh"][0]
        lip[155:220, 60:130] = LIP_MAPPING["Dress"]
        atr[155:220, 60:130] = ATR_MAPPING["Dress"]

        # Mo phong khoang trong giua khuyu tay chong hong va eo (x: 25..55, y: 80..120)
        # Canh tay ngoai o x: 18..30, y: 75..125
        dp[75:125, 18:30] = DENSE_INDEX_MAP["left big arm"][0]

        out = refined_cloth_agnostic_mask(
            Image.fromarray(dp), Image.fromarray(lip), Image.fromarray(atr), part="upper"
        )
        m = np.asarray(out) > 127

        # 1. Phai bao phu vung ao khong bi che
        self.assertGreater(m[70:90, 80:94].mean(), 0.9)
        # 2. Khong duoc xoa toc, tui xach, ban tay
        self.assertEqual(m[60:90, 58:68].sum(), 0, "Hair occlusion should stay protected")
        self.assertEqual(m[98:125, 98:122].sum(), 0, "Bag occlusion should stay protected")
        self.assertEqual(m[87:99, 102:116].sum(), 0, "Hand should stay protected")
        # 3. Khong duoc tran xuong vung dui bi nhan nham Dress
        self.assertEqual(m[170:210, 65:125].sum(), 0, "Lower thigh region should not be masked in upper mode")
        # 4. Khong duoc lap kin khoang nen trong giua khuyu tay va eo bang convex hull
        self.assertEqual(m[95:110, 35:50].sum(), 0, "Background gap inside bent elbow should stay unmasked")

    def test_white_on_white_contrast_padding(self):
        # Ao trang tren nen trang -> phai chuyen nen sang xam trung tinh
        white_cloth = Image.new("RGB", (400, 500), (253, 253, 253))
        arr = np.asarray(white_cloth).copy()
        arr[80:420, 90:310] = (242, 242, 242)  # than ao trang nhat
        white_cloth = Image.fromarray(arr)

        padded, triggered = preprocess_cloth_for_tryon(white_cloth, target_size=(768, 1024))
        self.assertTrue(triggered)
        corner_px = padded.getpixel((5, 5))
        self.assertLess(corner_px[0], 240)

        # Ao mau do -> giu nen trang goc
        red_cloth = Image.new("RGB", (400, 500), (255, 255, 255))
        r_arr = np.asarray(red_cloth).copy()
        r_arr[80:420, 90:310] = (180, 30, 30)
        red_cloth = Image.fromarray(r_arr)

        padded2, triggered2 = preprocess_cloth_for_tryon(red_cloth, target_size=(768, 1024))
        self.assertFalse(triggered2)
        self.assertEqual(padded2.getpixel((5, 5)), (255, 255, 255))


if __name__ == "__main__":
    unittest.main(verbosity=2)
