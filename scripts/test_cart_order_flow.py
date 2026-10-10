import urllib.request
import json

def test_cart_and_order():
    print("=== KIỂM THỬ LUỒNG GIỎ HÀNG VÀ ĐẶT HÀNG ===")

    # 1. Lấy thông tin 1 variant từ sản phẩm 1001
    prod_url = "http://127.0.0.1:8080/visual-search/v1/products/1001"
    with urllib.request.urlopen(prod_url) as resp:
        prod = json.loads(resp.read().decode('utf-8'))['data']
        variant = prod['variants'][0]
        variant_id = variant['id']
        sku = variant['sku']
        initial_stock = variant['stockQuantity']
        price = prod['rawPrice']
        print(f"1. Sản phẩm: {prod['name']}")
        print(f"   Variant ID: {variant_id} ({sku}), Tồn kho ban đầu: {initial_stock}")

    # 2. Login admin để lấy token và checkout
    login_url = "http://127.0.0.1:8080/visual-search/v1/auth/login"
    login_data = json.dumps({'usernameOrEmail': 'admin', 'password': 'AdminPassword@123'}).encode('utf-8')
    req_login = urllib.request.Request(login_url, data=login_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req_login) as resp:
        token = json.loads(resp.read().decode('utf-8'))['data']['accessToken']
        print(f"2. Đăng nhập thành công! Token: {token[:20]}...")

    # 3. Tạo đơn hàng qua API Checkout / Orders
    order_payload = {
        'recipientName': 'Nguyễn Văn Test',
        'phoneNumber': '0987654321',
        'shippingAddress': '123 Đường Thời Trang, Quận 1, TP. Hồ Chí Minh',
        'notes': 'Giao hàng giờ hành chính',
        'paymentMethod': 'COD',
        'items': [
            {
                'variantId': variant_id,
                'quantity': 2
            }
        ]
    }
    order_url = "http://127.0.0.1:8080/visual-search/v1/orders/checkout"
    req_order = urllib.request.Request(
        order_url,
        data=json.dumps(order_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req_order) as resp:
        order_res = json.loads(resp.read().decode('utf-8'))['data']
        order_code = order_res['orderNumber']
        order_id = order_res['id']
        print(f"3. Đặt hàng thành công! Mã đơn hàng: {order_code} (ID: {order_id})")
        print(f"   Tổng tiền thanh toán: {order_res['totalAmount']}₫")
        print(f"   Trạng thái đơn: {order_res['orderStatus']}")

    # 4. Kiểm tra tồn kho sau khi trừ
    with urllib.request.urlopen(prod_url) as resp:
        prod_after = json.loads(resp.read().decode('utf-8'))['data']
        var_after = [v for v in prod_after['variants'] if v['id'] == variant_id][0]
        print(f"4. Tồn kho sau khi đặt 2 sản phẩm: {var_after['stockQuantity']} (ban đầu: {initial_stock})")
        assert var_after['stockQuantity'] == initial_stock - 2, "Tồn kho chưa được trừ chính xác!"
        print("   -> Tồn kho đã được trừ chính xác!")

    # 5. Admin cập nhật trạng thái đơn hàng sang CONFIRMED
    update_url = f"http://127.0.0.1:8080/visual-search/v1/admin/orders/{order_id}/status"
    req_update = urllib.request.Request(
        update_url,
        data=json.dumps({'orderStatus': 'CONFIRMED'}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'},
        method='PUT'
    )
    with urllib.request.urlopen(req_update) as resp:
        updated_order = json.loads(resp.read().decode('utf-8'))['data']
        print(f"5. Admin cập nhật trạng thái đơn: {updated_order['orderStatus']}")

    print("=== TOÀN BỘ LUỒNG E-COMMERCE CORE HOẠT ĐỘNG HOÀN HẢO! ===")

if __name__ == '__main__':
    test_cart_and_order()
