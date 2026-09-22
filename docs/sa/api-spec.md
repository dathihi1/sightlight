# API Specification — SignLight

| Phiên bản | **v0.3** | Ngày | 2026-09-20 | Trạng thái | DRAFT — chờ GATE-3 |
|-----------|------|------|------------|------------|---------------------|

**Tiền đề:** `docs/sa/LLD.md` v0.2 (nguồn sự thật tên bảng/trường), `docs/ba/SRS.md` v0.2 (ràng buộc validate)
**Lưu ý:** file `.md` này là **hợp đồng API**. OpenAPI/Swagger **sinh tự động từ code** (springdoc) ở B4 và
được đối chiếu với file này ở GATE-4. **Không ai viết YAML tay.** Mâu thuẫn giữa code và file này → **file
này (đã duyệt) thắng**.

---

## 1. Quy ước chung *(khai MỘT LẦN — các endpoint không lặp lại)*

- **Base URL:** dev `http://localhost:8080` · uat `https://uat.signlight.local` · prod `<chưa có>`.
  Prefix: **`/api/v1`**.
- **Auth:** Bearer JWT ở header `Authorization` cho **mọi** endpoint, **trừ** những endpoint đánh dấu
  `công khai` ở §2 (`/health`, đăng ký, đăng nhập, quên mật khẩu, tìm kiếm từ điển, webhook, xác minh chứng chỉ, form doanh nghiệp).
- **Định dạng:** JSON UTF-8; ngày `dd/MM/yyyy HH:mm:ss` (múi giờ người dùng trong response, UTC trong lưu trữ); tiền tệ số nguyên (`amountMinor`) kèm `currency` ISO 4217 — **GĐ1 chỉ `VND`**, đơn vị là **đồng**.
- **Envelope (mọi API — theo convention `backend-dev-java`):**
  - Request kế thừa `BaseRequest`: `requestId` (string, bắt buộc, client sinh, echo lại — cũng là `traceId`), `version` (string, mặc định `"1.0"`).
  - Response bọc `TransactionResponse<T>`: `requestId` · `errorCode` (5 ký tự, `00000` = thành công) · `errorMessage` · `result`.
  - **Phần §3 dưới đây chỉ đặc tả `result` và field nghiệp vụ của request.**
- **HTTP status:** 2xx thành công (`201` khi tạo mới) · 400 validate/nghiệp vụ · 401/403 authn/authz · 404 không tìm thấy · 429 vượt tần suất · 5xx tích hợp/nội bộ. **Body luôn là `TransactionResponse`.**
- **Phân trang** (endpoint danh sách): request `page` (từ 0), `size` (mặc định 20, **tối đa 50** — vượt thì bị ép về 50, không lỗi); `result` có `items[]`, `totalElements`, `totalPages`.
- **Mã lỗi chung mọi endpoint** *(không lặp ở từng endpoint)*: `00101` payload không hợp lệ · `00105` vượt tần suất (429) · `00401` chưa xác thực · `00403` không có quyền · `00404` không tìm thấy · `00499` lỗi hệ thống. Mã nghiệp vụ theo bảng ở `LLD.md` §5.1.
- **Giới hạn tần suất (NFR-10):** đăng nhập 10/phút/IP · đăng ký 5/giờ/IP · quên mật khẩu 3/giờ/email · tìm kiếm 60/phút/người dùng · form doanh nghiệp 3/giờ/IP. Vượt → `00105` + header `Retry-After`.
- **Bất biến bảo mật áp cho toàn bộ API:**
  1. **Không endpoint nào trả về đáp án đúng** của bài tập trước khi người học đã trả lời (ADR-04, AC-12.4).
  2. **Không endpoint nào nhận dữ liệu ảnh/video từ camera** — payload chứa trường ảnh bị từ chối
     (`00101` cho đánh vần, `10103` cho ký hiệu động). Ngoại lệ **duy nhất**: `POST /ai/donations/clips`,
     chỉ hoạt động khi người dùng **đã đồng ý tường minh** (FR-46).
  3. **Không endpoint nào nhận giá tiền từ client** — giá luôn tra từ `plan_price` (BR-A60).
  4. Mọi kiểm quyền thực hiện ở backend, kể cả khi giao diện đã ẩn nút (BR-A67).
  5. **`returnUrl` của cổng thanh toán không bao giờ cấp quyền** — chỉ IPN đã xác thực chữ ký mới làm điều
     đó (BR-A110, AC-29.7).

- **Dịch vụ AI (nội bộ, KHÔNG công khai ra Internet):** backend gọi `POST {AI_BASE_URL}/infer` với tensor
  `64×327`; timeout **5 giây**, circuit breaker. Dịch vụ AI **không** có xác thực người dùng và **phải**
  được đặt trong mạng nội bộ. Hợp đồng chi tiết ở §4.

---

## 2. Danh mục endpoint

| # | Method | Path | Mô tả | FR | Quyền |
|---|--------|------|-------|----|-------|
| 1 | GET | `/health` | Healthcheck | — | công khai |
| **identity** |
| 2 | POST | `/api/v1/auth/register` | Đăng ký tài khoản | FR-01 | công khai |
| 3 | POST | `/api/v1/auth/login` | Đăng nhập | FR-02 | công khai |
| 4 | POST | `/api/v1/auth/refresh` | Làm mới token | FR-02 | cookie refresh |
| 5 | POST | `/api/v1/auth/logout` | Đăng xuất | FR-02 | đã đăng nhập |
| 6 | POST | `/api/v1/auth/google` | Đăng nhập/Đăng ký với Google OIDC ID token | FR-03 | công khai |
| 6a | GET | `/api/v1/auth/google/authorize` | Bắt đầu OAuth Google | FR-03 | công khai |
| 7 | GET | `/api/v1/auth/google/callback` | Callback OAuth | FR-03 | công khai |
| 8 | POST | `/api/v1/auth/password/forgot` | Yêu cầu đặt lại mật khẩu | FR-04 | công khai |
| 9 | POST | `/api/v1/auth/password/reset` | Đặt lại mật khẩu | FR-04 | công khai |
| 10 | POST | `/api/v1/auth/email/verify` | Xác thực email | FR-01 | công khai |
| 11 | POST | `/api/v1/auth/email/resend` | Gửi lại email xác thực | FR-01 | đã đăng nhập |
| 12 | POST | `/api/v1/onboarding/answers` | Lưu trả lời onboarding | FR-05 | công khai |
| 13 | GET | `/api/v1/onboarding/answers/{token}` | Lấy lại onboarding dở dang | FR-05 | công khai |
| 14 | GET | `/api/v1/me` | Hồ sơ + quyền + gói hiện tại | FR-06 | LEARNER |
| 15 | PATCH | `/api/v1/me/profile` | Cập nhật hồ sơ | FR-06 | LEARNER |
| 16 | PUT | `/api/v1/me/avatar` | Tải ảnh đại diện | FR-06 | LEARNER |
| 17 | PATCH | `/api/v1/me/preferences` | Mục tiêu/ngày, khoá, tốc độ video, ngôn ngữ | FR-10, 24 | LEARNER |
| 18 | POST | `/api/v1/me/email/change` | Đổi email | FR-06 | LEARNER |
| 19 | POST | `/api/v1/me/password/change` | Đổi mật khẩu | FR-06 | LEARNER |
| 20 | POST | `/api/v1/me/progress/reset` | Đặt lại tiến độ khoá | FR-07 | LEARNER |
| 21 | POST | `/api/v1/me/deletion` | Yêu cầu xoá tài khoản | FR-08 | LEARNER |
| 22 | DELETE | `/api/v1/me/deletion` | Huỷ yêu cầu xoá | FR-08 | LEARNER |
| 23 | GET | `/api/v1/me/export` | Xuất dữ liệu cá nhân (PDPL) | FR-08 | LEARNER |
| **content / learning** |
| 24 | GET | `/api/v1/courses` | Danh sách khoá đang mở | FR-05, 10 | công khai |
| 25 | GET | `/api/v1/courses/{courseId}/path` | Lộ trình học kèm tiến độ | FR-09 | LEARNER |
| 26 | GET | `/api/v1/lessons/{lessonId}` | Nội dung bài học + bài tập | FR-11, 12 | LEARNER |
| 27 | POST | `/api/v1/lessons/{lessonId}/exercises/{exerciseId}/answer` | Nộp câu trả lời (chấm ở server) | FR-12 | LEARNER |
| 28 | POST | `/api/v1/lessons/{lessonId}/complete` | Hoàn thành bài học | FR-16 | LEARNER |
| 29 | GET | `/api/v1/chapters/{chapterId}/quiz` | Lấy đề quiz | FR-13 | LEARNER |
| 30 | POST | `/api/v1/chapters/{chapterId}/quiz/submit` | Nộp quiz | FR-13 | LEARNER |
| 31 | GET | `/api/v1/units/{unitId}/milestone` | Lấy đề bài mốc | FR-14 | LEARNER |
| 32 | POST | `/api/v1/units/{unitId}/milestone/submit` | Nộp bài mốc | FR-14 | LEARNER |
| **practice** |
| 33 | GET | `/api/v1/practice/vocabulary/session` | Bắt đầu phiên Trainer từ vựng | FR-17 | LEARNER |
| 34 | POST | `/api/v1/practice/vocabulary/answer` | Trả lời trong Trainer | FR-17 | LEARNER |
| 35 | GET | `/api/v1/practice/fingerspell/session` | Bắt đầu phiên đánh vần | FR-18 | LEARNER |
| 36 | POST | `/api/v1/practice/fingerspell/attempt` | Ghi nhận lượt đánh vần | FR-18 | LEARNER |
| 37 | GET | `/api/v1/practice/numbers/session` | Phiên luyện số | FR-19 | LEARNER |
| 38 | GET | `/api/v1/practice/mirror/{signId}` | Dữ liệu chế độ Gương | FR-20 | LEARNER |
| **dictionary** |
| 39 | GET | `/api/v1/dictionary/search` | Tìm kiếm ký hiệu | FR-21 | công khai (hạn mức) |
| 40 | GET | `/api/v1/dictionary/signs/{signId}` | Chi tiết ký hiệu & biến thể | FR-22 | công khai (hạn mức) |
| 41 | GET | `/api/v1/dictionary/topics` | Danh sách chủ đề + số ký hiệu | FR-21 | công khai |
| 41b | POST | `/api/v1/dictionary/missing-signs` | **Báo thiếu ký hiệu** | **FR-45** | LEARNER |
| **gamification** |
| 42 | GET | `/api/v1/progress/overview` | Trang tiến độ tổng hợp | FR-26 | LEARNER |
| 43 | GET | `/api/v1/progress/activity` | Hoạt động 7/30 ngày | FR-26 | LEARNER |
| 44 | GET | `/api/v1/awards` | Huy hiệu & cấp bậc | FR-25 | LEARNER |
| 45 | POST | `/api/v1/awards/{awardCode}/celebrated` | Đánh dấu đã xem chúc mừng | FR-25 | LEARNER |
| 46 | GET | `/api/v1/curiosities` | Bộ sưu tập Curiosity | FR-15 | LEARNER |
| 47 | POST | `/api/v1/certificates` | Tạo chứng chỉ PDF | FR-27 | PREMIUM |
| 48 | GET | `/api/v1/certificates/verify/{code}` | Xác minh chứng chỉ | FR-27 | công khai |
| **billing (payOS VietQR Gateway)** |
| 49 | GET | `/api/v1/billing/plans` | Bảng giá (VND) các gói Premium đang mở | FR-28 | công khai |
| 50 | POST | `/api/v1/billing/checkout` | Tạo giao dịch thanh toán payOS VietQR (trả `checkoutUrl`, `qrCode`) | FR-29 | LEARNER |
| 50a | GET | `/api/v1/billing/status/{orderCode}` | Kiểm tra trạng thái giao dịch theo mã đơn payOS | FR-29 | LEARNER |
| 51 | GET | `/api/v1/billing/subscription` | Thuê bao hiện tại + số ngày còn lại | FR-31 | LEARNER |
| 52 | ~~cancel~~ | *(đã bỏ ở v0.2)* | **Không có gia hạn tự động → không có gì để huỷ** (BR-A69) | — | — |
| 53 | ~~resume~~ | *(đã bỏ ở v0.2)* | — | — | — |
| 54 | GET | `/api/v1/billing/transactions` | Lịch sử giao dịch + biên nhận | FR-31 | LEARNER |
| 55 | POST | `/api/v1/billing/ipn/payos` | **Webhook IPN từ payOS (xác thực HMAC SHA-256)** | FR-32 | công khai + **HMAC** |
| 55b | GET | `/api/v1/billing/return/{provider}` | Trang kết quả sau thanh toán — **chỉ hiển thị** | FR-29 | công khai |
| **media (Google Drive CDN Streaming)** |
| 55c | GET | `/api/v1/media/stream/{signVideoId}` | Chuyển hướng stream video Google Drive (HTTP 307 + Range support) | FR-11 | công khai / LEARNER |
| **M10 — AI nhận diện ký hiệu động** |
| **56a** | GET | `/api/v1/ai/capabilities` | **Vốn ký hiệu AI + phiên bản mô hình + ngưỡng** | FR-41, FR-44 | LEARNER |
| **56b** | POST | `/api/v1/ai/attempts` | **Chấm một lượt ký hiệu động** | **FR-41, FR-42, FR-43** | LEARNER |
| **56c** | GET | `/api/v1/ai/attempts` | Lịch sử lượt thử của chính mình | FR-41 | LEARNER |
| **56d** | GET | `/api/v1/ai/practice/session` | Bắt đầu phiên luyện ký hiệu động | FR-41 | LEARNER |
| **56e** | GET | `/api/v1/ai/quota` | Hạn mức lượt thử còn lại hôm nay | FR-30 | LEARNER |
| **56f** | GET | `/api/v1/me/data-donation` | Xem trạng thái đồng ý góp dữ liệu | FR-46 | LEARNER |
| **56g** | PUT | `/api/v1/me/data-donation` | **Bật/tắt đồng ý góp dữ liệu** | FR-46 | LEARNER |
| **56h** | POST | `/api/v1/ai/donations/clips` | Gửi clip góp dữ liệu *(chỉ khi đã đồng ý)* | FR-46 | LEARNER |
| **56i** | POST | `/api/v1/cms/ai/labels/sync` | Đồng bộ vốn ký hiệu từ dịch vụ AI | FR-44 | ADMIN |
| **56j** | GET | `/api/v1/cms/ai/labels` | Danh sách nhãn + nhãn mồ côi | FR-44 | CONTENT_EDITOR+ |
| **56k** | GET | `/api/v1/cms/missing-signs` | Xếp hạng ký hiệu được yêu cầu | FR-45 | CONTENT_EDITOR+ |
| **cms** |
| 56 | GET/POST/PATCH | `/api/v1/cms/signs` | CRUD ký hiệu | FR-33 | CONTENT_EDITOR+ |
| 57 | POST | `/api/v1/cms/signs/{signId}/videos` | Tải video biến thể | FR-33 | CONTENT_EDITOR+ |
| 58 | POST | `/api/v1/cms/transcode/webhook` | Webhook chuyển mã | FR-33 | **HMAC** |
| 59 | GET/POST/PATCH | `/api/v1/cms/lessons` | CRUD bài học & bài tập | FR-34 | CONTENT_EDITOR+ |
| 60 | POST | `/api/v1/cms/content/{type}/{id}/submit-review` | Gửi duyệt | FR-35 | CONTENT_EDITOR+ |
| 61 | POST | `/api/v1/cms/content/{type}/{id}/approve` | Duyệt & xuất bản | FR-35 | **CONTENT_APPROVER** |
| 62 | POST | `/api/v1/cms/content/{type}/{id}/unpublish` | Gỡ xuất bản | FR-35 | CONTENT_APPROVER |
| 63 | GET | `/api/v1/support/users` | Tra cứu người dùng (email chính xác) | FR-36 | SUPPORT |
| 64 | POST | `/api/v1/support/users/{userId}/premium-grant` | Cấp Premium bù | FR-36 | SUPPORT |
| **platform** |
| 65 | POST | `/api/v1/business-inquiries` | Form liên hệ doanh nghiệp | FR-38 | công khai |
| 66 | POST | `/api/v1/me/notifications/preferences` | Tuỳ chọn nhận email | FR-39 | LEARNER |

---

## 3. Đặc tả từng endpoint

### 3.1 `POST /api/v1/auth/register` — Đăng ký tài khoản *(FR-01, SCR-06)*

- **Mô tả & quyền:** công khai. Tạo tài khoản người học mới.
- **Request** (ngoài `BaseRequest`):

  | Trường | Kiểu | Bắt buộc | Ràng buộc (ref SRS) | Mô tả |
  |--------|------|:--------:|----------------------|-------|
  | `displayName` | string | ✓ | FR-01 bảng validate | Tên hiển thị 2–50 |
  | `email` | string | ✓ | FR-01 bảng validate | Chuyển chữ thường |
  | `password` | string | ✓ | FR-01 bảng validate | 10–128, chữ + số |
  | `acceptedTerms` | boolean | ✓ | phải `true` | Đồng ý Điều khoản |
  | `onboardingToken` | string | ✗ | UUID v4, TTL 24h | Gắn câu trả lời onboarding |
  | `timezone` | string | ✗ | IANA, mặc định `Asia/Ho_Chi_Minh` | Cơ sở tính streak |

- **Response `result`:**

  | Trường | Kiểu | Mô tả |
  |--------|------|-------|
  | `userId` | string | UUID người dùng |
  | `accessToken` | string | JWT, hiệu lực 15 phút |
  | `status` | string | `PENDING_VERIFICATION` |
  | `activeCourseId` | string | Khoá học được gán |

  > Refresh token **không nằm trong body** — đặt ở cookie `HttpOnly; Secure; SameSite=Strict` (ADR-06).

- **Mã lỗi nghiệp vụ:**

  | errorCode | HTTP | Ý nghĩa | errorMessage (vi) |
  |-----------|:----:|---------|-------------------|
  | `01101` | 400 | Sai định dạng trường | *(theo trường lỗi cụ thể)* |
  | `01102` | 400 | Mật khẩu quá phổ biến | Mật khẩu này quá phổ biến, vui lòng chọn mật khẩu khác. |
  | `01103` | 400 | Chưa đồng ý Điều khoản | Bạn cần đồng ý Điều khoản sử dụng để tiếp tục. |
  | `00105` | 429 | Quá 5 lần/giờ/IP | Bạn thao tác quá nhanh, vui lòng thử lại sau. |

  > ⚠️ **Không có mã lỗi "email đã tồn tại"** — theo NFR-08/AC-01.2, email trùng trả về **đúng như thành công**.

- **Ví dụ:**
  ```json
  // Request
  { "requestId": "a1b2c3d4", "version": "1.0",
    "displayName": "Nguyen Van A", "email": "hocvien01@example.com",
    "password": "hocKyHieu2026", "acceptedTerms": true,
    "onboardingToken": "8f14e45f-ceea-467a-9cbe-1e4d2f7a9c31", "timezone": "Asia/Ho_Chi_Minh" }

  // 201 — thành công
  { "requestId": "a1b2c3d4", "errorCode": "00000", "errorMessage": "Success",
    "result": { "userId": "018f3a2b-...", "accessToken": "eyJhbGciOi...",
                "status": "PENDING_VERIFICATION", "activeCourseId": "018f0011-..." } }

  // 400 — mật khẩu quá phổ biến
  { "requestId": "a1b2c3d4", "errorCode": "01102",
    "errorMessage": "Mật khẩu này quá phổ biến, vui lòng chọn mật khẩu khác.", "result": null }
  ```

### 3.2 `POST /api/v1/auth/login` — Đăng nhập *(FR-02, SCR-03)*

- **Request:** `email` (string, ✓, RFC 5322) · `password` (string, ✓, 1–128).
- **Response `result`:** `accessToken` (string) · `userId` (string) · `roles` (string[]) · `activeCourseId` (string) · `requiresEmailVerification` (boolean) · `pendingDeletion` (boolean — nếu `true`, giao diện hỏi khôi phục theo FR-02 2d).
- **Mã lỗi nghiệp vụ:**

  | errorCode | HTTP | Ý nghĩa | errorMessage (vi) |
  |-----------|:----:|---------|-------------------|
  | `01201` | 400 | Sai email **hoặc** mật khẩu (không phân biệt) | Email hoặc mật khẩu không đúng. |
  | `01202` | 400 | Khoá tạm 15 phút | Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút. |
  | `01203` | 400 | Tài khoản bị đình chỉ | Tài khoản đang bị tạm khoá. Vui lòng liên hệ hỗ trợ. |

- **Ví dụ:**
  ```json
  // Request
  { "requestId": "b2c3d4e5", "version": "1.0", "email": "hocvien01@example.com", "password": "hocKyHieu2026" }
  // 200
  { "requestId": "b2c3d4e5", "errorCode": "00000", "errorMessage": "Success",
    "result": { "accessToken": "eyJ...", "userId": "018f3a2b-...", "roles": ["LEARNER_FREE"],
                "activeCourseId": "018f0011-...", "requiresEmailVerification": true, "pendingDeletion": false } }
  // 400 — sai thông tin (giống hệt khi email không tồn tại)
  { "requestId": "b2c3d4e5", "errorCode": "01201", "errorMessage": "Email hoặc mật khẩu không đúng.", "result": null }
  ```

### 3.3 `POST /api/v1/onboarding/answers` — Lưu trả lời onboarding *(FR-05, SCR-02)*

- **Request:** `onboardingToken` (string, ✗ — server sinh nếu vắng) · `courseId` (string, ✓, khoá `PUBLISHED`) · `learningReason` (enum 7 giá trị, ✓ từ bước 4) · `dailyGoalMinutes` (int, ✓ ∈ {5,10,15,20}) · `currentStep` (int, ✓, 1–11).
- **Response `result`:** `onboardingToken` (string) · `currentStep` (int) · `expiresAt` (string).
- **Mã lỗi:** `01101` sai enum/giá trị ngoài miền · `02201` khoá chưa mở.
- **Ví dụ:**
  ```json
  // Request
  { "requestId": "c3d4e5f6", "version": "1.0", "courseId": "018f0011-...",
    "learningReason": "FAMILY", "dailyGoalMinutes": 10, "currentStep": 6 }
  // 200
  { "requestId": "c3d4e5f6", "errorCode": "00000", "errorMessage": "Success",
    "result": { "onboardingToken": "8f14e45f-...", "currentStep": 6, "expiresAt": "21/09/2026 14:30:00" } }
  ```

### 3.4 `GET /api/v1/courses/{courseId}/path` — Lộ trình học *(FR-09, SCR-08)*

- **Mô tả & quyền:** `LEARNER_*`. Trả cây Unit → Chapter → Lesson kèm trạng thái tiến độ và cờ khoá.
- **Request:** không có body. Query: `includeCompleted` (boolean, mặc định `true`).
- **Response `result`:**

  | Trường | Kiểu | Mô tả |
  |--------|------|-------|
  | `courseId`, `courseName` | string | Khoá đang học |
  | `nextLessonId` | string | Bài kế tiếp cho nút "Tiếp tục học" (AC-09.3) |
  | `units[]` | array | Danh sách Unit |
  | `units[].isFree` | boolean | Unit miễn phí |
  | `units[].starsEarned` | int | Sao mốc đã đạt (0–5) |
  | `units[].chapters[].quizPassed` | boolean | |
  | `units[].chapters[].lessons[].status` | string | `NOT_STARTED`/`IN_PROGRESS`/`COMPLETED` |
  | `units[].chapters[].lessons[].locked` | boolean | Khoá do chưa học bài trước (BR-A12) |
  | `units[].chapters[].lessons[].premiumLocked` | boolean | Khoá do cần Premium (BR-A14) |
  | `units[].chapters[].lessons[].bestScorePercent` | int | |

- **Mã lỗi:** `00404` khoá không tồn tại · `02201` khoá chưa xuất bản.
- **Ví dụ (rút gọn):**
  ```json
  { "requestId": "d4e5f6a7", "errorCode": "00000", "errorMessage": "Success",
    "result": { "courseId": "018f0011-...", "courseName": "Ngôn ngữ ký hiệu — Cơ bản",
      "nextLessonId": "018f0a31-...",
      "units": [ { "id": "018f0100-...", "title": "Unit 1 — Chào hỏi", "isFree": true, "starsEarned": 4,
        "chapters": [ { "id": "018f0110-...", "title": "Chương 1", "quizPassed": true,
          "lessons": [ { "id": "018f0a30-...", "title": "Xin chào", "status": "COMPLETED",
                         "locked": false, "premiumLocked": false, "bestScorePercent": 100 },
                       { "id": "018f0a31-...", "title": "Tạm biệt", "status": "NOT_STARTED",
                         "locked": false, "premiumLocked": false, "bestScorePercent": null } ] } ] } ] } }
  ```

### 3.5 `GET /api/v1/lessons/{lessonId}` — Nội dung bài học *(FR-11, FR-12, SCR-10)*

- **Mô tả & quyền:** `LEARNER_*` **đã mở khoá bài** và **đủ quyền paywall**.
- **Response `result`:**

  | Trường | Kiểu | Mô tả |
  |--------|------|-------|
  | `lessonId`, `title`, `type` | string | `STANDARD`/`QUIZ`/`MILESTONE`/`DIALOGUE` |
  | `resumeAtIndex` | int | Câu đang dở (FR-12 4a) |
  | `exercises[]` | array | Theo thứ tự |
  | `exercises[].id`, `.type`, `.promptText` | string | |
  | `exercises[].videoUrl` | string | **URL ký hạn 15 phút** (BR-A17) |
  | `exercises[].options[].id`, `.labelText`, `.videoUrl` | | **KHÔNG có `isCorrect`** (AC-12.4) |
  | `exercises[].tokens[]` | array | Chỉ với `SENTENCE_ORDER`, **đã xáo trộn**, không kèm thứ tự đúng |

- **Mã lỗi:** `03201` bài chưa mở khoá (400) · `06203` cần Premium (400) · `00403` không sở hữu · `00404` không tồn tại.
- **Ví dụ:**
  ```json
  { "requestId": "e5f6a7b8", "errorCode": "00000", "errorMessage": "Success",
    "result": { "lessonId": "018f0a31-...", "title": "Tạm biệt", "type": "STANDARD", "resumeAtIndex": 0,
      "exercises": [
        { "id": "018f0b01-...", "type": "SIGN_TO_MEANING", "promptText": "Ký hiệu này nghĩa là gì?",
          "videoUrl": "https://cdn.example/hls/018f.../master.m3u8?exp=1789...&sig=...",
          "options": [ { "id": "018f0c01-...", "labelText": "Tạm biệt" },
                       { "id": "018f0c02-...", "labelText": "Xin chào" },
                       { "id": "018f0c03-...", "labelText": "Cảm ơn" },
                       { "id": "018f0c04-...", "labelText": "Xin lỗi" } ] } ] } }
  ```
  ```json
  // 400 — nội dung Premium
  { "requestId": "e5f6a7b8", "errorCode": "06203", "errorMessage": "Nội dung này thuộc gói Premium.", "result": null }
  ```

### 3.6 `POST /api/v1/lessons/{lessonId}/exercises/{exerciseId}/answer` — Nộp câu trả lời *(FR-12)*

- **Mô tả & quyền:** `LEARNER_*`. **Chấm ở server** (ADR-04).
- **Request:**

  | Trường | Kiểu | Bắt buộc | Ràng buộc (ref SRS) | Mô tả |
  |--------|------|:--------:|----------------------|-------|
  | `answerType` | string | ✓ | ∈ 6 loại, **khớp loại bài tập** — FR-12 | |
  | `selectedOptionId` | string | ✓ nếu loại chọn | Thuộc tập lựa chọn của bài tập | |
  | `typedAnswer` | string | ✓ nếu `TYPE_WHAT_YOU_SEE` | 1–200, khử HTML | |
  | `orderedTokenIds` | string[] | ✓ nếu `SENTENCE_ORDER` | Đúng số phần tử, không trùng | |
  | `recognitionScore` | number | ✓ nếu `FINGERSPELL_RECOGNITION` | 0.0–1.0 | |
  | `clientElapsedMs` | int | ✓ | 0–600000, **chỉ thống kê** | |
  | ~~`isCorrect`~~ | — | **cấm** | Nếu client gửi thì **bị bỏ qua** (AC-12.3) | |

- **Response `result`:** `isCorrect` (boolean) · `attemptNo` (int) · `correctOptionId` (string — **chỉ trả sau khi đã chấm**) · `explanationVideoUrl` (string) · `willRepeat` (boolean — câu này sẽ quay lại cuối hàng đợi, FR-12 2a).
- **Mã lỗi:** `03101` bài tập không thuộc bài học · `03102` loại câu trả lời không khớp · `03201` bài chưa mở khoá · `06203` cần Premium.
- **Ví dụ:**
  ```json
  // Request
  { "requestId": "f6a7b8c9", "version": "1.0", "answerType": "SIGN_TO_MEANING",
    "selectedOptionId": "018f0c02-...", "clientElapsedMs": 4200 }
  // 200 — trả lời sai
  { "requestId": "f6a7b8c9", "errorCode": "00000", "errorMessage": "Success",
    "result": { "isCorrect": false, "attemptNo": 1, "correctOptionId": "018f0c01-...",
                "explanationVideoUrl": "https://cdn.example/hls/...", "willRepeat": true } }
  // 400 — loại câu trả lời không khớp
  { "requestId": "f6a7b8c9", "errorCode": "03102", "errorMessage": "Loại câu trả lời không khớp bài tập.", "result": null }
  ```

### 3.7 `POST /api/v1/lessons/{lessonId}/complete` — Hoàn thành bài học *(FR-16)*

- **Mô tả & quyền:** `LEARNER_*`. **Idempotent** theo `idempotencyKey` (BR-A31).
- **Request:** `idempotencyKey` (string UUID v4, ✓, duy nhất theo người dùng) · `activeSeconds` (int, ✓, 0–3600 — thời gian **có tương tác**, server áp trần 15 phút theo BR-A46).
- **Response `result`:**

  | Trường | Kiểu | Mô tả |
  |--------|------|-------|
  | `scorePercent` | int | Tính theo lần trả lời đầu (BR-A20) |
  | `firstTryPerfect` | boolean | |
  | `effectiveMinutes` | number | Sau khi áp trần |
  | `streak` | object | `{ current, longest, freezeCount, goalMetToday }` |
  | `freezeEarned` | int | 0 hoặc 1 (BR-A21) |
  | `newSignsLearned` | int | |
  | `awardsLeveledUp[]` | array | `{ awardCode, newTier }` — để hiện màn chúc mừng |
  | `curiosityUnlocked` | object\|null | `{ id, title, content }` nếu vừa mở (FR-15) |
  | `nextLessonId` | string\|null | |

- **Mã lỗi:** `03201` bài chưa mở khoá · `00101` `idempotencyKey` sai định dạng.
- **Ví dụ:**
  ```json
  // Request
  { "requestId": "a7b8c9d0", "version": "1.0",
    "idempotencyKey": "5c2f1a90-3b7e-4f21-9a11-8d0c2e4b7f33", "activeSeconds": 265 }
  // 200
  { "requestId": "a7b8c9d0", "errorCode": "00000", "errorMessage": "Success",
    "result": { "scorePercent": 100, "firstTryPerfect": true, "effectiveMinutes": 4.42,
      "streak": { "current": 5, "longest": 9, "freezeCount": 2, "goalMetToday": true },
      "freezeEarned": 1, "newSignsLearned": 6,
      "awardsLeveledUp": [ { "awardCode": "SIGNING_ENTHUSIAST", "newTier": 2 } ],
      "curiosityUnlocked": null, "nextLessonId": "018f0a32-..." } }
  ```

### 3.8 `GET /api/v1/practice/vocabulary/session` — Phiên Trainer từ vựng *(FR-17, SCR-13)*

- **Request:** query `limit` (int, ✗, mặc định 20, tối đa 20 — BR-A32).
- **Response `result`:** `sessionId` (string) · `items[]` `{ signId, word, videoUrl, options[] }` · `dueTotal` (int — tổng ký hiệu đến hạn) · `quotaRemaining` (int\|null — `null` nếu Premium).
- **Mã lỗi:** `06201` hết hạn mức Trainer miễn phí (400) — AC-17.4.
- **Ví dụ lỗi:**
  ```json
  { "requestId": "b8c9d0e1", "errorCode": "06201",
    "errorMessage": "Bạn đã dùng hết lượt luyện tập miễn phí hôm nay.", "result": null }
  ```

### 3.9 `POST /api/v1/practice/fingerspell/attempt` — Ghi nhận lượt đánh vần *(FR-18, SCR-14)*

- **Mô tả & quyền:** `LEARNER_*`. **Chỉ nhận số liệu** — suy luận đã chạy trong trình duyệt (ADR-03).
- **Request:**

  | Trường | Kiểu | Bắt buộc | Ràng buộc (ref SRS) | Mô tả |
  |--------|------|:--------:|----------------------|-------|
  | `sessionId` | string | ✓ | UUID phiên đang mở | |
  | `letter` | string | ✓ | 1 ký tự ∈ `course.alphabet_letters` — FR-18 | |
  | `recognitionScore` | number | ✓ | 0.00–1.00, 2 chữ số thập phân | |
  | `durationMs` | int | ✓ | 0–60000 | |
  | `modelVersion` | string | ✓ | Thuộc danh sách hỗ trợ | |
  | ~~`frame`, `image`, `videoBlob`, bất kỳ base64 ảnh~~ | — | **CẤM** | Có mặt → từ chối `00101` (AC-18.6) | |

- **Response `result`:** `accepted` (boolean — `recognitionScore ≥ 0.80`, BR-A36) · `nextLetter` (string\|null) · `sessionProgress` `{ done, total }`.
- **Mã lỗi:** `00101` payload chứa trường bị cấm hoặc `letter` ngoài bảng chữ cái · `00404` phiên không tồn tại/đã đóng · `01101` `modelVersion` không hỗ trợ.
- **Ví dụ:**
  ```json
  // Request
  { "requestId": "c9d0e1f2", "version": "1.0", "sessionId": "018f0d01-...",
    "letter": "A", "recognitionScore": 0.87, "durationMs": 1240, "modelVersion": "fs-v1.2.0" }
  // 200
  { "requestId": "c9d0e1f2", "errorCode": "00000", "errorMessage": "Success",
    "result": { "accepted": true, "nextLetter": "B", "sessionProgress": { "done": 1, "total": 26 } } }
  // 400 — payload chứa dữ liệu ảnh
  { "requestId": "c9d0e1f2", "errorCode": "00101", "errorMessage": "Yêu cầu không hợp lệ.", "result": null }
  ```

### 3.10 `GET /api/v1/dictionary/search` — Tìm kiếm ký hiệu *(FR-21, SCR-17)*

- **Mô tả & quyền:** công khai; khách giới hạn **10 lượt/ngày/IP** (BR-A40).
- **Request (query):** `q` (string, ✓, 1–100, chuẩn hoá NFC) · `topic` (string, ✗) · `level` (string, ✗) · `page` (int, ✗, từ 0) · `size` (int, ✗, mặc định 20, **ép tối đa 50** — AC-21.4).
- **Response `result`:** `items[]` `{ signId, word, meaning, wordClass, topic, thumbnailUrl, variantCount }` · `totalElements` · `totalPages` · `suggestions[]` (gợi ý khi gõ sai, từ `pg_trgm`) · `guestQuotaRemaining` (int\|null).
- **Mã lỗi:** `04201` khách hết hạn mức (400) · `00105` vượt 60 lượt/phút (429).
- **Ví dụ:**
  ```json
  // GET /api/v1/dictionary/search?q=chao&size=2
  { "requestId": "d0e1f2a3", "errorCode": "00000", "errorMessage": "Success",
    "result": { "items": [ { "signId": "018f0e01-...", "word": "chào", "meaning": "lời chào gặp mặt",
                             "wordClass": "VERB", "topic": "Giao tiếp cơ bản",
                             "thumbnailUrl": "https://cdn.example/thumb/018f0e01.jpg", "variantCount": 3 } ],
                "totalElements": 1, "totalPages": 1, "suggestions": [], "guestQuotaRemaining": 9 } }
  // 400 — khách hết lượt
  { "requestId": "d0e1f2a3", "errorCode": "04201",
    "errorMessage": "Bạn đã hết lượt tra cứu miễn phí hôm nay. Đăng ký để tra không giới hạn.", "result": null }
  ```

### 3.11 `GET /api/v1/progress/overview` — Trang tiến độ *(FR-26, SCR-19)*

- **Response `result`:** `courseId`, `courseName` (**hiển thị nổi bật** — BR-A56) · `streak` `{ current, longest, freezeCount }` · `today` `{ minutes, goalMinutes, goalMet }` · `totals` `{ lessonsCompleted, chaptersCompleted, signsLearned, starsEarned }` · `awards[]` `{ code, tier, currentValue, nextTierAt }` · `curiosities` `{ unlockedCount, totalCount }` *(chỉ số lượng — BR-A29)*.
- **Ví dụ:**
  ```json
  { "requestId": "e1f2a3b4", "errorCode": "00000", "errorMessage": "Success",
    "result": { "courseId": "018f0011-...", "courseName": "Ngôn ngữ ký hiệu — Cơ bản",
      "streak": { "current": 5, "longest": 9, "freezeCount": 2 },
      "today": { "minutes": 11.5, "goalMinutes": 10, "goalMet": true },
      "totals": { "lessonsCompleted": 42, "chaptersCompleted": 6, "signsLearned": 214, "starsEarned": 18 },
      "awards": [ { "code": "STREAK_GUARDIAN", "tier": 2, "currentValue": 9, "nextTierAt": 14 } ],
      "curiosities": { "unlockedCount": 7, "totalCount": 30 } } }
  ```

### 3.12 `GET /api/v1/billing/plans` — Bảng giá *(FR-28, SCR-22)*

- **Mô tả & quyền:** công khai. **Giá do server quyết** (BR-A60). GĐ1 chỉ **VND** (BR-A104).
- **Request:** không có tham số. *(Đã bỏ `region` ở v0.2 — chỉ một vùng, một tiền tệ.)*
- **Response `result`:**

  | Trường | Kiểu | Mô tả |
  |--------|------|-------|
  | `currency` | string | Luôn là `VND` ở GĐ1 |
  | `autoRenewSupported` | boolean | **Luôn `false`** — để client hiển thị đúng thông điệp minh bạch (BR-A61) |
  | `providers[]` | string[] | `["VNPAY","MOMO"]` |
  | `plans[].code`, `.durationDays`, `.amountMinor`, `.amountFormatted`, `.pricePerMonthMinor`, `.savingPercent` | | |
  | `plans[].expectedExpiresAt` | string | Ngày hết hạn **dự kiến** nếu mua gói này ngay bây giờ — **đã cộng dồn** nếu đang còn hạn (BR-A66b) |

  > **Không có trường `autoRenew: true`** — v0.2 bỏ hoàn toàn mô hình tự động gia hạn.

- **Ví dụ:**
  ```json
  { "requestId": "f2a3b4c5", "errorCode": "00000", "errorMessage": "Success",
    "result": { "currency": "VND", "autoRenewSupported": false, "providers": ["VNPAY", "MOMO"],
      "plans": [ { "code": "PREMIUM_1M", "durationDays": 30, "amountMinor": 149000,
                   "amountFormatted": "149.000 ₫", "pricePerMonthMinor": 149000, "savingPercent": 0,
                   "expectedExpiresAt": "20/10/2026 23:59:59" },
                 { "code": "PREMIUM_12M", "durationDays": 365, "amountMinor": 990000,
                   "amountFormatted": "990.000 ₫", "pricePerMonthMinor": 82500, "savingPercent": 45,
                   "expectedExpiresAt": "20/09/2027 23:59:59" } ] } }
  ```

### 3.12b 🤖 `GET /api/v1/ai/capabilities` — Vốn ký hiệu AI *(FR-41, FR-44, SCR-31)*

- **Mô tả & quyền:** `LEARNER_*`. Client gọi **trước khi** hiển thị nút luyện AI, để biết ký hiệu nào có
  chấm tự động (BR-A111) và để nạp đúng phiên bản mô hình.
- **Response `result`:**

  | Trường | Kiểu | Mô tả |
  |--------|------|-------|
  | `modelVersion` | string | Ví dụ `vsl-mvp30-v2-lite-transformer` |
  | `sequenceLength` | int | **64** — client phải chuẩn hoá đúng số khung này |
  | `featureDim` | int | **327** |
  | `schemaVersion` | string | `v2_holistic_subset` |
  | `minFrames`, `maxFrames` | int | **8** và **32** |
  | `recognizableSignIds[]` | string[] | Danh sách `sign.id` có chấm AI *(chỉ nhãn đã ánh xạ và đã `PUBLISHED`)* |
  | `landmarkSpec` | object | `poseLandmarkIndices[]`, `faceLandmarkIndices[]`, `slices{leftHand,rightHand,pose,face,motion,geometry,quality}` — để client trích đúng thứ tự |
  | `attributionText` | string | Dòng ghi nguồn **VSL400 CC BY 4.0** (bắt buộc hiển thị — SC-12) |
  | `disclaimerText` | string | "Công cụ hỗ trợ luyện tập, không phải thông dịch viên" (SC-13) |

  > ⚠️ **Không trả `confidenceThreshold` ra client.** Ngưỡng là luật nghiệp vụ, áp ở backend (ADR-09);
  > lộ ra client sẽ giúp người dùng đoán cách "lách".

- **Ví dụ:**
  ```json
  { "requestId": "g1h2i3", "errorCode": "00000", "errorMessage": "Success",
    "result": { "modelVersion": "vsl-mvp30-v2-lite-transformer", "sequenceLength": 64, "featureDim": 327,
      "schemaVersion": "v2_holistic_subset", "minFrames": 8, "maxFrames": 32,
      "recognizableSignIds": ["018f2a01-...", "018f2a02-..."],
      "landmarkSpec": { "poseLandmarkIndices": [0,11,12,13,14,15,16,23,24],
        "slices": { "leftHand": [0,63], "rightHand": [63,126], "pose": [126,162],
                    "face": [162,285], "motion": [285,303], "geometry": [303,319], "quality": [319,327] } },
      "attributionText": "Dữ liệu huấn luyện: VSL400 (Zenodo) — giấy phép CC BY 4.0",
      "disclaimerText": "Đây là công cụ hỗ trợ luyện tập, không phải thông dịch viên." } }
  ```

### 3.12c 🤖 `POST /api/v1/ai/attempts` — Chấm một lượt ký hiệu động *(FR-41→43, SCR-31)*

- **Mô tả & quyền:** `LEARNER_*`. **Endpoint quan trọng nhất của module M10.**
- **Request** (ngoài `BaseRequest`):

  | Trường | Kiểu | Bắt buộc | Ràng buộc (ref SRS) | Mô tả |
  |--------|------|:--------:|----------------------|-------|
  | `targetSignId` | string | ✓ | Phải ∈ `recognizableSignIds` — FR-41 | Ký hiệu đang luyện |
  | `modelVersion` | string | ✓ | Khớp bản đang hoạt động | Chống client cũ gửi tensor sai schema |
  | `features` | number[][] | ✓ | **Đúng 64 × 327**, hữu hạn, \|v\| ≤ 50 | Tensor đặc trưng đã chuẩn hoá |
  | `frameCount` | int | ✓ | **8 ≤ n ≤ 32** | Số khung hữu ích thu được |
  | `durationMs` | int | ✓ | 300–6000 | |
  | `clientQuality` | object | ✓ | `handFrameRatio`, `bothHandsRatio` ∈ [0,1]; `poseDetected` boolean | Dùng để sinh gợi ý (FR-43) |
  | `sessionId` | string | ✗ | UUID | Nhóm các lượt trong một phiên luyện |
  | ~~`frame`, `image`, `video`, base64 ảnh~~ | — | **CẤM** | Có mặt → `10103` | |

- **Response `result`:**

  | Trường | Kiểu | Mô tả |
  |--------|------|-------|
  | `attemptId` | string | |
  | `verified` | boolean | **Do backend quyết định** (ADR-09) |
  | `status` | string | `ok`/`wrong_target`/`low_confidence`/`uncertain_intent`/`no_hand`/`too_short`/… |
  | `confidence` | number | 0.000–1.000 |
  | `predictedSignId`, `predictedLabel` | string | Ký hiệu AI nhận ra — **có giá trị dạy học khi `wrong_target`** |
  | `top3[]` | array | `{signId, label, confidence}` — chỉ trả khi `wrong_target` / `uncertain_intent` |
  | `qualityHints[]` | string[] | **Tối đa 2 câu** (BR-A121) |
  | `countedAgainstQuota` | boolean | |
  | `quotaRemaining` | int\|null | `null` nếu Premium |
  | `consecutiveFailures` | int | ≥ 3 → giao diện đề nghị lối thoát (BR-A122) |

- **Mã lỗi nghiệp vụ:**

  | errorCode | HTTP | Ý nghĩa | errorMessage (vi) |
  |-----------|:----:|---------|-------------------|
  | `10101` | 400 | Phiên bản mô hình không hỗ trợ | Đã có phiên bản mới, vui lòng tải lại trang. |
  | `10102` | 400 | Tensor sai kích thước/giá trị | Dữ liệu chuyển động không hợp lệ. |
  | `10103` | 400 | Payload chứa dữ liệu ảnh | Yêu cầu không hợp lệ. |
  | `10104` | 400 | `frameCount` ngoài 8–32 | Hãy thực hiện trọn động tác trong khoảng hai giây. |
  | `10201` | 400 | Ký hiệu không có chấm AI | Ký hiệu này chưa được hỗ trợ chấm tự động. |
  | `06204` | 400 | Hết hạn mức ngày | Bạn đã dùng hết 5 lượt luyện AI hôm nay. |
  | `10301` | **503** | Dịch vụ AI không sẵn sàng | Hệ thống chấm tự động đang bận, bạn thử lại sau ít phút nhé. |
  | `10302` | **504** | Quá 5 giây | Chấm tự động mất nhiều thời gian hơn thường lệ, vui lòng thử lại. |

  > **`10301` / `10302` KHÔNG trừ hạn mức và KHÔNG ghi lượt thất bại** (NFR-20, AC-41.6).

- **Ví dụ:**
  ```json
  // Request (rút gọn phần tensor)
  { "requestId": "h2i3j4", "version": "1.0",
    "targetSignId": "018f2a01-...", "modelVersion": "vsl-mvp30-v2-lite-transformer",
    "features": [[0.12, -0.04, 0.88, "…327 số…"], "…64 khung…"],
    "frameCount": 21, "durationMs": 1840,
    "clientQuality": { "handFrameRatio": 0.95, "bothHandsRatio": 0.88, "poseDetected": true } }

  // 200 — đúng
  { "requestId": "h2i3j4", "errorCode": "00000", "errorMessage": "Success",
    "result": { "attemptId": "018f3001-...", "verified": true, "status": "ok", "confidence": 0.93,
      "predictedSignId": "018f2a01-...", "predictedLabel": "Cái bàn", "top3": null,
      "qualityHints": [], "countedAgainstQuota": true, "quotaRemaining": 4, "consecutiveFailures": 0 } }

  // 200 — nhận ra ký hiệu khác (vẫn là 200 vì request hợp lệ)
  { "requestId": "h2i3j4", "errorCode": "00000", "errorMessage": "Success",
    "result": { "attemptId": "018f3002-...", "verified": false, "status": "wrong_target", "confidence": 0.71,
      "predictedSignId": "018f2a03-...", "predictedLabel": "Cái cửa",
      "top3": [ {"signId":"018f2a03-...","label":"Cái cửa","confidence":0.71},
                {"signId":"018f2a01-...","label":"Cái bàn","confidence":0.18},
                {"signId":"018f2a07-...","label":"Cửa sổ","confidence":0.06} ],
      "qualityHints": ["Ký hiệu nhận được chưa khớp từ đang luyện. Hãy xem lại video mẫu."],
      "countedAgainstQuota": true, "quotaRemaining": 3, "consecutiveFailures": 1 } }

  // 503 — dịch vụ AI bận
  { "requestId": "h2i3j4", "errorCode": "10301",
    "errorMessage": "Hệ thống chấm tự động đang bận, bạn thử lại sau ít phút nhé.", "result": null }
  ```

### 3.12d 🤖 `PUT /api/v1/me/data-donation` — Bật/tắt góp dữ liệu *(FR-46, SCR-34)*

- **Request:** `granted` (boolean, ✓) · `consentTextVersion` (string, ✓ khi `granted = true` — phiên bản
  văn bản đồng ý mà người dùng đã đọc).
- **Response `result`:** `granted` · `grantedAt` · `pseudonymId` · `purgeScheduledAt` (khi tắt: thời điểm
  dữ liệu đã góp sẽ bị xoá — trong vòng 30 ngày).
- **Mã lỗi:** `00101` thiếu `consentTextVersion`.
- **Ví dụ:**
  ```json
  // Request — rút lại đồng ý
  { "requestId": "i3j4k5", "version": "1.0", "granted": false }
  // 200
  { "requestId": "i3j4k5", "errorCode": "00000", "errorMessage": "Success",
    "result": { "granted": false, "grantedAt": null, "pseudonymId": "018f4001-...",
                "purgeScheduledAt": "20/10/2026 00:00:00" } }
  ```

### 3.13 `POST /api/v1/billing/checkout` — Tạo giao dịch thanh toán payOS VietQR *(FR-29, SCR-23)*

- **Mô tả & quyền:** `LEARNER_*`. Tạo liên kết thanh toán payOS kèm dữ liệu mã VietQR động chuẩn NAPAS 24/7.
- **Request:**

  | Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
  |--------|------|:--------:|-----------|-------|
  | `planId` | string | ✓ | ∈ {`PREMIUM_1M`,`PREMIUM_6M`,`PREMIUM_12M`} | Mã gói người dùng chọn |
  | `requestId` | string | ✗ | Chuỗi định danh yêu cầu | |

- **Response `result`:** `orderCode` (int64) · `orderRef` · `amount` (VND) · `checkoutUrl` · `qrCode` (chuỗi VietQR) · `status` (`PENDING`) · `accountNumber` · `accountName` · `bin` · `bankName` · `description`.
- **Mã lỗi:** `00404` không tìm thấy gói · `00401` chưa xác thực.
- **Ví dụ:**
  ```json
  // Request
  { "requestId": "a3b4c5d6", "planId": "PREMIUM_6M" }
  // 200
  { "requestId": "a3b4c5d6", "errorCode": "00000", "errorMessage": "Success",
    "result": {
      "orderCode": 1790046846344,
      "orderRef": "SL-1790046846344",
      "amount": 499000,
      "checkoutUrl": "https://pay.payos.vn/web/417242c7...8d2b",
      "qrCode": "00020101021238540010A000000727012600069704180114V3CAS5111146929...",
      "status": "PENDING",
      "accountNumber": "V3CAS5111146929",
      "accountName": "PHAN BUI BA DAT",
      "bin": "970418",
      "bankName": "BIDV (Ngân hàng TMCP Đầu tư và Phát triển Việt Nam)",
      "description": "SL-1790046846344"
    }
  }
  ```

### 3.13a `GET /api/v1/billing/status/{orderCode}` — Đồng bộ & kiểm tra trạng thái đơn hàng *(FR-29)*

- **Mô tả & quyền:** `LEARNER_*`. Truy vấn trạng thái giao dịch theo mã đơn payOS. Khi chạy môi trường dev/local chưa có public webhook, endpoint này chủ động gọi sang API `GET /v2/payment-requests/{orderCode}` của payOS để đồng bộ trạng thái thực và tự kích hoạt Premium nếu đã thanh toán.
- **Response `result`:** cấu trúc `CheckoutResult` tương tự checkout, trường `status` đổi thành `PAID` nếu đã chuyển khoản thành công.

### 3.13b `POST /api/v1/billing/confirm/{orderCode}` — Xác nhận thủ công & chống gian lận bypass *(FR-29)*

- **Mô tả & quyền:** `LEARNER_*`. Được gọi khi người dùng bấm nút "Tôi đã thanh toán trên payOS".
- **Cơ chế xác thực an toàn:**
  1. Nếu giao dịch trong CSDL đã là `PAID` -> trả về kết quả thành công ngay.
  2. Nếu giao dịch còn `PENDING` -> backend **bắt buộc truy vấn trực tiếp máy chủ payOS** (`GET /v2/payment-requests/{orderCode}`) để kiểm tra trạng thái thực tế từ ngân hàng.
  3. Chỉ khi payOS xác nhận `PAID`, hệ thống mới kích hoạt thuê bao và nâng quyền `ROLE_LEARNER_PREMIUM`.
  4. Nếu payOS báo chưa thanh toán (`PENDING` / `CANCELLED`), hệ thống từ chối kích hoạt và ném mã lỗi **`06101`** (`PAYMENT_NOT_COMPLETED`), ngăn chặn 100% rủi ro người dùng bấm xác nhận khống để chiếm quyền Premium.
- **Mã lỗi:** `06101` (Chưa nhận được thanh toán từ ngân hàng hoặc giao dịch chưa hoàn tất) · `00404` không tìm thấy đơn.

### 3.14 `POST /api/v1/billing/ipn/payos` — Webhook IPN từ payOS *(FR-32)*

- **Mô tả & quyền:** Công khai về mặt mạng, **bắt buộc xác thực chữ ký HMAC SHA-256** của payOS.
- **Đầu vào:** Raw body JSON do máy chủ payOS bắn sang kèm trường `signature`.
  ```json
  {
    "code": "00",
    "desc": "success",
    "data": {
      "orderCode": 1790046846344,
      "amount": 499000,
      "description": "SL-1790046846344",
      "accountNumber": "V3CAS5111146929",
      "reference": "FT242...",
      "transactionDateTime": "2026-09-22 10:20:00",
      "currency": "VND",
      "paymentLinkId": "417242c7...",
      "code": "00",
      "desc": "success"
    },
    "signature": "3c983a..."
  }
  ```
- **Xác thực:** Dữ liệu trong `data` được trích xuất, sắp xếp theo thứ tự bảng chữ cái của khoá, nối thành query string `k1=v1&k2=v2...`, băm HMAC SHA-256 bằng `checksumKey` và so khớp với `signature`.
- **Xử lý:**
  1. Ghi log kiểm toán `payment_webhook_log`.
  2. Cập nhật `payment_transaction` sang `PAID`, lưu `paid_at`, `webhook_signature`.
  3. Kích hoạt `subscription` mới (hoặc cộng dồn thời hạn nếu đang còn gói ACTIVE).
  4. Nâng quyền người dùng lên `ROLE_LEARNER_PREMIUM`.
- **Phản hồi:** `{"code":"00", "desc":"success", "success": true}`.
  ```json
  // Request
  { "partnerCode": "MOMOXXXX", "orderId": "SL26092000124", "requestId": "SL26092000124",
    "amount": 990000, "orderInfo": "SignLight Premium 12M", "orderType": "momo_wallet",
    "transId": 2626262626, "resultCode": 0, "message": "Successful.",
    "payType": "qr", "responseTime": 1789012345678, "extraData": "",
    "signature": "3b1a…" }
  ```
  ```
  // 204 No Content
  ```

### 3.15 `GET /api/v1/billing/subscription` — Thuê bao hiện tại *(FR-31, SCR-24)*

- **Mô tả & quyền:** `LEARNER_*`. **Nguồn sự thật để giao diện hiển thị trạng thái** sau khi thanh toán —
  frontend hỏi endpoint này, **không** đọc tham số trên `returnUrl` (BR-A110, AC-29.7).
- **Response `result`:**

  | Trường | Kiểu | Mô tả |
  |--------|------|-------|
  | `status` | string | `ACTIVE` / `EXPIRED` / `REFUNDED` / `NONE` |
  | `planCode` | string\|null | |
  | `expiresAt` | string\|null | `dd/MM/yyyy HH:mm:ss` theo múi giờ người dùng |
  | `daysRemaining` | int\|null | Để giao diện hiện "Còn 12 ngày" |
  | `renewalReminderStage` | int\|null | 7 / 3 / 1 / 0 — mốc nhắc gần nhất đã gửi |
  | `pendingTransaction` | object\|null | `{orderRef, provider, status}` nếu đang có giao dịch `PENDING` — dùng cho màn "Đang xác nhận…" |

  > **Không có trường `autoRenew`** — v0.2 bỏ hẳn khái niệm này (BR-A69, AC-31.6).

- **Ví dụ:**
  ```json
  { "requestId": "b4c5d6e7", "errorCode": "00000", "errorMessage": "Success",
    "result": { "status": "ACTIVE", "planCode": "PREMIUM_12M",
                "expiresAt": "20/09/2027 23:59:59", "daysRemaining": 365,
                "renewalReminderStage": null, "pendingTransaction": null } }
  ```

### 3.16 `POST /api/v1/certificates` — Tạo chứng chỉ PDF *(FR-27, SCR-20)*

- **Mô tả & quyền:** **chỉ `LEARNER_PREMIUM`** (BR-A57).
- **Request:** `chapterIds` (string[], ✓, mọi phần tử phải đã `COMPLETED` bởi chính người dùng) · `locale` (string, ✗, `vi`/`en`).
- **Response `result`:** `certificateId` · `verificationCode` · `downloadUrl` (URL ký hạn 15 phút) · `issuedAt`.
- **Mã lỗi:** `06202` cần Premium · `05201` chưa hoàn thành phần yêu cầu.
- **Ví dụ:**
  ```json
  // Request
  { "requestId": "c5d6e7f8", "version": "1.0", "chapterIds": ["018f0110-...", "018f0111-..."], "locale": "vi" }
  // 200
  { "requestId": "c5d6e7f8", "errorCode": "00000", "errorMessage": "Success",
    "result": { "certificateId": "018f1201-...", "verificationCode": "SL-7K2M-9QX4",
                "downloadUrl": "https://cdn.example/cert/018f1201.pdf?exp=...&sig=...",
                "issuedAt": "20/09/2026 16:05:00" } }
  // 400 — chưa hoàn thành
  { "requestId": "c5d6e7f8", "errorCode": "05201", "errorMessage": "Bạn chưa hoàn thành phần này.", "result": null }
  ```

### 3.17 `POST /api/v1/cms/content/{type}/{id}/approve` — Duyệt & xuất bản *(FR-35, SCR-27)*

- **Mô tả & quyền:** **chỉ `CONTENT_APPROVER` / `ADMIN`** — `CONTENT_EDITOR` bị từ chối kể cả khi giao diện lộ nút (BR-A79, AC-35.1).
- **Đường dẫn:** `type` ∈ {`sign`, `lesson`, `chapter`, `unit`, `course`}.
- **Request:** `note` (string, ✗, ≤ 1000) — ghi vào `content_audit_log`.
- **Response `result`:** `id` · `status` (`PUBLISHED`) · `publishedAt` · `cacheEvicted` (boolean).
- **Mã lỗi:** `00403` không đủ quyền · `07202` chưa đủ điều kiện xuất bản (thiếu đáp án đúng / video chưa `READY`) · `00404`.
- **Ví dụ:**
  ```json
  // 400 — chưa đủ điều kiện
  { "requestId": "d6e7f8a9", "errorCode": "07202",
    "errorMessage": "Nội dung chưa đủ điều kiện xuất bản.",
    "result": null }
  // 403 — editor tự xuất bản
  { "requestId": "d6e7f8a9", "errorCode": "00403",
    "errorMessage": "Bạn không có quyền thực hiện thao tác này.", "result": null }
  ```

### 3.18 `POST /api/v1/support/users/{userId}/premium-grant` — Cấp Premium bù *(FR-36)*

- **Mô tả & quyền:** `SUPPORT` / `ADMIN`. Ghi `audit_log` với **lý do bắt buộc** (BR-A83).
- **Request:** `days` (int, ✓, 1–365) · `reason` (string, **✓**, 10–500).
- **Response `result`:** `subscriptionId` · `accessUntil` · `auditLogId`.
- **Mã lỗi:** `07103` thiếu lý do (AC-36.2) · `00403`.
- **Ví dụ:**
  ```json
  // Request
  { "requestId": "e7f8a9b0", "version": "1.0", "days": 30,
    "reason": "Bu tru gian doan dich vu ngay 18/09/2026 theo ticket SUP-1042" }
  // 400 — thiếu lý do
  { "requestId": "e7f8a9b0", "errorCode": "07103", "errorMessage": "Vui lòng nhập lý do thực hiện.", "result": null }
  ```

### 3.19 `POST /api/v1/business-inquiries` — Form liên hệ doanh nghiệp *(FR-38, SCR-28)*

- **Request:** `organizationName` (string, ✓, 2–150) · `contactEmail` (string, ✓, RFC 5322) · `seatCount` (int, ✓, 1–100000) · `message` (string, ✗, ≤ 2000, **khử HTML**) · `antiSpamToken` (string, ✓).
- **Response `result`:** `inquiryId` · `submittedAt`.
- **Mã lỗi:** `00101` validate · `00105` quá 3 lần/giờ/IP (429 — AC-38.1).

### 3.20 Các endpoint còn lại — đặc tả rút gọn

> Mọi endpoint dưới đây dùng envelope, phân trang, mã lỗi chung ở §1. Các mã lỗi **riêng** ghi ở cột cuối.

| Endpoint | Request chính | `result` chính | Mã lỗi riêng |
|----------|---------------|----------------|--------------|
| `POST /auth/google` | `idToken` (Google OIDC) | `accessToken`, `userId`, `roles`, `activeCourseId`, `requiresEmailVerification` | `00401` token Google không hợp lệ |
| `POST /auth/refresh` | *(cookie refresh `refresh_token` hoặc body `refreshToken`)* | `accessToken`, `expiresIn: 900`, `tokenType: "Bearer"` | `01204` tái sử dụng token (thu hồi cả family), `00401` |
| `POST /auth/logout` | — | `{}` (xoá cookie refresh token) | — |
| `POST /auth/email/verify` | `email`, `otp` (6 số) | `accessToken`, `userId`, `roles`, `activeCourseId`, `requiresEmailVerification: false` | `01105` sai OTP, `01106` hết hạn OTP, `01104` đã xác nhận trước đó |
| `POST /auth/email/resend` | `email` | `{}` | `01109` quá tần suất (cooldown 60s), `01104` |
| `POST /auth/password/forgot` | `email` | `{}` *(luôn trả thành công chống dò user)* | `00105` |
| `POST /auth/password/reset` | `token`, `newPassword` | `{}` | `01107` token sai, `01108` token hết hạn, `01102` mật khẩu phổ biến |
| `POST /billing/checkout` | `planId` | `orderCode`, `orderRef`, `amount`, `checkoutUrl`, `qrCode`, `accountNumber`, `bankName`, `description` | `00404` không tìm thấy gói |
| `GET /billing/status/{orderCode}` | — | `CheckoutResult` (tự động đồng bộ từ payOS nếu chưa có IPN) | `00404` |
| `POST /billing/confirm/{orderCode}` | — | `CheckoutResult` (đối soát trực tiếp API payOS, chống bypass) | `06101` chưa hoàn tất thanh toán trên payOS |
| `POST /billing/ipn/payos` | raw payload JSON + HMAC SHA-256 signature | `{"code":"00","desc":"success"}` | `400` chữ ký sai |
| `GET /media/stream/{id}` | header `Range: bytes=...` | Điều hướng 307 tới Google Drive CDN `lh3.googleusercontent.com` hoặc HTTP 206 Partial Content video tĩnh | `00404` |
| `GET /onboarding/answers/{token}` | — | `currentStep`, `answers`, `expiresAt` | `00404` hết hạn (AC-05.4) |
| `GET /me` | — | `profile`, `preferences`, `roles`, `subscription`, `emailVerified` | — |
| `PATCH /me/profile` | `displayName`, `timezone` | `profile` | `01101` |
| `PUT /me/avatar` | multipart `file` | `avatarUrl` | `01602` tệp không hợp lệ |
| `PATCH /me/preferences` | `activeCourseId`, `dailyGoalMinutes`, `videoSpeed`, `uiLocale` | `preferences`, `goalEffectiveFrom` *(ngày mai — BR-A52)* | `01101` |
| `POST /me/email/change` | `newEmail`, `currentPassword` | `pendingEmail`, `confirmationSentTo` | `01601` sai mật khẩu |
| `POST /me/password/change` | `currentPassword`, `newPassword` | `sessionsRevoked` (int) | `01601`, `01102` |
| `POST /me/progress/reset` | `courseId`, `confirmation: "RESET"` | `lessonsReset`, `awardsKept` | `00101` xác nhận sai (AC-07.2) |
| `POST /me/deletion` | `currentPassword` | `status: PENDING_DELETION`, `purgeAt` | `01601` |
| `DELETE /me/deletion` | — | `status: ACTIVE` | `00404` |
| `GET /me/export` | — | `downloadUrl` (JSON, ký hạn 15 phút) | `00105` (1/ngày) |
| `GET /courses` | — | `items[] {id, code, name, status, comingSoon}` | — |
| `GET /chapters/{id}/quiz` | — | `quizAttemptId`, `questions[]` *(không đáp án)* | `06203` |
| `POST /chapters/{id}/quiz/submit` | `quizAttemptId`, `answers[]` | `scorePercent`, `passed`, `signsToReview[]` | `03202` chưa đạt |
| `GET /units/{id}/milestone` | — | `milestoneAttemptId`, `questions[]` | `03201` chưa mở (BR-A13) |
| `POST /units/{id}/milestone/submit` | `answers[]` | `scorePercent`, `starsEarned`, `bestStars` | — |
| `POST /practice/vocabulary/answer` | `sessionId`, `signId`, `selectedOptionId` | `isCorrect`, `nextDueAt`, `intervalDays` | `00404` phiên đóng |
| `GET /practice/fingerspell/session` | query `mode` (`ALPHABET`/`DUE`) | `sessionId`, `letters[]`, `modelUrl`, `modelVersion` | — |
| `GET /practice/numbers/session` | query `range` | `sessionId`, `items[] {value, videoUrl, recognizable}` | `06201` |
| `GET /practice/mirror/{signId}` | — | `videoUrl`, `mirrorDefault: true` | `00404` |
| `GET /dictionary/signs/{id}` | — | `word`, `meaning`, `wordClass`, `description`, `variants[] {videoUrl, regionLabel, signerLabel}`, `relatedSigns[]`, `usedInLessons[]` | `02201` chưa xuất bản |
| `GET /dictionary/topics` | — | `items[] {topic, signCount}` | — |
| `GET /progress/activity` | query `days` (7/30) | `items[] {date, minutes, goalMinutes, goalMet}` | — |
| `GET /awards` | — | `items[] {code, name, tier, currentValue, nextTierAt, pendingCelebration}` | — |
| `POST /awards/{code}/celebrated` | — | `{}` | `00404` |
| `GET /curiosities` | — | `unlocked[] {id, title, content}`, `lockedCount` *(BR-A29)* | — |
| `GET /certificates/verify/{code}` | — | `courseName`, `completedScope[]`, `issuedAt` *(không PII — BR-A59)* | `00404` |
| `GET /billing/transactions` | phân trang | `items[] {id, orderRef, provider, planCode, amountMinor, currency, status, paidAt, receiptUrl}` | — |
| `GET /billing/return/{provider}` | tham số của cổng | `{}` — **chỉ điều hướng về giao diện**; trạng thái đọc từ `GET /billing/subscription` (BR-A110) | — |
| `GET /ai/quota` | — | `used`, `limit`, `remaining`, `resetAtLocal`, `unlimited` | — |
| `GET /ai/practice/session` | query `mode` (`LESSON`/`REVIEW`/`FREE`) | `sessionId`, `items[] {signId, label, videoUrl}` *(chỉ ký hiệu có chấm AI)* | `10201` |
| `GET /ai/attempts` | phân trang | `items[] {attemptId, targetSignId, status, verified, confidence, createdAt}` | — |
| `GET /me/data-donation` | — | `granted`, `grantedAt`, `consentTextVersion`, `donatedClipCount` | — |
| `POST /ai/donations/clips` | multipart `clip` (webm ≤ 5 MB, ≤ 5 giây) + `attemptId` | `clipId`, `purgeAfter` | `10202` chưa đồng ý |
| `POST /dictionary/missing-signs` | `word`, `note` | `requestId`, `requestCount` | `00105` quá 10/ngày |
| `POST /cms/ai/labels/sync` | — | `synced`, `mapped`, `orphaned[]` | `10301` dịch vụ AI không sẵn sàng |
| `GET /cms/ai/labels` | query `onlyOrphaned` | `items[] {labelIndex, rawLabel, stableSignId, signId, isEnabled}` | — |
| `GET /cms/missing-signs` | query `status`, phân trang | `items[] {word, requestCount, status}` sắp theo `requestCount` giảm dần | — |
| `GET/POST/PATCH /cms/signs` | theo FR-33 | `sign` | `07201` đang dùng, `01101` |
| `POST /cms/signs/{id}/videos` | multipart `file`, `regionLabel`, `signerLabel` | `signVideoId`, `status: UPLOADED` | `07101` tệp không hợp lệ |
| `POST /cms/transcode/webhook` | *(HMAC)* | — | `401` |
| `GET/POST/PATCH /cms/lessons` | theo FR-34 | `lesson`, `exercises[]` *(editor **được** thấy `isCorrect`)* | `07202` |
| `POST /cms/content/{type}/{id}/submit-review` | `note` | `status: IN_REVIEW` | `07202` |
| `POST /cms/content/{type}/{id}/unpublish` | `note` | `status: UNPUBLISHED` | `00403` |
| `GET /support/users` | query `email` (**khớp chính xác, bắt buộc**) | `user` *(PII che một phần — BR-A84)* | `00403` nếu thiếu email (AC-36.1) |
| `POST /me/notifications/preferences` | `dailyReminder`, `streakWarning`, `marketing` | `preferences` | — |
| `GET /health` | — | `status: UP`, `db`, `redis` | — |

---

## 4. 🤖 Hợp đồng nội bộ với dịch vụ AI *(mới ở v0.2 — KHÔNG công khai ra Internet)*

> Đây là hợp đồng giữa **backend Java** và **dịch vụ AI Python**. Dịch vụ AI **chỉ được** truy cập từ mạng
> nội bộ (Docker network), **không** có xác thực người dùng, **không** chạm CSDL (ADR-10).

**Base URL nội bộ:** `http://ai:7860` *(cổng 7860 theo repo EXE101)*

### 4.1 `GET /health`
`{"status":"UP","modelVersion":"vsl-mvp30-v2-lite-transformer","numClasses":30}`

### 4.2 `GET /api/labels`
```json
{ "modelVersion": "vsl-mvp30-v2-lite-transformer", "schemaVersion": "v2_holistic_subset",
  "sequenceLength": 64, "featureDim": 327, "confidenceThreshold": 0.55, "confidenceMargin": 0.03,
  "labels": [ {"index":0,"label":"Anh","stableSignId":"anh"},
              {"index":1,"label":"Cháu","stableSignId":"chau"} ] }
```

### 4.3 `POST /api/infer/features` — ✅ **endpoint BẮT BUỘC bổ sung vào repo** *(Q8 chốt phương án B)*

> ✅ **Q8 đã chốt (anh Duy, 2026-09-20) = phương án B.** Đây là **endpoint suy luận duy nhất** được dùng
> trong sản phẩm. Việc bổ sung nó vào repo EXE101 là **hạng mục chặn GATE-4**, không còn là điều kiện.

Repo hiện chỉ có `POST /api/infer/frames` (nhận 8–32 ảnh JPEG). Phương án B cần thêm endpoint nhận
**tensor đã trích sẵn**, bỏ qua bước MediaPipe ở server:

- **Request:** `{"features": number[64][327], "modelVersion": "..."}` — JSON hoặc `application/octet-stream`
  (Float32Array) để nhẹ hơn.
- **Response:**
  ```json
  { "status": "ok", "label": "Cái bàn", "stableSignId": "cai-ban", "confidence": 0.93,
    "top3": [ {"label":"Cái bàn","stableSignId":"cai-ban","confidence":0.93},
              {"label":"Cái cửa","stableSignId":"cai-cua","confidence":0.04},
              {"label":"Cửa sổ","stableSignId":"cua-so","confidence":0.02} ],
    "quality": {"handFrameRatio":0.95,"bothHandsRatio":0.88,"poseDetected":true},
    "inferenceLatencyMs": 0.6, "retainedMedia": false }
  ```
- **Lỗi:** `400` tensor sai kích thước · `409` `modelVersion` không khớp bản đang nạp · `503` mô hình chưa nạp xong.

> **Lượng công việc cần thêm vào repo EXE101:** một endpoint mỏng gọi thẳng `OnnxSignRecognizer` với tensor
> có sẵn, bỏ qua `HolisticLandmarkExtractor`. Đây là **thay đổi nhỏ** vì lớp suy luận đã tách sẵn.

### 4.4 `POST /api/infer/frames` — ❌ **KHÔNG bật trong sản phẩm** *(phương án C đã bị loại)*
Có sẵn trong repo: nhận 8–32 ảnh JPEG, tổng ≤ 2 MB, cộng `expected_sign_id`. **Phương án C đã bị loại
khi Q8 chốt phương án B** → endpoint này **phải tắt** ở cấu hình sản phẩm (xem §4.5). Giữ lại trong repo
chỉ để chạy thử nghiệm nội bộ ở môi trường `dev`.

### 4.5 Endpoint của repo **KHÔNG được bật** trong sản phẩm

| Endpoint | Vì sao không bật |
|----------|------------------|
| `POST /api/infer/frames` | Nhận **pixel** — vi phạm NFR-12 sau khi Q8 chốt phương án B. Chỉ được bật ở `dev` để thử nghiệm |
| `POST /api/attempt` | **Ghi video người dùng xuống đĩa** và có thể tải lên Google Drive — vi phạm NFR-12. Việc góp dữ liệu phải đi qua luồng có đồng ý tường minh (FR-46, `POST /ai/donations/clips`) |
| `GET /` (trang HTML test nội bộ) | Lộ giao diện test ra ngoài |
| `GET /api/sample/{i}` | Không cần — video mẫu phục vụ qua CDN của SignLight |

**Biến môi trường phải đặt rỗng/tắt:** `LOG_WEBHOOK_URL`, `GDRIVE_FOLDER_ID`, `LOG_WEBHOOK_SECRET`.

---

## ✅ Checklist trước GATE-3
- [x] §1 quy ước chung đầy đủ (base URL, auth, envelope, HTTP status, phân trang, mã lỗi chung, giới hạn tần suất, **5 bất biến bảo mật**) — khai 1 lần.
- [x] Danh mục endpoint (§2) phủ đủ **FR-01→FR-46**; mỗi endpoint gắn FR.
- [x] §4 khai báo hợp đồng nội bộ với dịch vụ AI và **liệt kê rõ endpoint của repo không được bật**.
- [x] Mỗi endpoint trọng yếu có bảng request + `result` + **mã lỗi nghiệp vụ** (errorCode 5 ký tự + HTTP + errorMessage).
- [x] Mỗi endpoint trọng yếu có **ví dụ JSON**: request + thành công + ít nhất 1 lỗi; dữ liệu giả, **không PII thật**.
- [x] Tên trường khớp **LLD** (nguồn sự thật data model); mã lỗi khớp convention `backend-dev-java`.
- [x] Ghi chú: OpenAPI sinh từ code (springdoc) sẽ đối chiếu file này ở GATE-4 — không viết YAML tay.
- [x] Đã xoá hết khối 💡 Hướng dẫn / 📝 Ví dụ của mẫu.
- [x] ✅ §3.14 đã viết theo đúng VNPay + MoMo (Q3 đã chốt).
- [x] ✅ **Q8 đã chốt phương án B** — §4.3 là endpoint suy luận duy nhất; §4.4 (`/api/infer/frames`) chuyển sang danh sách **không bật**.
- [ ] ⚠️ **Việc cần làm ở B4:** bổ sung `POST /api/infer/features` vào repo EXE101 (**chặn GATE-4**).
