import urllib.request
import json
import sys

def run_tests():
    print("=== KIỂM THỬ TỔNG HỢP E-COMMERCE CORE & ADMIN ===", flush=True)

    # 1. Categories
    cat_url = "http://127.0.0.1:8080/visual-search/v1/categories"
    with urllib.request.urlopen(cat_url) as resp:
        categories = json.loads(resp.read().decode('utf-8'))['data']
        print(f"1. Tổng số danh mục: {len(categories)}", flush=True)
        for cat in categories:
            print(f"   - Mã: {cat['code']} | Tên: {cat['name']}", flush=True)

    # 2. Category filters
    print("\n2. Kiểm tra bộ lọc sản phẩm theo Category:", flush=True)
    for code in ['all', 'upper', 'dress', 'outerwear', 'lower']:
        param = "" if code == 'all' else f"?category={code}"
        url = f"http://127.0.0.1:8080/visual-search/v1/products{param}&page=1&limit=2"
        if not param:
            url = f"http://127.0.0.1:8080/visual-search/v1/products?page=1&limit=2"
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read().decode('utf-8'))['data']
            print(f"   - Danh mục [{code}]: Tổng {data['totalElements']} sản phẩm", flush=True)
            if data['content']:
                p = data['content'][0]
                print(f"     Mẫu: {p['name']} | Giá: {p['price']} | Ảnh: {p['image']}", flush=True)

    # 3. Product detail
    first_id = 1001
    print(f"\n3. Kiểm tra chi tiết sản phẩm ID {first_id}:", flush=True)
    detail_url = f"http://127.0.0.1:8080/visual-search/v1/products/{first_id}"
    with urllib.request.urlopen(detail_url) as resp:
        detail = json.loads(resp.read().decode('utf-8'))['data']
        print(f"   Tên: {detail['name']}", flush=True)
        print(f"   SKU: {detail['sku']}", flush=True)
        print(f"   Số lượng variants: {len(detail.get('variants', []))}", flush=True)
        print(f"   Số sản phẩm liên quan: {len(detail.get('relatedProducts', []))}", flush=True)

    # 4. Search query
    print("\n4. Tìm kiếm từ khóa 'Ren':", flush=True)
    search_url = "http://127.0.0.1:8080/visual-search/v1/products?search=Ren&limit=2"
    with urllib.request.urlopen(search_url) as resp:
        s_data = json.loads(resp.read().decode('utf-8'))['data']
        print(f"   Tổng kết quả tìm kiếm 'Ren': {s_data['totalElements']}", flush=True)

    # 5. Admin Authentication & Overview
    print("\n5. Đăng nhập Quản trị viên (Admin Login):", flush=True)
    login_url = "http://127.0.0.1:8080/visual-search/v1/auth/login"
    login_payload = json.dumps({'usernameOrEmail': 'admin', 'password': 'AdminPassword@123'}).encode('utf-8')
    req = urllib.request.Request(login_url, data=login_payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        login_res = json.loads(resp.read().decode('utf-8'))
        token = login_res['data']['accessToken']
        print(f"   Đăng nhập thành công! Token: {token[:25]}...", flush=True)

    # 6. Admin Dashboard Overview Metrics
    print("\n6. Lấy chỉ số tổng quan Admin Dashboard:", flush=True)
    overview_url = "http://127.0.0.1:8080/visual-search/v1/admin/dashboard/overview"
    req_ov = urllib.request.Request(overview_url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req_ov) as resp:
        ov = json.loads(resp.read().decode('utf-8'))['data']
        print(f"   - Tổng số sản phẩm trong hệ thống: {ov['totalProducts']}", flush=True)
        print(f"   - Sản phẩm đang kinh doanh (Active): {ov['activeProducts']}", flush=True)
        print(f"   - Biến thể sắp hết hàng (<10): {ov['lowStockCount']}", flush=True)
        print(f"   - Tổng số đơn hàng: {ov['totalOrders']}", flush=True)
        print(f"   - Tổng doanh thu: {ov['totalRevenueFormatted']}", flush=True)
        print(f"   - Phân bố danh mục sản phẩm (Category Breakdown):", flush=True)
        for cat in ov.get('categoryBreakdown', []):
            print(f"     * {cat['categoryName']}: {cat['productCount']} sản phẩm", flush=True)

    print("\n=== TOÀN BỘ CÁC BƯỚC KIỂM THỬ ĐỀU THÀNH CÔNG RỰC RỠ! ===", flush=True)

if __name__ == '__main__':
    run_tests()
