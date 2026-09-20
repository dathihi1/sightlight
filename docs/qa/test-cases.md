# Test Cases — SignLight

| Phiên bản | **v0.2** | Ngày | 2026-09-20 | Trạng thái | DRAFT — **chưa chạy**, cột kết quả để trống cho B4 |
|-----------|------|------|------------|------------|-----------------------------------------------------|

**Tiền đề:** `docs/ba/SRS.md` (tiêu chí chấp nhận), `docs/sa/api-spec.md` (endpoint), `docs/ba/FSD.md` (màn hình)
**Chiến lược:** `docs/qa/test-plan.md`

---

## 1. Phạm vi & Nguồn suy test case

Bộ case này phủ **FR-01 → FR-46** và **75 endpoint**. Nguồn suy:
- **~150 tiêu chí chấp nhận Given–When–Then** trong `SRS.md` v0.2 → mỗi tiêu chí ≥ 1 case.
- Mỗi endpoint `api-spec.md` → 1 case đúng schema + ≥ 1 case mã lỗi.
- **7 bất biến `INV-1→INV-7`** (`test-plan.md` §1) → bộ case riêng, **mức Blocker**.

## 2. Quy ước

- **TC-ID:** `TC-FR<nn>-<số>`. Case bất biến gắn thêm nhãn `[INV-n]`.
- **Mức lỗi:** Blocker / Critical / Major / Minor.
- **Trạng thái:** Pass / Fail / Blocked / N/A. *(Bỏ trống tới khi chạy thật ở B4.)*
- **Dữ liệu:** hoàn toàn **ẩn danh** — `hocvien{n}@example.com`, "Hoc Vien 01". Không PII thật (PDPL).
- Case 🤖 cần **cờ giả lập lỗi dịch vụ AI** (`AI_SIMULATE_FAILURE`) do dev cung cấp — xem `test-plan.md` TR-07.

---

## 3. Bảng test case

### 3.0 BẤT BIẾN — nhóm ưu tiên cao nhất *(mọi case ở đây đều là Blocker; không cho phép ngoại lệ)*

| TC-ID | FR / Tiêu chí chấp nhận | Tiền điều kiện | Bước thực hiện | Dữ liệu | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái | Mức lỗi |
|-------|--------------------------|----------------|----------------|---------|-----------------|-----------------|:----------:|---------|
| TC-FR18-01 `[INV-1]` | FR-18 / AC-18.1 | Đã đăng nhập, có webcam, đã cấp quyền | 1) Mở DevTools tab Network, bật "Preserve log"; 2) Vào SCR-14; 3) Luyện đủ 5 chữ cái; 4) Lọc mọi request theo kích thước > 10 KB và theo content-type `image/*`, `video/*`, `multipart/*` | 5 chữ: A, B, C, D, E | **Không có request nào** chứa dữ liệu ảnh/video/blob nhị phân từ camera. Chỉ có request JSON nhỏ `{letter, recognitionScore, durationMs, modelVersion}` | | | Blocker |
| TC-FR18-02 `[INV-1]` | FR-18 / AC-18.6 | Có access token hợp lệ | 1) Gọi thẳng `POST /practice/fingerspell/attempt` với body kèm trường `frame` chứa chuỗi base64 ảnh | `{"letter":"A","recognitionScore":0.9,"durationMs":1200,"modelVersion":"fs-v1.2.0","frame":"data:image/png;base64,iVBORw0..."}` | HTTP 400, `errorCode = 00101`; **không** ghi bản ghi nào vào `fingerspell_attempt` | | | Blocker |
| TC-FR18-03 `[INV-1]` | FR-18 / BR-A35 | Đã chạy một phiên đánh vần | 1) Truy vấn toàn bộ schema: `SELECT column_name, data_type FROM information_schema.columns WHERE data_type IN ('bytea','blob') OR column_name ~* 'image|frame|photo|video_data'` | — | **0 dòng** liên quan tới dữ liệu camera | | | Blocker |
| TC-FR20-01 `[INV-1]` | FR-20 / AC-20.1 | Đang ở chế độ Gương | 1) Theo dõi Network 60 giây khi camera bật | — | Không có dữ liệu ảnh/video đi ra | | | Blocker |
| TC-FR12-01 `[INV-2]` | FR-12 / AC-12.4 | Đã mở một bài học | 1) Gọi `GET /lessons/{id}`; 2) Tìm trong JSON trả về các khoá `isCorrect`, `correctAnswerText`, `correctOrder`, `correct` | Bài học có 10 bài tập | **Không có** bất kỳ khoá nào chỉ ra đáp án đúng trong toàn bộ phản hồi | | | Blocker |
| TC-FR12-02 `[INV-2]` | FR-12 / AC-12.3 | Đang làm bài tập trắc nghiệm | 1) Gửi `POST .../answer` với đáp án **sai** kèm thêm trường `"isCorrect": true` | `selectedOptionId` = lựa chọn sai | Phản hồi `isCorrect: false`; `exercise_attempt.is_correct = false` | | | Blocker |
| TC-FR12-03 `[INV-2]` | FR-12 / AC-12.4 | — | 1) Kiểm tra `SENTENCE_ORDER`: gọi `GET /lessons/{id}`, xem mảng `tokens[]` | Bài tập sắp xếp câu 6 từ | Mảng `tokens` **đã xáo trộn**, không kèm trường thứ tự đúng | | | Blocker |
| TC-FR30-01 `[INV-3]` | FR-30 / AC-30.1 | Tài khoản `free@example.com` | 1) Gọi `GET /lessons/{id}` với id của bài thuộc Unit 3 (Premium) | Bài Premium | HTTP 400, `errorCode = 06203`, `result = null`, **không có URL video nào** trong phản hồi | | | Blocker |
| TC-FR30-02 `[INV-3]` | FR-30 / AC-30.2 | Lấy URL video Premium từ tài khoản Premium | 1) Dán URL video đó vào trình duyệt của tài khoản Free | URL ký | Bị từ chối (403) | | | Blocker |
| TC-FR30-03 `[INV-3]` | FR-30 / AC-30.3 | Tài khoản Premium vừa hết hạn (`current_period_end` = quá khứ) | 1) Không đăng xuất; 2) Gọi `GET /lessons/{id}` bài Premium | — | `06203` ngay lần gọi kế tiếp (không cần đăng nhập lại) | | | Blocker |
| TC-FR30-04 `[INV-3]` | FR-30 / BR-A67 | Tài khoản Free | 1) Gọi `POST /certificates`; 2) Gọi `GET /practice/vocabulary/session` lần thứ 2 trong ngày | — | Lần lượt `06202` và `06201`; không cấp tài nguyên | | | Blocker |
| TC-FR01-01 `[INV-4]` | FR-01 / AC-01.2 | `hocvien01@example.com` **đã tồn tại** | 1) Gửi `POST /auth/register` với email đó; 2) So sánh mã HTTP, `errorCode`, `errorMessage` và **thời gian phản hồi** với lần đăng ký email mới | Đo 20 lần mỗi loại, lấy trung vị | Phản hồi **giống hệt nhau**; chênh lệch thời gian trung vị **< 100 ms**; `SELECT count(*) FROM app_user WHERE lower(email)='hocvien01@example.com'` = **1** | | | Blocker |
| TC-FR02-01 `[INV-4]` | FR-02 / AC-02.2 | — | 1) Đăng nhập với email **không tồn tại**; 2) Đăng nhập với email tồn tại nhưng **sai mật khẩu** | — | Hai phản hồi **không phân biệt được**: cùng `01201`, cùng thông điệp, chênh thời gian < 100 ms | | | Blocker |
| TC-FR04-01 `[INV-4]` | FR-04 / AC-04.1 | — | 1) `POST /auth/password/forgot` với email không tồn tại | `khongtontai@example.com` | HTTP 200, thông điệp trung tính; **không** có bản ghi nào trong `email_outbox` cho email đó | | | Blocker |
| TC-FR29-01 `[INV-5]` | FR-29 / AC-29.4 | Đã chạy 1 giao dịch thanh toán thử | 1) Grep toàn bộ log ứng dụng 24 giờ bằng biểu thức `[0-9]{13,19}` và `cvv|cvc|card_number|pan` | Thẻ thử của cổng | **0 kết quả** là dữ liệu thẻ | | | Blocker |
| TC-FR40-01 `[INV-5]` | FR-40 / AC-40.1 | Hệ thống đã chạy ≥ 24 giờ có lưu lượng | 1) Grep log ứng dụng tìm `@` và tìm mẫu email | — | **Không** có địa chỉ email dạng thô trong log | | | Blocker |
| TC-FR40-02 `[INV-5]` | FR-40 / BR-A90 | — | 1) Grep log tìm `password`, `token`, `Authorization: Bearer` | — | Không có giá trị mật khẩu/token dạng thô | | | Blocker |
| TC-FR29-10 `[INV-6]` | FR-29 / AC-29.7 | Tài khoản Free, **chưa** thanh toán gì | 1) Tự gõ URL `/billing/return/vnpay?vnp_ResponseCode=00&vnp_TxnRef=<order_ref bất kỳ>&vnp_Amount=99000000&vnp_SecureHash=<bịa>`; 2) Tải lại trang chủ; 3) Gọi `GET /billing/subscription` | order_ref bịa | **KHÔNG** được lên Premium; `subscription.status` vẫn `NONE`; vai trò vẫn `LEARNER_FREE` | | | Blocker |
| TC-FR29-11 `[INV-6]` | FR-29 / BR-A110 | Có một `payment_transaction` **thật** đang `PENDING` | 1) Gọi `returnUrl` với đúng `order_ref` đó và tham số thành công **nhưng không có IPN** | — | Trang hiện "Đang xác nhận…"; **KHÔNG** cấp Premium cho tới khi IPN hợp lệ tới | | | Blocker |
| TC-FR32-06 `[INV-6]` | FR-32 / AC-32.1 | — | 1) Gửi IPN VNPay đúng cấu trúc nhưng **chữ ký sai** | `vnp_SecureHash` bịa | Từ chối; **không** bản ghi nào đổi; có cảnh báo bảo mật; `payment_anomaly(SIGNATURE_INVALID)` | | | Blocker |
| TC-FR41-01 `[INV-1]` | FR-41 / NFR-12 | Đã đăng nhập, có webcam, đã cấp quyền | 1) Mở DevTools → Network, bật "Preserve log"; 2) Vào SCR-31, luyện **5 lượt**; 3) Lọc mọi request theo content-type `image/*`, `video/*`, `multipart/*` và theo kích thước > 500 KB | 5 lượt ký hiệu "Cái bàn" | **Không** request nào chứa ảnh/video. Chỉ có JSON chứa mảng số (tensor) và số liệu chất lượng | | | Blocker |
| TC-FR41-02 `[INV-1]` | FR-41 / AC-41.x | Có access token hợp lệ | 1) Gọi `POST /ai/attempts` với body kèm trường `frame` chứa base64 ảnh | `{"targetSignId":"…","features":[…],"frame":"data:image/png;base64,iVBOR…"}` | HTTP 400, `errorCode = 10103`; **không** ghi `sign_attempt` | | | Blocker |
| TC-FR41-03 `[INV-1]` | FR-41 / LLD §1.10 | Đã chạy nhiều lượt luyện AI | 1) Truy vấn schema tìm cột kiểu `bytea`/`blob` hoặc tên chứa `image\|frame\|photo\|landmark`; 2) Kiểm bảng `sign_attempt` | — | `sign_attempt` **chỉ chứa số**; **0** cột nhị phân liên quan camera *(ngoại lệ hợp lệ duy nhất: `donated_clip` khi đã bật FR-46)* | | | Blocker |
| TC-FR46-01 `[INV-1]` | FR-46 / AC-46.1 | Tài khoản **chưa** bật góp dữ liệu | 1) Luyện 5 lượt AI; 2) Theo dõi lưu lượng mạng; 3) Kiểm bảng `donated_clip` và bucket `signlight-donation` | — | **Không** dữ liệu ảnh/video gửi đi; **0** bản ghi `donated_clip`; bucket rỗng | | | Blocker |
| TC-FR41-04 `[INV-7]` | FR-41 / AC-41.6, NFR-20 | Bật cờ giả lập lỗi dịch vụ AI | 1) Ghi lại `quotaRemaining` trước; 2) Luyện 1 lượt (dịch vụ AI trả 500); 3) Kiểm lại hạn mức, `sign_attempt`, `user_sign_knowledge` | `AI_SIMULATE_FAILURE=500` | `10301`; **hạn mức KHÔNG giảm**; **không** ghi `sign_attempt` với `verified=false`; lịch ôn tập **không đổi** | | | Blocker |
| TC-FR41-05 `[INV-7]` | FR-41 / NFR-20 | Bật giả lập timeout 10 giây | 1) Luyện 1 lượt | `AI_SIMULATE_FAILURE=timeout` | `10302` sau **đúng 5 giây** (không chờ 10); hạn mức không giảm; giao diện đề nghị chuyển chế độ Gương | | | Blocker |
| TC-FR41-06 `[INV-7]` | FR-41 / NFR-20 | Dịch vụ AI **tắt hoàn toàn** | 1) `docker compose stop ai`; 2) Mở lộ trình học, làm một bài học **không có** bước AI; 3) Mở từ điển; 4) Mở Trainer từ vựng | — | **Toàn bộ luồng học vẫn hoạt động bình thường**; chỉ chức năng chấm AI bị vô hiệu với thông báo rõ ràng | | | Blocker |

### 3.1 M0 — Tài khoản & Onboarding *(FR-01 → FR-08)*

| TC-ID | FR / Tiêu chí chấp nhận | Tiền điều kiện | Bước thực hiện | Dữ liệu | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái | Mức lỗi |
|-------|--------------------------|----------------|----------------|---------|-----------------|-----------------|:----------:|---------|
| TC-FR01-02 | FR-01 / AC-01.1 | Email chưa tồn tại | 1) Gửi form đăng ký hợp lệ | `hocvien50@example.com` / `hocKyHieu2026` | HTTP 201; 1 bản ghi `app_user` trạng thái `PENDING_VERIFICATION`; trả `accessToken`; cookie refresh có cờ `HttpOnly; Secure; SameSite=Strict` | | | Critical |
| TC-FR01-03 | FR-01 / AC-01.1 | — | 1) Sau khi đăng ký, truy vấn `SELECT password_hash FROM app_user` | — | Giá trị bắt đầu bằng `$argon2id$`; **không** khớp mật khẩu thô | | | Blocker |
| TC-FR01-04 | FR-01 / AC-01.3 (lỗi) | — | 1) Đăng ký với mật khẩu nằm trong danh sách rò rỉ | `123456789a` | `01102`; không tạo tài khoản | | | Critical |
| TC-FR01-05 | FR-01 / biên | — | 1) Thử mật khẩu **9** ký tự; 2) **10** ký tự; 3) **128**; 4) **129** | `abc12345d` / `abc12345de` / 128 ký tự / 129 ký tự | 9 → `01101`; 10 → OK; 128 → OK; 129 → `01101` | | | Major |
| TC-FR01-06 | FR-01 / biên | — | 1) Tên hiển thị **1** ký tự; 2) **2**; 3) **50**; 4) **51** | — | 1 → lỗi; 2 → OK; 50 → OK; 51 → lỗi | | | Major |
| TC-FR01-07 | FR-01 / AC-01.4 | — | 1) Gửi 6 yêu cầu đăng ký từ cùng IP trong 1 giờ | — | Lần 6: HTTP 429, `00105`, có header `Retry-After` | | | Major |
| TC-FR01-08 | FR-01 / AC-01.5 | Có `onboardingToken` hợp lệ (10 phút/ngày, lý do FAMILY) | 1) Đăng ký kèm token | — | `user_preference.daily_goal_minutes = 10`, `learning_reason = 'FAMILY'` | | | Major |
| TC-FR01-09 | FR-01 / AC-01.3 | — | 1) Gọi API đăng ký với `acceptedTerms: false` | — | `01103`; không tạo tài khoản | | | Major |
| TC-FR01-10 | FR-01 / BR-A03 biên | Có link xác thực email | 1) Bấm link sau **23 giờ 59 phút**; 2) Tạo link khác, bấm sau **24 giờ 01 phút**; 3) Bấm lại link đã dùng | — | (1) thành công → `ACTIVE`; (2) `01401`; (3) `01401` | | | Major |
| TC-FR02-02 | FR-02 / AC-02.1 | Tài khoản `ACTIVE` | 1) Đăng nhập đúng | — | 200; thêm 1 `login_history` với `result='SUCCESS'`; **`ip_hash` là chuỗi băm, không phải IP thô** | | | Critical |
| TC-FR02-03 | FR-02 / AC-02.3 | — | 1) Sai mật khẩu 5 lần; 2) Lần 6 nhập **đúng** mật khẩu | — | Lần 6 vẫn bị chặn `01202`; có email cảnh báo trong `email_outbox` | | | Critical |
| TC-FR02-04 | FR-02 / AC-02.4 | Có refresh token hợp lệ | 1) Dùng refresh token → nhận token mới; 2) Dùng **lại** token cũ | — | Lần 2: `01204`; **toàn bộ** refresh token của người dùng bị thu hồi | | | Blocker |
| TC-FR02-05 | FR-02 / 2c | Tài khoản `SUSPENDED` | 1) Đăng nhập đúng mật khẩu | — | `01203` | | | Major |
| TC-FR02-06 | FR-02 / 2d | Tài khoản `PENDING_DELETION` trong 30 ngày | 1) Đăng nhập; 2) Chọn "Khôi phục" | — | `pendingDeletion: true`; sau khi khôi phục → `ACTIVE` | | | Major |
| TC-FR03-01 | FR-03 / AC-03.1 | Email Google trùng tài khoản mật khẩu đã có, đã học 12 bài | 1) Đăng nhập bằng Google | — | **Không** tạo tài khoản thứ hai; `auth_identity` thêm 1 dòng; tiến độ 12 bài còn nguyên | | | Critical |
| TC-FR03-02 | FR-03 / AC-03.2 | — | 1) Sửa tham số `state` ở callback | — | `01301`; không phát hành token | | | Blocker |
| TC-FR03-03 | FR-03 / 2b | Tài khoản Google có `email_verified = false` | 1) Đăng nhập Google | — | `01302` | | | Major |
| TC-FR04-02 | FR-04 / AC-04.2 | Có token đặt lại hợp lệ | 1) Đặt lại mật khẩu thành công; 2) Dùng **lại** cùng token | — | Lần 2: `01401` | | | Critical |
| TC-FR04-03 | FR-04 / AC-04.3 | Đang đăng nhập trên 3 thiết bị | 1) Đặt lại mật khẩu | — | Cả 3 phiên bị vô hiệu; `refresh_token.revoked_at` được set | | | Critical |
| TC-FR04-04 | FR-04 / biên | — | 1) Dùng token đặt lại sau **59 phút**; 2) sau **61 phút** | — | (1) OK; (2) `01401` | | | Major |
| TC-FR04-05 | FR-04 / BR-A05 | — | 1) Truy vấn `SELECT * FROM password_reset_token` | — | Chỉ có `token_hash` (64 ký tự hex); **không** có token thô | | | Blocker |
| TC-FR05-01 | FR-05 / AC-05.1 | — | 1) Chạy hết 11 bước với 10 phút/ngày và lý do `FAMILY` | — | `user_preference` mang đúng 2 giá trị này | | | Critical |
| TC-FR05-02 | FR-05 / AC-05.2 | Đang ở bước 6 | 1) Bấm ← ba lần về bước 3; 2) Tiến lại tới bước 6 | — | Lựa chọn ở bước 2 và bước 4 **vẫn giữ nguyên** | | | Major |
| TC-FR05-03 | FR-05 / AC-05.3 | Bỏ dở ở bước 7 | 1) Đóng trình duyệt; 2) Mở lại sau 2 giờ, cùng trình duyệt | — | Vào đúng bước 7, lựa chọn cũ còn nguyên | | | Major |
| TC-FR05-04 | FR-05 / AC-05.4 (biên) | Bỏ dở ở bước 7 | 1) Mở lại sau **25 giờ** | — | Bắt đầu lại từ bước 1; hiện chú thích phiên hết hạn | | | Major |
| TC-FR05-05 | FR-05 / 4a, 6a | Ở bước 4 và bước 6 | 1) Chưa chọn gì, quan sát nút "Tiếp" | — | Nút **disable**, **không** hiện lỗi đỏ | | | Minor |
| TC-FR05-06 | FR-05 / 8a | Mô phỏng lỗi khi dựng lộ trình | 1) Chạy tới bước 8 | — | Dùng lộ trình mặc định; **không chặn** người dùng; có cảnh báo trong log | | | Major |
| TC-FR06-01 | FR-06 / AC-06.1 | Đã đăng nhập | 1) Đổi email nhưng nhập **sai** mật khẩu hiện tại | — | `01601`; email không đổi | | | Critical |
| TC-FR06-02 | FR-06 / AC-06.2 | Đăng nhập trên 2 thiết bị | 1) Đổi mật khẩu ở thiết bị A | — | Thiết bị B bị đăng xuất; thiết bị A **vẫn dùng được** | | | Critical |
| TC-FR06-03 | FR-06 / AC-06.3 | — | 1) Đổi tên tệp `payload.html` thành `avatar.jpg`, tải lên | Nội dung thật là HTML | `01602`; **không** lưu tệp | | | Blocker |
| TC-FR06-04 | FR-06 / biên | — | 1) Tải ảnh **2,0 MB**; 2) Tải ảnh **2,1 MB** | JPEG hợp lệ | (1) OK; (2) `01602` | | | Major |
| TC-FR06-05 | FR-06 / BR PII | — | 1) Tải ảnh có EXIF chứa toạ độ GPS; 2) Tải ảnh đã lưu về, đọc EXIF | — | **Không còn** EXIF/GPS | | | Major |
| TC-FR06-06 | FR-06 / đổi email | — | 1) Đổi email đúng quy trình | — | Thư xác nhận gửi tới **email mới** *và* thông báo gửi tới **email cũ** | | | Major |
| TC-FR07-01 | FR-07 / AC-07.1 | Có 40 bài hoàn thành, 3 Award, 5 Curiosity | 1) Đặt lại tiến độ, gõ `RESET` | — | 0 bài hoàn thành; **vẫn còn đủ 3 Award và 5 Curiosity** | | | Critical |
| TC-FR07-02 | FR-07 / AC-07.2 | — | 1) Gõ `reset` (chữ thường) | — | Nút xác nhận vẫn **disable** | | | Major |
| TC-FR07-03 | FR-07 / BR-A08 | Đang học 2 khoá A và B | 1) Đặt lại tiến độ khoá A | — | Tiến độ khoá B **không đổi** | | | Critical |
| TC-FR08-01 | FR-08 / AC-08.1 | Đang đăng nhập 2 thiết bị | 1) Yêu cầu xoá tài khoản | — | Trạng thái `PENDING_DELETION`; **mọi** refresh token bị thu hồi; có `audit_log` | | | Critical |
| TC-FR08-02 | FR-08 / AC-08.2 | Tài khoản `PENDING_DELETION` đã quá 30 ngày | 1) Chạy job xoá; 2) Tìm email/tên trong mọi bảng và trong log | — | Không tìm thấy email/tên ở đâu; `payment_transaction` **vẫn còn** ở dạng ẩn danh | | | Blocker |
| TC-FR08-03 | FR-08 / BR-A10 | `PENDING_DELETION` ngày thứ 29 | 1) Đăng nhập, chọn khôi phục | — | Về `ACTIVE`; dữ liệu học còn nguyên | | | Critical |

### 3.2 M1–M2 — Nội dung, Học & Bài tập *(FR-09 → FR-16)*

| TC-ID | FR / Tiêu chí chấp nhận | Tiền điều kiện | Bước thực hiện | Dữ liệu | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái | Mức lỗi |
|-------|--------------------------|----------------|----------------|---------|-----------------|-----------------|:----------:|---------|
| TC-FR09-01 | FR-09 / AC-09.1 | Bài 3 chưa hoàn thành | 1) Gọi `GET /lessons/{id bài 4}` bằng URL trực tiếp | — | Bị chặn **ở backend**: `03201`/`00403`; giao diện đưa về lộ trình | | | Blocker |
| TC-FR09-02 | FR-09 / AC-09.2 | Tài khoản Free | 1) Xem lộ trình | — | Bài Premium **vẫn hiện tên** kèm biểu tượng khoá | | | Major |
| TC-FR09-03 | FR-09 / AC-09.3 | Vừa hoàn thành bài 5 | 1) Tải lại trang | — | `nextLessonId` = bài 6; nút "Tiếp tục học" trỏ đúng | | | Critical |
| TC-FR09-04 | FR-09 / BR-A13 | Unit 1 còn 1 bài chưa xong | 1) Mở bài mốc của Unit 1 | — | Bị chặn; thông báo "Hoàn thành toàn bộ bài trong Unit…" | | | Major |
| TC-FR10-01 | FR-10 / AC-10.1 | Khoá A đang ở bài 12 | 1) Đổi sang khoá B; 2) Học 1 bài; 3) Quay lại khoá A | — | Khoá A vẫn ở bài 12, tiến độ nguyên vẹn | | | Critical |
| TC-FR11-01 | FR-11 / AC-11.1 | Đang xem video bài học | 1) Bấm nút 🐢 | — | Tốc độ 0.5×; hình **không biến dạng**, không đổi cao độ | | | Major |
| TC-FR11-02 | FR-11 / AC-11.2 | Đã chọn 0.5× ở bài trước | 1) Mở bài mới | — | Vẫn là 0.5× (`user_preference.video_speed`) | | | Major |
| TC-FR11-03 | FR-11 / AC-11.3 | Có URL video đã ký | 1) Mở URL sau **14 phút**; 2) Mở sau **16 phút** | — | (1) phát được; (2) 403 | | | Blocker |
| TC-FR11-04 | FR-11 / AC-11.4 | Đang xem video | 1) Giới hạn băng thông xuống 1 Mbps bằng DevTools | — | Tự hạ độ phân giải; **không dừng quá 2 giây** | | | Major |
| TC-FR11-05 | FR-11 / BR-A16 | — | 1) Tắt hoàn toàn âm thanh; 2) Làm trọn 1 bài học | — | **Không mất** bất kỳ thông tin nào | | | Blocker |
| TC-FR12-04 | FR-12 / AC-12.1 | Bài học 10 câu | 1) Trả lời đúng 8 câu ngay lần đầu | — | `best_score_percent = 80`; `first_try_perfect = false`; **không** cộng Freeze | | | Critical |
| TC-FR12-05 | FR-12 / AC-12.2 | Freeze hiện tại = 1 | 1) Hoàn thành bài 10/10 đúng lần đầu | — | Freeze = 2; `freezeEarned = 1` | | | Critical |
| TC-FR12-06 | FR-12 / AC-12.5 | — | 1) Trả lời **sai** câu 3; 2) Tiếp tục tới hết bài | — | Câu 3 xuất hiện lại trước khi kết thúc, **tối đa 2 lần** | | | Major |
| TC-FR12-07 | FR-12 / AC-12.6 | Câu `FINGERSPELL_RECOGNITION` | 1) Từ chối quyền camera | — | Chuyển chế độ tự đánh giá; **bài học vẫn hoàn thành được** | | | Critical |
| TC-FR12-08 | FR-12 / AC-12.7 | Bài tập `TYPE_WHAT_YOU_SEE`, đáp án `xin chào` | 1) Gõ `"  Xin CHÀO! "` | — | Chấm **đúng** | | | Major |
| TC-FR12-09 | FR-12 / biên | Bài tập `TYPE_WHAT_YOU_SEE` | 1) Gõ **200** ký tự; 2) Gõ **201** ký tự | — | (1) nhận; (2) lỗi validate | | | Major |
| TC-FR12-10 | FR-12 / 3a | Đang làm bài tập | 1) Ngắt mạng; 2) Trả lời 3 câu; 3) Nối mạng lại | — | 3 câu được lưu tạm rồi đồng bộ; **không mất** lượt trả lời | | | Critical |
| TC-FR12-11 | FR-12 / validate | — | 1) Gửi `selectedOptionId` là UUID của bài tập **khác** | — | `03101` hoặc `03102`; không ghi lượt | | | Major |
| TC-FR12-12 | FR-12 / BR-A22 (biên) | Bài `FINGERSPELL_RECOGNITION` | 1) Gửi `recognitionScore = 0.79`; 2) `0.80`; 3) `0.81` | — | (1) sai; (2) đúng; (3) đúng | | | Major |
| TC-FR13-01 | FR-13 / AC-13.1 | Quiz 10 câu | 1) Đúng 7/10 | — | Không đạt; chương **chưa** `COMPLETED`; hiện danh sách ký hiệu cần ôn | | | Critical |
| TC-FR13-02 | FR-13 / biên | Quiz 10 câu | 1) Đúng **8**/10 | — | **Đạt** (ngưỡng 80%); chương `COMPLETED` | | | Critical |
| TC-FR13-03 | FR-13 / AC-13.2 | Đã làm quiz lần 1 | 1) Làm lại lần 2 | — | Thứ tự và bộ câu **khác** lần 1 | | | Major |
| TC-FR13-04 | FR-13 / BR-A25 | Đang làm quiz | 1) Quan sát sau mỗi câu | — | **Không** hiện đáp án đúng cho tới khi nộp xong toàn bài | | | Major |
| TC-FR14-01 | FR-14 / AC-14.1 | Lần 1 đạt 4 sao | 1) Làm lại, đạt 2 sao | — | Vẫn hiển thị **4 sao**; `best_stars = 4` | | | Critical |
| TC-FR14-02 | FR-14 / AC-14.2 (biên) | — | 1) Đạt lần lượt 59%, 60%, 69%, 70%, 79%, 80%, 89%, 90% | — | Sao lần lượt: 1, 2, 2, 3, 3, 4, 4, **5** | | | Major |
| TC-FR15-01 | FR-15 / AC-15.1 | Bài học có gắn Curiosity | 1) Hoàn thành bài | — | Curiosity mở; hiện ở bộ sưu tập | | | Major |
| TC-FR15-02 | FR-15 / AC-15.2 | Có Curiosity chưa mở | 1) Gọi `GET /curiosities`, đọc JSON | — | Mục chưa mở **không** có `title`/`content`, chỉ có `lockedCount` | | | Blocker |
| TC-FR15-03 | FR-15 / BR-A28 | Đã mở Curiosity của bài X | 1) Học lại bài X | — | **Không** mở lại, không cộng trùng | | | Minor |
| TC-FR16-01 | FR-16 / AC-16.1 | — | 1) Gọi `POST /lessons/{id}/complete` **3 lần** với cùng `idempotencyKey` | `activeSeconds = 300` | Thời lượng cộng **một lần**; streak tăng **một lần**; 1 dòng `lesson_completion` | | | Blocker |
| TC-FR16-02 | FR-16 / AC-16.2 | Mô phỏng lỗi ở bước cập nhật Award | 1) Hoàn thành bài | — | **Rollback toàn bộ**: `user_lesson_state` không đổi, `daily_activity` không đổi | | | Blocker |
| TC-FR16-03 | FR-16 / BR-A46 (biên) | — | 1) Gửi `activeSeconds = 1800` (30 phút) | — | `effectiveMinutes` bị áp trần **15 phút** | | | Major |

### 3.3 M3 — Luyện tập *(FR-17 → FR-20)*

| TC-ID | FR / Tiêu chí chấp nhận | Tiền điều kiện | Bước thực hiện | Dữ liệu | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái | Mức lỗi |
|-------|--------------------------|----------------|----------------|---------|-----------------|-----------------|:----------:|---------|
| TC-FR17-01 | FR-17 / AC-17.1 | Ký hiệu X chưa từng ôn | 1) Trả lời **đúng** lần đầu | — | `interval_days = 1`; `due_at` = hôm nay + 1 ngày; `repetition_count = 1` | | | Critical |
| TC-FR17-02 | FR-17 / AC-17.2 | X đã đúng 2 lần (interval 1 → 6) | 1) Trả lời đúng lần 3 | `ease_factor = 2.5` | `interval_days = 15` (6 × 2.5) | | | Critical |
| TC-FR17-03 | FR-17 / AC-17.3 | X có `ease_factor = 2.5`, `interval = 15` | 1) Trả lời **sai** | — | `interval_days = 1`; `repetition_count = 0`; `ease_factor = 2.30` | | | Critical |
| TC-FR17-04 | FR-17 / AC-17.3 biên | X có `ease_factor = 1.30` | 1) Trả lời sai | — | `ease_factor` **vẫn = 1.30** (không xuống dưới sàn) | | | Major |
| TC-FR17-05 | FR-17 / AC-17.4 | Tài khoản Free đã luyện 1 phiên hôm nay | 1) Mở phiên thứ 2 | — | `06201`; điều hướng SCR-22 | | | Critical |
| TC-FR17-06 | FR-17 / BR-A32 | Có 50 ký hiệu đến hạn | 1) Bắt đầu phiên | — | Trả đúng **20** ký hiệu, ưu tiên `due_at` sớm nhất | | | Major |
| TC-FR17-07 | FR-17 / BR-A34 | Mục tiêu 10 phút, chưa học bài nào hôm nay | 1) Luyện Trainer 11 phút | — | `daily_activity.goal_met = true` (Trainer **có** tính vào mục tiêu) | | | Critical |
| TC-FR18-04 | FR-18 / AC-18.2 | Camera đã bật | 1) Tạo hình tay đúng, điểm 0.85, giữ **1,2 giây** | Chữ "A" | Báo đúng; ghi 1 `fingerspell_attempt` | | | Critical |
| TC-FR18-05 | FR-18 / AC-18.3 | Camera đã bật | 1) Để điểm dao động 0.9 → 0.4 → 0.9 trong 0,5 giây | — | **Chưa** báo đúng (yêu cầu ổn định ≥ 1 giây) | | | Major |
| TC-FR18-06 | FR-18 / AC-18.4 | — | 1) Từ chối quyền camera; 2) Tiếp tục trong cùng phiên | — | Vào chế độ tự đánh giá; **không** bị hỏi quyền lần hai | | | Major |
| TC-FR18-07 | FR-18 / AC-18.5 | Camera đang bật | 1) Chuyển sang tab khác **31 giây**; 2) Quay lại | — | Đèn camera đã **tắt**; có nút "Bật lại camera" | | | Critical |
| TC-FR18-08 | FR-18 / 2b | Thiết bị **không có** camera | 1) Mở Trainer đánh vần | — | Vào thẳng chế độ tự đánh giá, **không** hiện lời nhắc quyền | | | Major |
| TC-FR18-09 | FR-18 / 2c | Trình duyệt không hỗ trợ WASM SIMD | 1) Mở Trainer đánh vần | — | Chế độ tự đánh giá + gợi ý đổi trình duyệt; **không** màn hình trắng | | | Major |
| TC-FR18-10 | FR-18 / BR-A38 | Lần đầu dùng | 1) Mở Trainer đánh vần | — | Màn giải thích hiện **TRƯỚC** khi trình duyệt hỏi quyền | | | Major |
| TC-FR18-11 | FR-18 / NFR-04 | Máy Android tầm trung 4 năm tuổi | 1) Đo FPS suy luận trong 60 giây | — | ≥ **15 khung hình/giây**; mô hình tải ≤ 5 MB và được cache lần sau | | | Critical |
| TC-FR18-12 | FR-18 / validate | — | 1) Gửi `letter = "Ω"` (không thuộc bảng chữ cái khoá) | — | `00101` | | | Major |
| TC-FR19-01 | FR-19 / AC-19.1 | Số thuộc nhóm hình tay **chuyển động** | 1) Mở bài luyện số đó | — | **Không** hiện chế độ chấm bằng camera | | | Major |
| TC-FR20-02 | FR-20 / AC-20.2 | Đang ở chế độ Gương | 1) Bấm nút lật | — | Hình camera đảo chiều ngang; video mẫu **không** đổi | | | Minor |
| TC-FR20-03 | FR-20 / BR-A94 | Đang ở chế độ Gương | 1) Rà toàn bộ giao diện | — | **Không có** nút ghi hình / tải xuống / tải lên ở bất kỳ đâu | | | Blocker |

### 3.4 M4–M5 — Từ điển, Tiến độ & Gamification *(FR-21 → FR-27)*

| TC-ID | FR / Tiêu chí chấp nhận | Tiền điều kiện | Bước thực hiện | Dữ liệu | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái | Mức lỗi |
|-------|--------------------------|----------------|----------------|---------|-----------------|-----------------|:----------:|---------|
| TC-FR21-01 | FR-21 / AC-21.1 | Có ký hiệu "chào" đã xuất bản | 1) Tìm với từ khoá `chao` (không dấu) | — | Trả về ký hiệu "chào" | | | Critical |
| TC-FR21-02 | FR-21 / AC-21.2 | Khách (chưa đăng nhập) | 1) Tra 10 lượt; 2) Tra lần 11 | — | Lần 11: `04201` + lời mời đăng ký | | | Major |
| TC-FR21-03 | FR-21 / AC-21.3 | Có ký hiệu trạng thái `DRAFT` | 1) Tìm đúng từ khoá của nó | — | **Không** xuất hiện trong kết quả | | | Blocker |
| TC-FR21-04 | FR-21 / AC-21.4 (biên) | — | 1) Gọi với `size = 0`; 2) `size = 1`; 3) `size = 50`; 4) `size = 51`; 5) `size = 500` | — | (1) mặc định 20; (2) 1; (3) 50; (4)(5) **ép về 50, không lỗi** | | | Major |
| TC-FR21-05 | FR-21 / gợi ý | — | 1) Tìm `xim chao` (sai chính tả) | — | `suggestions[]` gợi ý "xin chào" | | | Minor |
| TC-FR21-06 | FR-21 / biên | — | 1) `q` = 100 ký tự; 2) `q` = 101 ký tự | — | (1) OK; (2) lỗi validate | | | Minor |
| TC-FR21-07 | FR-21 / NFR-10 | Đã đăng nhập | 1) Gửi 61 yêu cầu tìm kiếm trong 1 phút | — | Yêu cầu 61: HTTP 429, `00105` | | | Major |
| TC-FR22-01 | FR-22 / AC-22.1 | Ký hiệu có 3 biến thể đã xuất bản | 1) Mở chi tiết | — | Hiện **đủ 3** biến thể, mỗi cái có nhãn vùng/người ký hiệu | | | Major |
| TC-FR23-01 | FR-23 / AC-23.1 | Mục tiêu 10 phút; hôm qua đã đạt; streak = 4 | 1) Hôm nay học 11 phút | — | streak = **5** | | | Critical |
| TC-FR23-02 | FR-23 / AC-23.2 | Hôm qua không học; Freeze = 2; streak = 7 | 1) Chạy tiến trình nửa đêm | — | streak = **7**; Freeze = **1**; có `streak_event(FREEZE_USED)`; có email | | | Critical |
| TC-FR23-03 | FR-23 / AC-23.3 | Hôm qua không học; Freeze = 0; streak = 7; kỷ lục = 9 | 1) Chạy tiến trình nửa đêm | — | streak = **0**; kỷ lục **vẫn 9** | | | Critical |
| TC-FR23-04 | FR-23 / AC-23.4 | Hôm qua không học; Freeze = 0; streak = 12; kỷ lục = 9 | 1) Chạy tiến trình nửa đêm | — | streak = **0**; kỷ lục = **12** | | | Critical |
| TC-FR23-05 | FR-23 / AC-23.5 | Mục tiêu 10 phút | 1) Mở tab bài học, **không thao tác** 3 giờ | — | Cộng tối đa **1 phút**; mục tiêu **chưa** đạt | | | Critical |
| TC-FR23-06 | FR-23 / AC-23.6 (biên) | Freeze = 3 | 1) Hoàn thành thêm 1 bài 100% đúng | — | Freeze **vẫn = 3** (trần) | | | Major |
| TC-FR23-07 | FR-23 / AC-23.7 | Người dùng múi giờ UTC+7 | 1) Học lúc **23:50 ngày 20/09** giờ địa phương | — | Tính cho **ngày 20/09**, không phải 21/09 | | | Critical |
| TC-FR23-08 | FR-23 / BR-A48 | Người dùng múi giờ UTC-5 và UTC+7 | 1) Chạy tiến trình nửa đêm theo giờ UTC | — | Mỗi người được xử lý đúng **múi giờ của mình**, không lệch ngày | | | Critical |
| TC-FR24-01 | FR-24 / AC-24.1 | Mục tiêu 20 phút; hôm nay học 6 phút | 1) Hạ mục tiêu xuống 5 phút lúc 23:00 | — | Hôm nay **vẫn** tính theo 20 phút → chưa đạt; mục tiêu mới áp dụng từ **ngày mai** | | | Critical |
| TC-FR25-01 | FR-25 / AC-25.1 | — | 1) Hoàn thành bài A 100% **ba lần** | — | `ZERO_MISS_WIZ` chỉ đếm **1** | | | Critical |
| TC-FR25-02 | FR-25 / AC-25.2 | `streak_longest = 30`, Award cấp tương ứng | 1) Mất streak về 0 | — | `STREAK_GUARDIAN` **vẫn** ở mốc 30 | | | Critical |
| TC-FR25-03 | FR-25 / AC-25.3 | Vừa lên cấp Award | 1) Xem màn chúc mừng; 2) Tải lại trang | — | **Không** hiện lại màn chúc mừng | | | Major |
| TC-FR25-04 | FR-25 / biên | `SIGNING_ENTHUSIAST` đang ở 14 bài | 1) Hoàn thành bài thứ **15** | — | Lên cấp đúng mốc 15 | | | Major |
| TC-FR26-01 | FR-26 / AC-26.1 | Đang học khoá B | 1) Mở trang tiến độ | — | Tên khoá B hiển thị **ở đầu trang**, dễ thấy | | | Major |
| TC-FR26-02 | FR-26 / AC-26.2 | Học 5 ngày trong 7 ngày qua | 1) Xem biểu đồ 7 ngày | — | Đúng 5 cột có giá trị, 2 cột bằng 0 | | | Major |
| TC-FR27-01 | FR-27 / AC-27.1 | Tài khoản Free | 1) Bấm tải chứng chỉ | — | `06202`; hiện màn Premium | | | Critical |
| TC-FR27-02 | FR-27 / AC-27.2 | Premium, chương X **chưa** hoàn thành | 1) Gọi API tạo chứng chỉ cho chương X | — | `05201` | | | Critical |
| TC-FR27-03 | FR-27 / AC-27.3 | Có chứng chỉ hợp lệ | 1) Mở trang xác minh bằng mã | — | Hiện tên khoá + phần hoàn thành + ngày; **không** lộ email | | | Blocker |
| TC-FR27-04 | FR-27 / BR-A58 | — | 1) Mở file PDF chứng chỉ | — | Có dòng "chứng nhận hoàn thành khoá học, không phải chứng chỉ thông dịch" | | | Major |
| TC-FR27-05 | FR-27 / i18n | — | 1) Xuất chứng chỉ tên "Nguyễn Thị Ánh Nguyệt" | — | PDF hiển thị **đúng dấu tiếng Việt**, không lỗi font | | | Major |

### 3.5 ~~M6 — Thanh toán~~ → **đã thay bằng §3.6c**

> ⚠️ **Bộ case thanh toán của v0.1 đã bị loại bỏ hoàn toàn ở v0.2.** Chúng được viết cho mô hình *thuê bao
> tự động gia hạn* (Stripe-style) với các khái niệm **không còn tồn tại**: `auto_renew`, "huỷ gia hạn",
> `CANCELLED_AT_PERIOD_END`, `06104`, webhook có `X-Timestamp`.
>
> Bộ case thay thế, viết theo đúng **VNPay + MoMo**, nằm ở **§3.6c**.

### 3.6 M7–M9 — CMS, Marketing, Nền tảng *(FR-33 → FR-40)*

| TC-ID | FR / Tiêu chí chấp nhận | Tiền điều kiện | Bước thực hiện | Dữ liệu | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái | Mức lỗi |
|-------|--------------------------|----------------|----------------|---------|-----------------|-----------------|:----------:|---------|
| TC-FR33-01 | FR-33 / AC-33.1 (biên) | Đăng nhập `editor@example.com` | 1) Tải video **99 MB**; 2) Tải video **120 MB** | MP4 hợp lệ | (1) nhận; (2) `07101`, **không** lưu tệp | | | Major |
| TC-FR33-02 | FR-33 / AC-33.2 | Ký hiệu đang dùng trong bài học đã xuất bản | 1) Bấm xoá ký hiệu | — | `07201` + **danh sách bài học đang dùng** | | | Critical |
| TC-FR33-03 | FR-33 / AC-33.3 | Video vừa tải, đang `TRANSCODING` | 1) Thử gửi duyệt ký hiệu | — | Bị chặn; nút gửi duyệt **disable** | | | Major |
| TC-FR33-04 | FR-33 / biên | — | 1) Tải video dài **61 giây** | — | `07101` | | | Major |
| TC-FR33-05 | FR-33 / bảo mật | — | 1) Tải tệp `.mp4` nhưng nội dung là ELF/EXE | — | Bị từ chối (kiểm magic bytes) | | | Blocker |
| TC-FR34-01 | FR-34 / AC-34.1 | Bài tập trắc nghiệm chỉ có **3** lựa chọn | 1) Xuất bản bài học | — | `07202` + chỉ rõ bài tập lỗi | | | Critical |
| TC-FR34-02 | FR-34 / AC-34.2 | Người học đã xong bài ở vị trí 5 | 1) Biên tập đổi bài đó xuống vị trí 8 | — | Bài đó **vẫn** `COMPLETED` với người học | | | Critical |
| TC-FR34-03 | FR-34 / validate | — | 1) Tạo bài tập trắc nghiệm có **2** đáp án đúng | — | Bị chặn khi xuất bản | | | Major |
| TC-FR35-01 | FR-35 / AC-35.1 | Đăng nhập `editor@example.com` | 1) Gọi thẳng `POST /cms/content/lesson/{id}/approve` | — | `00403` — **kể cả khi giao diện lộ nút** | | | Blocker |
| TC-FR35-02 | FR-35 / AC-35.2 | Người học đang làm dở bài X | 1) Approver gỡ xuất bản bài X; 2) Người học nộp bài | — | Người học **vẫn hoàn thành được**; bài không hiện với người mới | | | Major |
| TC-FR35-03 | FR-35 / BR-A80 | — | 1) Duyệt một nội dung | — | `content_audit_log` ghi ai, khi nào, từ trạng thái nào sang trạng thái nào | | | Major |
| TC-FR36-01 | FR-36 / AC-36.1 | Đăng nhập `support@example.com` | 1) Gọi `GET /support/users` **không** kèm email chính xác | — | `00403` — không cho liệt kê toàn bộ | | | Blocker |
| TC-FR36-02 | FR-36 / AC-36.2 | — | 1) Cấp Premium bù, **bỏ trống** lý do | — | `07103`; **không** thực hiện | | | Critical |
| TC-FR36-03 | FR-36 / AC-36.3 | — | 1) Bấm "Hiện đầy đủ" email người dùng | — | Có bản ghi `audit_log` tương ứng | | | Major |
| TC-FR36-04 | FR-36 / BR-A82 | — | 1) Thử mọi cách xem mật khẩu người dùng qua giao diện/API CSKH | — | **Không** có đường nào lộ mật khẩu | | | Blocker |
| TC-FR37-01 | FR-37 / AC-37.1 | — | 1) Tắt JavaScript; 2) Mở 1 bài blog | — | **Đọc được toàn bộ** nội dung chữ | | | Major |
| TC-FR37-02 | FR-37 / AC-37.2 | Lần đầu vào trang | 1) **Chưa** bấm đồng ý cookie; 2) Xem tab Network | — | **Không** request nào tới dịch vụ phân tích/quảng cáo | | | Blocker |
| TC-FR37-03 | FR-37 / BR-A85 | — | 1) Xem mã nguồn trang blog | — | Có thẻ meta, Open Graph, dữ liệu có cấu trúc `VideoObject`; có sitemap | | | Minor |
| TC-FR38-01 | FR-38 / AC-38.1 | — | 1) Gửi 4 form từ cùng IP trong 1 giờ | — | Lần 4: HTTP 429 | | | Major |
| TC-FR38-02 | FR-38 / AC-38.2 | — | 1) Gửi `message` chứa `<script>alert(1)</script>`; 2) Mở ở trang quản trị | — | Hiển thị dạng **văn bản thuần**; script **không** chạy | | | Blocker |
| TC-FR38-03 | FR-38 / biên | — | 1) `seatCount = 0`; 2) `= 1`; 3) `= 100000`; 4) `= 100001` | — | (1)(4) lỗi validate; (2)(3) OK | | | Minor |
| TC-FR39-01 | FR-39 / AC-39.1 | Đã đạt mục tiêu lúc 10:00 | 1) Tới giờ nhắc 20:00 theo múi giờ người dùng | — | **Không** gửi email nhắc học | | | Major |
| TC-FR39-02 | FR-39 / AC-39.2 | — | 1) Bấm ngừng nhận email nhắc học; 2) Mua Premium | — | Không còn email nhắc học; **vẫn** nhận email hoá đơn | | | Major |
| TC-FR39-03 | FR-39 / BR-A88 | — | 1) Kiểm số email nhắc gửi trong 1 ngày | — | Tối đa **1 email/ngày** | | | Minor |
| TC-FR40-03 | FR-40 / AC-40.2 | — | 1) Gây 1 request lỗi; 2) Tra theo `traceId` | — | Dựng lại được **toàn bộ** chuỗi xử lý | | | Major |

### 3.6b 🤖 M10 — AI nhận diện ký hiệu động *(FR-41 → FR-46)*

| TC-ID | FR / Tiêu chí chấp nhận | Tiền điều kiện | Bước thực hiện | Dữ liệu | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái | Mức lỗi |
|-------|--------------------------|----------------|----------------|---------|-----------------|-----------------|:----------:|---------|
| TC-FR41-07 | FR-41 / AC-41.1 | Ký hiệu "Cái bàn" có trong vốn AI | 1) Thực hiện đúng ký hiệu; 2) Kết thúc | Tensor thật từ webcam | `verified = true`, `status = ok`; ghi 1 `sign_attempt` kèm `confidence` | | | Critical |
| TC-FR41-08 | FR-41 / AC-41.2 | Ký hiệu **ngoài** 30 nhãn (ví dụ "Xin chào") | 1) Mở trang chi tiết ký hiệu đó | — | **Không** có nút "Luyện với AI"; chỉ có chế độ Gương + chú thích "chưa có chấm tự động" | | | Critical |
| TC-FR41-09 | FR-41 / AC-41.2 | Như trên | 1) Gọi thẳng `POST /ai/attempts` với `targetSignId` đó | — | `10201` | | | Blocker |
| TC-FR41-10 | FR-41 / AC-41.3 | Đang luyện "Cái bàn" | 1) Cố tình thực hiện ký hiệu "Cái cửa" | — | `status = wrong_target`; phản hồi **nêu tên** "Cái cửa"; có `top3` | | | Critical |
| TC-FR41-11 | FR-41 / AC-41.4 (biên) | Bật giả lập trả top1 = 0.30, top2 = 0.29 | 1) Luyện 1 lượt | biên = 0.01 < 0.03 | `status = uncertain_intent`; `verified = false` | | | Critical |
| TC-FR41-12 | FR-41 / BR-A112 (biên) | `confidence_threshold = 0.55` | 1) Giả lập `confidence` lần lượt 0.54 · 0.55 · 0.56 với nhãn **đúng** | — | 0.54 → `low_confidence`; **0.55 và 0.56 → `ok`** | | | Critical |
| TC-FR41-13 | FR-41 / AC-41.7 | Tài khoản có streak = 5, sao mốc = 12 | 1) Thử sai ký hiệu **5 lần liên tiếp**; 2) Kiểm trang tiến độ | — | streak **vẫn 5**, sao **vẫn 12**; ký hiệu đó có `due_at` sớm hơn trước | | | Critical |
| TC-FR41-14 | FR-41 / AC-41.8 | — | 1) Mở SCR-31; 2) Rà toàn bộ nội dung chữ trên màn | — | Thấy **cả hai**: "không phải thông dịch viên" **và** dòng ghi nguồn VSL400 CC BY 4.0 | | | Critical |
| TC-FR41-15 | FR-41 / BR-A115 | Bài mốc có chứa bước `SIGN_PERFORMANCE` | 1) Làm bài mốc, cố tình để bước AI sai; 2) Kiểm số sao | — | Bước AI **không ảnh hưởng** số sao của bài mốc | | | Major |
| TC-FR41-16 | FR-41 / validate biên | — | 1) Gửi tensor kích thước 63×327; 2) 64×326; 3) **64×327**; 4) 65×327 | — | (1)(2)(4) → `10102`; (3) → xử lý bình thường | | | Critical |
| TC-FR41-17 | FR-41 / AC-44.4 | Client gửi `modelVersion` cũ | 1) Gọi `POST /ai/attempts` | `vsl-mvp30-v1` | `10101` + yêu cầu tải lại trang | | | Major |
| TC-FR42-01 | FR-42 / AC-42.1 | Camera bật, **để tay ngoài khung** | 1) Bấm "Bắt đầu quay"; 2) Giữ 3 giây; 3) Bấm "Kết thúc"; 4) Theo dõi Network | — | `no_hand` hiển thị **tại chỗ**; **KHÔNG** có request `POST /ai/attempts`; hạn mức **không** giảm | | | Critical |
| TC-FR42-02 | FR-42 / AC-42.2 (biên) | Đang ghi | 1) Ghi liên tục **6 giây** | — | Tự dừng ở **5 giây**, xử lý phần đã thu | | | Major |
| TC-FR42-03 | FR-42 / AC-42.3 | Đang ghi | 1) Quan sát giao diện | — | Có đồng hồ đếm thời lượng đang chạy | | | Minor |
| TC-FR42-04 | FR-42 / AC-42.4 (biên) | — | 1) Thu **7** khung hữu ích; 2) Thu **8** khung | — | 7 → `not_enough_frames` + gợi ý "trong khoảng hai giây"; 8 → xử lý bình thường | | | Major |
| TC-FR42-05 | FR-42 / bảng trạng thái | — | 1) Lần lượt tạo 7 trạng thái ở bảng FR-42; 2) Kiểm cột `counted_against_quota` | — | Đúng bảng: `ok`/`wrong_target`/`low_confidence`/`uncertain_intent` → trừ; `no_hand`/`too_short`/`service_error` → **không** trừ | | | Critical |
| TC-FR43-01 | FR-43 / AC-43.1 | `wrong_target` | 1) Xem khay kết quả | — | Có tên ký hiệu nhận được **và** danh sách top-3 kèm % | | | Major |
| TC-FR43-02 | FR-43 / AC-43.2 | `handFrameRatio = 0.40` | 1) Xem gợi ý | — | Đúng câu "Đưa bàn tay vào giữa khung hình và đứng cách camera khoảng một sải tay." | | | Major |
| TC-FR43-03 | FR-43 / AC-43.3 | Thử không thành công **3 lần liên tiếp** | 1) Xem giao diện | — | Hiện đủ **3 lối thoát**: xem lại mẫu · chế độ Gương · bỏ qua | | | Major |
| TC-FR43-04 | FR-43 / AC-43.4 | Bất kỳ phản hồi nào | 1) Rà toàn bộ chuỗi phản hồi; 2) Chụp màn hình ở chế độ đơn sắc | — | **Không** từ ngữ chê trách; kết luận đúng/sai **đọc được khi bỏ màu** (có biểu tượng + chữ) | | | Critical |
| TC-FR43-05 | FR-43 / BR-A121 (biên) | Nhiều vấn đề chất lượng cùng lúc | 1) Quay trong điều kiện vừa tối vừa thiếu tay | — | Hiện **tối đa 2 câu** gợi ý | | | Minor |
| TC-FR44-01 | FR-44 / AC-44.1 | Dịch vụ AI công bố 30 nhãn | 1) Bấm "Đồng bộ" ở SCR-34 | — | `ai_sign_label` có **30 dòng**; mỗi dòng ánh xạ hoặc bị đánh dấu **mồ côi** | | | Critical |
| TC-FR44-02 | FR-44 / AC-44.2 | — | 1) Chạy `stableSignId()` ở backend và `stable_sign_id()` ở dịch vụ AI trên cùng 30 nhãn | "Cái bàn", "Trường Đại học", "Quạt (đứng)", "Ướt" | **Kết quả khớp 100%** giữa hai phía | | | Blocker |
| TC-FR44-03 | FR-44 / AC-44.5 | Có 1 nhãn không ánh xạ được | 1) Xem CMS; 2) Kiểm `GET /ai/capabilities` | — | Nhãn đó hiện trong danh sách mồ côi và **KHÔNG** có trong `recognizableSignIds` | | | Critical |
| TC-FR44-04 | FR-44 / AC-44.3 | — | 1) Đổi cấu hình sang mô hình MVP-50; 2) Khởi động lại container `ai`; 3) Đồng bộ | — | Vốn ký hiệu tăng lên 50 **không** cần build lại backend | | | Major |
| TC-FR45-01 | FR-45 / AC-45.1 | — | 1) Ba người gửi "cảm ơn", "Cảm ơn", "cam on" | — | Gộp thành **1 mục**, `request_count = 3` | | | Major |
| TC-FR45-02 | FR-45 / AC-45.2 (biên) | — | 1) Gửi 10 yêu cầu; 2) Gửi yêu cầu thứ 11 | — | Lần 11: `00105` | | | Minor |
| TC-FR45-03 | FR-45 / AC-45.3 | Ký hiệu được yêu cầu nay đã `PUBLISHED` | 1) Chạy job thông báo | — | Người yêu cầu nhận được thông báo | | | Minor |
| TC-FR46-02 | FR-46 / AC-46.2 | Lần đầu vào SCR-33 | 1) Quan sát công tắc và nội dung | — | Công tắc **mặc định TẮT**; hiện đủ **5 thông tin** của BR-A132, **không** giấu sau "Xem thêm" | | | Blocker |
| TC-FR46-03 | FR-46 / AC-46.3 | Đã góp 12 clip rồi rút lại đồng ý | 1) Rút đồng ý; 2) Chạy job xoá; 3) Kiểm sau 30 ngày | — | **0** bản ghi của người đó trong `donated_clip` và trong bucket | | | Blocker |
| TC-FR46-04 | FR-46 / AC-46.5 | Tài khoản **không** bật góp dữ liệu | 1) Dùng đầy đủ chức năng AI | — | **Không** bị hạn chế gì; không bị nhắc lại quá 1 lần/tháng | | | Critical |
| TC-FR46-05 | FR-46 / AC-46.6 | Đã bật và góp vài clip | 1) Truy vấn `donated_clip` và `data_donation_consent` | — | Bản ghi clip gắn `pseudonym_id`, **không** chứa email/tên/`user_id` trực tiếp | | | Blocker |
| TC-FR46-06 | FR-46 / BR-A136 | Đang bật góp dữ liệu, đang luyện | 1) Quan sát giao diện lúc ghi | — | Có chỉ báo rõ ràng "đang lưu để góp dữ liệu" | | | Major |
| TC-FR46-07 | FR-46 / `10202` | Tài khoản **chưa** đồng ý | 1) Gọi thẳng `POST /ai/donations/clips` | — | `10202`; **không** lưu clip | | | Blocker |

### 3.6c 💳 M6 — Thanh toán VNPay / MoMo *(thay bộ case §3.5 của v0.1)*

| TC-ID | FR / Tiêu chí chấp nhận | Tiền điều kiện | Bước thực hiện | Dữ liệu | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái | Mức lỗi |
|-------|--------------------------|----------------|----------------|---------|-----------------|-----------------|:----------:|---------|
| TC-FR28-04 | FR-28 / AC-28.3 | — | 1) Mở trang giá; 2) Rà nội dung | — | Có câu nêu rõ **"KHÔNG tự động trừ tiền lần sau"**; có ngày hết hạn dự kiến | | | Critical |
| TC-FR29-12 | FR-29 / AC-29.1 | Sandbox VNPay | 1) Mua `PREMIUM_3M` qua VNPay tới khi IPN về | — | `subscription.ACTIVE`, `expires_at` = now + **90 ngày**; vai trò Premium; có email biên nhận | | | Critical |
| TC-FR29-13 | FR-29 / AC-29.1 | Sandbox MoMo | 1) Mua `PREMIUM_1M` qua MoMo | — | Tương tự, **30 ngày** | | | Critical |
| TC-FR29-14 | FR-29 / AC-29.9 | Đang có Premium **còn 40 ngày** | 1) Mua thêm gói 1M | — | `expires_at` mới = cũ **+ 30 ngày** (tổng 70) — **cộng dồn**, không ghi đè | | | Critical |
| TC-FR29-15 | FR-29 / AC-29.8 | — | 1) Gửi IPN hợp lệ nhưng `vnp_Amount` lệch | `vnp_Amount = 100` cho đơn 990.000 | Từ chối; `payment_anomaly(AMOUNT_MISMATCH)`; **không** cấp Premium | | | Blocker |
| TC-FR29-16 | FR-29 / VNPay × 100 | — | 1) Mua gói 990.000 VND; 2) Kiểm `vnp_Amount` trong URL tạo ra | — | `vnp_Amount = 99000000` (**đúng × 100**) | | | Blocker |
| TC-FR29-17 | FR-29 / AC-29.2 | Đã có IPN thành công | 1) Gửi lại **cùng** IPN 3 lần | cùng `vnp_TransactionNo` | Vẫn 1 `subscription`; hạn **không** cộng dồn; trả `RspCode 02` | | | Blocker |
| TC-FR29-18 | FR-29 / 5c | — | 1) Gửi IPN hợp lệ với `order_ref` **không tồn tại** | — | `payment_anomaly(UNKNOWN_ORDER)` + cảnh báo; **không** cấp Premium | | | Blocker |
| TC-FR29-19 | FR-29 / AC-29.10 | Có giao dịch `PENDING` quá 5 phút | 1) Chạy job đối soát | — | Truy vấn cổng và cập nhật đúng trạng thái | | | Major |
| TC-FR31-05 | FR-31 / AC-31.1 | Thuê bao còn đúng 7 ngày | 1) Chạy job nhắc 3 lần liên tiếp | — | Chỉ **1** email nhắc mốc 7 ngày; `last_reminder_stage = 7` | | | Critical |
| TC-FR31-06 | FR-31 / AC-31.5 (biên) | Theo dõi trọn một kỳ | 1) Đếm tổng email nhắc gia hạn | — | **≤ 4** (7d, 3d, 1d, sau hết hạn 1 ngày) — **không** gửi thêm sau đó | | | Major |
| TC-FR31-07 | FR-31 / AC-31.2 | Thuê bao vừa hết hạn | 1) Chạy job hết hạn; 2) Kiểm tiến độ học | — | Vai trò về `LEARNER_FREE`; **toàn bộ tiến độ học còn nguyên** | | | Critical |
| TC-FR31-08 | FR-31 / AC-31.4 | Đã tắt email tiếp thị | 1) Tới mốc nhắc gia hạn | — | **Vẫn nhận** email nhắc (là email giao dịch) | | | Major |
| TC-FR31-09 | FR-31 / AC-31.6 | — | 1) Rà toàn bộ SCR-21 và SCR-24 | — | **Không** có chữ "huỷ gia hạn" hay diễn đạt hàm ý đang bị trừ tiền định kỳ | | | Major |
| TC-FR31-10 | FR-31 / AC-31.3 | Đang ở màn có banner nhắc | 1) Đếm số thao tác tới trang thanh toán | — | **≤ 3 thao tác** | | | Major |
| TC-FR32-07 | FR-32 / AC-32.2 | Sandbox VNPay | 1) IPN `vnp_ResponseCode=00` + `vnp_TransactionStatus=00` | — | Kích hoạt; phản hồi `{"RspCode":"00","Message":"Confirm Success"}` | | | Critical |
| TC-FR32-08 | FR-32 / AC-32.3 | Sandbox MoMo | 1) IPN `resultCode = 0` | — | Kích hoạt; phản hồi theo định dạng MoMo | | | Critical |
| TC-FR32-09 | FR-32 / BR-A72 | — | 1) Gửi IPN chữ ký sai; 2) Kiểm mọi bảng **trước và sau** | — | **Không bảng nào đổi**, kể cả `payment_event` nghiệp vụ *(chỉ ghi `payment_anomaly` + log cảnh báo)* | | | Blocker |

### 3.7 Kiểm thử phi chức năng

| TC-ID | NFR | Tiền điều kiện | Bước thực hiện | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái | Mức lỗi |
|-------|-----|----------------|----------------|-----------------|-----------------|:----------:|---------|
| TC-NFR01-01 | NFR-01 | Dữ liệu gieo đầy đủ | Chạy k6: 300 rps trong 10 phút lên các endpoint đọc | P95 < **300 ms**, P99 < **800 ms**, tỉ lệ lỗi < 0,1% | | | Critical |
| TC-NFR02-01 | NFR-02 | 4G mô phỏng, thiết bị tầm trung | Lighthouse trên SCR-08 và SCR-10 | LCP < **2,5 s**, INP < **200 ms**, CLS < **0,1** | | | Critical |
| TC-NFR03-01 | NFR-03 | Băng thông ≥ 5 Mbps | Mở 20 video bài học | Bắt đầu phát < **2 giây**; rebuffer < **1%** thời lượng | | | Critical |
| TC-NFR05-01 | NFR-05 | — | Giám sát 30 ngày (sau go-live) | Uptime ≥ **99,5%** | | | Major |
| TC-NFR06-01 | NFR-06 | — | k6: 500 phiên học đồng thời | Không lỗi 5xx, P95 vẫn đạt | | | Critical |
| TC-NFR10-01 | NFR-10 | — | Vượt từng hạn mức: đăng nhập 11/phút, đăng ký 6/giờ, quên MK 4/giờ, tìm kiếm 61/phút | Mỗi trường hợp: HTTP 429 + `Retry-After` | | | Major |
| TC-NFR14-01 | NFR-14 | — | Chạy axe-core trên 30 màn hình | **0 vi phạm critical/serious** | | | Blocker |
| TC-NFR14-02 | NFR-14 | — | Làm trọn 1 bài học **chỉ dùng bàn phím** | Hoàn thành được; viền focus luôn thấy rõ | | | Blocker |
| TC-NFR14-03 | NFR-14 | — | Phóng trình duyệt lên **200%** | Không mất nội dung, không cuộn ngang | | | Major |
| TC-NFR14-04 | NFR-14 | — | Kiểm tương phản mọi cặp màu ở `design.md` §2.1 | Chữ ≥ 4,5:1; thành phần ≥ 3:1 | | | Major |
| TC-NFR14-05 | NFR-14 | — | Bật `prefers-reduced-motion: reduce` | Hiệu ứng trang trí tắt; **video bài học vẫn phát bình thường** | | | Major |
| TC-NFR15-01 | NFR-15 | — | Chạy bộ E2E rút gọn trên Chrome, Edge, Firefox, Safari (desktop + iOS) | Không lỗi chặn trên bất kỳ trình duyệt nào | | | Critical |
| TC-NFR17-01 | NFR-17 | — | Khôi phục CSDL từ bản sao lưu hằng ngày vào môi trường sạch | Khôi phục thành công trong **< 4 giờ (RTO)**; mất dữ liệu **≤ 24 giờ (RPO)** | | | Critical |
| TC-NFR04-01 🤖 | NFR-04 | Máy Android tầm trung ≥ 4 năm tuổi | Đo FPS trích landmark MediaPipe trong 60 giây | ≥ **15 khung/giây**; tổng tải về ≤ 8 MB và được cache lần sau | | | Critical |
| TC-NFR04-02 🤖 | NFR-04 | — | Đo thời gian từ lúc bấm "Kết thúc" tới khi hiện kết quả, 30 lượt | **P95 ≤ 1,5 giây** | | | Critical |
| TC-NFR19-01 🤖 | NFR-19 | Tập kiểm định gốc `group_shuffle_by_signer` | Chạy mô hình triển khai trên tập kiểm định | top1 ≥ **0,85** · top3 ≥ **0,95** | | | Blocker |
| TC-NFR19-02 🤖 | NFR-19 | **5 người thật** ngoài dữ liệu huấn luyện, webcam thật | 30 ký hiệu × 3 lần × 5 người = **450 lượt**, ánh sáng đủ | top1 ≥ **0,80** — *nếu không đạt thì hạ cấp về chế độ Gương* | | | Blocker |
| TC-NFR19-03 🤖 | NFR-19 | Như trên, **ngược sáng** và **thiếu sáng** | Lặp lại bộ kiểm | Ghi lại top1 từng điều kiện; các lượt trượt phải sinh **đúng gợi ý chất lượng** | | | Critical |
| TC-NFR19-04 🤖 | NFR-19 | ≥ 1 người **thuận tay trái** | So sánh top1 trái vs phải | Chênh lệch ≤ **10 điểm phần trăm** | | | Critical |
| TC-NFR19-05 🤖 | NFR-19 | Dữ liệu từ TC-NFR19-02 | Dựng **ma trận nhầm lẫn** 30×30 | Liệt kê mọi cặp lẫn > 20% → đưa vào danh sách xử lý | | | Major |
| TC-NFR20-01 🤖 | NFR-20 | 50 lượt chấm đồng thời | Chạy k6 gọi `POST /ai/attempts` | Không lỗi 5xx ngoài dự kiến; circuit breaker mở đúng ngưỡng rồi tự phục hồi | | | Critical |

## 4. Độ phủ TC → FR

| FR | Số TC | Có case biên? | Có case lỗi? | Ghi chú |
|----|:-----:|:-------------:|:------------:|---------|
| FR-01 | 10 | ✅ (mật khẩu 9/10/128/129; tên 1/2/50/51; token 24h) | ✅ | Gồm 1 case `[INV-4]` |
| FR-02 | 6 | ✅ (5 lần sai) | ✅ | Gồm 1 case `[INV-4]` |
| FR-03 | 3 | — | ✅ | |
| FR-04 | 5 | ✅ (59/61 phút) | ✅ | Gồm 1 case `[INV-4]` |
| FR-05 | 6 | ✅ (2 giờ / 25 giờ) | ✅ | |
| FR-06 | 6 | ✅ (2,0/2,1 MB) | ✅ | |
| FR-07 | 3 | — | ✅ | |
| FR-08 | 3 | ✅ (ngày 29 / quá 30) | ✅ | |
| FR-09 | 4 | — | ✅ | |
| FR-10 | 1 | — | — | ⚠️ Cần bổ sung case lỗi khi chốt Q4 (nhiều khoá) |
| FR-11 | 5 | ✅ (14/16 phút) | ✅ | |
| FR-12 | 12 | ✅ (200/201 ký tự; 0.79/0.80/0.81) | ✅ | Gồm 3 case `[INV-2]` |
| FR-13 | 4 | ✅ (7/10 vs 8/10) | ✅ | |
| FR-14 | 2 | ✅ (8 mốc điểm) | — | |
| FR-15 | 3 | — | ✅ | |
| FR-16 | 3 | ✅ (trần 15 phút) | ✅ | |
| FR-17 | 7 | ✅ (sàn ease 1.30) | ✅ | |
| FR-18 | 12 | ✅ (0.79/0.80/0.81; 31 giây) | ✅ | Gồm 3 case `[INV-1]` |
| FR-19 | 1 | — | ✅ | ⚠️ Mỏng — bổ sung ở B4 |
| FR-20 | 3 | — | ✅ | Gồm 1 case `[INV-1]` |
| FR-21 | 7 | ✅ (size 0/1/50/51/500; q 100/101) | ✅ | |
| FR-22 | 1 | — | — | ⚠️ Mỏng — bổ sung ở B4 |
| FR-23 | 8 | ✅ (Freeze 0/2/3; 23:50) | ✅ | Phần nhiều case nhất — đúng với mức rủi ro |
| FR-24 | 1 | ✅ (23:00 cùng ngày) | — | |
| FR-25 | 4 | ✅ (mốc 14→15) | — | |
| FR-26 | 2 | — | — | |
| FR-27 | 5 | — | ✅ | |
| ~~FR-28 (v0.1)~~ | — | — | — | *Đã thay bằng dòng "FR-28 (cập nhật)" bên dưới* |
| ~~FR-29 (v0.1)~~ | — | — | — | *Đã thay bằng dòng "FR-29 (viết lại)" bên dưới* |
| FR-30 | 4 | — | ✅ | Toàn bộ là `[INV-3]` |
| ~~FR-31 (v0.1)~~ | — | — | — | *Đã thay bằng dòng "FR-31 (viết lại)" bên dưới* |
| ~~FR-32 (v0.1)~~ | — | — | — | *Đã thay bằng dòng "FR-32 (viết lại)" bên dưới* |
| FR-33 | 5 | ✅ (99/120 MB; 61 giây) | ✅ | |
| FR-34 | 3 | — | ✅ | |
| FR-35 | 3 | — | ✅ | |
| FR-36 | 4 | — | ✅ | |
| FR-37 | 3 | — | ✅ | |
| FR-38 | 3 | ✅ (0/1/100000/100001) | ✅ | |
| FR-39 | 3 | — | ✅ | |
| FR-40 | 3 | — | — | Gồm 2 case `[INV-5]` |
| **FR-41** 🤖 | **17** | ✅ (0.54/0.55/0.56; tensor 63/64/65×327) | ✅ | Gồm 3 `[INV-1]` + 3 `[INV-7]` — **nhiều case nhất, đúng với mức rủi ro** |
| **FR-42** 🤖 | 5 | ✅ (5/6 giây; 7/8 khung) | ✅ | |
| **FR-43** 🤖 | 5 | ✅ (tối đa 2 câu gợi ý) | ✅ | |
| **FR-44** | 4 | — | ✅ | Gồm 1 Blocker: khớp thuật toán chuẩn hoá nhãn hai phía |
| **FR-45** | 3 | ✅ (10/11 yêu cầu) | ✅ | |
| **FR-46** | 7 | — | ✅ | Gồm 1 `[INV-1]`; 4 case Blocker về quyền riêng tư |
| **FR-28** *(cập nhật)* | 4 | — | ✅ | |
| **FR-29** *(viết lại)* | **13** | ✅ (VNPay × 100; cộng dồn hạn) | ✅ | Gồm 2 `[INV-6]` |
| **FR-31** *(viết lại)* | 10 | ✅ (≤ 4 email/kỳ) | ✅ | |
| **FR-32** *(viết lại)* | 9 | — | ✅ | Gồm 1 `[INV-6]` |
| **NFR** | **22** | — | — | Bảng §3.7 — thêm NFR-04 (2), NFR-19 (5), NFR-20 (1) |

**Tổng: 264 test case** · FR được phủ: **46/46 (100%)** · FR thiếu case biên hoặc case lỗi: **FR-10, FR-19,
FR-22, FR-26** → **phải bổ sung trước khi trình GATE-4** (đã ghi vào tiêu chí ra ở `test-plan.md` §4.2).

**Phân bố theo bất biến:**

| Bất biến | Số case | Ghi chú |
|----------|:-------:|---------|
| INV-1 Camera không rời thiết bị | **10** | 5 case cũ (đánh vần/Gương) + 5 case mới (AI động, góp dữ liệu) |
| INV-2 Chấm bài ở server | 3 | |
| INV-3 Paywall ở backend | 4 | |
| INV-4 Chống dò tài khoản | 3 | |
| INV-5 Không dữ liệu thẻ / PII trong log | 3 | |
| **INV-6** `returnUrl` không cấp quyền 🆕 | **3** | Rủi ro doanh thu cao nhất |
| **INV-7** Lỗi AI không phạt người học 🆕 | **3** | Cần cờ giả lập lỗi từ dev (TR-07) |
| **Tổng nhóm bất biến** | **29** | **Bắt buộc Pass 100%** |

## 5. Tổng hợp kết quả

> ⚠️ **Chưa chạy.** Bộ case này soạn ở B3 từ SRS/api-spec; sẽ thực thi ở **B4** khi dev handover.
> Điền vào đây sau khi chạy, rồi chuyển sang `test-report.md`.

| Chỉ số | Giá trị |
|--------|---------|
| Tổng số TC | 264 |
| Pass | *(chưa chạy)* |
| Fail | *(chưa chạy)* |
| Blocked | *(chưa chạy)* |
| N/A | 0 |
| **TC nhóm bất biến (INV-1→7)** | **29 — bắt buộc Pass 100%** |

---

## ✅ Checklist
- [x] Mỗi FR có test case; mỗi tiêu chí chấp nhận Given–When–Then được phủ ít nhất 1 case.
- [x] Mỗi endpoint trọng yếu có case đúng schema + case mã lỗi.
- [x] Có đủ **case biên** và **case luồng lỗi**, không chỉ happy path.
- [x] Mỗi TC **tái lập được**: tiền điều kiện, bước đánh số, dữ liệu cụ thể, một kết quả kỳ vọng kiểm chứng được.
- [x] Ánh xạ **TC→FR** đầy đủ để đo độ phủ (§4).
- [x] Dữ liệu **ẩn danh** (PDPL) — không PII thật.
- [x] Nhóm **bất biến INV-1→INV-5** có bộ case riêng, mức Blocker.
- [ ] ⚠️ **4 FR còn mỏng case (FR-10, 19, 22, 26) — bổ sung ở B4.**
- [x] ✅ Bộ case thanh toán đã viết theo VNPay + MoMo (Q3 đã chốt).
- [ ] ⚠️ **Case 🤖 phụ thuộc quyết định Q8** — nếu chọn phương án C (gửi ảnh) thì TC-FR41-01/02 phải viết lại.
