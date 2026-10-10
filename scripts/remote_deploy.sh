#!/bin/bash
set -e

PUBLIC_IP="54.254.216.166"
APP_DIR="/home/ubuntu/DATN"

echo "=================================================="
echo "BẮT ĐẦU QUY TRÌNH TRIỂN KHAI LÊN MÁY ẢO AWS EC2"
echo "Public IP: $PUBLIC_IP"
echo "=================================================="

# 1. Giải nén mã nguồn dự án
echo "[1/7] Giải nén mã nguồn dự án từ project_code.tar.gz..."
mkdir -p "$APP_DIR"
tar -xzf /home/ubuntu/project_code.tar.gz -C "$APP_DIR"
cd "$APP_DIR"

# 2. Giải nén datacard vào dự án nếu có file zip
echo "[2/7] Giải nén tệp dữ liệu datacard..."
if [ -f "/home/ubuntu/datacard.zip" ]; then
    mkdir -p "$APP_DIR/datacard"
    unzip -o /home/ubuntu/datacard.zip -d "$APP_DIR/datacard"
    echo "Đã giải nén datacard thành công."
fi

# 3. Thiết lập file .env cấu hình cho máy chủ đám mây
echo "[3/7] Cấu hình biến môi trường .env..."
cat <<EOF > "$APP_DIR/.env"
# ===== Registry / Image tags =====
REGISTRY=local
IMAGE_TAG=latest
BACKEND_AI_IMAGE=visual-search/backend-ai
BACKEND_JAVA_IMAGE=visual-search/backend-java
FRONTEND_IMAGE=visual-search/frontend

# ===== Project =====
COMPOSE_PROJECT_NAME=visual-search-engine

# ===== Ports =====
POSTGRES_PORT=5432
QDRANT_HTTP_PORT=6333
QDRANT_GRPC_PORT=6334
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
BACKEND_AI_PORT=8000
BACKEND_JAVA_PORT=8080
FRONTEND_PORT=80

# ===== Postgres =====
POSTGRES_DB=imagesearch
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_secure_password_123

# ===== MinIO =====
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_secure_password_123
MINIO_BUCKET=images
PUBLIC_HOST=${PUBLIC_IP}
VITE_PUBLIC_HOST=${PUBLIC_IP}
MINIO_ENDPOINT=http://minio:9000
MINIO_PUBLIC_URL=http://${PUBLIC_IP}:9000
MINIO_BOOTSTRAP_ENDPOINT=http://minio:9000

# ===== App env =====
SPRING_PROFILES_ACTIVE=docker
JAVA_TOOL_OPTIONS=-Xmx768m -Xms256m
BACKEND_AI_MOCK_EMBEDDING=false
QDRANT_COLLECTION=images
LORA_WEIGHTS_DIR=/app/lora-weights
BASE_MODEL_CACHE=/app/base_model_cache
OCR_MODEL_CACHE=/app/ocr_model_cache
HF_HOME=/app/base_model_cache/huggingface
TORCH_HOME=/app/base_model_cache/torch

# ===== Frontend build-time hints =====
VITE_API_BASE_URL=/api/visual-search/v1
VITE_USE_MOCK_SEARCH_RESULTS=false
VITE_PUBLIC_HOST=${PUBLIC_IP}
VITE_MINIO_PUBLIC_URL=http://${PUBLIC_IP}:9000
VITE_MINIO_PUBLIC_URLS=http://${PUBLIC_IP}:9000
VITE_MINIO_BUCKET=images

# ===== Security and Admin Account =====
JWT_SECRET=c2VjdXJlX2p3dF9zZWNyZXRfa2V5X2Zvcl9kZXZlbG9wbWVudF8yMDI2X2FwaV92MQ==
APP_ADMIN_USERNAME=admin
APP_ADMIN_EMAIL=admin@example.com
APP_ADMIN_PASSWORD=AdminPassword@123

# ===== Artificial Intelligence Integrations =====
GEMINI_API_KEY=
CATVTON_SERVICE_URL=https://aspire-traps-deserving.ngrok-free.dev/api/tryon
CATVTON_TIMEOUT_SECONDS=120
EOF

# 4. Khởi động các container qua Docker Compose
echo "[4/7] Xây dựng và khởi chạy Docker Compose..."
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build

# 5. Chờ cơ sở dữ liệu PostgreSQL sẵn sàng
echo "[5/7] Đợi cơ sở dữ liệu PostgreSQL sẵn sàng..."
until docker exec visual-search-engine-postgres-1 pg_isready -U postgres -d imagesearch; do
    sleep 3
done

# 6. Nạp dữ liệu 1000 sản phẩm và cập nhật ràng buộc
echo "[6/7] Nạp 1009 sản phẩm và dữ liệu e-commerce vào PostgreSQL..."
PROD_COUNT=$(docker exec visual-search-engine-postgres-1 psql -U postgres -d imagesearch -t -c "SELECT count(*) FROM products;" 2>/dev/null | tr -d ' ' || echo "0")
echo "Số sản phẩm hiện tại: $PROD_COUNT"

if [ "$PROD_COUNT" -lt "100" ]; then
    echo "Nạp dữ liệu từ scripts/import_datacard.sql..."
    docker exec -i visual-search-engine-postgres-1 psql -U postgres -d imagesearch < scripts/import_datacard.sql
fi

docker exec visual-search-engine-postgres-1 psql -U postgres -d imagesearch -c "ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check; ALTER TABLE orders ADD CONSTRAINT orders_order_status_check CHECK (order_status::text = ANY (ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'PROCESSING'::character varying, 'SHIPPING'::character varying, 'DELIVERED'::character varying, 'CANCELLED'::character varying]::text[]));"

# 7. Nạp 1000 ảnh lên MinIO Bucket
echo "[7/7] Nạp 1000 ảnh sản phẩm lên MinIO bucket..."
if [ -d "$APP_DIR/datacard/test_color" ]; then
    echo "Tải ảnh vào MinIO bucket 'images' bằng MinIO Client container..."
    docker run --rm --network visual-search-engine_default -v "$APP_DIR/datacard/test_color:/images_src:ro" cgr.dev/chainguard/minio-client:latest-dev sh -c "
        until mc alias set local http://minio:9000 minioadmin minioadmin_secure_password_123; do
            echo 'Chờ MinIO sẵn sàng...'
            sleep 2
        done
        mc mb local/images || true
        mc cp --recursive /images_src/ local/images/
        mc anonymous set download local/images
        echo 'Hoàn tất nạp ảnh vào MinIO.'
    "
fi

echo "=================================================="
echo "TRIỂN KHAI HOÀN TẤT THÀNH CÔNG TRÊN AWS EC2!"
echo "Link web công khai: http://${PUBLIC_IP}/"
echo "Danh mục sản phẩm: http://${PUBLIC_IP}/catalog"
echo "Trang quản trị: http://${PUBLIC_IP}/admin"
echo "=================================================="
