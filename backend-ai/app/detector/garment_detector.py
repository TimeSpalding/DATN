"""
app/detector/garment_detector.py
---------------------------------
Phát hiện và cắt trang phục bằng YOLOv8n ONNX Runtime (CPU-only).

Hỗ trợ cả mô hình 3 siêu lớp (DeepFashion2: upper, lower, dress)
và mô hình 46 lớp chi tiết (Fashionpedia: jacket, coat, shirt, pants, skirt, dress...).

Trách nhiệm:
  - Nhận 1 PIL.Image (ảnh in-the-wild hoặc catalog)
  - Chạy YOLOv8n ONNX để phát hiện BBox trang phục
  - Mở rộng mỗi BBox thêm PADDING_RATIO (mặc định 10%) để không bị chém lẹm cổ áo / gấu áo
  - Trả về danh sách DetectedGarment(crop_img, label, fine_label, confidence, bbox)
  - Fallback tự động: nếu conf < CONF_THRESHOLD → trả nguyên ảnh gốc (label="full", conf=0.0)
"""

import io
import logging
import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ─── ĐƯỜNG DẪN MODEL ─────────────────────────────────────────────────────────
_DEFAULT_MODEL_PATH = os.environ.get(
    "YOLO_ONNX_PATH",
    "/models/yolov8n_garment.onnx"
)

# ─── HYPERPARAMETERS ─────────────────────────────────────────────────────────
CONF_THRESHOLD = float(os.environ.get("YOLO_CONF_THRESHOLD", "0.35"))
IOU_THRESHOLD  = float(os.environ.get("YOLO_IOU_THRESHOLD",  "0.50"))
PADDING_RATIO  = float(os.environ.get("YOLO_PADDING_RATIO",  "0.10"))  # 10% mỗi cạnh
INPUT_SIZE     = int(os.environ.get("YOLO_INPUT_SIZE", "640"))        # 640 hoặc 320


class GarmentLabel(str, Enum):
    UPPER = "upper_clothes"
    LOWER = "lower_clothes"
    DRESS = "dress"
    FULL  = "full"  # Fallback: trả nguyên ảnh


@dataclass
class DetectedGarment:
    crop: Image.Image         # Ảnh PIL đã cắt
    label: GarmentLabel       # Siêu lớp (upper/lower/dress/full)
    fine_label: str           # Nhãn chi tiết (jacket, shirt, pants, dress, v.v.)
    confidence: float         # Score YOLO (0.0 nếu fallback)
    bbox: tuple[int, int, int, int] = field(default=(-1, -1, -1, -1))
    area_ratio: float = 0.0   # Diện tích BBox / diện tích ảnh gốc


# ─── LABEL MAPS ───────────────────────────────────────────────────────────────
# Bản đồ ánh xạ Fashionpedia 46 lớp → 3 siêu lớp + nhãn chi tiết
_FASHIONPEDIA_GARMENT_MAP = {
    # Upper clothes (Bao gồm cả áo khoác, áo mặc trong, áo len để xử lý layering)
    0: (GarmentLabel.UPPER, "shirt, blouse"),
    1: (GarmentLabel.UPPER, "top, t-shirt, sweatshirt"),
    2: (GarmentLabel.UPPER, "sweater"),
    3: (GarmentLabel.UPPER, "cardigan"),
    4: (GarmentLabel.UPPER, "jacket"),
    5: (GarmentLabel.UPPER, "vest"),
    9: (GarmentLabel.UPPER, "coat"),
    12: (GarmentLabel.UPPER, "cape"),
    # Lower clothes
    6: (GarmentLabel.LOWER, "pants"),
    7: (GarmentLabel.LOWER, "shorts"),
    8: (GarmentLabel.LOWER, "skirt"),
    # Dress & Full-body
    10: (GarmentLabel.DRESS, "dress"),
    11: (GarmentLabel.DRESS, "jumpsuit"),
}

# Bản đồ ánh xạ DeepFashion2 3 lớp
_DEEPFASHION2_MAP = {
    0: (GarmentLabel.UPPER, "upper_clothes"),
    1: (GarmentLabel.LOWER, "lower_clothes"),
    2: (GarmentLabel.DRESS, "dress"),
}


class GarmentDetector:
    """
    Wrapper quanh YOLOv8n ONNX Runtime.
    Singleton nạp một lần khi import. Tự động chuyển STUB nếu model chưa mount.
    """

    def __init__(self, model_path: str = _DEFAULT_MODEL_PATH):
        self._session = None
        self._model_path = model_path
        self._stub = False
        self._resolved_model_path = None
        self._load_model()

    def _resolve_model_path(self) -> Optional[str]:
        candidates = [
            self._model_path,
            os.path.join(os.path.dirname(__file__), "..", "..", "models", "yolov8n_garment.onnx"),
            os.path.join(os.getcwd(), "models", "yolov8n_garment.onnx"),
            "e:/DATN/backend-ai/models/yolov8n_garment.onnx",
            "/models/yolov8n_garment.onnx",
        ]
        for c in candidates:
            if c and os.path.exists(c):
                return os.path.abspath(c)
        return None

    def _load_model(self):
        resolved = self._resolve_model_path()
        if not resolved:
            logger.warning(
                "[GarmentDetector] ONNX model không tìm thấy tại '%s' hoặc các thư mục mặc định. "
                "Chạy ở chế độ STUB (luôn fallback toàn ảnh).",
                self._model_path,
            )
            self._stub = True
            return

        self._resolved_model_path = resolved
        try:
            import onnxruntime as ort

            opts = ort.SessionOptions()
            opts.inter_op_num_threads = 2
            opts.intra_op_num_threads = 4
            opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

            self._session = ort.InferenceSession(
                resolved,
                sess_options=opts,
                providers=["CPUExecutionProvider"],
            )
            self._input_name  = self._session.get_inputs()[0].name
            self._output_name = self._session.get_outputs()[0].name
            self._stub = False
            logger.info(
                "[GarmentDetector] Nạp ONNX model thành công từ '%s'. "
                "Input: %s, Default Size: %d",
                resolved, self._input_name, INPUT_SIZE,
            )
        except ImportError:
            logger.warning(
                "[GarmentDetector] onnxruntime chưa được cài. Chạy ở chế độ STUB."
            )
            self._stub = True
        except Exception as exc:
            logger.error("[GarmentDetector] Lỗi khi nạp ONNX: %s", exc)
            self._stub = True

    @staticmethod
    def _preprocess(img: Image.Image, size: int) -> tuple[np.ndarray, float, float, int, int]:
        orig_w, orig_h = img.size
        scale = min(size / orig_w, size / orig_h)
        new_w = int(round(orig_w * scale))
        new_h = int(round(orig_h * scale))
        resized = img.resize((new_w, new_h), Image.BILINEAR)

        canvas = Image.new("RGB", (size, size), (114, 114, 114))
        pad_x = (size - new_w) // 2
        pad_y = (size - new_h) // 2
        canvas.paste(resized, (pad_x, pad_y))

        arr = np.array(canvas, dtype=np.float32) / 255.0
        arr = arr.transpose(2, 0, 1)[np.newaxis]
        return arr, scale, pad_x, pad_y, orig_w, orig_h

    @staticmethod
    def _decode_output(
        output: np.ndarray,
        scale: float,
        pad_x: int,
        pad_y: int,
        orig_w: int,
        orig_h: int,
        conf_thr: float,
        iou_thr: float,
    ) -> list[tuple[GarmentLabel, str, float, tuple[int, int, int, int]]]:
        """
        output: (1, 4+num_cls, num_anchors) — format YOLOv8 raw.
        Trả về list of (macro_label, fine_label, confidence, (x1, y1, x2, y2)).
        """
        preds = output[0]  # (4+num_cls, num_anchors)
        num_classes = preds.shape[0] - 4
        boxes_raw = preds[:4].T          # (N, 4) cx, cy, w, h
        scores_raw = preds[4:].T         # (N, num_classes)

        # Chọn map phù hợp dựa trên số lớp
        if num_classes >= 40:
            target_map = _FASHIONPEDIA_GARMENT_MAP
        else:
            target_map = _DEEPFASHION2_MAP

        valid_class_indices = list(target_map.keys())
        if not valid_class_indices:
            return []

        # Chỉ lọc trên các lớp trang phục (loại bỏ chi tiết như cúc, khóa, ren, v.v.)
        sub_scores = scores_raw[:, valid_class_indices]
        best_sub_idx = sub_scores.argmax(axis=1)
        confs = sub_scores.max(axis=1)
        chosen_cls_ids = np.array(valid_class_indices)[best_sub_idx]

        mask = confs >= conf_thr
        if not np.any(mask):
            return []

        boxes_raw = boxes_raw[mask]
        chosen_cls_ids = chosen_cls_ids[mask]
        confs = confs[mask]

        cx, cy, bw, bh = boxes_raw[:, 0], boxes_raw[:, 1], boxes_raw[:, 2], boxes_raw[:, 3]
        x1_lb = cx - bw / 2
        y1_lb = cy - bh / 2
        x2_lb = cx + bw / 2
        y2_lb = cy + bh / 2

        x1_rs = x1_lb - pad_x
        y1_rs = y1_lb - pad_y
        x2_rs = x2_lb - pad_x
        y2_rs = y2_lb - pad_y

        x1 = np.clip(x1_rs / scale, 0, orig_w).astype(int)
        y1 = np.clip(y1_rs / scale, 0, orig_h).astype(int)
        x2 = np.clip(x2_rs / scale, 0, orig_w).astype(int)
        y2 = np.clip(y2_rs / scale, 0, orig_h).astype(int)

        detections = []
        for cls_id in np.unique(chosen_cls_ids):
            idx = np.where(chosen_cls_ids == cls_id)[0]
            order = confs[idx].argsort()[::-1]
            kept = []
            while len(order) > 0:
                i = order[0]
                kept.append(idx[i])
                if len(order) == 1:
                    break
                rest = order[1:]
                ix1 = np.maximum(x1[idx[i]], x1[idx[rest]])
                iy1 = np.maximum(y1[idx[i]], y1[idx[rest]])
                ix2 = np.minimum(x2[idx[i]], x2[idx[rest]])
                iy2 = np.minimum(y2[idx[i]], y2[idx[rest]])
                iw = np.maximum(0, ix2 - ix1)
                ih = np.maximum(0, iy2 - iy1)
                inter = iw * ih
                a1 = (x2[idx[i]] - x1[idx[i]]) * (y2[idx[i]] - y1[idx[i]])
                a2 = (x2[idx[rest]] - x1[idx[rest]]) * (y2[idx[rest]] - y1[idx[rest]])
                union = a1 + a2 - inter + 1e-6
                iou = inter / union
                order = order[1:][iou <= iou_thr]

            macro_label, fine_label = target_map.get(int(cls_id), (GarmentLabel.UPPER, "clothing"))
            for k in kept:
                detections.append((
                    macro_label,
                    fine_label,
                    float(confs[k]),
                    (int(x1[k]), int(y1[k]), int(x2[k]), int(y2[k]))
                ))

        return detections

    def _make_fallback(self, img: Image.Image) -> DetectedGarment:
        return DetectedGarment(
            crop=img.copy(),
            label=GarmentLabel.FULL,
            fine_label="full_image",
            confidence=0.0,
            bbox=(-1, -1, -1, -1),
            area_ratio=1.0,
        )

    def detect(self, img: Image.Image, size: int = INPUT_SIZE) -> list[DetectedGarment]:
        """Phát hiện toàn bộ trang phục trong ảnh."""
        if self._stub or self._session is None:
            return [self._make_fallback(img)]

        try:
            tensor, scale, pad_x, pad_y, orig_w, orig_h = self._preprocess(img, size)
            raw_output = self._session.run([self._output_name], {self._input_name: tensor})
            detections = self._decode_output(
                raw_output[0], scale, pad_x, pad_y, orig_w, orig_h,
                CONF_THRESHOLD, IOU_THRESHOLD,
            )

            if not detections:
                return [self._make_fallback(img)]

            results: list[DetectedGarment] = []
            total_area = orig_w * orig_h or 1
            for macro_label, fine_label, conf, (bx1, by1, bx2, by2) in detections:
                pw = int((bx2 - bx1) * PADDING_RATIO)
                ph = int((by2 - by1) * PADDING_RATIO)
                cx1 = max(0, bx1 - pw)
                cy1 = max(0, by1 - ph)
                cx2 = min(orig_w, bx2 + pw)
                cy2 = min(orig_h, by2 + ph)

                crop = img.crop((cx1, cy1, cx2, cy2))
                area_ratio = ((bx2 - bx1) * (by2 - by1)) / total_area

                results.append(DetectedGarment(
                    crop=crop,
                    label=macro_label,
                    fine_label=fine_label,
                    confidence=conf,
                    bbox=(bx1, by1, bx2, by2),
                    area_ratio=area_ratio,
                ))

            return results
        except Exception as exc:
            logger.error("[GarmentDetector] Lỗi suy luận ONNX: %s", exc)
            return [self._make_fallback(img)]

    def detect_best(self, img: Image.Image, size: int = INPUT_SIZE) -> DetectedGarment:
        """Chọn món đồ có tích số diện tích và độ tin cậy lớn nhất."""
        crops = self.detect(img, size=size)
        return max(crops, key=lambda g: g.area_ratio * g.confidence)

    def detect_target(
        self,
        img: Image.Image,
        target: str | GarmentLabel,
        size: int = INPUT_SIZE
    ) -> DetectedGarment:
        """
        Tìm kiếm đúng món đồ theo chủ đích (Target-aware Detection).
        Giải quyết triệt để lỗi chọn nhầm áo khi người dùng muốn tìm quần.
        """
        target_val = target.value if isinstance(target, GarmentLabel) else str(target).lower()
        crops = self.detect(img, size=size)

        # Lọc theo macro_label hoặc fine_label
        filtered = [
            g for g in crops
            if g.label.value.lower() == target_val
            or target_val in g.fine_label.lower()
            or (target_val in ["áo", "ao", "top", "shirt", "jacket"] and g.label == GarmentLabel.UPPER)
            or (target_val in ["quần", "quan", "pants", "shorts", "skirt"] and g.label == GarmentLabel.LOWER)
            or (target_val in ["váy", "vay", "đầm", "dam", "dress"] and g.label == GarmentLabel.DRESS)
        ]

        if not filtered:
            return self._make_fallback(img)
        return max(filtered, key=lambda g: g.area_ratio * g.confidence)

    @property
    def is_stub(self) -> bool:
        return self._stub

    @property
    def model_path(self) -> Optional[str]:
        return self._resolved_model_path


# ─── SINGLETON ───────────────────────────────────────────────────────────────
garment_detector = GarmentDetector()
