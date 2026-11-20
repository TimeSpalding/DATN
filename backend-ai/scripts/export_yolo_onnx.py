"""
scripts/export_yolo_onnx.py
-----------------------------
Script xuất YOLOv8n từ PyTorch → ONNX với 3 lớp garment.

Cách dùng:
  pip install ultralytics
  python scripts/export_yolo_onnx.py \
      --weights path/to/yolov8n_deepfashion2.pt \
      --output  /models/yolov8n_garment.onnx

Nếu chưa có file .pt đã fine-tune trên DeepFashion2, có thể dùng
checkpoint mặc định YOLOv8n của Ultralytics (80 lớp COCO) làm thử nghiệm
bằng cách truyền --pretrained để tự tải về. Lưu ý: với checkpoint COCO
bạn cần ánh xạ lại class_id thủ công vì COCO không có lớp "garment" riêng.
"""

import argparse
import os
import sys


def export_onnx(weights: str, output: str, imgsz: int = 640):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics chưa được cài. Chạy: pip install ultralytics")
        sys.exit(1)

    print(f"[EXPORT] Nạp model từ: {weights}")
    model = YOLO(weights)

    # Export sang ONNX
    result = model.export(
        format="onnx",
        imgsz=imgsz,
        opset=12,
        simplify=True,
        dynamic=False,
    )
    exported_path = str(result)
    print(f"[EXPORT] ONNX đã xuất tại: {exported_path}")

    # Di chuyển sang output path mong muốn
    if exported_path != output:
        os.makedirs(os.path.dirname(output), exist_ok=True)
        import shutil
        shutil.move(exported_path, output)
        print(f"[EXPORT] Đã di chuyển sang: {output}")

    print("[EXPORT] Hoàn thành. Mount file này vào Docker tại /models/yolov8n_garment.onnx")
    print("[EXPORT] Hoặc đặt biến môi trường: YOLO_ONNX_PATH=/path/to/yolov8n_garment.onnx")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export YOLOv8n sang ONNX cho garment detection")
    parser.add_argument("--weights", required=False, default="yolov8n.pt",
                        help="Đường dẫn file .pt (mặc định: tải yolov8n.pt từ Ultralytics)")
    parser.add_argument("--output", required=False, default="models/yolov8n_garment.onnx",
                        help="Đường dẫn file ONNX đầu ra")
    parser.add_argument("--imgsz", type=int, default=640, help="Kích thước input (640 hoặc 320)")
    args = parser.parse_args()

    export_onnx(args.weights, args.output, args.imgsz)
