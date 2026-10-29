# Kế hoạch tích hợp Firebase Notification cho SignLight

## 1. Quyết định kiến trúc

SignLight sẽ dùng **Firebase Cloud Messaging (FCM) làm kênh gửi push notification**, không thay thế module
thông báo hiện có.

- PostgreSQL tiếp tục là nguồn sự thật cho nội dung thông báo, trạng thái đã đọc/chưa đọc và lịch sử.
- FCM chỉ chịu trách nhiệm chuyển thông báo đến trình duyệt hoặc ứng dụng di động trong tương lai.
- Nếu người dùng từ chối quyền push hoặc FCM tạm lỗi, thông báo vẫn xuất hiện trong `NotificationDropdown`.
- Thông báo cá nhân như thanh toán, streak, phần thưởng và tiến độ do Spring Boot phát sinh.
- Firebase Console chỉ dùng cho chiến dịch chung đã được duyệt, ví dụ ra mắt bài học hoặc bảo trì hệ thống.

```text
Nghiệp vụ Spring Boot
        │
        ├── lưu notification ──> PostgreSQL ──> API thông báo hiện tại
        │
        └── lưu push_outbox ───> worker ──────> Firebase Cloud Messaging
                                                        │
                                      ┌─────────────────┴─────────────────┐
                                      │                                   │
                              Service Worker                       Tab đang mở
                              thông báo nền                  cập nhật badge/toast
```

## 2. Trạng thái triển khai hiện tại

Đã hoàn thành nền tảng FCM đầu tiên trên nhánh `feature/appreciation-plan-and-gift-codes`:

- Migration `V18` cho installation và outbox.
- Firebase Admin, worker batch, retry, thu hồi FID lỗi và feature flag mặc định tắt.
- API đăng ký/gỡ FID theo người dùng đang đăng nhập.
- Firebase Web SDK dùng API FID mới, service worker, foreground toast và deep link an toàn.
- Nút bật/tắt thông báo trên trang `/thong-bao`; tự đồng bộ khi đăng nhập và gỡ khi logout.
- Badge dùng FCM làm kênh chính, refetch khi quay lại tab và polling dự phòng 5 phút.

Chưa bật Firebase ở bất kỳ môi trường nào cho đến khi cấu hình project, VAPID key và credential Admin.
Lựa chọn bật/tắt theo từng nhóm thông báo, rate limit và dashboard vận hành nằm ở đợt tiếp theo.

## 3. Phạm vi giai đoạn đầu

1. Web push trên Chrome, Edge, Firefox và các trình duyệt hỗ trợ Push API.
2. Gửi cho từng tài khoản trên tất cả thiết bị đã đăng ký.
3. Deep link về trang liên quan khi người dùng bấm thông báo.
4. Đồng bộ badge chưa đọc ngay khi tab đang mở.
5. Cho phép người dùng bật/tắt toàn bộ push; tùy chọn theo từng nhóm thực hiện ở đợt tiếp theo.
6. Dọn token/installation không còn hợp lệ.

Firebase Authentication, Firestore và Cloud Functions **không nằm trong phạm vi này**. Hệ thống JWT, role và
PostgreSQL hiện tại được giữ nguyên.

## 4. Thay đổi dữ liệu

Tạo migration mới, không sửa migration `V10` đã chạy.

### `push_installation`

| Cột | Mục đích |
|---|---|
| `id` | UUID nội bộ |
| `user_id` | Chủ sở hữu thiết bị, FK tới `app_user` |
| `firebase_installation_id` | Định danh installation/FID do Firebase cấp |
| `platform` | `WEB`, sẵn đường mở rộng `ANDROID`, `IOS` |
| `permission_status` | `GRANTED`, `DENIED`, `DEFAULT`, `REVOKED` |
| `last_seen_at` | Lần ứng dụng đồng bộ installation gần nhất |
| `revoked_at` | Đánh dấu token đã ngừng sử dụng |
| `created_at`, `updated_at` | Audit thời gian |

Ràng buộc duy nhất cho `installation_id`; tạo index theo `(user_id, revoked_at)` và `last_seen_at`. Không ghi
FCM token vào log. Nếu môi trường yêu cầu cao hơn, mã hóa cột token ở tầng ứng dụng hoặc database.

### `push_outbox`

| Cột | Mục đích |
|---|---|
| `id` | UUID sự kiện |
| `notification_id` | Liên kết thông báo in-app |
| `installation_id` | Thiết bị nhận, FK tới `push_installation` |
| `title`, `body`, `notification_type`, `target_url` | Payload push tối giản, không chứa PII nhạy cảm |
| `status` | `PENDING`, `PROCESSING`, `SENT`, `FAILED` |
| `attempt_count` | Số lần thử |
| `next_attempt_at` | Thời điểm retry |
| `last_error_code` | Mã lỗi đã làm sạch, không lưu credential/token |
| `created_at`, `processed_at` | Audit thời gian |

`push_outbox` có unique key `(notification_id, installation_id)` để chống tạo lặp. Việc gọi FCM diễn ra bất
đồng bộ qua worker để lỗi mạng không làm thất bại nghiệp vụ chính.

## 5. Backend Spring Boot

### Cấu hình

- Thêm dependency `com.google.firebase:firebase-admin` và khóa phiên bản cụ thể khi triển khai.
- Tạo `FirebaseMessagingConfig`, chỉ khởi tạo khi `FIREBASE_ENABLED=true`.
- Production ưu tiên Workload Identity/Application Default Credentials. Nếu dùng service-account JSON, nạp từ
  secret của nền tảng triển khai; tuyệt đối không commit file khóa.
- Biến cấu hình dự kiến:
  - `FIREBASE_ENABLED`
  - `FIREBASE_PROJECT_ID`
  - `GOOGLE_APPLICATION_CREDENTIALS` hoặc secret tương đương của nền tảng

### Thành phần mới

- `PushInstallation`: entity và repository quản lý thiết bị.
- `PushSubscriptionController`: đăng ký, cập nhật và thu hồi installation của người dùng hiện tại.
- `FcmPushGateway`: adapter duy nhất gọi Firebase Admin SDK.
- `PushOutboxWorker`: lấy batch `PENDING`, gửi FCM, retry theo exponential backoff và đánh dấu kết quả.
- `PushPreferenceService`: kiểm tra lựa chọn nhận thông báo trước khi tạo outbox.

### API đề xuất

| Method | Endpoint | Công dụng |
|---|---|---|
| `POST` | `/api/v1/push/installations` | Upsert FID/token của thiết bị đang đăng nhập |
| `DELETE` | `/api/v1/push/installations/{installationId}` | Gỡ liên kết khi logout hoặc tắt push |
| `GET` | `/api/v1/me/notification-preferences` | Đọc lựa chọn nhận thông báo |
| `PATCH` | `/api/v1/me/notification-preferences` | Cập nhật lựa chọn theo loại |

Tất cả endpoint installation đều yêu cầu JWT hiện tại. Backend lấy `user_id` từ `CurrentUser`, không nhận
`user_id` tùy ý từ request.

### Thay đổi `NotificationService`

Sau khi lưu `Notification`, service tạo một bản ghi outbox nếu:

- loại thông báo được phép push;
- người dùng chưa tắt nhóm đó;
- thông báo có nội dung phù hợp để xuất hiện ngoài màn hình khóa.

Payload FCM chuẩn hóa:

```json
{
  "schemaVersion": "1",
  "notificationId": "uuid",
  "type": "STREAK",
  "title": "Sắp mất chuỗi học hôm nay",
  "body": "Hoàn thành mục tiêu để giữ chuỗi của bạn.",
  "targetUrl": "/hanh-trinh"
}
```

Không gửi email, tên đầy đủ, số tiền hoặc dữ liệu riêng tư trong payload push. Với nội dung nhạy cảm, chỉ gửi
thông báo chung và yêu cầu người dùng mở ứng dụng sau khi xác thực.

## 6. Frontend Next.js

### Cấu hình Firebase Web

- Thêm package `firebase` và dùng modular SDK.
- Tạo `lib/firebase/client.ts` để khởi tạo app một lần.
- Tạo `lib/firebase/messaging.ts` để yêu cầu quyền, lấy FID/token và đăng ký với backend.
- Tạo `public/firebase-messaging-sw.js` để xử lý thông báo khi tab ở nền.
- Dùng biến `NEXT_PUBLIC_FIREBASE_*` và `NEXT_PUBLIC_FIREBASE_VAPID_KEY`. Các giá trị config web có thể nằm ở
  client; service-account private key chỉ được tồn tại ở backend/secret store.

### Trải nghiệm người dùng

1. Không hỏi quyền notification ngay khi vào trang.
2. Hiện lời mời bật thông báo sau một hành động có ngữ cảnh, ví dụ hoàn thành bài đầu hoặc trong Cài đặt.
3. Nút “Bật thông báo” mới gọi `Notification.requestPermission()`.
4. Khi được cấp quyền, lấy installation/token và gọi API đăng ký.
5. Khi nhận foreground message, invalidate query `notifications` và `unread-count`, sau đó hiện toast nhẹ.
6. Service worker xử lý background notification và chỉ cho phép `targetUrl` nội bộ đã được kiểm tra.
7. Khi logout trên thiết bị dùng chung, gọi API gỡ installation trước khi xóa phiên.

Polling 40 giây hiện tại được thay bằng:

- tải badge một lần khi mở ứng dụng;
- refetch khi nhận FCM foreground;
- refetch khi tab chuyển từ hidden sang visible;
- polling dự phòng thưa hơn, ví dụ 5 phút, trong giai đoạn rollout đầu.

## 7. Bảo mật và vận hành

- Tách Firebase project cho development/staging và production.
- Web push production bắt buộc HTTPS và service worker đúng scope.
- Chỉ backend giữ credential Firebase Admin.
- Validate `targetUrl` là đường dẫn nội bộ; không cho open redirect.
- Rate-limit API đăng ký installation và giới hạn số installation hoạt động trên mỗi tài khoản.
- Không dùng topic chứa email hoặc user ID. Topic chỉ dành cho nhóm công khai như `content_vi`.
- Khi FCM trả về installation/token không còn đăng ký, đánh dấu revoked và ngừng retry.
- Retry lỗi tạm thời bằng exponential backoff; có dead-letter trạng thái `FAILED` sau ngưỡng thử.
- Metrics tối thiểu: số pending, sent, failed, token invalid, độ trễ outbox và tỷ lệ click nếu có consent.
- Có feature flag `FIREBASE_ENABLED` để tắt push mà không ảnh hưởng notification in-app.

Firebase App Check có thể triển khai ở giai đoạn sau như một lớp chống lạm dụng bổ sung; nó không thay thế JWT,
authorization hay rate limiting.

## 8. Thứ tự triển khai

### Phase A — Nền tảng

- Tạo Firebase project theo môi trường, đăng ký Web App và VAPID key.
- Thêm migration `push_installation`, `push_outbox` và preference.
- Thêm Firebase Admin config, gateway và health/metrics.

### Phase B — Luồng gửi backend

- Tích hợp outbox vào `NotificationService`.
- Viết worker batch, retry, idempotency và dọn installation lỗi.
- Thêm unit/integration test với `FcmPushGateway` mock; không gọi Firebase thật trong test mặc định.

### Phase C — Web client

- Thêm Firebase Web SDK và service worker.
- Tạo UI xin quyền có ngữ cảnh và trang tùy chọn.
- Đăng ký/gỡ installation, foreground refresh và background deep link.

### Phase D — Rollout

- Bật cho nội bộ, sau đó 5%, 25%, 100% người dùng.
- Trong rollout vẫn giữ polling dự phòng.
- Theo dõi tỷ lệ cấp quyền, lỗi gửi, token invalid và số thông báo trùng.

### Phase E — Chiến dịch Firebase Console

- Chỉ cho phép role quản trị được phê duyệt gửi chiến dịch.
- Dùng topic theo ngôn ngữ/loại nội dung, không dùng topic định danh cá nhân.
- Mọi chiến dịch phải có deep link hợp lệ, nội dung tiếng Việt/Anh và kế hoạch hủy.

## 9. Tiêu chí hoàn thành

- Thông báo in-app được lưu ngay cả khi Firebase tắt hoặc lỗi.
- Một notification nghiệp vụ chỉ tạo tối đa một push cho mỗi installation.
- Người dùng chưa cấp quyền không gặp lỗi và không bị hỏi lại liên tục.
- Foreground message cập nhật badge mà không reload trang.
- Background message mở đúng route nội bộ.
- Logout thiết bị dùng chung không tiếp tục nhận thông báo của tài khoản cũ.
- Token/FID lỗi được thu hồi tự động; retry không tạo gửi lặp.
- Không có service-account key, FCM token hoặc PII trong source code và log.
- Test backend, typecheck, lint và kiểm thử service worker đều chạy trong CI.

## 10. Tài liệu Firebase tham chiếu

- [FCM cho Web](https://firebase.google.com/docs/cloud-messaging/web/get-started)
- [Nhận message trên Web](https://firebase.google.com/docs/cloud-messaging/web/receive-messages)
- [Quản lý registration/installation](https://firebase.google.com/docs/cloud-messaging/manage-tokens)
- [Môi trường gửi FCM phía server](https://firebase.google.com/docs/cloud-messaging/server-environment)
- [App Check cho custom backend](https://firebase.google.com/docs/app-check/web/custom-resource)
