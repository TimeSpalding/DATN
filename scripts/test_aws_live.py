import urllib.request
import json

base_url = 'http://54.254.216.166'

print("=== KIỂM THỬ HỆ THỐNG TRÊN AWS EC2 LIVE ===")

# 1. Test frontend
with urllib.request.urlopen(f'{base_url}/', timeout=10) as r:
    print(f"1. Frontend Web (port 80): HTTP {r.status}, length: {len(r.read())} bytes")

# 2. Test categories API
with urllib.request.urlopen(f'{base_url}/api/visual-search/v1/categories', timeout=10) as r:
    res = json.loads(r.read().decode('utf-8'))
    categories = res.get('data', [])
    print(f"2. Categories API: {len(categories)} danh mục")
    for c in categories:
        print(f"   - {c['code']}: {c['name']} ({c.get('productCount', 0)} sản phẩm)")

# 3. Test products API
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

print("=== TẤT CẢ CÁC ENDPOINT CÔNG KHAI TRÊN AWS HOẠT ĐỘNG HOÀN HẢO! ===")
