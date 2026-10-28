# Triển khai SignLight: Vercel + Cloudflare + Azure

Kiến trúc production MVP:

```text
Người dùng
  -> Cloudflare DNS
  -> Vercel (Next.js)
       -> Azure Container Apps: signlight-api (public, 0.5 CPU / 1 GiB)
            -> Azure PostgreSQL Flexible Server (B1ms / 32 GiB)
            -> Azure Container Apps: signlight-ai (internal, 0.25 CPU / 0.5 GiB)
  -> Cloudflare R2/custom domain (video công khai)
```

AI chỉ nhận tensor đặc trưng, có ingress nội bộ và token service-to-service. API và AI đều đặt `min-replicas=0`, `max-replicas=1` để ưu tiên chi phí thay vì thời gian phản hồi đầu tiên.

## Lưu ý chi phí

- Azure Container Apps có free grant dùng chung theo subscription: 180.000 vCPU-giây, 360.000 GiB-giây và 2 triệu request/tháng. Không phải hai container được miễn phí riêng.
- PostgreSQL B1ms, 32 GiB data và 32 GiB backup chỉ miễn phí 12 tháng cho tài khoản Azure đủ điều kiện. Sau 12 tháng sẽ tính phí nếu không xóa hoặc đổi phương án.
- ACR Standard 100 GB chỉ miễn phí 12 tháng cho tài khoản đủ điều kiện.
- R2 miễn phí 10 GB-tháng ở lớp Standard, kèm hạn mức thao tác. Egress Internet miễn phí; custom domain nên được dùng thay `r2.dev` cho production.
- Vercel Hobby chỉ dành cho dự án cá nhân/phi thương mại. Nếu SignLight thu tiền qua payOS hoặc vận hành như sản phẩm thương mại, phải dùng Vercel Pro hoặc chuyển frontend sang Cloudflare Pages/Azure Static Web Apps.
- PostgreSQL và ACR không scale-to-zero. Hãy tạo Budget + alert ở mức nhỏ ngay sau khi triển khai.

## 0. Việc bảo mật bắt buộc

Các credential từng nằm trong `application.yml` phải được thu hồi/xoay mới trước khi production: Google OAuth client secret, payOS client/API/checksum keys, Resend key và Gmail app password. Không tái sử dụng các giá trị cũ, kể cả sau khi chúng đã được xóa khỏi phiên bản hiện tại.

## 1. Cloudflare R2

1. Tạo bucket Standard, ví dụ `signlight-media`.
2. Tạo custom domain, ví dụ `cdn.signlight.id.vn`.
3. Tạo R2 API token chỉ có quyền Object Read & Write trên bucket này.
4. Cài `boto3`, đặt các biến `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, rồi chạy:

```powershell
python -m pip install boto3
python scripts/upload_videos_to_r2.py --dry-run
python scripts/upload_videos_to_r2.py
```

5. Cấu hình CORS bucket cho domain frontend. Với video công khai chỉ cần `GET`, `HEAD`, header `Range`, và expose `Accept-Ranges`, `Content-Length`, `Content-Range`.

## 2. Azure lần đầu

Yêu cầu Azure CLI và một subscription đã đăng nhập:

```powershell
az login
az account set --subscription "<subscription-id>"
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
```

Đặt secret vào biến môi trường của phiên PowerShell hiện tại; không ghi chúng vào repo. Hàm dưới tương thích cả Windows PowerShell cũ:

```powershell
function New-SignLightSecret([int]$Bytes = 48) {
  $buffer = New-Object byte[] $Bytes
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($buffer)
  } finally {
    $rng.Dispose()
  }
  [Convert]::ToBase64String($buffer).Replace('+','-').Replace('/','_').TrimEnd('=')
}

$env:AZURE_DB_ADMIN_PASSWORD = "Aa1!$(New-SignLightSecret 32)"
$env:JWT_SECRET = New-SignLightSecret 64
$env:MEDIA_SIGNING_KEY = New-SignLightSecret 48
$env:SIGNLIGHT_AI_SERVICE_TOKEN = New-SignLightSecret 48
$env:IP_HASH_SALT = New-SignLightSecret 32

.\deploy\azure\bootstrap.ps1 `
  -ResourceGroup "signlight-mvp-eastasia-rg" `
  -Location "eastasia" `
  -WebBaseUrl "https://signlight.id.vn" `
  -CdnBaseUrl "https://cdn.signlight.id.vn" `
  -SkipApiDeployment
```

`-SkipApiDeployment` là bắt buộc khi đang chuyển database từ Docker: nó tạo database và AI nhưng chưa khởi động API. Script tự tìm Azure CLI ở đường dẫn Windows chuẩn nếu terminal chưa nhận PATH mới.

Script tạo ACR Standard, managed identity có `AcrPull`, PostgreSQL B1ms/32 GiB, Container Apps environment và hai app. Nó không bật Redis vì backend hiện không dùng Redis. Log Analytics cũng được tắt ở environment để tránh một nguồn phí ngoài bảng dự toán; dùng log console trực tiếp hoặc bật Azure Monitor có chủ đích khi cần.

Image được build bằng Docker trên máy rồi push lên ACR. Azure for Students thường chặn ACR Tasks, vì vậy quy trình không dùng `az acr build`.

### Chuyển PostgreSQL từ Docker

Trước hết, dừng API để không có dữ liệu mới được ghi trong lúc export. Tại thư mục gốc repository, tạo dump nhị phân ngay bên trong container rồi chép ra máy:

```powershell
docker compose -f .\deploy\docker-compose.yml --env-file .\deploy\.env stop api
docker compose -f .\deploy\docker-compose.yml --env-file .\deploy\.env exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" -f /tmp/signlight.dump'
New-Item -ItemType Directory -Force .\backups | Out-Null
docker compose -f .\deploy\docker-compose.yml --env-file .\deploy\.env cp db:/tmp/signlight.dump .\backups\signlight-before-azure.dump
```

Sau khi chạy bootstrap với `-SkipApiDeployment`, restore dump vào PostgreSQL Azure. Dùng đúng server name script đã in. Nếu máy đã có PostgreSQL client, chạy:

```powershell
$env:PGPASSWORD = $env:AZURE_DB_ADMIN_PASSWORD
pg_restore --no-owner --no-privileges --clean --if-exists `
  --host "<postgres-server>.postgres.database.azure.com" `
  --port 5432 --username signlightadmin --dbname signlight `
  --format custom ..\backups\signlight-before-azure.dump
Remove-Item Env:PGPASSWORD
```

Nếu chưa có `pg_restore` trên Windows, dùng image PostgreSQL 17 qua Docker (chạy ở thư mục gốc repository):

```powershell
docker run --rm `
  -e PGPASSWORD=$env:AZURE_DB_ADMIN_PASSWORD `
  -v "${PWD}\backups:/backup:ro" `
  postgres:17-alpine `
  pg_restore --no-owner --no-privileges --clean --if-exists `
  --host "<postgres-server>.postgres.database.azure.com" `
  --port 5432 --username signlightadmin --dbname signlight `
  --format custom /backup/signlight-before-azure.dump
```

Kiểm tra số migration của database cũ, sau đó khởi động API bằng cách chạy lại bootstrap không có `-SkipApiDeployment`:

```powershell
.\deploy\azure\bootstrap.ps1 `
  -ResourceGroup "signlight-mvp-eastasia-rg" `
  -Location "eastasia" `
  -WebBaseUrl "https://signlight.id.vn" `
  -CdnBaseUrl "https://cdn.signlight.id.vn"
```

Chỉ xóa volume/database Docker sau khi API Azure, đăng nhập và dữ liệu học đã được kiểm thử. Giữ file dump ở nơi an toàn, không commit.

Sau khi script chạy xong, lấy URL API được in ra. Script đã tự cập nhật `PUBLIC_API_BASE_URL` của API bằng URL này.

Các secret tích hợp còn lại (Google, payOS, Resend/SMTP) thêm bằng `az containerapp secret set`, sau đó ánh xạ bằng `az containerapp update --set-env-vars NAME=secretref:secret-name`. Không đưa secret vào `NEXT_PUBLIC_*`.

## 3. Vercel

Import repository và đặt **Root Directory** là `src/frontend`. Chọn Hobby chỉ khi đây thực sự là dự án cá nhân/phi thương mại.

Production environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://<api-fqdn>
NEXT_PUBLIC_APP_URL=https://signlight.id.vn
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-client-id-cong-khai>
NEXT_PUBLIC_GA_MEASUREMENT_ID=<tuy-chon>
NEXT_PUBLIC_MEDIAPIPE_WASM_URL=/wasm/mediapipe
NEXT_PUBLIC_HOLISTIC_MODEL_URL=/models/holistic_landmarker.task
```

Sau khi Vercel cấp domain, thêm domain đó vào `PUBLIC_WEB_BASE_URL` của API. Nếu dùng cả `www` và apex, truyền danh sách cách nhau bằng dấu phẩy.

## 4. Cloudflare DNS

- Trỏ apex/`www` theo hướng dẫn domain của Vercel.
- `cdn` được gắn trực tiếp bằng custom domain của R2, không tự tạo CNAME tùy ý trước bước kết nối R2.
- Nếu thêm custom domain cho Azure API, xác thực domain trên Container Apps trước rồi mới bật proxy Cloudflare. Webhook payOS phải dùng URL HTTPS ổn định.

## 5. CI/CD Azure

Workflow `.github/workflows/deploy-azure.yml` chạy test backend/AI rồi mới build và cập nhật image sau khi bootstrap thành công. Tạo GitHub Environment `production` và cấu hình:

Secrets:

```text
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
```

Variables:

```text
AZURE_RESOURCE_GROUP=signlight-mvp-eastasia-rg
AZURE_ACR_NAME=<giá trị script in ra>
AZURE_API_APP_NAME=signlight-api
AZURE_AI_APP_NAME=signlight-ai
```

Azure identity dùng cho GitHub OIDC cần quyền build/push ACR và cập nhật Container Apps trong resource group; không tạo client secret dài hạn cho GitHub.

## 6. Kiểm tra sau triển khai

1. `GET https://<api-fqdn>/health` trả HTTP 200.
2. Đăng ký/đăng nhập, refresh token và CORS hoạt động từ domain Vercel.
3. Mở một video và xác nhận URL trả về thuộc domain R2.
4. Thử một lượt nhận diện AI; lượt đầu có thể chậm vì cả API và AI cùng cold start.
5. Kiểm tra Flyway đã chạy đủ migration và `SIGNLIGHT_SEED_ENABLED=false`.
6. Đặt Azure Budget/Cost alert và kiểm tra mục Free services mỗi tuần trong tháng đầu.
