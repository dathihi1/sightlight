# Techstack — SignLight

| Phiên bản | **v0.3** | Ngày | 2026-09-20 | Trạng thái | ✅ **ĐÃ DUYỆT TOÀN BỘ VERSION** — anh Duy xác nhận 2026-09-20 |

**Tiền đề:** `docs/ba/BRD.md`, `docs/ba/SRS.md` (NFR-01→21) · **Khớp với:** `docs/sa/HLD.md` §1 — **Modular monolith**

---

## Nguyên tắc lựa chọn
Ưu tiên: **phù hợp NFR > thế mạnh đội ngũ > chi phí vận hành > độ trưởng thành**.

Bốn ràng buộc chi phối mọi lựa chọn dưới đây:
1. **Đội 1–2 người** (BRD §6) → tránh mọi thứ cần một đội vận hành riêng (Kubernetes, Kafka, service mesh).
2. **Chi phí ≤ 0,15 USD/MAU** (NFR-18) → video bắt buộc qua CDN; hạn chế tối đa số dịch vụ luôn chạy.
3. **Hình ảnh camera được bảo vệ** (NFR-12) → **trích đặc trưng bắt buộc chạy trong trình duyệt**; dịch vụ AI phía server chỉ nhận **tensor số**, không nhận pixel (**phương án B — Q8 đã chốt 2026-09-20**).
4. **Tái dùng tài sản AI đã kiểm chứng** (repo EXE101) → chấp nhận thêm một tiến trình Python thay vì viết lại bằng Java.

## Bảng công nghệ *(✅ anh Duy đã duyệt toàn bộ — 2026-09-20)*

| Lớp | Lựa chọn | **Version** | Lý do (chọn & chọn version) | Phương án thay thế đã cân nhắc | NFR liên quan | Xác nhận |
|-----|----------|-------------|------------------------------|-------------------------------|---------------|:--------:|
| Ngôn ngữ/Backend | **Java** | **21 (LTS)** | LTS hỗ trợ tới 2029+; virtual threads xử lý tốt tải I/O-bound (gọi cổng thanh toán, storage) mà không cần lập trình phản ứng. Hệ sinh thái thư viện & ảnh Docker đã ổn định hoàn toàn trên Java 21 | **Java 25 (LTS)** — mới hơn nhưng hệ sinh thái chưa chín bằng · **Java 17** — thiếu virtual threads · **Kotlin** — đội chưa có kinh nghiệm · **Node.js** — dùng cho backend sẽ trùng ngôn ngữ FE nhưng yếu về giao dịch tiền bạc | NFR-01, NFR-06 | ✅ |
| Framework API | **Spring Boot** | **3.3.x (3.3.4)** | Chuẩn ổn định LTS; hỗ trợ đầy đủ Java 21 + virtual threads; tích hợp Spring Security 6, Spring Data JPA, Spring Validation, Actuator | **Spring Boot 3.5.x / 4.x** — quá mới hoặc chưa ổn định với toàn bộ starter · **Quarkus** — khởi động nhanh hơn nhưng lệch chuẩn | NFR-01, NFR-07, NFR-16 | ✅ |
| Bảo mật backend | **Spring Security** + **JWT (Nimbus JOSE)** + **Google OIDC** | Spring Boot 3.3.x | Tích hợp sẵn; Google OAuth2/OIDC ID token verification (`GoogleTokenVerifier`); bộ lọc JwtAuthenticationFilter; Refresh Token rotation xoay vòng 30 ngày (bảng `refresh_token`, chống tái dùng token family) | **Keycloak** — mạnh nhưng thêm một dịch vụ phải vận hành, quá nặng cho đội 1–2 người | NFR-07, NFR-09 | ✅ |
| Băm mật khẩu | **Argon2id** (Spring Security Crypto + BouncyCastle) | m=19 MiB, t=2, p=1 | Chuẩn khuyến nghị hiện hành cho mật khẩu; tham số theo OWASP Password Storage Cheat Sheet | **BCrypt** — vẫn chấp nhận được nhưng yếu hơn trước tấn công GPU · **PBKDF2** — yếu nhất trong ba | NFR-09 | ✅ |
| CSDL vận hành | **PostgreSQL** | **16.x** | ACID cho giao dịch thuê bao; JSONB cho cấu hình bài tập linh hoạt; **full-text search + `unaccent` + `pg_trgm`** đủ cho từ điển (FR-21) nên **không cần Elasticsearch** — tiết kiệm một dịch vụ. Khớp môi trường Docker Compose | **PostgreSQL 17** — mới hơn, sẵn sàng nâng cấp · **MySQL 8** — yếu hơn về JSONB & full-text tiếng Việt · **MongoDB** — không phù hợp dữ liệu giao dịch tiền | NFR-01, NFR-06, NFR-17 | ✅ |
| Tìm kiếm | **PostgreSQL FTS** (`tsvector` + `unaccent` + `pg_trgm`) | theo PostgreSQL 16 | Kho từ điển mục tiêu ~1.500–5.000 ký hiệu (BG-04) — quy mô này **không cần** máy tìm kiếm riêng. `unaccent` giải quyết tìm không dấu (AC-21.1), `pg_trgm` lo gợi ý sai chính tả | **Elasticsearch/OpenSearch** — mạnh hơn nhiều nhưng thêm ~40 USD/tháng và một hệ phải vận hành; **cân nhắc lại khi > 50.000 ký hiệu** | NFR-01, NFR-18 | ✅ |
| Cache | **Redis** | **7.4.x** | Cache danh mục nội dung (đọc nhiều, ghi ít) để đạt P95 < 300 ms; lưu bộ đếm giới hạn tần suất (NFR-10) và danh sách token bị thu hồi (NFR-09) | **Valkey 8** — nhánh mã nguồn mở của Redis, tương thích, đáng cân nhắc nếu lo về giấy phép · **Caffeine (cache trong tiến trình)** — không dùng chung được khi chạy nhiều bản sao | NFR-01, NFR-09, NFR-10 | ✅ |
| Di trú CSDL | **Flyway** | **10.x** | Di trú theo phiên bản (V1 đến V6), chạy tự động lúc khởi động; quản lý lịch sử migration toàn vẹn | **Liquibase** — linh hoạt hơn nhưng dài dòng · **Hibernate ddl-auto** — **tuyệt đối không dùng** ở môi trường thật | NFR-16, NFR-17 | ✅ |
| Hàng đợi/Streaming | **Không dùng message broker riêng** — dùng **bảng outbox trong PostgreSQL + `@Scheduled`** | — | Nhu cầu bất đồng bộ của GĐ1 chỉ gồm: gửi email OTP/reset mật khẩu, nhắc hạn thuê bao. Bảng outbox cho **đúng-một-lần trong cùng transaction** với dữ liệu nghiệp vụ — chính xác hơn và rẻ hơn | **Kafka** — over-engineering nghiêm trọng cho quy mô này (HLD ADR-02) · **RabbitMQ** — nhẹ hơn Kafka nhưng vẫn là một dịch vụ phải vận hành | NFR-06, NFR-18 | ✅ |
| Frontend | **Next.js** (App Router) + **React** | **Next.js 15.2.x**, **React 19.x** | SSR/SSG cho SEO blog & landing (BR-A85, AC-37.1) **và** ứng dụng học tương tác — một codebase phục vụ cả hai. Đầy đủ Server Component và Client Hooks | **Angular** — bộ skill có sẵn chuẩn secure-coding, nhưng SEO/SSG yếu hơn cho blog · **Remix** — tốt nhưng cộng đồng nhỏ hơn | NFR-02, NFR-15, BR-A85 | ✅ |
| Ngôn ngữ frontend | **TypeScript** | **5.7.x** | Kiểu tĩnh bắt lỗi hợp đồng API sớm; `strict: true` bắt buộc (NFR-16) | JavaScript thuần — không chấp nhận với dự án nhiều trạng thái | NFR-16 | ✅ |
| UI & Style | **Tailwind CSS** + **Lucide Icons** | **Tailwind 4.x**, Radix UI | Giao diện hiện đại tông Teal/Kem thanh lịch; Tailwind v4 hiệu năng cao, Lucide icons trực quan | MUI — nặng, khó tuỳ biến giao diện tối giản | NFR-02, NFR-14 | ✅ |
| Quản lý trạng thái/dữ liệu | **TanStack Query** + **Context** | TanStack Query **5.x** | Query lo cache/đồng bộ dữ liệu server (tiến độ, lộ trình, polling trạng thái thanh toán 2s); React Context lo xác thực phiên học và chuyển đổi ngôn ngữ Việt-Anh | Redux Toolkit — nhiều boilerplate cho nhu cầu này | NFR-02 | ✅ |
| **Trích đặc trưng chuyển động** | **MediaPipe Holistic (WASM)** — chạy **trong trình duyệt** | MediaPipe **0.5.x** | Sinh landmark 75 điểm mốc (tay + thân + mặt) từ camera trực tiếp, chuẩn hoá thành vector 225 đặc trưng/khung hình, chuỗi 30 khung hình. Chạy tại chỗ nên **không pixel nào rời thiết bị** (NFR-12) | Chạy MediaPipe ở server — pixel phải rời máy, vi phạm quyền riêng tư | **NFR-04, NFR-12** | ✅ |
| **🤖 Kiến trúc AI nhận diện kép (Dual Inference)** | **Client-side WASM (Chính) + Python FastAPI (Dự phòng)** | ONNX Web **1.21.x** (WASM) & Python **3.11** FastAPI **0.115.x** | **Đột phá kép**: Mô hình LiteTransformer INT8 (~0.4 MB) tải về chạy trực tiếp trên trình duyệt qua `onnxruntime-web` cho độ trễ cực thấp (<20 ms), không tải server. Dự phòng qua FastAPI `POST /api/infer/features` trên mạng nội bộ | Chạy 100% server — tốn chi phí băng thông & suy luận máy chủ | **NFR-04, NFR-19, NFR-20** | ✅ |
| **Định dạng mô hình** | **ONNX INT8** (`model.onnx`) | opset 17 | Mô hình lượng tử hoá INT8 chỉ 400 KB, tối ưu hoá bộ nhớ và tốc độ suy luận WASM SIMD | TorchScript — nặng, không tương thích WASM trình duyệt | NFR-04 | ✅ |
| **Huấn luyện & mở rộng mô hình** | **PyTorch** (Lite Transformer / Multi-head Self Attention) | PyTorch **2.4.x** | Pipeline huấn luyện VSL 30 nhãn & 400 nhãn (`src/ai/runs/`) | — | BG-08 | ✅ |
| **Bộ dữ liệu huấn luyện** | **VSL400** (Zenodo, **CC BY 4.0**) | bản `17943574` | Bộ dữ liệu VSL công khai chất lượng cao cho ký hiệu tiếng Việt. Ghi nguồn CC BY 4.0 trong sản phẩm | Tự quay toàn bộ — chi phí và thời gian rất lớn | BG-08 | ✅ |
| Lưu trữ & Phát video | **Google Drive CDN Direct Streaming** + **Local Media Proxy** | HTTP 206 Partial Content | Phát trực tiếp qua CDN toàn cầu của Google (`https://lh3.googleusercontent.com/d/{id}`) không giật lag. Backend proxy `/api/v1/media/stream/{id}` điều hướng HTTP 307 hoặc stream tệp tĩnh có Range support. Không phụ thuộc MinIO | MinIO tự dựng — tốn tài nguyên máy chủ và chi phí băng thông outbound | NFR-03, NFR-18 | ✅ |
| Cổng thanh toán | **payOS (VietQR NAPAS standard)** | payOS Java SDK / REST API | Tích hợp chuẩn thanh toán ngân hàng quốc gia VietQR. Sinh mã QR động cho 40+ ngân hàng (BIDV, MBBank, VCB,...). Xác thực Webhook HMAC SHA-256 tức thì, hỗ trợ active polling (2s) và xác thực 2 chiều chống gian lận | VNPay / MoMo — thủ tục xét duyệt merchant phức tạp, khó tích hợp trực tiếp cá nhân | NFR-11 | ✅ |
| Email giao dịch | **Spring Mail (SMTP / JavaMailSender)** | javax.mail / jakarta.mail | Gửi email OTP xác nhận tài khoản 6 chữ số (TTL 15 phút) và liên kết đặt lại mật khẩu bảo mật | Tự dựng SMTP không chứng thực — hay vào spam | NFR-17 | ✅ |
| Sinh PDF chứng chỉ | **OpenPDF** hoặc **Apache PDFBox** | PDFBox **3.x** | Sinh phía server, nhúng font tiếng Việt; không phụ thuộc trình duyệt | Sinh phía client — không kiểm soát được tính toàn vẹn của chứng chỉ | FR-27 | ✅ |
| Hạ tầng/Triển khai | **Docker Compose** (UAT) · **một máy chủ + reverse proxy** (prod GĐ1) | Docker **27.x**, Compose **v2.x** | Theo bộ skill; đủ cho NFR-06 (5.000 DAU). Nâng lên nhiều bản sao sau cổng tải cân bằng khi cần | **Kubernetes** — over-engineering cho đội 1–2 người (HLD ADR-03) · **Serverless** — khởi động nguội gây hại NFR-01 | NFR-05, NFR-06, NFR-18 | ✅ |
| Reverse proxy / TLS | **Caddy** hoặc **Nginx** | Caddy **2.x** | TLS tự động, cấu hình ngắn; đặt security header tập trung (CSP, HSTS) | Nginx — mạnh hơn nhưng phải tự lo chứng chỉ | NFR-07 | ✅ |
| CI/CD | **GitHub Actions** hoặc **GitLab CI** *(theo nơi đặt repo)* | — | Build + test + quét SCA + quét secret ở mỗi PR; bắt buộc CI xanh trước khi merge (`source-control.md`) | Chạy build tay — không chấp nhận với quy trình có cổng | NFR-16 | ✅ |
| Quan sát (obs) | **Spring Boot Actuator + Micrometer** → **Prometheus + Grafana**; log JSON tập trung | Prometheus **3.x**, Grafana **11.x** | Đáp ứng NFR-17 (traceId, cảnh báo 5xx > 1%/5 phút) với chi phí thấp | **Datadog/New Relic** — tiện hơn nhiều nhưng chi phí đe doạ NFR-18 · Không quan sát gì — vi phạm NFR-17 | NFR-17 | ✅ |
| Kiểm thử | **JUnit 5 + Mockito + Testcontainers** (BE) · **Vitest + Testing Library + Playwright** (FE) | JUnit **5.11**, Testcontainers **1.20**, Playwright **1.48** | Testcontainers chạy PostgreSQL thật trong test tích hợp → bắt được lỗi SQL mà mock bỏ sót; Playwright chạy được **kiểm tra khả năng tiếp cận tự động** (NFR-14) | H2 in-memory — khác biệt hành vi với PostgreSQL, hay gây lỗi giả | NFR-14, NFR-16 | ✅ |
| Chất lượng mã & bảo mật | **SpotBugs + ESLint + Prettier**, **OWASP Dependency-Check**, **Gitleaks** | — | Bắt buộc theo `ST.TIM.ITC.16` (shift-left security, DoD GATE-4) | Rà tay — không lặp lại được | NFR-07, NFR-16 | ✅ |
| Phân tích sản phẩm | Công cụ phân tích **tôn trọng quyền riêng tư**, nạp **sau khi có đồng ý** | — | BR-A86, AC-37.2; đo BG-01→BG-03 | Google Analytics nạp vô điều kiện — vi phạm BR-A86 | NFR-13, BG-01→03 | ✅ |
| Ứng dụng di động | **Không áp dụng ở GĐ1** | — | Ngoài phạm vi theo BRD §3; web responsive phục vụ mobile browser | React Native / Flutter — GĐ2 | — | ☐ |

## Chuẩn dự án backend Java *(✅ đã duyệt cùng bảng trên — 2026-09-20)*

| Hạng mục | Giá trị chốt | Xác nhận |
|----------|--------------|:--------:|
| Maven module | **Single-module** — kiến trúc là modular monolith, tách gói theo miền là đủ; multi-module làm chậm vòng lặp phát triển của đội nhỏ. Tách module khi nào thực sự cần tách deploy | ✅ |
| `groupId` / `artifactId` | `vn.duy.signlight` / `signlight-api` | ✅ |
| Package gốc | `vn.duy.signlight` — **package-by-feature**: `identity`, `content`, `learning`, `practice`, `dictionary`, `gamification`, `billing`, `cms`, `platform`, **`airecognition`** | ✅ |
| Envelope | `BaseRequest` / `TransactionResponse<T>`, `errorCode` **5 ký tự** `[MM][T][NN]` theo `error-code-convention.md` | ✅ |
| Phân bổ mã module (2 ký tự đầu của errorCode) | `00` chung · `01` identity · `02` content · `03` learning · `04` dictionary · `05` gamification · `06` billing · `07` cms · `08` platform · **`10` airecognition** | ✅ |
| Sinh OpenAPI | **springdoc-openapi 2.6.x**, sinh từ code ở B4, đối chiếu với `api-spec.md` ở GATE-4. **Không viết YAML tay** | ✅ |

## Ràng buộc & Rủi ro công nghệ

| # | Rủi ro | Mức | Giảm thiểu |
|---|--------|-----|------------|
| T-01 | ~~Cổng thanh toán chưa chốt~~ → **Đã chốt VNPay + MoMo**; rủi ro còn lại là **merchant không được duyệt** | **Cao** | Nộp hồ sơ merchant **ngay**, song song phát triển (BRD R-11); `PaymentProvider` cho phép đổi/thêm cổng mà không phá kiến trúc |
| T-02 | **Độ chính xác 0.901 đo trên video quay chuẩn, chưa đo trên webcam thật** | **Rất cao** | Kiểm với ≥ 5 người thật, ≥ 3 điều kiện ánh sáng, **trước GATE-4** (NFR-19); tụt dưới 0,80 → hạ cấp về chế độ Gương (BRD R-02) |
| T-09 | **Thêm một ngôn ngữ (Python) vào hệ thống Java/TS** → đội 1–2 người phải bảo trì 3 ngôn ngữ | **Cao** | Đóng gói dịch vụ AI thành **hộp đen có hợp đồng ổn định** (`/ai/infer`, `/ai/labels`); tái dùng nguyên trạng repo EXE101, **không sửa logic AI** trong dự án này; có thể gộp về Java sau nếu cần |
| T-10 | **MediaPipe Holistic nặng trên trình duyệt** — nút cổ chai thật sự (mô hình chỉ 0,5 ms, MediaPipe mới là phần tốn) | **Cao** | Đo sớm trên máy tầm trung (GĐ-06 của BRD); hạ độ phân giải khung vào, giảm tần suất lấy mẫu; nếu không đạt → **leo thang lên anh Duy**. ⚠️ **Không được tự ý rơi về phương án C** (gửi ảnh lên server) — phương án đó đã bị loại khi Q8 chốt phương án B, rơi về nó là **vi phạm NFR-12** |
| T-11 | **Lệch quy tắc chuẩn hoá nhãn** giữa dịch vụ AI (`stable_sign_id`) và backend | TB — gây ánh xạ sai, người học nhận kết quả vô nghĩa | Viết **một bộ test chung** chạy cùng bộ dữ liệu ở cả hai phía (BR-A124, AC-44.2) |
| T-12 | Giấy phép **CC BY 4.0 của VSL400** yêu cầu ghi nguồn | TB — rủi ro pháp lý nếu quên | Ghi nguồn ở 3 vị trí cố định; đưa vào checklist release (SC-12) |
| T-03 | Giấy phép Redis (RSALv2/SSPL) có thể vướng nếu sau này cung cấp dịch vụ lại | TB | Dùng ở dạng nội bộ là hợp lệ; sẵn sàng chuyển **Valkey** (tương thích giao thức) |
| T-04 | PostgreSQL FTS không đủ khi kho từ điển lớn | TB | Ngưỡng đã định: xem xét lại khi > 50.000 ký hiệu hoặc P95 tìm kiếm > 300 ms |
| T-05 | Chi phí chuyển mã & băng thông video vượt dự toán | TB–Cao | Giới hạn 3 mức bitrate; theo dõi chi phí hằng tuần; cảnh báo ở 120% dự toán (NFR-18) |
| T-06 | Phụ thuộc MediaPipe (dự án của một hãng lớn, có thể đổi hướng) | Thấp–TB | Đóng gói sau interface `HandLandmarkProvider` ở frontend để thay thế được |
| T-07 | Vendor lock-in với object storage/CDN | Thấp | Dùng API tương thích S3 → chuyển nhà cung cấp được |
| T-08 | Tuân thủ PDPL khi dùng dịch vụ đặt ngoài lãnh thổ | TB | Chốt vùng lưu trữ dữ liệu cá nhân trước GATE-5; ghi rõ trong Chính sách riêng tư |

---

## ✅ Checklist trước GATE-2
- [x] Mọi lựa chọn có **Lý do** bám NFR + **≥1 phương án thay thế** đã cân nhắc (không mặc định framework).
- [x] Mọi dòng có **version cụ thể** (ưu tiên LTS, kèm lý do chọn version).
- [ ] ⚠️ **Cột Xác nhận còn trống toàn bộ — cần anh Duy xác nhận từng dòng trước khi trình GATE-2.**
- [x] ✅ Backend Java: **Maven single-module**, `vn.duy.signlight` / `signlight-api`, package-by-feature — **đã duyệt**.
- [x] Cột **NFR liên quan** trỏ đúng ID NFR ở SRS.
- [x] Techstack **khớp kiểu kiến trúc** đã chốt ở HLD §1 (Modular monolith).
- [x] Ô không dùng ghi rõ "Không áp dụng" + lý do (ứng dụng di động, message broker).
- [x] Nêu **ràng buộc & rủi ro** (giấy phép, vendor lock-in, chi phí, **PDPL**).
- [x] ✅ **Cổng thanh toán đã chốt: VNPay + MoMo** (Q3, 2026-09-20).
- [x] ✅ **Q8 đã chốt: phương án B** (2026-09-20) — MediaPipe chạy **bắt buộc** ở trình duyệt; `onnxruntime-web` chuyển sang **đường nâng cấp**, không dùng ở GĐ1.
- [x] ✅ **Q9 đã chốt: BẬT góp dữ liệu** — kéo theo **bucket `signlight-donation`** ở dòng "Lưu trữ đối tượng" (quyền truy cập tách riêng, BR-A134).
- [x] ✅ **Q1 đã chốt: anh Duy duyệt toàn bộ bảng version + chuẩn backend** (2026-09-20) — **GATE-2 hết vướng về techstack**.
- [ ] ⚠️ Dòng duy nhất còn `☐`: **Ứng dụng di động** — cố ý, vì "Không áp dụng ở GĐ1".
