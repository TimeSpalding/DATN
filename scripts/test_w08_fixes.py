import json
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
from benchmark_vton_profiling import load_frozen_manifest  # noqa: E402
from w08_frozen_manifest import MANIFEST_JSON, verify_manifest  # noqa: E402


class TestW08ReproAndMaskRefiner(unittest.TestCase):
    def test_frozen_manifest_sha256_integrity(self):
        ok, errs = verify_manifest()
        self.assertTrue(ok, f"Manifest SHA-256 verification failed: {errs}")

    def test_benchmark_loader_order_and_seed_invariance(self):
        pairs = load_frozen_manifest(MANIFEST_JSON)
        self.assertEqual(len(pairs), 20)
        ids = [p["pair_id"] for p in pairs]
        self.assertEqual(len(set(ids)), 20)

        # Kiem tra moi cap co category tuong minh va pair_seed doc lap voi thu tu duyet
        with open(MANIFEST_JSON, "r", encoding="utf-8") as f:
            raw = json.load(f)
        seed_map = {r["pair_id"]: r["pair_seed"] for r in raw["pairs"]}
        for p in pairs:
            self.assertIn(p["category"], {"upper", "lower", "overall"})
            self.assertEqual(p["pair_seed"], seed_map[p["pair_id"]])

    def test_refined_mask_preserves_hand_bag_hair_and_hip_boundary(self):
        h, w = 256, 192
        dp = np.zeros((h, w), dtype=np.uint8)
        lip = np.zeros((h, w), dtype=np.uint8)
        atr = np.zeros((h, w), dtype=np.uint8)

        dp[60:145, 55:135] = 1
        lip[60:145, 55:135] = LIP_MAPPING["Upper-clothes"]
        atr[60:145, 55:135] = ATR_MAPPING["Upper-clothes"]

        lip[55:95, 55:72] = LIP_MAPPING["Hair"]
        atr[55:95, 55:72] = ATR_MAPPING["Hair"]

        atr[95:130, 95:125] = ATR_MAPPING["Bag"]
        dp[85:102, 100:118] = DENSE_INDEX_MAP["right hand"][0]

        dp[155:220, 60:130] = DENSE_INDEX_MAP["right thigh"][0]
        lip[155:220, 60:130] = LIP_MAPPING["Dress"]
        atr[155:220, 60:130] = ATR_MAPPING["Dress"]

        dp[75:125, 18:30] = DENSE_INDEX_MAP["left big arm"][0]

        out = refined_cloth_agnostic_mask(
            Image.fromarray(dp), Image.fromarray(lip), Image.fromarray(atr), part="upper"
        )
        m = np.asarray(out) > 127

        self.assertGreater(m[70:90, 80:94].mean(), 0.9)
        self.assertEqual(m[60:90, 58:68].sum(), 0, "Hair occlusion should stay protected")
        self.assertEqual(m[98:125, 98:122].sum(), 0, "Bag occlusion should stay protected")
        self.assertEqual(m[87:99, 102:116].sum(), 0, "Hand should stay protected")
        self.assertEqual(m[170:210, 65:125].sum(), 0, "Lower thigh region should not be masked in upper mode")
        self.assertEqual(m[95:110, 35:50].sum(), 0, "Background gap inside bent elbow should stay unmasked")

    def test_white_on_white_contrast_padding(self):
        white_cloth = Image.new("RGB", (400, 500), (253, 253, 253))
        arr = np.asarray(white_cloth).copy()
        arr[80:420, 90:310] = (242, 242, 242)
        white_cloth = Image.fromarray(arr)

        padded, triggered = preprocess_cloth_for_tryon(white_cloth, target_size=(768, 1024))
        self.assertTrue(triggered)
        self.assertLess(padded.getpixel((5, 5))[0], 240)

        red_cloth = Image.new("RGB", (400, 500), (255, 255, 255))
        r_arr = np.asarray(red_cloth).copy()
        r_arr[80:420, 90:310] = (180, 30, 30)
        red_cloth = Image.fromarray(r_arr)

        padded2, triggered2 = preprocess_cloth_for_tryon(red_cloth, target_size=(768, 1024))
        self.assertFalse(triggered2)
        self.assertEqual(padded2.getpixel((5, 5)), (255, 255, 255))

    def test_v2_fixes_chest_hole_coat_cutoff_and_sleeve_margin(self):
        h, w = 256, 192
        dp = np.zeros((h, w), dtype=np.uint8)
        lip = np.zeros((h, w), dtype=np.uint8)
        atr = np.zeros((h, w), dtype=np.uint8)

        # Ao khoac (Coat o LIP, Upper-clothes o ATR) phu xuong qua muc dui
        dp[55:155, 50:140] = 1
        lip[55:185, 50:140] = LIP_MAPPING["Coat"]
        atr[55:185, 50:140] = ATR_MAPPING["Upper-clothes"]
        dp[160:230, 58:132] = DENSE_INDEX_MAP["right thigh"][0]

        # Dom nhieu SCHP ben trong nguc ao (misclassified Scarf/Pants speck + thieu DensePose)
        lip[85:102, 85:105] = LIP_MAPPING["Scarf"]
        atr[85:102, 85:105] = ATR_MAPPING["Pants"]
        dp[85:102, 85:105] = 0

        # Canh tay SCHP can duoc mo rong vien ra Background (~2-4px) nhung van giu bao ve quan/chan o duoi
        lip[70:130, 35:48] = LIP_MAPPING["Left-arm"]
        atr[70:130, 35:48] = ATR_MAPPING["Left-arm"]

        out = refined_cloth_agnostic_mask(
            Image.fromarray(dp), Image.fromarray(lip), Image.fromarray(atr), part="upper"
        )
        m = np.asarray(out) > 127

        self.assertGreater(m[88:99, 88:102].mean(), 0.9, "Small internal misclassified torso hole should be filled")
        self.assertGreater(m[165:180, 70:120].mean(), 0.9, "Coat labeled Coat+Upper-clothes should not be cut off at hip")
        self.assertGreater(m[90:115, 33:35].mean(), 0.5, "Outer sleeve margin into Background should be included")
        self.assertEqual(m[200:225, 65:125].sum(), 0, "Thigh region below coat should stay unmasked")


if __name__ == "__main__":
    unittest.main(verbosity=2)
