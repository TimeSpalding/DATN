#!/bin/bash
set -e

echo "=== 1. SAO LƯU THƯ MỤC CŨ ==="
BACKUP_DIR="/home/ubuntu/DATN_backup_$(date +%Y%m%d_%H%M%S)"
cp -r /home/ubuntu/DATN "$BACKUP_DIR"
echo "Đã sao lưu tại: $BACKUP_DIR"

echo "=== 2. GIẢI NÉN MÃ NGUỒN MỚI ==="
tar -xzf /home/ubuntu/project_code.tar.gz -C /home/ubuntu/DATN
cd /home/ubuntu/DATN

echo "=== 3. CẬP NHẬT CẤU HÌNH BIẾN MÔI TRƯỜNG .ENV ==="
sed -i 's|CATVTON_TIMEOUT_SECONDS=.*|CATVTON_TIMEOUT_SECONDS=180|g' .env
sed -i 's|CATVTON_SERVICE_URL=.*|CATVTON_SERVICE_URL=https://aspire-traps-deserving.ngrok-free.dev/api/tryon|g' .env
grep -E 'CATVTON|PUBLIC_HOST' .env

echo "=== 4. XÂY DỰNG VÀ KHỞI ĐỘNG CONTAINER FRONTEND, BACKEND-AI, BACKEND-JAVA ==="
docker compose -f docker-compose.yml -f docker-compose.build.yml build frontend backend-ai backend-java
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --no-deps frontend backend-ai backend-java

echo "=== 5. DỌN DẸP TỆP TẠM ==="
rm -f /home/ubuntu/project_code.tar.gz
rm -f /home/ubuntu/deploy_on_ec2.sh

echo "=== HOÀN TẤT BƯỚC CẬP NHẬT TRÊN MÁY CHỦ AWS EC2 ==="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

