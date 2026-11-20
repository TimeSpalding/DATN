import os
import shutil
from huggingface_hub import hf_hub_download

cached_file = hf_hub_download(
    repo_id="louisJLN/yolo8-fashionpedia",
    filename="results/yolov8n-fashionpedia-1.onnx"
)
print("Cached file:", cached_file)

dest_dir = "e:/DATN/backend-ai/models"
os.makedirs(dest_dir, exist_ok=True)
dest_file = os.path.join(dest_dir, "yolov8n_garment.onnx")

shutil.copy2(cached_file, dest_file)
print("Copied to:", dest_file)
print("File size:", os.path.getsize(dest_file), "bytes")
