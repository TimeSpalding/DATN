import json

with open('E:/DATN/notebooks/catvton-api-server.ipynb', 'r', encoding='utf-8') as f:
    d = json.load(f)

for cell in d.get('cells', []):
    if 'source' in cell and len(cell['source']) > 0:
        text = "".join(cell['source'])

        # ROLLBACK 1: category "overall" -> "upper" (overall mask qua lon, gay hallucinate background)
        text = text.replace(
            'category: str = Form("overall")',
            'category: str = Form("upper")'
        )

        # ROLLBACK 2: guidance_scale 7.5 -> 3.5 (7.5 qua cao, model ve lai ca background)
        text = text.replace(
            'num_inference_steps=50, guidance_scale=7.5',
            'num_inference_steps=30, guidance_scale=3.5'
        )

        # GIU NGUYEN: blur_factor=4 (tot hon 9)
        # GIU NGUYEN: resize_and_padding cho person (tot hon crop)

        cell['source'] = [text]

with open('E:/DATN/notebooks/catvton-api-server.ipynb', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=1, ensure_ascii=False)

print("[DONE] Rollback hoan tat:")
print("   category       : 'overall' -> 'upper'")
print("   guidance_scale : 7.5       -> 3.5")
print("   inference_steps: 50        -> 30")
print("   blur_factor    : 4         (giu nguyen)")
print("   resize_and_padding         (giu nguyen)")
