import json

with open('E:/DATN/notebooks/catvton-api-server.ipynb', 'r', encoding='utf-8') as f:
    d = json.load(f)

for cell in d.get('cells', []):
    if 'source' in cell and len(cell['source']) > 0:
        text = "".join(cell['source'])

        # Cập nhật category mặc định thành "overall" để giải quyết vấn đề áo dài bị ngắn
        text = text.replace(
            'category: str = Form("upper")',
            'category: str = Form("overall")'
        )

        # Cân bằng guidance_scale: 3.5 -> 4.5
        # 3.5: Màu hơi nhạt. 7.5: Hỏng background. 4.5 - 5.0 là điểm cân bằng lý tưởng.
        text = text.replace(
            'num_inference_steps=30, guidance_scale=3.5',
            'num_inference_steps=35, guidance_scale=4.5'
        )

        cell['source'] = [text]

with open('E:/DATN/notebooks/catvton-api-server.ipynb', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=1, ensure_ascii=False)

print("[DONE] Da update notebook:")
print("   - category       : 'upper' -> 'overall' (De render full ta ao dai)")
print("   - guidance_scale : 3.5 -> 4.5 (De giu mau hoa tot hon ma ko hong nen)")
print("   - steps          : 30 -> 35 (Tang nhe chat luong)")
