# `src/` — Mã nguồn SignLight

| Thư mục | Vai trò | Công nghệ | Cổng nội bộ |
|---------|---------|-----------|:-----------:|
| `backend/` | API nghiệp vụ, chấm điểm, phân quyền, hạn mức | Java 21 · Spring Boot 3.5 · PostgreSQL 17 | 8080 → `18080` |
| `frontend/` | Giao diện học, **trích đặc trưng chuyển động trong trình duyệt** | Next.js 15 · React 19 · TS 5.6 · Tailwind 4 | 3000 → `18081` |
| `ai/` | Phân lớp tensor 64×327 bằng ONNX Runtime | Python 3.11 · FastAPI · ONNX Runtime | 7860 — **không mở ra ngoài** |

---

## Lát cắt đang có (B4 — vòng đầu)

Mục tiêu vòng này là **một đường đi xuyên suốt chạy được để demo**, không phải toàn bộ 46 FR.

| Luồng | Trạng thái |
|-------|------------|
| Đăng ký → đăng nhập → hồ sơ (FR-01, FR-02, FR-06) | ✅ |
| Lộ trình học Unit → Chương → Bài, khoá theo tiến độ và theo Premium (FR-09) | ✅ |
| Học bài: xem mẫu → trả lời → **chấm ở server** → hoàn thành (FR-11, FR-12, FR-16) | ✅ |
| Streak và phút học theo ngày địa phương (FR-23, FR-26 — phần "vừa học xong") | ✅ |
| Từ điển: tìm không dấu, gợi ý sai chính tả, chủ đề (FR-21, FR-22) | ✅ |
| **AI chấm ký hiệu động end-to-end (FR-41 → FR-44)** | ✅ |
| Hạn mức 5 lượt AI/ngày cho tài khoản miễn phí (FR-30, BR-A108) | ✅ |
| Bộ seed idempotent + cờ `is_seed` (SRS §3.4, việc **V-4**) | ✅ |

**Chưa làm ở vòng này** *(có chủ ý, không phải bỏ sót)*: thanh toán VNPay/MoMo (FR-28→32),
CMS (FR-33→35), chứng chỉ PDF (FR-27), góp dữ liệu (FR-46), quiz và bài mốc (FR-13, FR-14),
đăng nhập Google (FR-03), email giao dịch, refresh token xoay vòng, giới hạn tần suất bằng Redis.

---

## Ba bất biến không được phá

Ba điều dưới đây là ràng buộc kiến trúc, không phải lựa chọn phong cách. Sửa code mà phá một trong
ba là hỏng cả một cổng nghiệm thu.

1. **Không pixel nào rời khỏi thiết bị trong luồng chấm AI** (NFR-12, Q8 = phương án B).
   Trình duyệt trích đặc trưng; thứ duy nhất gửi lên là tensor `64×327`. API từ chối mọi payload có
   trường ảnh/video với mã `10103`. `POST /api/infer/frames` và `POST /api/attempt` của repo gốc
   **không được bật**.
2. **Chấm điểm nằm ở server** (ADR-04). Không endpoint nào trả đáp án đúng trước khi người học đã
   trả lời; `isCorrect` do client gửi lên bị bỏ qua.
3. **Backend quyết định `verified`, không phải dịch vụ AI** (ADR-09). Dịch vụ AI chỉ trả xác suất;
   ngưỡng tin cậy và biên top1−top2 là luật nghiệp vụ, đọc từ bảng `ai_model_version`.

---

## Schema đặc trưng — hợp đồng ba bên

Bố cục 327 chiều được khai **ba nơi** và phải khớp tuyệt đối:

| Nơi | Tệp |
|-----|-----|
| Trình duyệt (bên trích) | `frontend/lib/holistic/featureSchema.ts` |
| Backend (kiểm ở biên) | `backend/.../airecognition/application/FeatureSchema.java` |
| Dịch vụ AI (bên dùng) | `ai/app/schema.py` |

Lệch bố cục thì mô hình nhận rác **mà không báo lỗi** — đây là rủi ro **T-11**. Thuật toán chuẩn hoá
nhãn `stable_sign_id` cũng vậy, nên có bộ test chung ở cả hai phía:
`backend/src/test/java/.../StableSignIdTest.java` và `ai/tests/test_labels.py`.

> ⚠️ **Việc còn nợ (chặn GATE-4):** bố cục từng lát (`motion`, `geometry`, `quality`) hiện được
> định nghĩa theo mô tả ở `api-spec.md` §3.12b. **Phải đối chiếu với bộ trích đặc trưng thật của repo
> `dathihi1/EXE101`** (`src/vsl_mvp/`) trước khi nạp trọng số mô hình — nếu công thức lệch, mô hình
> đã huấn luyện sẽ nhận đầu vào sai mà vẫn trả về một nhãn trông có vẻ hợp lý.

---

## Chế độ STUB của dịch vụ AI

Không có tệp mô hình trong `ai/runs/vsl_mvp30_v2_lite_transformer/` thì dịch vụ **vẫn chạy**, nhưng
sinh kết quả giả lập tất định theo tensor để demo được luồng đầu-cuối. Khi đó:

- `modelVersion` mang hậu tố `-stub`;
- mọi phản hồi có cờ `stubMode: true`;
- giao diện hiện cảnh báo "đang chạy ở chế độ mô phỏng".

**Chế độ này không được dùng để nghiệm thu NFR-19 hay GATE-4.** Xem
`ai/runs/vsl_mvp30_v2_lite_transformer/README.md` để biết cần đặt tệp nào vào đâu.

---

## Chạy tại máy

Cần Docker; không cần cài sẵn Java, Node hay Python.

```bash
cd deploy && cp .env.example .env && docker compose --env-file .env up -d --build
```

Sau khi các container khoẻ: web `http://localhost:18081` · API `http://localhost:18080` ·
OpenAPI `http://localhost:18080/swagger-ui.html`.
