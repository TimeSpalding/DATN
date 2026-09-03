import json

with open('E:/DATN/notebooks/catvton-api-server.ipynb', 'r', encoding='utf-8') as f:
    d = json.load(f)

for cell in d.get('cells', []):
    if 'source' in cell and len(cell['source']) > 0:
        text = "".join(cell['source'])
        
        # Sửa thêm skip_safety_check=True
        if 'device="cuda",' in text and 'skip_safety_check' not in text:
            text = text.replace(
                'device="cuda",',
                'device="cuda",\n    skip_safety_check=True,'
            )
        
        cell['source'] = [text]

with open('E:/DATN/notebooks/catvton-api-server.ipynb', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=1)
