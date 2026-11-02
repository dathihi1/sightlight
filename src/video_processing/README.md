# SignLight Video Processing Service

Service FastAPI nhận video ngắn có sự đồng ý của người dùng, giải mã MP4/MOV/WebM, chạy MediaPipe Holistic, tạo tensor `64 × 327`, rồi chuyển tensor sang Spring để Spring tiếp tục làm nguồn sự thật cho AI, quota và gamification.

## Luồng dữ liệu

1. Web/Flutter xin quyền tải video lên. Chế độ mặc định vẫn xử lý trên thiết bị.
2. Service kiểm tra JWT và quyền dùng model qua `GET /api/v1/ai/capabilities`.
3. Video chỉ nằm trong RAM và file tạm trong lúc xử lý; file tạm luôn bị xóa. Không ghi video vào database, R2 hay Azure Storage.
4. MediaPipe tạo landmarks và pipeline tương thích Web tạo `v2_holistic_subset` (`64 × 327`).
5. Service gửi tensor tới `POST /api/v1/ai/attempts` bằng JWT gốc. Spring gọi AI service và quyết định kết quả, quota, XP.

`requestId` là UUID dùng chống gửi trùng trong một replica trong 120 giây. Spring vẫn là lớp bảo vệ cuối cùng cho quota.

## Chạy cục bộ

```powershell
cd src/video_processing
Copy-Item .env.example .env
python scripts/download_holistic_model.py models/holistic_landmarker.task
python -m pip install -r requirements-dev.txt
$env:SPRING_BACKEND_BASE_URL = "http://localhost:8080"
$env:REQUIRE_HTTPS_BACKEND = "false"
$env:HOLISTIC_MODEL_PATH = "models/holistic_landmarker.task"
uvicorn app.main:app --reload --port 8000
```

Hoặc:

```powershell
docker compose up --build
```

Kiểm tra: `GET http://localhost:8000/healthz` và `GET /readyz`.

## API

`POST /v1/video/infer` dùng `multipart/form-data`:

- `video`: MP4/MOV/WebM, tối đa 10 MiB, 6 giây, 1280×720.
- `targetSignId`: UUID từ practice session.
- `modelVersion`: model Spring trả về.
- `sessionId`: UUID tùy chọn.
- `requestId`: UUID; cũng có thể gửi bằng `X-Request-Id`.
- `consent=true`: bắt buộc.
- `Authorization: Bearer <access token>`: access token đăng nhập hiện tại của app; không tạo token mới riêng cho service.

Response chứa kết quả authoritative trong `attempt`, thông tin video, timing từng công đoạn,
`extraction` (`rawLandmarkFrames`, `effectiveFrames`, tỷ lệ có tay/hai tay, pose) và
`retainedMedia=false`. Web hiển thị các trường này để tester phân biệt frame được lấy mẫu có chủ đích
với lỗi mất dữ liệu. Lỗi có `errorCode`, thông báo tiếng Việt và `retryable` để client quyết định có thử lại hay không.

## Azure Container Apps

Image có thể để công khai trên GHCR/Docker Hub để không cần Azure Container Registry trả phí. Sau khi build và push:

```powershell
./azure/deploy.ps1 `
  -ResourceGroup signlight-free `
  -Image ghcr.io/OWNER/signlight-video-processing:COMMIT_SHA `
  -SpringBackendBaseUrl https://YOUR-SPRING-API `
  -Location southeastasia
```

Template dùng Consumption, `minReplicas=0`, `maxReplicas=3`, 1 vCPU/2 GiB và một video đang xử lý trên mỗi replica. Scale-to-zero ưu tiên chi phí thấp nhưng lần gọi đầu có thể chậm vì cold start. Đặt `minReplicas=1` chỉ khi cần giảm độ trễ và chấp nhận phí chạy nền.

### Ước tính chi phí

Azure hiện miễn phí mỗi subscription/tháng 180.000 vCPU-giây, 360.000 GiB-giây và 2 triệu request cho Container Apps Consumption. Với cấu hình 1 vCPU/2 GiB, cả hai hạn mức compute cùng tương đương khoảng **180.000 giây hoạt động (50 giờ)**. Nếu một lượt gồm cold/warm processing trung bình 3 giây thì khoảng 60.000 lượt/tháng vẫn nằm trong grant; nếu tính bảo thủ 5 giây thì khoảng 36.000 lượt. Grant được chia sẻ với các Container Apps khác trong cùng subscription.

Sau free grant, Azure Retail Prices API ngày 01/11/2026 trả về cho Southeast Asia 0,000034 USD/vCPU-giây và 0,000004 USD/GiB-giây. Vì vậy 1 vCPU/2 GiB xấp xỉ 0,1512 USD/giờ hoạt động, tức khoảng 0,000126 USD/lượt 3 giây hoặc 1,26 USD cho 10.000 lượt vượt grant. Giá thực tế phụ thuộc region, tiền tệ, cold start và thay đổi bảng giá; kiểm tra Azure Pricing Calculator trước khi bật production. Thiết kế này không dùng Azure Storage cho video và có thể dùng public GHCR, nên không có phí lưu video/ACR bắt buộc.

Nguồn: [Azure Container Apps pricing](https://azure.microsoft.com/pricing/details/container-apps/) và [Azure scaling documentation](https://learn.microsoft.com/azure/container-apps/scale-app).

Service production hiện tại:

`https://signlight-video-processing.thankfulocean-a6c2129d.eastasia.azurecontainerapps.io`

Web dùng `NEXT_PUBLIC_VIDEO_PROCESSING_BASE_URL`; Flutter dùng URL này làm production default. Có thể tắt
riêng chế độ server trên web bằng `NEXT_PUBLIC_SERVER_VIDEO_ENABLED=false`. Với Flutter, truyền
`dart-define` khi muốn tắt hoặc thay endpoint:

```powershell
flutter build apk

# Build chỉ xử lý trên thiết bị
flutter build apk --dart-define=SERVER_VIDEO_ENABLED=false
```

Không commit `.env`, access token, registry password hoặc Azure credential.

## Kiểm thử

```powershell
python -m pytest -q
```

Các test API dùng processor/backend giả, nên không gửi dữ liệu ra ngoài. Test tích hợp MediaPipe chỉ chạy khi có model local.

### Benchmark 1 vCPU/2 GiB

Tải model rồi chạy processor thật với affinity một logical CPU:

```powershell
python scripts/download_holistic_model.py models/holistic_landmarker.task
python -m scripts.benchmark_processor C:\path\to\sample.mp4 --iterations 3
```

Kết quả tham chiếu ngày 02/11/2026 với video mẫu 640×640, 20 FPS, 2,55 giây: peak RSS
306,43 MiB; median 3,83 giây (min 3,04, max 4,53); giải mã 144–218 ms; landmark 2,85–4,26 giây.
Service giải mã đủ 51 frame và chủ động lấy 41 frame ở 16 FPS; 100% frame landmark có bàn tay, 82,81%
có hai tay và có pose. Vì vậy không thấy mất dữ liệu trích xuất đáng kể ở mẫu này; CPU landmark là nút
thắt, không phải RAM. Số đo local không bao gồm upload, AI/backend hoặc cold start của Container Apps.
