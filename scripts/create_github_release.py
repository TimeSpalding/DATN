import json
import subprocess
import urllib.request
import sys

def get_git_token():
    res = subprocess.run(
        ['git', 'credential', 'fill'],
        input='protocol=https\nhost=github.com\n',
        capture_output=True,
        text=True
    )
    creds = dict(line.split('=', 1) for line in res.stdout.strip().splitlines() if '=' in line)
    token = creds.get('password')
    if not token:
        raise RuntimeError("Could not retrieve GitHub token from git credential helper.")
    return token

def create_or_update_release():
    token = get_git_token()
    repo = "TimeSpalding/DATN"
    tag_name = "w06"
    release_name = "Bản phát hành Tuần 6: Hệ thống Grand Atelier & Thực nghiệm CatVTON (AWS Public IP)"
    
    body_content = """## Địa chỉ truy cập trực tiếp hệ thống (Live Deployment on AWS EC2)

- **Trang chủ Cửa hàng thời trang & Thử đồ ảo**: [http://54.254.216.166/](http://54.254.216.166/)
- **Danh mục sản phẩm (Catalog)**: [http://54.254.216.166/catalog](http://54.254.216.166/catalog)
- **Phòng thử đồ trực tuyến thông minh (Virtual Try-on Studio)**: [http://54.254.216.166/tryon](http://54.254.216.166/tryon)
- **Trang quản trị hệ thống (Admin Portal)**: [http://54.254.216.166/admin](http://54.254.216.166/admin)
- **Backend AI API Documentation (FastAPI OpenAPI)**: [http://54.254.216.166:8000/docs](http://54.254.216.166:8000/docs)
- **Backend Java API Documentation (Spring Boot Swagger UI)**: [http://54.254.216.166:8080/swagger-ui/index.html](http://54.254.216.166:8080/swagger-ui/index.html)
- **MinIO Object Storage Console**: [http://54.254.216.166:9001/](http://54.254.216.166:9001/)

---

## Kiến trúc hạ tầng phân tán (Hybrid Infrastructure Architecture)

1. **AWS EC2 (Elastic IP: `54.254.216.166`, Singapore ap-southeast-1)**:
   - `frontend`: Giao diện người dùng Grand Atelier (React + TypeScript + Tailwind CSS, Nginx reverse proxy).
   - `backend-java`: Core E-Commerce Microservice (Spring Boot 3, Java 21).
   - `backend-ai`: Dịch vụ tìm kiếm trực quan FashionCLIP, trích xuất đặc trưng và Proxy tích hợp CatVTON.
   - `postgres`: Lưu trữ dữ liệu quan hệ (1.009 sản phẩm thời trang và đơn hàng).
   - `qdrant`: Cơ sở dữ liệu vector lưu trữ 512-dim FashionCLIP embeddings cho tìm kiếm ảnh đa phương thức.
   - `minio`: Lưu trữ đối tượng S3 tương thích cho toàn bộ hình ảnh sản phẩm và ảnh thử đồ.

2. **Kaggle GPU Worker (NVIDIA Tesla T4 / P100)**:
   - Dịch vụ suy luận mô hình khuếch tán thử đồ ảo CatVTON (Virtual Try-on Diffusion Pipeline).
   - Kết nối an toàn đến AWS EC2 Backend-AI qua đường hầm bảo mật HTTPS ngrok proxy với cấu hình timeout nâng cao 180s.

---

## Tóm tắt các hạng mục hoàn thành trong Tuần 6

1. **Tái thiết kế và chuẩn hóa toàn diện giao diện Frontend (Grand Atelier)**:
   - Loại bỏ thanh trượt tương tác gradient phức tạp theo góp ý; chuyển đổi sang card kết quả thử đồ với nút So sánh (A/B Toggle) và Tải ảnh độ phân giải cao.
   - Chuẩn hóa layout responsive: khắc phục lỗi tràn chữ tại danh mục, cố định phân trang danh mục sản phẩm, căn giữa thanh điều hướng trong suốt.
   - Việt hóa đồng bộ toàn bộ giao diện, lược bỏ từ ngữ mặc định của các mẫu template AI.

2. **Thực nghiệm Benchmark 25 cặp ảnh CatVTON thực tế**:
   - Hoàn thành benchmark cho 25 cặp ảnh người mẫu và trang phục thực tế (unpaired setting) từ tập DeepFashion.
   - Đo lường định lượng: Độ trễ suy luận (60-70s trên GPU T4), SSIM ngoại mặt nạ (>0.97), PSNR (>30 dB).
   - Đánh giá thị giác chi tiết bằng mắt thường từng cặp ảnh, lưu trong file Excel `Evidence/W06/Danh_gia_thi_giac_25_cap_CatVTON_Tuan6.xlsx`.

3. **Nghiên cứu tối ưu hóa tài nguyên GPU & Định dạng FP16**:
   - Phân tích chi tiết mức tiêu thụ VRAM (~8.4 GB đến 10.2 GB trên GPU T4).
   - Đánh giá giải pháp FP16 half-precision, xFormers memory-efficient attention và chuẩn bị chiến lược triển khai suy luận hàng đợi bất đồng bộ.

4. **Tài liệu và Báo cáo tuần**:
   - Báo cáo tiến độ chi tiết: `bao_cao_hang_tuan/Bao_cao_tien_do_tuan_6.docx`.
   - Minh chứng kỹ thuật tuần 6 đầy đủ: `Evidence/W06/`.
"""

    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'DATN-Deployer',
        'Content-Type': 'application/json'
    }

    # Check if release for tag_name already exists
    check_url = f'https://api.github.com/repos/{repo}/releases/tags/{tag_name}'
    check_req = urllib.request.Request(check_url, headers=headers)
    
    release_id = None
    try:
        with urllib.request.urlopen(check_req) as resp:
            data = json.loads(resp.read().decode())
            release_id = data.get('id')
            print(f"Found existing release ID {release_id} for tag {tag_name}.")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"No release found for tag {tag_name}, creating new one.")
        else:
            raise

    payload = {
        'tag_name': tag_name,
        'target_commitish': 'main',
        'name': release_name,
        'body': body_content,
        'draft': False,
        'prerelease': False
    }

    if release_id:
        update_url = f'https://api.github.com/repos/{repo}/releases/{release_id}'
        data_bytes = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(update_url, data=data_bytes, headers=headers, method='PATCH')
        with urllib.request.urlopen(req) as resp:
            res_data = json.loads(resp.read().decode())
            print(f"Successfully updated release: {res_data.get('html_url')}")
            return res_data.get('html_url')
    else:
        create_url = f'https://api.github.com/repos/{repo}/releases'
        data_bytes = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(create_url, data=data_bytes, headers=headers, method='POST')
        with urllib.request.urlopen(req) as resp:
            res_data = json.loads(resp.read().decode())
            print(f"Successfully created release: {res_data.get('html_url')}")
            return res_data.get('html_url')

if __name__ == '__main__':
    url = create_or_update_release()
    print("Release URL:", url)
