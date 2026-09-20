# Deploy Notes — SignLight (UAT)

| Phiên bản | **v0.3** | Ngày | 2026-09-20 | Trạng thái | ⚠️ **RUNBOOK — CHƯA TRIỂN KHAI LẦN NÀO** |
|-----------|------|------|------------|------------|-------------------------------------------|

> ## ⚠️ Đọc trước
>
> Chưa có mã nguồn nên **chưa chạy `docker compose up` lần nào**. Tài liệu này là **runbook chuẩn bị sẵn**:
> các bước, checklist và cách xử lý sự cố. Phần "Nhật ký triển khai" (§7) còn trống.
>
> **Đang CHẶN việc chạy UAT:**
> 1. ⚠️ **Chưa có BỘ KHOÁ merchant/sandbox VNPay + MoMo** — anh Duy xác nhận tài khoản thuộc loại
>    **merchant/sandbox developer** (2026-09-20), nên **lấy được** 5 giá trị sau; DevOps cần chúng mới chạy được M6:
>    `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`.
>    Lấy ở `sandbox.vnpayment.vn` và `business.momo.vn` → mục *Thông tin tích hợp*.
>    🔐 **Khoá là bí mật: chỉ đặt trong `deploy/.env`, tuyệt đối không commit, không dán vào tài liệu.**
> 2. ⚠️ **Chưa có mã nguồn** (`../src/backend`, `../src/frontend`, `../src/ai`) — B4 chưa chạy.
>
> ✅ **Đã gỡ chặn ở v0.3:**
> - **Q2 — dải port `18080–18090` đã được cấp**, đã điền vào `docker-compose.yml` và `.env.example`.
> - **Q8 = phương án B** → dịch vụ `ai` **chỉ nhận tensor**, không nhận ảnh.
> - **Q9 = CÓ** → **bắt buộc** tạo bucket `signlight-donation` với quyền tách riêng.
> - **Q10 = nội dung giả lập** → UAT chạy bằng **dữ liệu seed**, không chờ nội dung thật.
>
> **Mới ở v0.2:** thêm service **`ai`** (Python + ONNX) và các biến `VNPAY_*` / `MOMO_*` / `SIGNLIGHT_AI_*`.

---

## 1. Tổng quan môi trường UAT

| Service | Ảnh / nguồn | Port trong container | Port host | Ghi chú |
|---------|-------------|:--------------------:|:---------:|---------|
| `api` | build từ `../src/backend` | 8080 | `18080` | Spring Boot 3.5 / Java 21 |
| `web` | build từ `../src/frontend` | 3000 | `18081` | Next.js 15 |
| `db` | `postgres:17-alpine` | 5432 | **không mở** | Có `unaccent` + `pg_trgm` |
| `cache` | `redis:7.4-alpine` | 6379 | **không mở** | Có mật khẩu |
| **`ai`** 🤖 | build từ `../src/ai` | 7860 | **không mở** | Python + FastAPI + ONNX. **Không có xác thực người dùng** → bắt buộc giữ nội bộ (ADR-10) |
| `storage` | `minio/minio` | 9000 / 9001 | `18082` / `18083` | Giả lập object storage; production dùng dịch vụ thật |

✅ **Dải port được cấp: `18080–18090`** (anh Duy, 2026-09-20). Thực dùng **4 port**; `18084–18090` để dự phòng.
Các service `ai`, `db`, `cache` **cố ý không mở port nào** — riêng `ai` là ràng buộc bảo mật (ADR-10, DR-12),
không được mở kể cả khi cần gỡ lỗi; gỡ lỗi thì `docker compose exec` vào trong mạng.

### 1.1 🤖 Chuẩn bị dịch vụ AI

Thư mục `../src/ai` cần chứa (lấy từ repo [`dathihi1/EXE101`](https://github.com/dathihi1/EXE101)):

```
src/ai/
├── Dockerfile
├── requirements-deploy.txt
├── vsl_mvp/                             # toàn bộ src/vsl_mvp/ của repo
└── runs/vsl_mvp30_v2_lite_transformer/
    ├── model.int8.onnx                  # ~0,40 MB — bản dùng để triển khai
    ├── labels.json                      # 30 nhãn VSL
    └── config.json                      # sequence_length 64, feature_dim 327
```

- [ ] Đã sao chép mô hình + `labels.json` + `config.json` vào đúng đường dẫn.
- [ ] Đã **giữ nguyên tệp ghi nguồn VSL400 (CC BY 4.0)** — nghĩa vụ giấy phép (BRD §6, SC-12).
- [ ] Đã xác nhận **3 biến `LOG_WEBHOOK_URL`, `LOG_WEBHOOK_SECRET`, `GDRIVE_FOLDER_ID` để rỗng**
      → tắt đường ghi/tải video người dùng của repo gốc (api-spec §4.5).
- [ ] ✅ **Q8 = phương án B (đã chốt)** → đã bổ sung endpoint `POST /api/infer/features` nhận tensor `64×327`.
- [ ] ✅ **Q8 = phương án B** → đã **tắt** `POST /api/infer/frames` và `POST /api/attempt` ở cấu hình UAT/prod (api-spec §4.5).
- [ ] ✅ **Q9 = CÓ (đã chốt)** → đã tạo bucket `signlight-donation` với chính sách truy cập **tách riêng** (xem mục 11 của §3).

## 2. Chuẩn bị trước khi triển khai

- [x] ✅ **Dải port đã có: `18080–18090`** → đã điền vào `docker-compose.yml` và `.env.example`.
      Gán: `18080` api · `18081` web · `18082` storage · `18083` storage-console · `18084–18090` dự phòng.
- [ ] ⚠️ **Kiểm `ai` KHÔNG mở ra ngoài:** `docker compose port ai 7860` phải **báo lỗi/không trả kết quả**.
      Nếu nó trả về một port host thì **dừng triển khai ngay** — đó là DR-12.
- [ ] Đã copy `.env.example` → `.env` và thay **toàn bộ** giá trị `change_me`.
      Sinh chuỗi ngẫu nhiên: `openssl rand -base64 64`
- [ ] Đã kiểm `.env` **không** bị commit (`git check-ignore -v deploy/.env` phải trả về kết quả).
- [ ] Máy chủ UAT có Docker ≥ 27 và Docker Compose v2.
- [ ] Ổ đĩa còn trống ≥ 20 GB (video chuyển mã chiếm chỗ nhanh).
- [ ] Đã đóng băng phiên bản mã nguồn cần triển khai (ghi lại commit hash).
- [ ] **Không có dữ liệu cá nhân thật** trong bộ dữ liệu gieo (PDPL).

## 3. Quy trình triển khai

```bash
cd deploy
cp .env.example .env    # rồi sửa .env — KHÔNG commit
docker compose --env-file .env up -d --build
```

```bash
docker compose ps
```

```bash
docker compose logs -f api
```

### 3.1 Kiểm tra sau khi khởi động (smoke test)

```bash
curl -fsS http://<HOST>:18080/health
```

- [ ] `/health` trả `status: UP`, gồm cả `db` và `redis`.
- [ ] Di trú Flyway chạy xong, không lỗi (xem log `api`).
- [ ] Mở `http://<HOST>:18081` → trang chủ hiển thị.
- [ ] Đăng ký một tài khoản thử → vào được lộ trình học.
- [ ] Mở một bài học → video phát được (kiểm cả đường qua storage).
- [ ] Mở Trainer đánh vần → mô hình tải được, camera bật được.
- [ ] Tra một từ trong từ điển bằng từ khoá **không dấu** → ra kết quả (xác nhận `unaccent` đã bật).
- [ ] Kiểm `docker compose port db 5432` → **không** trả kết quả (DB không lộ ra ngoài).
- [ ] 🤖 Kiểm dịch vụ AI **từ bên trong mạng**:
      `docker compose exec api curl -fsS http://ai:7860/health` → `{"status":"UP","numClasses":30}`
- [ ] 🤖 Kiểm dịch vụ AI **KHÔNG** với tới được từ ngoài: `docker compose port ai 7860` → **không** có kết quả.
- [ ] 🤖 Đồng bộ vốn ký hiệu: CMS → "Đồng bộ từ dịch vụ AI" → **30 nhãn**, ghi lại số nhãn mồ côi.
- [ ] 🤖 Luyện thử một ký hiệu trước camera → nhận được kết quả + gợi ý.
- [ ] 🤖 **Kiểm bất biến camera**: mở DevTools → Network → luyện 3 lượt → **không** request nào chứa ảnh/video.
- [ ] 💳 Thanh toán thử VNPay sandbox → IPN tới → Premium kích hoạt, `expires_at` đúng số ngày.
- [ ] 💳 Thanh toán thử MoMo sandbox → tương tự.
- [ ] 💳 **Kiểm `returnUrl` không cấp quyền**: tự gọi `/billing/return/vnpay?vnp_ResponseCode=00&...` bằng
      tài khoản chưa trả tiền → **KHÔNG** được lên Premium (AC-29.7).

## 4. Cấu hình bảo mật bắt buộc trên UAT

| # | Hạng mục | Yêu cầu | Đã làm? |
|---|----------|---------|:-------:|
| 1 | Port CSDL & cache | **Không** mở ra ngoài | ☐ |
| 2 | Actuator | Chỉ `health`, `info`, `prometheus`; `show-details: never` (rủi ro DR-03) | ☐ |
| 3 | Trang lỗi | Không trả stack trace, không trả message nội bộ | ☐ |
| 4 | Secret | Chỉ qua biến môi trường; **không** hard-code trong compose hay mã nguồn | ☐ |
| 5 | Bảng điều khiển storage | Cân nhắc **không mở** ra ngoài; nếu mở thì đổi mật khẩu mặc định | ☐ |
| 6 | TLS | UAT nội bộ có thể dùng HTTP; **production bắt buộc HTTPS + HSTS** | ☐ |
| 7 | Dữ liệu | Chỉ dữ liệu ẩn danh | ☐ |
| 8 | Quyền bucket | `signlight-video` **không** để công khai; chỉ truy cập qua URL ký | ☐ |
| 9 | 🤖 **Port dịch vụ AI** | **Không** mở ra ngoài — dịch vụ này không có xác thực người dùng | ☐ |
| 10 | 🤖 **Đường ghi dữ liệu của repo gốc** | `LOG_WEBHOOK_URL`, `LOG_WEBHOOK_SECRET`, `GDRIVE_FOLDER_ID` **để rỗng**; endpoint `POST /api/attempt` **không** được route qua proxy | ☐ |
| 11 | 🤖 **Bucket dữ liệu góp** | `signlight-donation` có **quyền truy cập riêng**, tách hẳn bucket vận hành (BR-A134) | ☐ |
| 12 | 💳 **Secret cổng thanh toán** | `VNPAY_HASH_SECRET`, `MOMO_SECRET_KEY` chỉ qua biến môi trường; **không** ghi log | ☐ |
| 13 | 💳 **Đường IPN** | IPN phải tới được từ Internet nhưng **chỉ** chấp nhận request có chữ ký hợp lệ | ☐ |

## 5. Vận hành

### 5.1 Sao lưu

```bash
docker compose exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > backup_$(date +%Y%m%d).sql
```

- Lịch: **hằng ngày** (NFR-17). Giữ tối thiểu 7 bản.
- **Diễn tập phục hồi hằng quý** — sao lưu chưa từng phục hồi thử thì coi như chưa có.
  Mục tiêu: **RPO ≤ 24 giờ, RTO ≤ 4 giờ**.

### 5.2 Phục hồi

```bash
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" < backup_YYYYMMDD.sql
```

### 5.3 Cập nhật phiên bản

```bash
docker compose --env-file .env up -d --build api web
```

Nếu có di trú CSDL: sao lưu **trước**, rồi mới build lại.

### 5.4 Rollback

```bash
git checkout <commit-cũ> && docker compose --env-file .env up -d --build
```

Nếu di trú CSDL không tương thích ngược → phục hồi từ bản sao lưu (§5.2).

### 5.5 Dừng dịch vụ

```bash
docker compose down
```

> ⚠️ `docker compose down -v` **xoá luôn volume** (mất toàn bộ dữ liệu và video). Chỉ dùng khi thực sự
> muốn xoá sạch, và **phải hỏi trước**.

## 6. Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|-------------|------------------------|------------|
| `api` khởi động rồi thoát | Sai thông tin CSDL, hoặc `db` chưa sẵn sàng | Xem `docker compose logs api`; kiểm `.env`; `depends_on: service_healthy` đã xử lý phần lớn trường hợp |
| Di trú Flyway lỗi | Schema lệch với lịch sử di trú | **Không** sửa tay CSDL; sửa file di trú rồi build lại; nếu UAT thì có thể `down -v` làm lại từ đầu |
| Tìm kiếm không dấu không ra kết quả | Extension `unaccent` chưa bật | Kiểm `deploy/init/01-extensions.sql` đã chạy chưa; nếu volume đã tồn tại từ trước thì script init **không** chạy lại → bật tay bằng `CREATE EXTENSION` |
| Video không phát được | Sai `PUBLIC_CDN_BASE_URL`, hoặc bucket sai quyền, hoặc URL ký hết hạn | Kiểm biến môi trường; kiểm bucket; kiểm lệch đồng hồ giữa các container |
| Camera không bật ở Trainer | Trang chạy HTTP không phải localhost | `getUserMedia` yêu cầu **HTTPS hoặc localhost** → UAT cần HTTPS hoặc truy cập qua `localhost` |
| `web` build lỗi biến `NEXT_PUBLIC_*` | Next.js cần biến công khai lúc **build**, không phải lúc chạy | Truyền qua `args` trong compose (đã cấu hình sẵn) |
| **IPN không tới** | UAT không có IP công khai | Dùng công cụ tạo đường hầm (tunnel) rồi đặt `VNPAY_IPN_URL`/`MOMO_IPN_URL` theo địa chỉ đó; hoặc gửi lại IPN từ cổng quản trị của VNPay/MoMo |
| **Giao dịch VNPay luôn báo lệch số tiền** | Quên nhân/chia **100** — `vnp_Amount` là VND × 100 | Kiểm lại công thức quy đổi ở cả lúc tạo URL và lúc đối chiếu IPN |
| **Chữ ký VNPay luôn sai** | Sai thứ tự tham số hoặc quên bỏ `vnp_SecureHashType` khỏi chuỗi ký | Sắp tham số theo **bảng chữ cái**, loại bỏ `vnp_SecureHash` *và* `vnp_SecureHashType` trước khi ký |
| 🤖 **`api` không khởi động vì `ai` chưa healthy** | Nạp mô hình ONNX + MediaPipe mất thời gian | `start_period: 90s` đã tính tới; nếu vẫn timeout thì xem `docker compose logs ai` |
| 🤖 **Mọi lượt chấm trả `10102`** | Tensor sai kích thước — client gửi ≠ 64×327 | Đối chiếu `sequenceLength`/`featureDim` client dùng với `config.json` của mô hình |
| 🤖 **Mọi lượt chấm trả `10201`** | Vốn ký hiệu chưa đồng bộ, hoặc nhãn chưa ánh xạ được | Vào CMS (SCR-34) bấm "Đồng bộ"; xử lý danh sách nhãn mồ côi |
| 🤖 **Nhãn mồ côi nhiều bất thường** | Quy tắc chuẩn hoá `stable_sign_id` ở backend lệch với dịch vụ AI | Chạy bộ test chung hai phía (BR-A124, AC-44.2) |
| 🤖 **Độ trễ chấm > 1,5 giây** | Nút cổ chai là **MediaPipe ở client**, không phải mô hình (mô hình chỉ ~0,5 ms) | Giảm độ phân giải khung vào; đo lại trên máy tầm trung (T-10) |
| Hết dung lượng đĩa | Video chuyển mã tích tụ | `docker system prune`; dọn bản chuyển mã cũ; theo dõi dung lượng |

## 7. Nhật ký triển khai

| Ngày | Phiên bản (commit) | Môi trường | Người thực hiện | Kết quả | Ghi chú |
|------|--------------------|------------|-----------------|---------|---------|
| — | — | — | — | *(chưa triển khai lần nào)* | |

## 8. Việc phải hỏi/chốt trước khi chạy UAT

| # | Việc | Người quyết | Trạng thái |
|---|------|-------------|------------|
| 1 | ~~Dải port UAT~~ | — | ✅ **Đã cấp: `18080–18090`** (2026-09-20) |
| 2 | Có mở bảng điều khiển storage ra ngoài không? | anh Duy | ❓ chờ |
| 3 | UAT dùng HTTP hay HTTPS? *(ảnh hưởng trực tiếp: camera chỉ chạy trên HTTPS/localhost)* | anh Duy | ❓ chờ |
| 4 | ~~Cổng thanh toán (Q3)~~ | — | ✅ **Đã chốt: VNPay + MoMo** |
| 5 | Ai được truy cập UAT (giới hạn IP?) | anh Duy | ❓ chờ |
| 6 | **Bộ khoá merchant/sandbox VNPay + MoMo** (5 giá trị, xem §đầu trang) — không có thì không kiểm được M6 | anh Duy | ⚠️ **một phần** — đã có tài khoản (SĐT `0866678802`), **chờ 5 khoá tích hợp** |
| 7 | ~~Q8: dịch vụ AI nhận tensor hay nhận ảnh?~~ | — | ✅ **Đã chốt: nhận TENSOR** (phương án B) — phải bổ sung `/api/infer/features`, tắt `/api/infer/frames` |
| 8 | ~~Q9: có bật "Góp dữ liệu" không?~~ | — | ✅ **Đã chốt: CÓ** — **bắt buộc** tạo bucket `signlight-donation` |
| 9 | **Nội dung giả lập (Q10)** — UAT chạy bằng **dữ liệu seed**; cần một lệnh seed idempotent và cờ `is_seed` | dev | ☐ theo SRS §3.4 / NFR-21 |
