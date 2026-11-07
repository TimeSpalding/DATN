import urllib.request
import json
import sys

base_url = 'http://54.254.216.166'

print("=== KIỂM THỬ HỆ THỐNG TRÊN AWS EC2 LIVE ===")

# 1. Test frontend
try:
    with urllib.request.urlopen(f'{base_url}/', timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print(f"1. Frontend Web (port 80): HTTP {r.status}, length: {len(html)} bytes")
        if "Grand Atelier" in html or "id=\"root\"" in html:
            print("   - Xác nhận: Trang web Grand Atelier tải thành công")
except Exception as e:
    print(f"1. Frontend Web: Lỗi {e}")

# 2. Test categories API
try:
    with urllib.request.urlopen(f'{base_url}/api/visual-search/v1/categories', timeout=10) as r:
        res = json.loads(r.read().decode('utf-8'))
        categories = res.get('data', [])
        print(f"2. Categories API: {len(categories)} danh mục")
        for c in categories[:3]:
            print(f"   - {c['code']}: {c['name']} ({c.get('productCount', 0)} sản phẩm)")
except Exception as e:
    print(f"2. Categories API: Lỗi {e}")

# 3. Test products API
try:
    with urllib.request.urlopen(f'{base_url}/api/visual-search/v1/products?page=1&limit=3', timeout=10) as r:
        res = json.loads(r.read().decode('utf-8'))
        data = res.get('data', {})
        print(f"3. Products Catalog API: Tổng {data.get('totalElements')} sản phẩm, {data.get('totalPages')} trang")
        if data.get('content'):
            sample = data['content'][0]
            print(f"   - Sản phẩm mẫu: {sample['name']}")
            print(f"   - Giá: {sample['rawPrice']}₫")
            print(f"   - Ảnh: {sample['image']}")

            # 4. Test image download from MinIO
            img_url = sample['image']
            try:
                with urllib.request.urlopen(img_url, timeout=10) as img_resp:
                    print(f"4. Tải ảnh MinIO trực tiếp ({img_url}): HTTP {img_resp.status}, kích thước: {len(img_resp.read())} bytes")
            except Exception as e:
                print(f"4. Tải ảnh MinIO trực tiếp ({img_url}): Lỗi {e}")
except Exception as e:
    print(f"3. Products Catalog API: Lỗi {e}")

# 5. Test Backend-AI health
try:
    with urllib.request.urlopen(f'{base_url}:8000/health', timeout=10) as r:
        res = json.loads(r.read().decode('utf-8'))
        print(f"5. Backend-AI Health (port 8000): HTTP {r.status}, {res}")
except Exception as e:
    print(f"5. Backend-AI Health: Lỗi {e}")

print("=== KIỂM THỬ HOÀN TẤT ===")
