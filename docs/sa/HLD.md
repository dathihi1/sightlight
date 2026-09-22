# HLD — SignLight

| Phiên bản | **v0.3** | Ngày | 2026-09-20 | Trạng thái | DRAFT — chờ GATE-2 |

**Tiền đề:** `docs/ba/BRD.md` v0.3, `docs/ba/SRS.md` v0.3 · **Đi kèm:** `docs/sa/architecture.html` (sơ đồ khối dễ nhìn — không thay tài liệu này) · **Khớp:** `docs/sa/techstack.md`

---

## 1. Quyết định kiểu kiến trúc

| Câu hỏi quyết định | Trả lời (trích BRD/SRS) | Nghiêng Monolith / Modular | Nghiêng Microservices |
|--------------------|-------------------------|----------------------------|-----------------------|
| Quy mô người dùng (tổng, đồng thời/peak, tăng trưởng) | NFR-06: 50.000 đăng ký · 5.000 hoạt động/ngày · **500 phiên học đồng thời** · NFR-01: 300 req/s | ✅ Nhỏ–vừa, tải có thể dự đoán (học tập có đỉnh buổi tối nhưng biên độ hẹp) | ❌ |
| Số miền nghiệp vụ & mức độc lập | 10 miền (identity, content, learning, practice, dictionary, gamification, billing, cms, platform, airecognition) — nhưng **gắn kết rất chặt**: hoàn thành 1 bài học chạm tới learning + gamification + practice **trong cùng một transaction** (BR-A30) | ✅ Nhiều miền nhưng **chia sẻ transaction**; tách service sẽ đẻ ra giao dịch phân tán không cần thiết | ❌ |
| Nhu cầu triển khai/mở rộng độc lập | Không có phần nào cần scale riêng ở GĐ1. Phần tốn tài nguyên nhất **nằm ngoài backend Java**: video ở CDN, trích đặc trưng ở trình duyệt, phân lớp ở **dịch vụ AI tách riêng** (ADR-08) | ✅ Trọn gói + 1 dịch vụ tính toán tách riêng | ❌ |
| Số đội song song & tần suất release | **1 đội 1–2 người** (BRD §6) | ✅ | ❌ |
| Năng lực vận hành (CI/CD, giám sát, hạ tầng phân tán) | Hạn chế; ngân sách NFR-18 ≤ 0,15 USD/MAU | ✅ | ❌ Microservices sẽ nhân chi phí hạ tầng & vận hành lên nhiều lần |

**Kết luận:** Kiểu kiến trúc = **Modular monolith + MỘT dịch vụ vệ tinh** — một tiến trình backend Java
(tách module theo miền, dùng chung một CSDL PostgreSQL), **cộng một dịch vụ AI Python tách riêng**.

**Vì sao dịch vụ AI là ngoại lệ duy nhất được tách ra** *(mới ở v0.2)* — ba lý do độc lập, mỗi lý do đủ mạnh:
1. **Khác ngôn ngữ.** Mô hình, pipeline trích đặc trưng và pipeline huấn luyện đều viết bằng Python
   (ONNX Runtime, MediaPipe, PyTorch). Nhét vào tiến trình Java là không làm được một cách sạch sẽ.
2. **Khác vòng đời.** Mô hình được huấn luyện lại và thay mới theo nhịp riêng (30 → 50 → 100 ký hiệu,
   mục tiêu BG-08), hoàn toàn độc lập với nhịp phát hành sản phẩm.
3. **Khác đặc tính lỗi.** Suy luận là tác vụ nặng CPU, có thể chậm hoặc chết; **phải cô lập** để không kéo
   sập luồng học (NFR-20). Backend gọi nó với timeout + circuit breaker, lỗi thì hạ cấp mềm.

Ranh giới này **không mâu thuẫn** với quyết định chọn monolith: dịch vụ AI **không có CSDL riêng**, **không
giữ trạng thái**, **không tham gia transaction nghiệp vụ** — nó là một **hàm thuần** nhận tensor trả nhãn.
Đây là *một dịch vụ tính toán*, không phải *một microservice nghiệp vụ*.

**Điều kiện tách service về sau (ghi sẵn để không phải tranh luận lại):** tách một module thành service
riêng khi **đồng thời** thoả (a) module đó chiếm > 40% tài nguyên backend, **và** (b) cần nhịp phát hành
khác phần còn lại, **hoặc** (c) có đội thứ hai sở hữu riêng module đó. Ứng viên tách tiếp theo: **`billing`**
(ranh giới rõ, ít phụ thuộc) và **`cms`** (tải khác hẳn người học).

## 2. Tổng quan kiến trúc

```mermaid
flowchart TB
    subgraph CLIENT["Kênh / Client"]
        WEB["Web người học<br/>Next.js 15 (SSR+CSR) · React 19"]
        CMSUI["CMS nội dung<br/>Next.js /admin"]
        MKT["Landing + Blog<br/>Next.js SSG"]
    end
    subgraph EDGE["Cổng / Edge"]
        PROXY["Reverse proxy (Caddy)<br/>TLS · security header · rate-limit thô"]
    end
    subgraph APP["SignLight API — Modular monolith (Spring Boot 3.3.4 / Java 21)"]
        IDN["identity<br/>FR-01→08 · Google OIDC · Refresh Token Family · Email OTP"]
        CNT["content<br/>FR-09,10,33→35 · Media Stream Proxy"]
        LRN["learning<br/>FR-11→16"]
        PRC["practice<br/>FR-17→20"]
        DIC["dictionary<br/>FR-21,22"]
        GAM["gamification<br/>FR-23→27"]
        BIL["billing<br/>FR-28→32 · payOS VietQR · Polling & Anti-bypass"]
        SUP["cms/support<br/>FR-36"]
        AIR["airecognition<br/>FR-41→44,46 · Dual Inference Orchestrator"]
        PLT["platform<br/>FR-39,40 · outbox · scheduler"]
    end
    subgraph AISVC["Dịch vụ AI (Python) — Fallback / Dự phòng máy chủ"]
        FAPI["FastAPI"]
        ONNX["ONNX Runtime<br/>vsl_mvp30 / vsl_mvp400 INT8"]
    end
    subgraph DATA["Dữ liệu"]
        PG[("PostgreSQL 16<br/>nguồn sự thật · Flyway V1-V6")]
        RDS[("Redis 7.4<br/>cache · rate-limit · token thu hồi")]
        GDRV[("Google Drive CDN + Local Web Videos<br/>Direct Streaming lh3.googleusercontent.com")]
    end
    subgraph EXT["Tích hợp ngoài"]
        PAY["Cổng payOS (VietQR NAPAS 24/7)"]
        MAIL["Dịch vụ Email (SMTP)"]
        GG["Google OIDC Identity Provider"]
    end
    subgraph BROWSER["Chạy trong trình duyệt — Kiến trúc Dual Inference"]
        MP["MediaPipe Holistic (WASM)<br/>→ 75 điểm mốc (225 features)"]
        ONNXWEB["ONNX Runtime Web (WASM INT8)<br/>→ Suy luận tại chỗ <20ms"]
    end

    WEB --> PROXY
    CMSUI --> PROXY
    MKT --> PROXY
    PROXY --> IDN & CNT & LRN & PRC & DIC & GAM & BIL & SUP & AIR
    IDN & CNT & LRN & PRC & DIC & GAM & BIL & SUP & AIR --> PG
    CNT -.-> GDRV
    BIL <--> PAY
    AIR -->|"tensor số dự phòng (timeout 5s)<br/>circuit breaker"| FAPI
    FAPI --> ONNX
```
    CNT & DIC & LRN --> RDS
    IDN --> RDS
    CNT --> OBJ
    PLT --> MAIL
    PLT --> TRC
    BIL <--> PAY
    IDN <--> GG
    WEB -. "HLS qua link ký 15 phút" .-> CDN
    CDN --> OBJ
    WEB -. "luồng camera ở lại máy" .-> MP
    MP -. "chỉ gửi tensor số, KHÔNG pixel" .-> AIR
```

**Nguyên tắc ranh giới module (bắt buộc tuân ở LLD & code):**
- Mỗi module là **một package gốc** `vn.duy.signlight.<module>`, có **một lớp cửa ngõ** (`<Module>Facade`).
- Module **chỉ gọi nhau qua Facade**, **không** gọi thẳng repository của module khác.
- Module **sở hữu bảng của mình**; module khác muốn đọc thì gọi Facade. Ngoại lệ được phép duy nhất:
  truy vấn đọc chỉ-đọc xuyên module cho màn hình tổng hợp, và phải khai báo rõ ở LLD §2.
- Vi phạm ranh giới bị chặn bằng **kiểm tra kiến trúc tự động** (ArchUnit) trong CI.

## 3. Thành phần chính

| Component/Module | Trách nhiệm | Công nghệ | Dữ liệu sở hữu | Phụ thuộc |
|-------------------|-------------|-----------|----------------|-----------|
| **Web người học** | Lộ trình, bài học, bài tập, Trainer, từ điển, tiến độ, thanh toán | Next.js 15, React 19, TS | Trạng thái phiên học cục bộ | API, CDN, MediaPipe |
| **CMS nội dung** | Soạn/duyệt/xuất bản nội dung | Next.js (khu `/admin`) | — | API |
| **Landing + Blog** | SEO, thu hút người dùng (FR-37) | Next.js SSG/ISR | Nội dung blog (MDX) | API (nhúng video ký hiệu) |
| **`identity`** | Đăng ký, đăng nhập, OAuth, token, hồ sơ, xoá tài khoản | Spring Security, JWT | `user`, `auth_identity`, `user_profile`, `user_preference`, `login_history`, `refresh_token` | Redis, Google, email |
| **`content`** | Cây nội dung, ký hiệu, video, xuất bản | Spring Boot | `course`, `unit`, `chapter`, `lesson`, `exercise`, `exercise_option`, `sign`, `sign_video`, `curiosity` | S3, chuyển mã, Redis |
| **`learning`** | Trình phát, chấm bài tập, quiz, mốc, tiến độ | Spring Boot | `user_progress`, `user_lesson_state`, `exercise_attempt`, `quiz_attempt`, `milestone_result` | `content`, `gamification`, `practice` |
| **`practice`** | Trainer SRS, đánh vần, số, Gương | Spring Boot | `user_sign_knowledge`, `fingerspell_attempt`, `practice_session` | `content`, `gamification` |
| **`dictionary`** | Tìm kiếm & chi tiết ký hiệu | PostgreSQL FTS | *(đọc từ `content`)* + `dictionary_search_log` | `content`, Redis |
| **`gamification`** | Streak, Freeze, Award, Curiosity, chứng chỉ | Spring Boot, PDFBox | `streak`, `streak_event`, `user_award`, `user_curiosity`, `certificate` | `learning`, `practice` |
| **`billing`** | Gói, thanh toán, thuê bao, webhook, paywall | Spring Boot | `plan`, `plan_price`, `subscription`, `payment_transaction`, `payment_event` | Cổng thanh toán, `identity` |
| **`cms`/`support`** | Quyền biên tập, duyệt, tra cứu CSKH | Spring Boot | `content_audit_log`, `audit_log` | mọi module (chỉ đọc qua Facade) |
| **`airecognition`** 🤖 | Cổng trung chuyển tới dịch vụ AI: kiểm quyền & hạn mức, đối chiếu nhãn ↔ ký hiệu, ghi lượt thử, đồng bộ vốn ký hiệu | Spring Boot, Resilience4j | `sign_attempt`, `ai_sign_label`, `ai_model_version`, `data_donation_consent` | Dịch vụ AI, `content`, `billing`, `practice` |
| **Dịch vụ AI** 🤖 | Suy luận thuần: tensor → nhãn + độ tin cậy + top-3 + chất lượng | Python 3.11, FastAPI, ONNX Runtime | **Không sở hữu bảng nào** | — *(không gọi ngược vào backend)* |
| **`platform`** | Outbox, scheduler, email, log, số liệu, health | Spring Boot, Micrometer | `email_outbox`, `job_lock`, `business_inquiry` | email, Prometheus |
| **Nhận dạng trong trình duyệt** | Điểm mốc bàn tay → chữ cái | MediaPipe WASM + TFJS | **Không lưu gì** | — |

## 4. Luồng dữ liệu chính

### 4.1 Hoàn thành một bài học (FR-12 + FR-16) — luồng quan trọng nhất

```mermaid
sequenceDiagram
    participant U as Người học
    participant FE as Web (Next.js)
    participant API as API Gateway (Spring)
    participant L as learning
    participant C as content
    participant G as gamification
    participant P as practice
    participant DB as PostgreSQL

    U->>FE: Mở bài học
    FE->>API: GET /lessons/{id}
    API->>L: kiểm mở khoá (BR-A12) + paywall (BR-A67)
    L->>C: lấy bài tập (KHÔNG kèm đáp án đúng — BR-A19)
    C-->>FE: bài tập + URL video đã ký (15 phút)
    loop mỗi bài tập
        U->>FE: trả lời
        FE->>API: POST /lessons/{id}/exercises/{eid}/answer
        API->>L: chấm Ở SERVER theo đáp án lưu trong DB
        L->>DB: ghi exercise_attempt
        L-->>FE: đúng/sai + video đáp án đúng
    end
    U->>FE: hoàn thành
    FE->>API: POST /lessons/{id}/complete (idempotencyKey)
    Note over L,DB: MỘT TRANSACTION (BR-A30)
    L->>DB: cập nhật user_lesson_state, user_progress
    L->>P: cập nhật lịch ôn tập (SM-2)
    L->>G: cộng phút học, xét streak, Award, Curiosity, Freeze
    L->>DB: commit
    L-->>FE: tổng kết + phần thưởng vừa nhận
```

**Điểm thiết kế then chốt:** ba việc *chấm bài*, *cập nhật tiến độ*, *cập nhật gamification* nằm **trong
cùng một transaction cục bộ**. Đây chính là lý do chọn monolith — nếu tách microservices, luồng này phải
dùng saga và sẽ sinh ra trạng thái nửa vời (người học thấy bài đã xong nhưng streak chưa tăng), làm hỏng
đúng thứ tạo động lực học (BG-02).

### 4.2 Luyện đánh vần có nhận dạng (FR-18)

```mermaid
sequenceDiagram
    participant U as Người học
    participant BR as Trình duyệt
    participant MP as MediaPipe + TFJS (tại chỗ)
    participant API as API
    participant DB as PostgreSQL

    U->>BR: cấp quyền camera (sau màn giải thích — BR-A38)
    BR->>MP: tải mô hình ≤5MB (cache)
    loop ≥15 khung hình/giây
        BR->>MP: khung hình camera
        MP-->>BR: 21 điểm mốc → chữ cái + độ tin cậy
    end
    Note over BR,MP: Khung hình KHÔNG rời khỏi thiết bị (BR-A35 / NFR-12)
    BR->>API: POST /practice/fingerspell/attempt<br/>{letter, recognitionScore, durationMs, modelVersion}
    API->>API: TỪ CHỐI nếu payload chứa dữ liệu ảnh (AC-18.6)
    API->>DB: ghi fingerspell_attempt (chỉ số liệu)
    API-->>BR: cập nhật tiến độ
```

### 4.2b 🤖 Luyện ký hiệu động với AI (FR-41 → FR-43) — luồng đặc trưng của sản phẩm

```mermaid
sequenceDiagram
    participant U as Người học
    participant BR as Trình duyệt
    participant MP as MediaPipe Holistic (tại chỗ)
    participant API as airecognition (Java)
    participant AI as Dịch vụ AI (Python)
    participant DB as PostgreSQL

    U->>BR: Bấm "Bắt đầu quay"
    loop ~2 giây, ≥15 khung/giây
        BR->>MP: khung hình camera
        MP-->>BR: landmark tay + thân + mặt
    end
    Note over BR,MP: Pixel KHÔNG rời thiết bị (NFR-12)
    U->>BR: Bấm "Kết thúc"
    BR->>BR: Cổng chất lượng tại chỗ (FR-42)<br/>thiếu tay / quá ngắn → DỪNG, không gọi API
    BR->>BR: Chuẩn hoá thành tensor 64×327
    BR->>API: POST /ai/attempts {targetSignId, features, quality, modelVersion}
    API->>API: 1) kiểm quyền  2) kiểm hạn mức (FR-30)<br/>3) kiểm targetSignId ∈ vốn AI (BR-A111)
    API->>AI: POST /infer {features}   [timeout 5s + circuit breaker]
    AI-->>API: {label, confidence, top3, status}
    API->>API: đối chiếu nhãn ↔ sign.id, áp ngưỡng<br/>+ biên tin cậy (BR-A112/113)
    API->>DB: ghi sign_attempt (CHỈ số liệu)
    API->>DB: cập nhật user_sign_knowledge (SM-2)
    API-->>BR: {verified, status, confidence, top3, qualityHints}
    BR-->>U: Kết quả + gợi ý sửa (FR-43)
```

**Bốn quyết định thiết kế nằm trong luồng này:**
1. **Cổng chất lượng chạy TRƯỚC khi gọi API** → không lãng phí lượt thử và không tốn tài nguyên suy luận
   cho chuỗi vô dụng.
2. **Backend Java quyết định "đúng/sai"**, không phải dịch vụ AI. Dịch vụ AI chỉ trả *nhãn + độ tin cậy*;
   việc áp ngưỡng, biên tin cậy và đối chiếu với mục tiêu là **luật nghiệp vụ**, thuộc về backend.
3. **Dịch vụ AI không chạm CSDL** → cô lập hoàn toàn, thay mô hình không ảnh hưởng dữ liệu.
4. **Lỗi dịch vụ AI không phải lỗi của người học** → không trừ hạn mức, không đánh dấu sai (NFR-20).

### 4.3 Thanh toán qua payOS VietQR và kích hoạt Premium (FR-29, FR-32)

```mermaid
sequenceDiagram
    participant U as Người học
    participant FE as Web (Next.js)
    participant B as Billing (Spring Boot)
    participant PAY as Cổng payOS (VietQR)
    participant DB as PostgreSQL

    U->>FE: Chọn gói dịch vụ (1 tháng / 6 tháng / 1 năm)
    FE->>B: POST /api/v1/billing/checkout {planId}
    B->>DB: Tra bảng giá server (bỏ qua giá client — BR-A60)
    B->>PAY: Tạo payment link (orderCode số nguyên 53-bit, số tiền VND)
    PAY-->>B: {checkoutUrl, qrCode, accountNumber, accountName, bin: 970418, description}
    B->>DB: Lưu payment_transaction (PENDING, thông tin ngân hàng giải mã BIDV)
    B-->>FE: Trả kết quả đơn hàng + mã QR VietQR + tài khoản BIDV
    FE-->>U: Hiển thị mã VietQR động + nút sao chép STK / Nội dung chuyển khoản

    alt Người học quét mã QR trên Mobile Banking
        U->>PAY: Chuyển khoản 24/7 NAPAS qua ứng dụng ngân hàng
        PAY->>B: Webhook POST /api/v1/billing/ipn/payos (HMAC SHA-256)
        B->>B: Xác thực chữ ký HMAC SHA-256 dữ liệu webhook
        B->>DB: Cập nhật payment_transaction (PAID), kích hoạt subscription ACTIVE, nâng vai trò ROLE_LEARNER_PREMIUM
        B-->>PAY: Phản hồi {"code":"00", "desc":"success"}
    else Người học bấm nút "Tôi đã thanh toán trên payOS"
        U->>FE: Bấm xác nhận
        FE->>B: POST /api/v1/billing/confirm/{orderCode}
        B->>PAY: Gọi API đối soát trực tiếp payOS GET /v2/payment-requests/{orderCode}
        alt payOS xác nhận PAID
            B->>DB: Cập nhật PAID, kích hoạt Subscription, nâng Premium
            B-->>FE: Trả về trạng thái PAID
        else payOS vẫn PENDING
            B-->>FE: Ném mã lỗi 06101 (PAYMENT_NOT_COMPLETED) — chống gian lận bypass
        end
    end

    loop Polling mỗi 2 giây
        FE->>B: GET /api/v1/billing/status/{orderCode}
        B-->>FE: Trạng thái hiện tại (nếu PAID -> điều hướng trang thành công)
    end
```

### 4.4 Xuất bản nội dung (FR-33→35)
`CONTENT_EDITOR` tạo ký hiệu → tải video lên S3 → `platform` đẩy việc chuyển mã → webhook chuyển mã trả về
→ `sign_video.status = READY` → biên tập gửi duyệt → `CONTENT_APPROVER` duyệt → `PUBLISHED` → **xoá cache
danh mục ở Redis** → nội dung xuất hiện với người học.

## 5. Tích hợp ngoài

| Hệ thống | Giao thức | Xác thực | Chiều | Xử lý lỗi & thử lại |
|----------|-----------|----------|-------|----------------------|
| Cổng thanh toán payOS | REST (ra) + Webhook (vào) | Client ID / Api Key / **Checksum Key (HMAC SHA-256)** | Hai chiều | Ra: gọi tạo link và đối soát API. Vào: Webhook xác thực chữ ký số HMAC SHA-256 dữ liệu; polling chủ động 2s (BR-A63) |
| Dịch vụ email | SMTP / JavaMailSender | Username / App Password | Ra | Gửi email mã OTP xác thực (6 số, 15 phút) và liên kết khôi phục mật khẩu |
| Video Streaming | CDN Google Drive + HTTP Range Controller | Public Direct Stream | Ra | Phát trực tiếp qua CDN `lh3.googleusercontent.com` hoặc stream qua Spring Boot `/api/v1/media/stream/{id}` (HTTP 206) |
| Google Identity (SSO) | Google OIDC ID Token | Google Client ID | Ra/Vào | Xác minh ID Token phía server qua GoogleTokenVerifier (`https://oauth2.googleapis.com/tokeninfo`) |
| AI Inference Engine | HTTP REST (Nội bộ) | Internal Docker Network | Ra/Vào | Suy luận chính: ONNX Runtime Web WASM trong trình duyệt (<20ms). Suy luận dự phòng: FastAPI `POST /api/infer/features` |
| Prometheus | HTTP scrape | Mạng nội bộ | Vào | Giám sát Actuator metrics |

## 6. Hạ tầng & Môi trường

| Môi trường | Mục đích | Cấu hình | Dữ liệu |
|------------|----------|----------|---------|
| **dev** | Máy lập trình viên | Docker Compose: api + web + postgres + redis; video stream Google Drive CDN | Dữ liệu mẫu seed (`vsl-seed.json`) |
| **uat** | Nghiệm thu (B6) | Docker Compose theo `deploy/docker-compose.yml`; dải port **`18080–18090`** (api `18080` · web `18081`; `ai` nội bộ) | Dữ liệu ẩn danh, **không PII thật** |
| **prod** (định hướng) | Người dùng thật | 1 máy chủ + Caddy + api + postgres + redis; video Google Drive CDN; sao lưu CSDL hằng ngày | Dữ liệu thật, mã hoá khi lưu nghỉ |

```
Internet ──► Google Drive CDN (video stream)
    │
    └──► Caddy (TLS, security header)
             ├──► Next.js (Web Frontend, MediaPipe + ONNX Web WASM)
             └──► Spring Boot API (Java 21) ──► PostgreSQL 16 (Flyway V1-V6)
                       │
                       └──► Dịch vụ AI FastAPI (Python, Server Fallback)
```
                                  └──► Redis
```

**Đường nâng cấp khi vượt NFR-06:** (1) tách Next.js và API sang hai máy; (2) thêm bản sao API sau cân bằng
tải (backend **không giữ trạng thái**, phiên nằm ở JWT + Redis nên nhân bản được ngay); (3) thêm replica đọc
PostgreSQL. **Không** cần đổi kiến trúc trong cả ba bước.

## 7. Xuyên suốt (cross-cutting)

| Mặt | Quyết định |
|-----|------------|
| **Xác thực** | JWT: access 15 phút (trong bộ nhớ, **không** localStorage), refresh 30 ngày trong **cookie HttpOnly + Secure + SameSite=Strict**, xoay vòng và phát hiện tái sử dụng (NFR-09) |
| **Phân quyền** | RBAC kiểm ở backend cho **mọi** endpoint (NFR-07, BR-A67); `@PreAuthorize` + kiểm quyền sở hữu tài nguyên ở tầng service; frontend chỉ ẩn/disable cho đẹp |
| **Giới hạn tần suất** | Bộ đếm cửa sổ trượt trong Redis theo NFR-10, áp ở filter trước controller |
| **Ghi log** | JSON có cấu trúc + `traceId` (MDC); **cấm PII** (BR-A90) — có bộ lọc che dữ liệu ở lớp append log |
| **Truy vết** | `traceId`/`spanId` theo Micrometer Tracing, truyền từ frontend qua header `X-Request-Id` (chính là `requestId` của envelope) |
| **Cấu hình** | Biến môi trường; **secret không nằm trong mã nguồn hay compose**; `.env` không commit |
| **Xử lý lỗi** | `@RestControllerAdvice` duy nhất → `TransactionResponse` với `errorCode` 5 ký tự; HTTP status thật theo loại lỗi (`error-code-convention.md` §3) |
| **Bảo vệ dữ liệu (PDPL)** | Email mã hoá khi lưu nghỉ; ảnh xoá EXIF; IP ẩn danh sau 30 ngày; xoá tài khoản có ân hạn 30 ngày; **khung hình camera không bao giờ rời thiết bị** |
| **Header bảo mật** | CSP nghiêm ngặt (không `unsafe-inline`), HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy: camera=(self)` |
| **Bộ nhớ đệm** | Danh mục nội dung cache ở Redis TTL 10 phút, **xoá chủ động khi xuất bản**; kết quả tìm kiếm từ điển cache 5 phút; **tuyệt đối không cache dữ liệu gắn người dùng ở tầng chia sẻ** |
| **Việc nền** | Bảng outbox + `@Scheduled` + khoá phân tán qua bảng `job_lock` (an toàn khi chạy nhiều bản sao) |
| **Khả năng tiếp cận** | Radix UI làm nền; kiểm tự động bằng axe trong Playwright ở CI (NFR-14) |

## 8. Quyết định kiến trúc (ADR ngắn)

- **ADR-01 — Modular monolith thay vì microservices.**
  *Bối cảnh:* 5.000 DAU, 9 miền gắn kết chặt, đội 1–2 người, ngân sách 0,15 USD/MAU.
  *Quyết định:* một tiến trình backend, tách module theo miền, một CSDL, ranh giới cưỡng chế bằng ArchUnit.
  *Hệ quả:* triển khai và gỡ lỗi đơn giản, transaction cục bộ cho luồng hoàn thành bài học; đổi lại phải
  **kỷ luật giữ ranh giới module** để sau này tách được. Điều kiện tách đã ghi ở §1.

- **ADR-02 — Bảng outbox trong PostgreSQL thay vì message broker.**
  *Bối cảnh:* chỉ có 3 loại việc bất đồng bộ; Kafka/RabbitMQ thêm một hệ phải vận hành.
  *Quyết định:* outbox + scheduler + `job_lock`.
  *Hệ quả:* đúng-một-lần cùng transaction nghiệp vụ, chi phí bằng 0; đổi lại thông lượng giới hạn (~vài
  nghìn việc/phút). Xem lại khi vượt 5.000 việc nền/phút.

- **ADR-03 — Suy luận nhận dạng ký hiệu chạy trong trình duyệt.**
  *Bối cảnh:* NFR-12 cấm khung hình camera rời thiết bị; suy luận phía server cần GPU, đắt, độ trễ cao.
  *Quyết định:* MediaPipe Hands (WASM) + mô hình phân lớp TFJS ≤ 5 MB tải về và cache.
  *Hệ quả:* quyền riêng tư đạt **theo thiết kế**, chi phí server bằng 0, hoạt động cả khi mạng chập chờn;
  đổi lại **phải tin điểm số do client gửi** → bù bằng BR-A22 (không cho loại bài này ảnh hưởng điểm mốc)
  và giới hạn tần suất. Đây là đánh đổi có chủ đích: quyền riêng tư quan trọng hơn khả năng chống gian lận
  tuyệt đối ở một bài luyện tập.

- **ADR-04 — Chấm bài tập luôn ở backend, không gửi đáp án đúng ra client.**
  *Bối cảnh:* client-side scoring khiến mọi chỉ số học tập (BG-01, BG-02) trở nên vô nghĩa và mở đường gian
  lận chứng chỉ.
  *Quyết định:* API trả lựa chọn **không cờ đáp án**; chấm ở server (BR-A19).
  *Hệ quả:* thêm một round-trip mỗi câu trả lời (chấp nhận được với P95 < 300 ms); dữ liệu học đáng tin.

- **ADR-05 — PostgreSQL FTS thay vì máy tìm kiếm riêng.**
  *Bối cảnh:* kho từ điển mục tiêu 1.500–5.000 ký hiệu.
  *Quyết định:* `tsvector` + `unaccent` + `pg_trgm`.
  *Hệ quả:* bớt một dịch vụ (~40 USD/tháng và công vận hành); đổi lại thiếu các tính năng xếp hạng nâng
  cao. Ngưỡng xem lại: > 50.000 ký hiệu hoặc P95 tìm kiếm > 300 ms.

- **ADR-06 — Refresh token trong cookie HttpOnly, access token chỉ trong bộ nhớ.**
  *Bối cảnh:* lưu token ở `localStorage` biến mọi lỗ hổng XSS thành chiếm tài khoản.
  *Quyết định:* refresh trong cookie HttpOnly/Secure/SameSite=Strict; access token giữ trong bộ nhớ JS.
  *Hệ quả:* phải có bảo vệ CSRF cho endpoint làm mới token (token chống CSRF gửi kèm); đổi lại giảm mạnh
  hậu quả của XSS.

- **ADR-07 — Tích hợp cổng thanh toán payOS (VietQR NAPAS 24/7) và kiểm chứng 2 chiều.** *(cập nhật v0.3)*
  *Bối cảnh:* Các cổng thanh toán truyền thống như VNPay/MoMo đòi hỏi thủ tục merchant doanh nghiệp phức tạp và người dùng phải cài app ví riêng. Cần một giải pháp chuyển khoản ngân hàng chuẩn quốc gia (VietQR) hoạt động với toàn bộ 40+ ngân hàng tại Việt Nam (BIDV, MBBank, VCB,...).
  *Quyết định:* Tích hợp cổng thanh toán **payOS** tạo payment link và mã VietQR chuẩn EMVCo/NAPAS. Backend lưu trữ mã BIN ngân hàng và số tài khoản thụ hưởng, tự động giải mã BIN sang tên ngân hàng chuẩn (VD: BIDV cho BIN 970418). Đồng bộ trạng thái đa kênh:
  1. Webhook IPN nhận dữ liệu từ payOS với chữ ký số HMAC SHA-256.
  2. Polling chu kỳ 2s từ client tới API backend để chủ động kéo trạng thái từ payOS khi chưa có public webhook URL.
  3. Cơ chế kiểm chứng 2 chiều tại `POST /api/v1/billing/confirm/{orderCode}`: gọi thẳng sang máy chủ payOS để đối soát trước khi kích hoạt gói, chặn đứng hoàn toàn việc bypass thanh toán.

- **ADR-08 — 🤖 Kiến trúc nhận diện AI kép (Dual Inference Architecture).** *(cập nhật v0.3)*
  *Bối cảnh:* Mô hình LiteTransformer lượng tử hoá INT8 chỉ nặng khoảng ~400 KB, nhận vector đặc trưng 75 landmark (225 chiều) qua 30 khung hình. Trình duyệt hiện đại có WebAssembly SIMD cho phép suy luận siêu nhanh mà không phụ thuộc hạ tầng backend.
  *Quyết định:* Triển khai **Kiến trúc nhận diện AI kép**:
  1. **Nhánh chính (Client-side WASM - Phương án A):** Nạp `onnxruntime-web` trực tiếp ở frontend cùng MediaPipe Holistic. Suy luận cục bộ ngay trên máy người học (<20 ms độ trễ), không tốn chi phí máy chủ, quyền riêng tư 100% (không landmark/pixel nào truyền qua mạng).
  2. **Nhánh dự phòng (Server Fallback - Phương án B):** Duy trì dịch vụ AI Python FastAPI (`POST /api/infer/features`) trên mạng nội bộ Docker. Backend Java gọi sang dịch vụ này khi client cần đối soát hoặc khi thiết bị người dùng không hỗ trợ WASM SIMD.

- **ADR-09 — 🤖 Backend Java quyết định đúng/sai, dịch vụ AI chỉ trả nhãn.** *(mới ở v0.2)*
  *Bối cảnh:* "đúng hay sai" phụ thuộc ngưỡng tin cậy, biên giữa top1/top2, và ký hiệu mục tiêu — đều là
  **luật nghiệp vụ** có thể phải điều chỉnh mà không huấn luyện lại mô hình.
  *Quyết định:* dịch vụ AI trả `{label, confidence, top3, status}`; backend áp `BR-A112`/`BR-A113` và quyết
  định `verified`.
  *Hệ quả:* hiệu chỉnh ngưỡng chỉ cần đổi cấu hình backend (quan trọng vì ngưỡng **chắc chắn phải chỉnh**
  sau khi đo trên webcam thật — rủi ro R-02); đổi lại logic bị chia giữa hai tiến trình nên **phải viết rõ
  ranh giới** và có test hai phía.

- **ADR-10 — 🤖 Dịch vụ AI không có trạng thái và không có CSDL.** *(mới ở v0.2)*
  *Bối cảnh:* muốn scale ngang được, thay mô hình dễ, và không tạo ra nguồn sự thật thứ hai.
  *Quyết định:* dịch vụ AI chỉ có mô hình + nhãn nạp từ tệp; mọi bản ghi nằm ở PostgreSQL do backend ghi.
  Endpoint thu thập dữ liệu của repo (`/api/attempt`, có ghi video) **không được bật** trong sản phẩm —
  việc góp dữ liệu đi theo luồng riêng có đồng ý tường minh (FR-46).
  *Hệ quả:* chạy được nhiều bản sao dịch vụ AI sau cân bằng tải; đổi lại dịch vụ AI không tự log được
  lượt thử để phân tích — backend phải làm việc đó.

---

## ✅ Checklist trước GATE-2
- [x] §1 chốt kiểu kiến trúc **trước** khi vẽ component, có bảng câu hỏi quyết định trích BRD/SRS.
- [x] Sơ đồ component đúng kiểu kiến trúc đã chọn; nêu rõ ranh giới module và cách cưỡng chế.
- [x] Có ≥ 2 luồng dữ liệu chính vẽ chi tiết (thực tế: 4 luồng).
- [x] Tích hợp ngoài nêu giao thức, xác thực, chiều, cách xử lý lỗi.
- [x] Hạ tầng 3 môi trường + đường nâng cấp khi vượt NFR-06.
- [x] Xuyên suốt: authn/authz, log, tracing, cấu hình, lỗi, **PDPL**, header bảo mật, cache, việc nền.
- [x] ADR ghi bối cảnh → quyết định → hệ quả (**10 ADR**).
- [x] ✅ Q3 đã chốt (VNPay + MoMo) — ADR-07 cập nhật cho hai cổng.
- [x] ✅ **Q8 đã chốt: phương án B** (trình duyệt trích landmark, server phân lớp) — ADR-08 cập nhật, C bị loại.
- [x] ✅ **Q9 đã chốt: BẬT góp dữ liệu tự nguyện** — ADR-10 giữ nguyên ranh giới: luồng góp dữ liệu đi riêng, không qua endpoint suy luận.
