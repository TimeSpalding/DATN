"""
Bo tien xu ly va hieu chinh mat na CatVTON cho các ca pose, mask va occlusion (Issue #20).
Giu duoc ca luong fallback theo PIL/scipy khi chay kiem thu cuc bo khong co opencv.
"""

from typing import Union
import numpy as np
from PIL import Image, ImageFilter

try:
    import cv2  # type: ignore
except ImportError:
    cv2 = None

from scipy import ndimage  # type: ignore

DENSE_INDEX_MAP = {
    "background": [0],
    "torso": [1, 2],
    "right hand": [3],
    "left hand": [4],
    "right foot": [5],
    "left foot": [6],
    "right thigh": [7, 9],
    "left thigh": [8, 10],
    "right leg": [11, 13],
    "left leg": [12, 14],
    "left big arm": [15, 17],
    "right big arm": [16, 18],
    "left forearm": [19, 21],
    "right forearm": [20, 22],
    "face": [23, 24],
    "thighs": [7, 8, 9, 10],
    "legs": [11, 12, 13, 14],
    "hands": [3, 4],
    "feet": [5, 6],
    "big arms": [15, 16, 17, 18],
    "forearms": [19, 20, 21, 22],
}

ATR_MAPPING = {
    "Background": 0, "Hat": 1, "Hair": 2, "Sunglasses": 3,
    "Upper-clothes": 4, "Skirt": 5, "Pants": 6, "Dress": 7,
    "Belt": 8, "Left-shoe": 9, "Right-shoe": 10, "Face": 11,
    "Left-leg": 12, "Right-leg": 13, "Left-arm": 14, "Right-arm": 15,
    "Bag": 16, "Scarf": 17,
}

LIP_MAPPING = {
    "Background": 0, "Hat": 1, "Hair": 2, "Glove": 3,
    "Sunglasses": 4, "Upper-clothes": 5, "Dress": 6, "Coat": 7,
    "Socks": 8, "Pants": 9, "Jumpsuits": 10, "Scarf": 11,
    "Skirt": 12, "Face": 13, "Left-arm": 14, "Right-arm": 15,
    "Left-leg": 16, "Right-leg": 17, "Left-shoe": 18, "Right-shoe": 19,
}

PROTECT_BODY_PARTS = {
    "upper": ["Left-leg", "Right-leg"],
    "lower": ["Right-arm", "Left-arm", "Face"],
    "overall": [],
    "inner": ["Left-leg", "Right-leg"],
    "outer": ["Left-leg", "Right-leg"],
}

PROTECT_CLOTH_PARTS = {
    "upper": {"ATR": ["Skirt", "Pants"], "LIP": ["Skirt", "Pants"]},
    "lower": {"ATR": ["Upper-clothes"], "LIP": ["Upper-clothes", "Coat"]},
    "overall": {"ATR": [], "LIP": []},
    "inner": {"ATR": ["Dress", "Coat", "Skirt", "Pants"], "LIP": ["Dress", "Coat", "Skirt", "Pants", "Jumpsuits"]},
    "outer": {"ATR": ["Dress", "Pants", "Skirt"], "LIP": ["Upper-clothes", "Dress", "Pants", "Skirt", "Jumpsuits"]},
}

# Goc trong CatVTON de upper chua ca Dress/Jumpsuits gay tran mask quan toi mau;
# ban refined chi lay Upper-clothes va Coat cho upper.
REFINED_MASK_CLOTH_PARTS = {
    "upper": ["Upper-clothes", "Coat"],
    "lower": ["Pants", "Skirt"],
    "overall": ["Upper-clothes", "Dress", "Pants", "Skirt", "Coat", "Jumpsuits"],
    "inner": ["Upper-clothes"],
    "outer": ["Coat"],
}

MASK_DENSE_PARTS = {
    "upper": ["torso", "big arms", "forearms"],
    "lower": ["thighs", "legs"],
    "overall": ["torso", "thighs", "legs", "big arms", "forearms"],
    "inner": ["torso"],
    "outer": ["torso", "big arms", "forearms"],
}


def part_mask_of(part: Union[str, list], parse: np.ndarray, mapping: dict) -> np.ndarray:
    if isinstance(part, str):
        part = [part]
    mask = np.zeros_like(parse, dtype=bool)
    for name in part:
        if name not in mapping:
            continue
        idx = mapping[name]
        if isinstance(idx, list):
            for i in idx:
                mask |= (parse == i)
        else:
            mask |= (parse == idx)
    return mask


def _dilate(mask_bool: np.ndarray, ksize: int, iterations: int = 1) -> np.ndarray:
    if ksize <= 1 or iterations <= 0:
        return mask_bool
    if cv2 is not None:
        kernel = np.ones((ksize, ksize), np.uint8)
        out = cv2.dilate(mask_bool.astype(np.uint8), kernel, iterations=iterations)
        return out > 0
    struct = np.ones((ksize, ksize), dtype=bool)
    return ndimage.binary_dilation(mask_bool, structure=struct, iterations=iterations)


def _close_holes(mask_bool: np.ndarray, ksize: int) -> np.ndarray:
    """Dong cac lo nho ben trong than ao ma khong bac cau qua khoang trong khuyu tay."""
    if ksize <= 1:
        return mask_bool
    if cv2 is not None:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ksize, ksize))
        closed = cv2.morphologyEx(mask_bool.astype(np.uint8), cv2.MORPH_CLOSE, kernel)
        return closed > 0
    yy, xx = np.ogrid[-ksize // 2 : ksize // 2 + 1, -ksize // 2 : ksize // 2 + 1]
    struct = (xx * xx + yy * yy) <= (ksize / 2.0) ** 2
    return ndimage.binary_closing(mask_bool, structure=struct)


def _feather_and_threshold(mask_bool: np.ndarray, ksize: int, threshold: int = 100) -> np.ndarray:
    if ksize <= 1:
        return mask_bool
    if cv2 is not None:
        blurred = cv2.GaussianBlur(mask_bool.astype(np.uint8) * 255, (ksize, ksize), 0)
        return blurred >= threshold
    sigma = max(1.0, ksize / 4.0)
    blurred = ndimage.gaussian_filter(mask_bool.astype(np.float32) * 255.0, sigma=sigma)
    return blurred >= threshold


def refined_cloth_agnostic_mask(
    densepose_mask: Image.Image,
    schp_lip_mask: Image.Image,
    schp_atr_mask: Image.Image,
    part: str = "upper",
) -> Image.Image:
    """
    Tao mat na da hieu chinh cho CatVTON:
    1. Bo convex hull (hull_mask) khi part != 'overall' de tranh lap kin lo chong tay/tui xach.
    2. Giam nhan lam mo vien va tru lai toan bo vung bao ve (toc, tui, ban tay, quan) sau cung.
    3. Tach Dress/Jumpsuits khoi strong_mask cua upper va chan bien duoi theo khop dui DensePose.
    """
    assert part in ["upper", "lower", "overall", "inner", "outer"], f"Invalid part: {part}"
    w, h = densepose_mask.size

    dp = np.array(densepose_mask)
    lip = np.array(schp_lip_mask)
    atr = np.array(schp_atr_mask)

    dilate_k = max(3, max(w, h) // 250)
    if dilate_k % 2 == 0:
        dilate_k += 1

    # Nhan dong nho (~1.5% chieu cao) chi han khe ho vai, khong bac cau qua khuyu tay (~10-20% anh)
    close_k = max(7, min(19, max(w, h) // 64))
    if close_k % 2 == 0:
        close_k += 1

    # Lam min mep cuc bo thay vi kernel 41x41 cua ban goc
    blur_k = max(5, min(13, max(w, h) // 90))
    if blur_k % 2 == 0:
        blur_k += 1

    # 1. Vung bao ve manh: mat + ban tay (DensePose hands khong bat buoc giao rong voi SCHP) + tui/phu kien
    dp_hands = part_mask_of(["hands", "feet"], dp, DENSE_INDEX_MAP)
    dp_hands = _dilate(dp_hands, dilate_k, iterations=1)
    schp_arms = part_mask_of(["Left-arm", "Right-arm"], atr, ATR_MAPPING) | part_mask_of(["Left-arm", "Right-arm"], lip, LIP_MAPPING)

    # Neu tay cam vat the (tui/coc), DensePose van giu duoc vung ban tay ngay ca khi SCHP bi nham
    hands_protect = dp_hands | (dp_hands & schp_arms)
    face_protect = part_mask_of("Face", lip, LIP_MAPPING) | part_mask_of("Face", atr, ATR_MAPPING)
    bag_protect = part_mask_of(["Bag", "Glove"], atr, ATR_MAPPING) | part_mask_of(["Glove"], lip, LIP_MAPPING)
    bag_protect = _dilate(bag_protect, dilate_k, iterations=1)

    strong_protect = hands_protect | face_protect | bag_protect

    # 2. Vung bao ve toc, phu kien va trang phuc khong thuoc vung thu
    body_protect = part_mask_of(PROTECT_BODY_PARTS[part], lip, LIP_MAPPING) | part_mask_of(PROTECT_BODY_PARTS[part], atr, ATR_MAPPING)
    hair_protect = part_mask_of(["Hair"], lip, LIP_MAPPING) | part_mask_of(["Hair"], atr, ATR_MAPPING)
    cloth_protect = (
        part_mask_of(PROTECT_CLOTH_PARTS[part]["LIP"], lip, LIP_MAPPING)
        | part_mask_of(PROTECT_CLOTH_PARTS[part]["ATR"], atr, ATR_MAPPING)
    )
    acc_parts = ["Hat", "Sunglasses", "Left-shoe", "Right-shoe", "Scarf", "Socks"]
    acc_protect = part_mask_of(acc_parts, lip, LIP_MAPPING) | part_mask_of(acc_parts, atr, ATR_MAPPING)

    all_protect = strong_protect | body_protect | hair_protect | cloth_protect | acc_protect

    # 3. Vung mat na muc tieu
    strong_mask = (
        part_mask_of(REFINED_MASK_CLOTH_PARTS[part], lip, LIP_MAPPING)
        | part_mask_of(REFINED_MASK_CLOTH_PARTS[part], atr, ATR_MAPPING)
    )
    background = part_mask_of(["Background"], lip, LIP_MAPPING) & part_mask_of(["Background"], atr, ATR_MAPPING)
    mask_dense = part_mask_of(MASK_DENSE_PARTS[part], dp, DENSE_INDEX_MAP)
    mask_dense = _dilate(mask_dense, dilate_k, iterations=2)

    # Bo sung vung co the tren ao + DensePose (nhung giu nguyen vung nen trong giua tay chong hong)
    mask_area = ((~all_protect) & (~background) & (strong_mask | mask_dense)) | (mask_dense & (~all_protect))

    # Chi dung morphological closing nho, khong dung convex hull cho upper
    mask_area = _close_holes(mask_area, close_k)
    mask_area = _feather_and_threshold(mask_area, blur_k, threshold=110)

    # Hop voi strong_mask (ao dai tay co tay hep de bi DensePose bo sot o co tay -> can strong_mask)
    mask_area = mask_area | strong_mask
    mask_area = _dilate(mask_area, dilate_k, iterations=1)

    # 4. Chan bien duoi khi part == 'upper' dua vao vung dui DensePose de tranh tran mask khi ao/quan den tiep mau
    if part == "upper":
        thighs = part_mask_of(["thighs", "legs"], dp, DENSE_INDEX_MAP)
        thigh_ys = np.where(thighs)[0]
        if len(thigh_ys) >= max(50, int(0.001 * w * h)):
            y_hip_cut = int(np.percentile(thigh_ys, 5)) + int(0.025 * h)
            # Chi cho phep giu phan duoi y_hip_cut neu ca LIP va ATR deu xac nhan la Upper-clothes
            strict_upper = part_mask_of(["Upper-clothes"], lip, LIP_MAPPING) & part_mask_of(["Upper-clothes"], atr, ATR_MAPPING)
            below_cut = np.zeros_like(mask_area, dtype=bool)
            below_cut[min(y_hip_cut, h) :, :] = True
            mask_area = mask_area & (~(below_cut & (~strict_upper)))

    # 5. Tru lai toan bo vung bao ve o buoc CUOI CUNG sau khi blur va dilate
    final_mask = mask_area & (~all_protect)

    return Image.fromarray((final_mask.astype(np.uint8)) * 255)


def preprocess_cloth_for_tryon(
    cloth_img: Image.Image,
    target_size: tuple[int, int] = (768, 1024),
    neutral_bg: tuple[int, int, int] = (232, 230, 224),
) -> tuple[Image.Image, bool]:
    """
    Chuan hoa kich thuoc va kiem tra nguy co ao trang tren nen trang.
    Neu goc anh la nen trang (>240) va phan trang phuc cung rat sang (>232),
    dem nen xam trung tinh nhat de Reference UNet bat duoc duong vien ao.
    """
    rgb = cloth_img.convert("RGB")
    arr = np.asarray(rgb, dtype=np.float32)
    h, w, _ = arr.shape
    patch = max(4, min(h, w) // 20)
    corners = np.concatenate([
        arr[:patch, :patch].reshape(-1, 3),
        arr[:patch, -patch:].reshape(-1, 3),
        arr[-patch:, :patch].reshape(-1, 3),
        arr[-patch:, -patch:].reshape(-1, 3),
    ], axis=0)
    corner_mean = float(corners.mean())

    # Uoc luong do sang vung giua (trang phuc)
    center = arr[h // 4 : (3 * h) // 4, w // 4 : (3 * w) // 4]
    center_bright_ratio = float((center.mean(axis=2) > 228.0).mean())

    white_on_white = (corner_mean > 240.0) and (center_bright_ratio > 0.60)
    bg_color = neutral_bg if white_on_white else (255, 255, 255)

    tw, th = target_size
    scale = min(tw / w, th / h)
    nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    resized = rgb.resize((nw, nh), Image.LANCZOS)

    canvas = Image.new("RGB", (tw, th), bg_color)
    canvas.paste(resized, ((tw - nw) // 2, (th - nh) // 2))

    # Neu ao trang nam tren nen trang san ben trong crop -> thay nen ngoai vien ao bang neutral_bg
    if white_on_white:
        c_arr = np.asarray(canvas, dtype=np.uint8).copy()
        is_pure_white = (c_arr[:, :, 0] > 246) & (c_arr[:, :, 1] > 246) & (c_arr[:, :, 2] > 246)
        # Chi floodfill tu 4 mep ngoai de khong doi mau ben trong mat ao
        seed = np.zeros((th, tw), dtype=bool)
        seed[0, :] = is_pure_white[0, :]
        seed[-1, :] = is_pure_white[-1, :]
        seed[:, 0] = is_pure_white[:, 0]
        seed[:, -1] = is_pure_white[:, -1]
        bg_mask = ndimage.binary_propagation(seed, mask=is_pure_white)
        c_arr[bg_mask] = neutral_bg
        canvas = Image.fromarray(c_arr)

    return canvas, white_on_white
