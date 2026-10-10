import os
import hashlib
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
from PIL import Image
from minio import Minio

# Configuration
CSV_PATH = r"D:\neit_ng\prjs_i\ptit_s9_pj\DATN\datacard\datacard.csv"
IMAGES_DIR = r"D:\neit_ng\prjs_i\ptit_s9_pj\DATN\datacard\test_color"
MINIO_ENDPOINT = "localhost:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin_secure_password_123"
MINIO_BUCKET = "images"
SQL_OUTPUT_PATH = r"D:\neit_ng\prjs_i\ptit_s9_pj\DATN\scripts\import_datacard.sql"

CATEGORY_MAP = {
    'áo': (1, 'Áo thun & Áo kiểu'),
    'váy liền': (3, 'Váy đầm liền'),
    'áo khoác': (4, 'Áo khoác'),
    'chân váy': (2, 'Chân váy'),
    'quần dài': (2, 'Quần dài'),
    'quần short': (2, 'Quần short'),
}

COLOR_PATTERNS = [
    ('maroon', 'Đỏ Rượu Vang', '#881337'),
    ('burgundy', 'Đỏ Rượu Vang', '#881337'),
    ('navy', 'Xanh Navy', '#1E3A8A'),
    ('red', 'Đỏ Nổi Bật', '#EF4444'),
    ('black', 'Đen Quyến Rũ', '#1F2937'),
    ('white', 'Trắng Tinh Khôi', '#F9FAFB'),
    ('pink', 'Hồng Pastel', '#EC4899'),
    ('yellow', 'Vàng Nắng', '#F59E0B'),
    ('green', 'Xanh Rêu Thời Thượng', '#10B981'),
    ('purple', 'Tím Nhạt', '#8B5CF6'),
    ('orange', 'Cam Năng Động', '#F97316'),
    ('blue', 'Xanh Dương', '#3B82F6'),
    ('grey', 'Ghi Xám Tối Giản', '#6B7280'),
    ('gray', 'Ghi Xám Tối Giản', '#6B7280'),
    ('beige', 'Be Thanh Lịch', '#F5F5DC'),
    ('cream', 'Kem Tinh Tế', '#FFFDD0'),
    ('brown', 'Nâu Vintage', '#78350F'),
]

MATERIALS = [
    'Cotton Compact 100% 250gsm thoáng khí',
    'Cotton 100% Organic tự nhiên mềm mại',
    'Chất vải Linen cao cấp thấm hút tốt',
    'Sợi dệt kim Spandex co giãn 4 chiều',
    'Vải lụa Hàn Châu mềm mịn cao cấp',
    'Cotton Poly Heavyweight giữ form chuẩn',
]

ORIGINS = ['Việt Nam', 'Hàn Quốc', 'Thái Lan', 'Việt Nam xuất khẩu']

BADGES = ['NEW', 'HOT', 'BEST SELLER', 'TRENDING', '']

def detect_color(desc):
    desc_lower = desc.lower()
    for kw, name, hex_code in COLOR_PATTERNS:
        if kw in desc_lower:
            return name, hex_code
    return 'Cơ Bản', '#1F2937'

def detect_details(desc):
    desc_lower = desc.lower()
    details = []
    if 'lace' in desc_lower: details.append('Phối Ren Tinh Tế')
    if 'floral' in desc_lower or 'flowers' in desc_lower: details.append('Họa Tiết Hoa')
    if 'stripe' in desc_lower or 'striped' in desc_lower: details.append('Kẻ Sọc Năng Động')
    if 'star' in desc_lower: details.append('Họa Tiết Sao')
    if 'skulls' in desc_lower: details.append('Graphic Họa Tiết Cá Tính')
    if 'print' in desc_lower: details.append('In Họa Tiết Nghệ Thuật')
    if 'button' in desc_lower: details.append('Đính Cúc Điểm Nhấn')
    if 'silver' in desc_lower or 'gold' in desc_lower: details.append('Điểm Nhấn Ánh Kim')
    if 'trim' in desc_lower: details.append('Viền Tương Phản')
    if 'v - neck' in desc_lower or 'open neck' in desc_lower: details.append('Cổ V Tôn Dáng')
    return details

def build_product_title(category, desc, stem):
    desc_lower = desc.lower()
    color_name, _ = detect_color(desc)
    details = detect_details(desc)
    detail_str = ' ' + ' '.join(details[:2]) if details else ''

    if category == 'váy liền':
        p_type = 'Váy Đầm Liền Nữ Thiết Kế'
    elif category == 'áo khoác':
        p_type = 'Áo Khoác Ngoài Thu Đông'
    elif category == 'chân váy':
        p_type = 'Chân Váy Nữ Thời Trang'
    elif category == 'quần dài':
        p_type = 'Quần Dài Casual Ống Suông'
    elif category == 'quần short':
        p_type = 'Quần Short Năng Động'
    else:
        if 'sweater' in desc_lower:
            p_type = 'Áo Len Dệt Kim Thu Đông'
        elif any(k in desc_lower for k in ['t - shirt', 't shirt', 'tee']):
            p_type = 'Áo Thun Cotton Cổ Tròn'
        elif 'shirt' in desc_lower:
            p_type = 'Áo Sơ Mi Kiểu Thanh Lịch'
        elif any(k in desc_lower for k in ['straps', 'sleeveless', 'tank']):
            p_type = 'Áo Hai Dây Quyến Rũ'
        elif 'polo' in desc_lower:
            p_type = 'Áo Polo Năng Động'
        else:
            p_type = 'Áo Kiểu Nữ Thời Trang'

    color_str = f" {color_name}" if color_name != 'Cơ Bản' else ""
    return f"{p_type}{color_str}{detail_str} (Mã {stem})".strip()

def determine_gender(desc, category):
    desc_lower = desc.lower()
    if 'woman' in desc_lower or 'lady' in desc_lower or category in ['váy liền', 'chân váy']:
        return 'WOMEN'
    if 'man' in desc_lower or 'men' in desc_lower:
        return 'MEN'
    return 'UNISEX'

def determine_price(category, seed_idx):
    random.seed(seed_idx)
    if category == 'áo':
        base = random.choice([249000, 289000, 320000, 350000, 389000, 420000, 450000])
    elif category == 'váy liền':
        base = random.choice([490000, 550000, 620000, 680000, 750000, 890000])
    elif category == 'áo khoác':
        base = random.choice([590000, 650000, 720000, 790000, 890000, 950000])
    else:
        base = random.choice([290000, 320000, 350000, 390000, 450000])

    has_discount = random.random() < 0.35
    if has_discount:
        discount = random.choice([10, 15, 20, 25, 30])
        orig = int(base / (1 - discount / 100))
        # Round orig to thousands
        orig = round(orig, -3)
    else:
        discount = 0
        orig = base

    return base, orig, discount

def get_file_info(file_path):
    size = os.path.getsize(file_path)
    with open(file_path, 'rb') as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()
    with Image.open(file_path) as img:
        width, height = img.size
    return size, sha256, width, height

def upload_single_image(minio_client, image_name, file_path):
    try:
        minio_client.fput_object(
            bucket_name=MINIO_BUCKET,
            object_name=image_name,
            file_path=file_path,
            content_type="image/jpeg"
        )
        return True, image_name
    except Exception as e:
        return False, f"{image_name}: {str(e)}"

def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    # String escaping
    s = str(val).replace("'", "''")
    return f"'{s}'"

def main():
    print("=== BẮT ĐẦU QUY TRÌNH NẠP 1000 SẢN PHẨM VÀO MINIO & DATABASE ===")
    
    # 1. Đọc datacard.csv
    df = pd.read_csv(CSV_PATH)
    total_records = len(df)
    print(f"1. Đã đọc file datacard.csv: {total_records} bản ghi.")

    # 2. Kết nối MinIO & chuẩn bị upload
    print("2. Đang kết nối MinIO và chuẩn bị tải lên bucket 'images'...")
    minio_client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False
    )
    if not minio_client.bucket_exists(MINIO_BUCKET):
        minio_client.make_bucket(MINIO_BUCKET)
        print(f"   Bucket '{MINIO_BUCKET}' được tạo mới.")
    else:
        print(f"   Bucket '{MINIO_BUCKET}' đã sẵn sàng.")

    upload_tasks = []
    metadata_list = []

    print("3. Phân tích ảnh và trích xuất thông số (SHA256, Size, Width, Height)...")
    for idx, row in df.iterrows():
        img_name = str(row['image_name']).strip()
        cat = str(row['category']).strip()
        desc = str(row['text_description']).strip() if pd.notna(row['text_description']) else ""
        file_path = os.path.join(IMAGES_DIR, img_name)

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Không tìm thấy file ảnh: {file_path}")

        file_size, sha256, width, height = get_file_info(file_path)
        metadata_list.append({
            'idx': idx,
            'image_name': img_name,
            'category': cat,
            'description': desc,
            'file_path': file_path,
            'file_size': file_size,
            'sha256': sha256,
            'width': width,
            'height': height
        })

    # Upload song song 16 threads
    print(f"4. Đang tải song song {total_records} ảnh lên MinIO...")
    success_count = 0
    fail_count = 0
    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = {
            executor.submit(upload_single_image, minio_client, item['image_name'], item['file_path']): item['image_name']
            for item in metadata_list
        }
        for future in as_completed(futures):
            ok, res = future.result()
            if ok:
                success_count += 1
            else:
                fail_count += 1
                print(f"   Lỗi upload: {res}")

    print(f"   Upload hoàn tất: {success_count} thành công, {fail_count} thất bại.")

    # 5. Sinh SQL script
    print("5. Đang sinh tệp SQL nạp dữ liệu vào PostgreSQL...")
    sql_lines = []
    sql_lines.append("BEGIN;")
    sql_lines.append("-- Script nạp 1000 sản phẩm thời trang từ datacard.csv")

    for item in metadata_list:
        idx = item['idx']
        img_name = item['image_name']
        cat = item['category']
        desc = item['description']
        stem = os.path.splitext(img_name)[0]
        sku = f"PRD-{stem}"

        cat_id, sub_cat = CATEGORY_MAP.get(cat, (1, 'Khác'))
        color_name, color_hex = detect_color(desc)
        title = build_product_title(cat, desc, stem)
        gender = determine_gender(desc, cat)
        base_price, orig_price, discount = determine_price(cat, idx)
        
        random.seed(idx + 100)
        badge = random.choice(BADGES) if random.random() < 0.4 else ""
        material = random.choice(MATERIALS)
        origin = random.choice(ORIGINS)
        rating = round(random.uniform(4.5, 5.0), 1)
        reviews_count = random.randint(3, 128)
        featured = (idx % 20 == 0) # Mỗi 20 sản phẩm có 1 featured

        full_desc = f"{title}. Sản phẩm thời trang thiết kế cao cấp, chất liệu {material}, nguồn gốc {origin}. Phong cách thời thượng phù hợp đi làm, đi chơi và dạo phố. Chi tiết mô tả: {desc}."

        # Insert or select image
        # Using CTE to safely insert image, product, variant and product_images
        sql_lines.append(f"""
-- Item {idx + 1}: {img_name}
DO $$
DECLARE
    v_image_id BIGINT;
    v_product_id BIGINT;
BEGIN
    -- 1. Insert Image
    INSERT INTO images (
        checksum, created_at, is_deleted, file_size, height,
        index_status, mime_type, original_filename, storage_path,
        updated_at, width, uploaded_by
    ) VALUES (
        {escape_sql(item['sha256'])}, NOW(), FALSE, {item['file_size']}, {item['height']},
        'PENDING', 'image/jpeg', {escape_sql(img_name)}, {escape_sql(img_name)},
        NOW(), {item['width']}, 1
    )
    ON CONFLICT (checksum) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_image_id;

    -- 2. Insert Product
    INSERT INTO products (
        name, sku, category_id, sub_category, gender,
        base_price, original_price, discount_percent, badge,
        material, origin, description, rating, reviews_count,
        featured, status, created_at, updated_at
    ) VALUES (
        {escape_sql(title)}, {escape_sql(sku)}, {cat_id}, {escape_sql(sub_cat)}, {escape_sql(gender)},
        {base_price}, {orig_price}, {discount}, {escape_sql(badge)},
        {escape_sql(material)}, {escape_sql(origin)}, {escape_sql(full_desc)}, {rating}, {reviews_count},
        {featured}, 'ACTIVE', NOW(), NOW()
    )
    ON CONFLICT (sku) DO UPDATE SET 
        name = EXCLUDED.name,
        base_price = EXCLUDED.base_price,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO v_product_id;

    -- 3. Insert Product Image
    DELETE FROM product_images WHERE product_id = v_product_id;
    INSERT INTO product_images (
        product_id, image_id, image_url, is_primary, sort_order
    ) VALUES (
        v_product_id, v_image_id, {escape_sql('http://localhost:9000/images/' + img_name)}, TRUE, 0
    );

    -- 4. Insert Variants (S, M, L, XL)
    DELETE FROM product_variants WHERE product_id = v_product_id;
    INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock_quantity, active, created_at)
    VALUES
        (v_product_id, {escape_sql(sku + '-S')}, 'S', {escape_sql(color_name)}, {escape_sql(color_hex)}, {(idx * 7) % 35 + 15}, TRUE, NOW()),
        (v_product_id, {escape_sql(sku + '-M')}, 'M', {escape_sql(color_name)}, {escape_sql(color_hex)}, {(idx * 11) % 40 + 20}, TRUE, NOW()),
        (v_product_id, {escape_sql(sku + '-L')}, 'L', {escape_sql(color_name)}, {escape_sql(color_hex)}, {(idx * 13) % 30 + 10}, TRUE, NOW()),
        (v_product_id, {escape_sql(sku + '-XL')}, 'XL', {escape_sql(color_name)}, {escape_sql(color_hex)}, {(idx * 17) % 25 + 5}, TRUE, NOW());

END $$;
""")

    sql_lines.append("COMMIT;")

    os.makedirs(os.path.dirname(SQL_OUTPUT_PATH), exist_ok=True)
    with open(SQL_OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"6. Đã tạo tệp SQL hoàn chỉnh tại: {SQL_OUTPUT_PATH}")
    print("=== HOÀN TẤT BƯỚC CHUẨN BỊ VÀ TẢI ẢNH LÊN MINIO ===")

if __name__ == '__main__':
    main()
