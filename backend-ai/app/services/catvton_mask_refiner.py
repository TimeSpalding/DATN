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


def _fill_small_garment_holes(
    mask_bool: np.ndarray,
    background_bool: np.ndarray,
    max_hole_area: int,
) -> np.ndarray:
    """Lap kin cac lo trong ben trong than ao nhung giu lai khoang nen trong giua tay chong hong."""
    filled = ndimage.binary_fill_holes(mask_bool)
    holes = filled & (~mask_bool)
    if not holes.any():
        return mask_bool
    labeled, n_comp = ndimage.label(holes)
    out = mask_bool.copy()
    for cid in range(1, n_comp + 1):
        comp = labeled == cid
        area = int(comp.sum())
        if area <= 0:
            continue
        non_bg_ratio = float((comp & (~background_bool)).sum()) / float(area)
        if area <= max_hole_area or non_bg_ratio > 0.35:
            out |= comp
    return out


def refined_cloth_agnostic_mask(
    densepose_mask: Image.Image,
    schp_lip_mask: Image.Image,
    schp_atr_mask: Image.Image,
    part: str = "upper",
) -> Image.Image:
    """
    Tao mat na da hieu chinh cho CatVTON (v2):
    1. Bo convex hull (hull_mask) khi part != 'overall' de tranh lap kin lo chong tay/tui xach.
    2. Mo rong bien nhe (~8px o anh 1024) ra vung nen va canh tay de xoa sach vien tay/co ao cu,
       dong thoi lap lo trong than ao va cho phep giu Coat/Dress o phan than tren khop dui.
    3. Tru lai toan bo vung bao ve (mat, ban tay, tui, toc, quan/vay) o buoc cuoi cung.
    """
    assert part in ["upper", "lower", "overall", "inner", "outer"], f"Invalid part: {part}"
    w, h = densepose_mask.size

    dp = np.array(densepose_mask)
    lip = np.array(schp_lip_mask)
    atr = np.array(schp_atr_mask)

    dilate_small_k = max(3, min(7, max(w, h) // 320))
    if dilate_small_k % 2 == 0:
        dilate_small_k += 1

    edge_dilate_k = max(5, min(19, max(w, h) // 60))
    if edge_dilate_k % 2 == 0:
        edge_dilate_k += 1

    # Nhan dong nho (~2% chieu cao) chi han khe ho vai/co ao, khong bac cau qua khuyu tay (~10-20% anh)
    close_k = max(7, min(23, max(w, h) // 48))
    if close_k % 2 == 0:
        close_k += 1

    # Lam min mep cuc bo thay vi kernel 41x41 cua ban goc
    blur_k = max(5, min(13, max(w, h) // 90))
    if blur_k % 2 == 0:
        blur_k += 1

    # 1. Vung bao ve manh: mat + ban tay + tui/phu kien (dem mong 3px de khong an vao co tay ao)
    dp_hands = part_mask_of(["hands", "feet"], dp, DENSE_INDEX_MAP)
    dp_hands = _dilate(dp_hands, dilate_small_k, iterations=1)
    schp_arms = part_mask_of(["Left-arm", "Right-arm"], atr, ATR_MAPPING) | part_mask_of(["Left-arm", "Right-arm"], lip, LIP_MAPPING)

    hands_protect = dp_hands | (dp_hands & schp_arms)
    face_protect = part_mask_of("Face", lip, LIP_MAPPING) | part_mask_of("Face", atr, ATR_MAPPING)
    bag_protect = part_mask_of(["Bag", "Glove"], atr, ATR_MAPPING) | part_mask_of(["Glove"], lip, LIP_MAPPING)
    bag_protect = _dilate(bag_protect, dilate_small_k, iterations=1)

    strong_protect = hands_protect | face_protect | bag_protect

    # 2. Vung bao ve toc, phu kien va trang phuc khong thuoc vung thu (bo Scarf vi hay gan nham len co ao)
    body_protect = part_mask_of(PROTECT_BODY_PARTS[part], lip, LIP_MAPPING) | part_mask_of(PROTECT_BODY_PARTS[part], atr, ATR_MAPPING)
    hair_protect = part_mask_of(["Hair"], lip, LIP_MAPPING) | part_mask_of(["Hair"], atr, ATR_MAPPING)
    cloth_protect = (
        part_mask_of(PROTECT_CLOTH_PARTS[part]["LIP"], lip, LIP_MAPPING)
        | part_mask_of(PROTECT_CLOTH_PARTS[part]["ATR"], atr, ATR_MAPPING)
    )
    acc_parts = ["Hat", "Sunglasses", "Left-shoe", "Right-shoe", "Socks"]
    acc_protect = part_mask_of(acc_parts, lip, LIP_MAPPING) | part_mask_of(acc_parts, atr, ATR_MAPPING)

    # Uoc luong khop dui truoc de phan biet Dress/Skirt nham tren than ao voi phan than duoi
    y_hip_cut = h
    if part == "upper":
        thighs = part_mask_of(["thighs", "legs"], dp, DENSE_INDEX_MAP)
        thigh_ys = np.where(thighs)[0]
        if len(thigh_ys) >= max(50, int(0.001 * w * h)):
            y_hip_cut = int(np.percentile(thigh_ys, 5)) + int(0.03 * h)

        # Loai cac dom nhieu Pants/Skirt nam hoan toan phia tren khop dui hoac qua nho (ao toi mau bi nhan nham)
        if cloth_protect.any():
            labeled_cp, n_cp = ndimage.label(cloth_protect)
            clean_cp = np.zeros_like(cloth_protect, dtype=bool)
            min_cp_area = max(64, int(0.01 * w * h))
            for cid in range(1, n_cp + 1):
                comp = labeled_cp == cid
                ys_c = np.where(comp)[0]
                if len(ys_c) == 0:
                    continue
                if y_hip_cut < h:
                    if ys_c.max() >= y_hip_cut and len(ys_c) >= max(32, int(0.002 * w * h)):
                        clean_cp |= comp
                elif len(ys_c) >= min_cp_area:
                    clean_cp |= comp
            cloth_protect = clean_cp

    all_protect = strong_protect | body_protect | hair_protect | cloth_protect | acc_protect

    # 3. Vung mat na muc tieu
    strong_mask = (
        part_mask_of(REFINED_MASK_CLOTH_PARTS[part], lip, LIP_MAPPING)
        | part_mask_of(REFINED_MASK_CLOTH_PARTS[part], atr, ATR_MAPPING)
    )
    if part == "upper":
        dress_mask = part_mask_of(["Dress"], lip, LIP_MAPPING) | part_mask_of(["Dress"], atr, ATR_MAPPING)
        below_hip = np.zeros((h, w), dtype=bool)
        below_hip[min(y_hip_cut, h) :, :] = True
        strong_mask = strong_mask | (dress_mask & (~below_hip))

    background = part_mask_of(["Background"], lip, LIP_MAPPING) & part_mask_of(["Background"], atr, ATR_MAPPING)
    mask_dense = part_mask_of(MASK_DENSE_PARTS[part], dp, DENSE_INDEX_MAP)
    mask_dense = _dilate(mask_dense, dilate_small_k, iterations=2)
    if part in ("upper", "overall", "outer"):
        mask_dense = mask_dense | (schp_arms & (~hands_protect))

    mask_area = (strong_mask | mask_dense) & (~all_protect)
    # Mo rong bien ra vung nen/canh tay de tranh sot vien 2-5px cua tay ao hoac co ao cu
    mask_area = _dilate(mask_area, edge_dilate_k, iterations=1)
    mask_area = _close_holes(mask_area, close_k)
    mask_area = _fill_small_garment_holes(mask_area, background, max_hole_area=max(64, int(0.004 * w * h)))
    mask_area = _feather_and_threshold(mask_area, blur_k, threshold=105)
    mask_area = mask_area | strong_mask

    # 4. Chan bien duoi khi part == 'upper', nhung van giu tron ven ao khoac (Coat) neu ATR/LIP khop than ao
    if part == "upper" and y_hip_cut < h:
        strict_upper = (
            part_mask_of(["Upper-clothes", "Coat"], lip, LIP_MAPPING)
            & part_mask_of(["Upper-clothes", "Coat"], atr, ATR_MAPPING)
        )
        below_cut = np.zeros_like(mask_area, dtype=bool)
        below_cut[min(y_hip_cut, h) :, :] = True
        mask_area = mask_area & (~(below_cut & (~strict_upper)))

    # 5. Tru lai toan bo vung bao ve o buoc CUOI CUNG sau khi mo rong bien va lam muot
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
