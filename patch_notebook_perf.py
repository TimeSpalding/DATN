import json

with open('E:/DATN/notebooks/catvton-api-server.ipynb', 'r', encoding='utf-8') as f:
    d = json.load(f)

for cell in d.get('cells', []):
    if 'source' not in cell or not cell['source']:
        continue
    text = "".join(cell['source'])

    # Tang steps tu 20 len 25 - can bang giua toc do va chat luong
    if 'num_inference_steps=20' in text:
        text = text.replace(
            'num_inference_steps=20, guidance_scale=4.5',
            'num_inference_steps=25, guidance_scale=4.5'
        )
        print("[PATCHED] steps: 20 -> 25")

    cell['source'] = [text]

with open('E:/DATN/notebooks/catvton-api-server.ipynb', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=1, ensure_ascii=False)

print("[DONE] Update xong! steps=25 voi DPM++ scheduler.")
print("       Du kien: ~35-40s (nhanh hon ban goc ~20s, chat luong on dinh hon 20 steps)")
