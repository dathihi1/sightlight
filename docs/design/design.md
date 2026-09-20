# design.md — SignLight

| Phiên bản | **v0.2** | Ngày | 2026-09-20 | Trạng thái | DRAFT — chờ GATE-3 |
|-----------|------|------|------------|------------|---------------------|

**Tiền đề:** `docs/ba/BRD.md` v0.2, `docs/ba/SRS.md` v0.2 · **Đi cùng:** `docs/ba/FSD.md` (đặc tả màn hình), `docs/sa/api-spec.md`

---

## 1. Nguyên tắc thiết kế

**Đối tượng.** Người nghe (15–55 tuổi) học ngôn ngữ ký hiệu vì gia đình, công việc hoặc sự quan tâm;
**và** người Điếc/khiếm thính dùng sản phẩm (kiểm tra nội dung, học ngôn ngữ ký hiệu khác). Phần lớn là
**người mới hoàn toàn**, không có thuật ngữ chuyên ngành.

**Thiết bị.** Mobile-first (mobile browser là kênh chính), nhưng **màn hình học phải đẹp trên desktop** vì
video ký hiệu cần diện tích lớn và bài luyện camera cần webcam. Bố cục co giãn từ 360 px tới 1440 px.

**Ngôn ngữ.** Tiếng Việt (mặc định) + Tiếng Anh. Mọi chuỗi đi qua hệ thống i18n, không hardcode.

**Năm nguyên tắc chi phối mọi quyết định giao diện:**

1. **Hình ảnh là nội dung chính, giao diện lùi về sau.** Video ký hiệu luôn là phần tử lớn nhất, sáng nhất
   trên màn. Nền trung tính, không hoạ tiết, không gradient chạy sau video.
2. **Không bao giờ dùng âm thanh để truyền tải thông tin.** Sản phẩm phục vụ cộng đồng khiếm thính — mọi
   phản hồi (đúng/sai, hoàn thành, cảnh báo) phải có **chữ + hình + chuyển động**. Âm thanh, nếu có, chỉ là
   lớp bổ trợ có thể tắt hoàn toàn.
3. **Không dùng riêng màu để truyền tải trạng thái.** Đúng/sai luôn kèm **biểu tượng + chữ**, không chỉ
   viền xanh/đỏ (WCAG 1.4.1).
4. **Thao tác một tay, ngón cái với tới.** Hành động chính đặt ở nửa dưới màn hình trên mobile.
5. **Tôn trọng văn hoá Điếc.** Ngôn từ dùng "người Điếc" (viết hoa khi chỉ cộng đồng văn hoá), không dùng
   từ mang tính thương hại ("bị câm điếc", "khiếm khuyết"). Ảnh minh hoạ thể hiện người Điếc **chủ động dạy**,
   không phải đối tượng được giúp đỡ.

**Nhận diện thương hiệu — ràng buộc pháp lý.** SignLight **phải khác biệt rõ ràng** với Lingvano (BRD §6,
rủi ro R-03). Vì vậy hệ màu chọn **chàm–lam sâu + hổ phách**, tương phản có chủ đích với hệ cam–kem của đối
thủ; hình minh hoạ, linh vật, kiểu chữ đều do đội tự tạo.

## 2. Design token

> Token là **nguồn sự thật** cho Tailwind config. Frontend/CMS **không được** tự đặt mã màu rời.

### 2.1 Màu — chế độ sáng

| Nhóm | Token | Giá trị | Dùng cho | Tương phản |
|------|-------|---------|----------|------------|
| Thương hiệu | `--brand-700` | `#3730A3` | Trạng thái nhấn/hover của nút chính | 10.4:1 trên trắng |
| Thương hiệu | `--brand-600` | `#4338CA` | **Nút chính, liên kết, viền focus** | 8.6:1 trên trắng |
| Thương hiệu | `--brand-100` | `#E0E7FF` | Nền vùng được chọn | — (chỉ làm nền) |
| Thương hiệu | `--brand-050` | `#EEF2FF` | Nền thẻ nhấn nhẹ | — |
| Nhấn (gamification) | `--accent-500` | `#F59E0B` | **Chỉ dùng cho streak/huy hiệu/sao — không bao giờ làm nền chữ** | 2.1:1 ⚠️ |
| Nhấn | `--accent-700` | `#B45309` | Chữ trên nền hổ phách nhạt | 5.3:1 trên trắng |
| Nền | `--bg-default` | `#FFFFFF` | Nền trang | — |
| Nền | `--bg-subtle` | `#F8FAFC` | Nền phần, nền thẻ | — |
| Nền | `--bg-video` | `#0F172A` | **Khung video & khung camera** (nền tối làm nổi bàn tay) | — |
| Chữ | `--ink-900` | `#0F172A` | Tiêu đề, chữ chính | 17.4:1 |
| Chữ | `--ink-600` | `#475569` | Chữ phụ, mô tả | 7.5:1 |
| Chữ | `--ink-400` | `#94A3B8` | Chữ bị vô hiệu (**không dùng cho thông tin quan trọng**) | 2.8:1 ⚠️ |
| Đường viền | `--border-default` | `#E2E8F0` | Viền thẻ, đường kẻ | — |
| Đường viền | `--border-strong` | `#CBD5E1` | Viền ô nhập | 3.2:1 (đạt cho thành phần phi văn bản) |
| Trạng thái | `--success-700` | `#15803D` | Chữ "Chính xác" | 5.1:1 |
| Trạng thái | `--success-050` | `#F0FDF4` | Nền phản hồi đúng | — |
| Trạng thái | `--danger-700` | `#B91C1C` | Chữ lỗi, "Chưa đúng" | 6.2:1 |
| Trạng thái | `--danger-050` | `#FEF2F2` | Nền phản hồi sai | — |
| Trạng thái | `--warning-700` | `#B45309` | Cảnh báo sắp mất streak | 5.3:1 |
| Focus | `--focus-ring` | `#4338CA` | Viền focus, dày **3 px**, cách 2 px | |

### 2.2 Màu — chế độ tối *(bắt buộc: người học hay học buổi tối)*

| Token | Giá trị |
|-------|---------|
| `--bg-default` | `#0B1120` |
| `--bg-subtle` | `#111827` |
| `--bg-video` | `#000000` |
| `--ink-900` | `#F1F5F9` |
| `--ink-600` | `#CBD5E1` |
| `--brand-600` | `#818CF8` *(sáng hơn để đạt ≥ 4.5:1 trên nền tối)* |
| `--success-700` | `#4ADE80` |
| `--danger-700` | `#FCA5A5` |

### 2.3 Kiểu chữ

| Token | Giá trị |
|-------|---------|
| Font chính | **`Be Vietnam Pro`** *(hỗ trợ đầy đủ dấu tiếng Việt)*, dự phòng: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| Font số liệu | `ui-monospace, "SF Mono", monospace` — dùng cho bộ đếm streak, điểm số |
| `--text-xs` | 12px / 16px |
| `--text-sm` | 14px / 20px |
| `--text-base` | **16px / 26px** *(tối thiểu cho nội dung — không dùng dưới 14px cho chữ đọc được)* |
| `--text-lg` | 18px / 28px |
| `--text-xl` | 22px / 30px |
| `--text-2xl` | 28px / 36px |
| `--text-3xl` | 36px / 44px |
| Cân nặng | 400 (thường) · 500 (nhấn) · 600 (tiêu đề phụ) · 700 (tiêu đề) |

### 2.4 Khoảng cách, bo góc, bóng, chuyển động

| Token | Giá trị |
|-------|---------|
| Đơn vị cơ sở | **4px**; thang dùng: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 |
| `--radius-sm` / `-md` / `-lg` / `-full` | 8px / 12px / 20px / 9999px |
| `--shadow-card` | `0 1px 2px rgba(15,23,42,.06), 0 4px 12px rgba(15,23,42,.08)` |
| `--shadow-modal` | `0 20px 48px rgba(15,23,42,.24)` |
| Chuyển động | 150ms (vi mô) · 250ms (thành phần) · 350ms (chuyển màn); easing `cubic-bezier(.２,0,0,1)` |
| **Giảm chuyển động** | Tôn trọng `prefers-reduced-motion: reduce` — tắt mọi hiệu ứng trang trí; **video bài học không bị ảnh hưởng** (đó là nội dung, không phải hiệu ứng) |
| Vùng chạm tối thiểu | **44 × 44 px** (NFR-14) |
| Bề rộng nội dung tối đa | 720px (chữ) · 960px (lộ trình) · 1200px (CMS) |

## 3. User flow

### UC-01 — Onboarding → tài khoản đầu tiên *(FR-05, FR-01)*

```
[Chào mừng] --chọn ngôn ngữ--> [Chọn khoá] --tiếp--> [Giá trị SP] --tiếp--> [Lý do học]
      --tiếp--> [Sứ mệnh] --tiếp--> [Mục tiêu phút/ngày] --cam kết--> [Dự báo tiến bộ]
      --tiếp--> [Dựng lộ trình ≤3s] --> [Sẵn sàng] --> [Tên] --> [Email] --> [Mật khẩu + Điều khoản]
                                                                                    |
                              +--tạo tài khoản OK--> [Lộ trình học — bài 1 mở sẵn]  |
                              +--email đã tồn tại--> [Lộ trình học] (phản hồi giống hệt, NFR-08)
                              +--mật khẩu yếu-------> [Mật khẩu: báo lỗi tại chỗ, giữ nguyên bước]
      ← ở MỌI bước: nút ← quay lại, giữ nguyên lựa chọn đã chọn
```

### UC-02 — Học một bài *(FR-11, FR-12, FR-16)*

```
[Lộ trình] --bấm bài--> [Bài học: video mẫu] --tiếp--> [Bài tập i/n]
    |                                                     |
    |                              +--trả lời ĐÚNG--> [Phản hồi ✓ "Chính xác" + video đáp án] --tiếp-->
    |                              +--trả lời SAI---> [Phản hồi ✗ "Chưa đúng" + video đáp án đúng]
    |                                                     --> (câu này quay lại cuối hàng đợi)
    |                              +--mất mạng------> [Lưu tạm cục bộ, biểu tượng "sẽ đồng bộ"]
    |                                                     |
    |                                             [Hết bài tập]
    |                                                     |
    |                         [Tổng kết: điểm, ký hiệu mới, streak, huy hiệu vừa lên cấp]
    |                                                     |
    +--thoát giữa chừng--> [Lưu tiến độ]          [Curiosity mở khoá?] --có--> [Thẻ Curiosity]
                                                          |
                                                  [Nút: Học bài tiếp theo]
```

### UC-03 — Luyện đánh vần có camera *(FR-18)*

```
[Trainer] --chọn "Đánh vần"--> [MÀN GIẢI THÍCH: "Camera chỉ chạy trên máy bạn,
                                 hình ảnh không được gửi đi đâu cả" + nút "Bật camera"]
                                            |
        +--CẤP QUYỀN--> [Tải mô hình ≤5MB] --> [Khung camera + chữ cái mục tiêu + đếm ngược 3s]
        |                                            |
        |                        +--giữ đúng ≥1s--> [✓ "Chính xác" --> chữ tiếp theo]
        |                        +--20s chưa được--> [Nút "Xem lại cách ký hiệu" / "Bỏ qua chữ này"]
        |                        +--không thấy tay--> [Gợi ý: "Đưa tay vào khung, tăng ánh sáng"]
        |                                            |
        |                                    [Hết bộ chữ] --> [Tổng kết: chữ đúng / cần luyện thêm]
        |
        +--TỪ CHỐI QUYỀN--> [Hướng dẫn bật lại + nút "Dùng chế độ tự đánh giá"]
        |                          --> [Video mẫu + nút "Tôi làm được" / "Cho tôi xem lại"]
        +--KHÔNG CÓ CAMERA--> (thẳng tới chế độ tự đánh giá, KHÔNG hỏi quyền)
```

### UC-06 🤖 — Luyện ký hiệu động với AI *(FR-41, FR-42, FR-43)*

```
[Ký hiệu có chấm AI?] --KHÔNG--> [Chỉ hiện chế độ Gương + "Ký hiệu này chưa có chấm tự động"]
        |
       CÓ
        |
[Màn giải thích camera] --cấp quyền--> [Tải MediaPipe + mô hình] --> [Sẵn sàng]
        |                                                               |
        +--TỪ CHỐI--> [Hướng dẫn bật lại + "Dùng chế độ Gương"]        |
        |                                                        [Bấm "Bắt đầu quay"]
        |                                                               |
        |                                                         [Đếm 3-2-1]
        |                                                               |
        |                                                    [Ghi ~2 giây · đồng hồ chạy]
        |                                                               |
        |                                                       [Bấm "Kết thúc"]
        |                                                               |
        |                                              [CỔNG CHẤT LƯỢNG TẠI CHỖ]
        |                          +--không thấy tay / quá ngắn--> [Gợi ý, KHÔNG gọi API,
        |                          |                                KHÔNG trừ lượt] --> thử lại
        |                          |
        |                          +--đạt--> [Gửi tensor 64×327] --> [AI chấm]
        |                                             |
        |          +--ĐÚNG----------> [✓ "Chính xác!" + độ tin cậy] --> [Ký hiệu tiếp theo]
        |          +--ký hiệu khác--> [✗ + "Hệ thống thấy: Cái cửa 71%" + top-3 + gợi ý]
        |          +--chưa chắc-----> [✗ + "Thử lại chậm hơn…"]
        |          +--LỖI DỊCH VỤ--> [Thông báo thân thiện, KHÔNG trừ lượt,
        |                             KHÔNG đánh dấu sai] + [Chuyển chế độ Gương]
        |                                             |
        |                                    [3 lần chưa được?]
        |                                             |
        |                          [Xem lại mẫu chậm · Chế độ Gương · Bỏ qua]
```

### UC-04 — Nâng cấp Premium *(FR-28, FR-29, FR-30)*

```
[Bài Premium bị khoá] --bấm--> [Màn giới thiệu Premium: so sánh Free ↔ Premium]
                                           |
        [Trang giá: 1T / 3T / 12T · VND · nêu RÕ "KHÔNG tự động trừ tiền lần sau"
                                        + ngày hết hạn dự kiến]
                                           |
                                   [Chọn phương thức: VNPay | MoMo]
                                           |
                        +--chưa xác thực email--> [Nhắc xác thực + nút gửi lại thư]
                        +--chọn gói--------------> [Trang/app VNPay hoặc MoMo (ngoài SignLight)]
                                                            |
                                        +--thành công--> [Đang xác nhận...] --IPN--> [Đã kích hoạt 🎉]
                                        |                      \--quá 60s--> [Sẽ kích hoạt trong ít phút,
                                        |                                     đã gửi email xác nhận]
                                        +--bị từ chối-----> [Thông báo thân thiện + nút thử lại]
                                        +--người dùng huỷ--> [Quay lại trang giá, không báo lỗi]

   ⚠️ returnUrl CHỈ để hiển thị. Trạng thái luôn đọc từ GET /billing/subscription (INV-6).

── Vòng đời sau khi mua (KHÔNG có tự động gia hạn) ──
[Đang dùng] --còn 7 ngày--> [Email + thông báo "Gia hạn ngay"]
            --còn 3 ngày--> [Nhắc lần 2]
            --còn 1 ngày--> [Nhắc lần cuối + banner cố định]
            --hết hạn-----> [Về gói miễn phí · "Tiến độ học của bạn vẫn còn nguyên"]
            --sau 1 ngày--> [1 email quay lại] --> DỪNG, không làm phiền thêm
```

### UC-05 — Mất streak / được Freeze cứu *(FR-23)*

```
[Nửa đêm theo múi giờ người dùng]
     |
  hôm qua đạt mục tiêu? --CÓ--> [streak +1] --> (không thông báo, hiện ở màn chính)
     |
    KHÔNG
     |
  còn Freeze? --CÓ--> [Dùng 1 Freeze, giữ streak] --> [Thông báo: "Freeze đã cứu chuỗi 7 ngày của bạn.
     |                                                  Còn 1 Freeze."]
     |
    KHÔNG --> [streak = 0, cập nhật kỷ lục] --> [Thông báo nhẹ nhàng, KHÔNG trách móc:
                                                 "Chuỗi đã kết thúc ở 7 ngày. Kỷ lục của bạn: 9 ngày.
                                                  Bắt đầu lại hôm nay nhé." + nút "Học 5 phút"]
```

## 4. Wireframe

### SCR-08 — Lộ trình học *(mobile)*

```
+----------------------------------------+
| SignLight        🔥 5   💎 Premium  👤 |  ← streak + trạng thái gói + hồ sơ
+----------------------------------------+
|  Hôm nay: ●●●●●○○○○○  6/10 phút        |  ← vòng/thanh mục tiêu ngày
+----------------------------------------+
|  ┌──────────────────────────────────┐  |
|  │  UNIT 1 · Chào hỏi     ★★★★☆     │  |
|  └──────────────────────────────────┘  |
|    ✓  Xin chào                   100%  |
|    ✓  Tạm biệt                    90%  |
|    ▶  Cảm ơn        ← ĐANG Ở ĐÂY       |
|    ○  Xin lỗi                          |
|    ⬚  Quiz chương 1                    |
|  ┌──────────────────────────────────┐  |
|  │  UNIT 2 · Gia đình      🔒 Premium│  |  ← vẫn thấy TÊN bài (BR-A14)
|  └──────────────────────────────────┘  |
|    🔒 Bố, mẹ                            |
|    🔒 Anh, chị, em                      |
+----------------------------------------+
|        [  ▶  TIẾP TỤC HỌC  ]           |  ← hành động chính, vùng ngón cái
+----------------------------------------+
| 🏠 Học  ✋ Luyện  📖 Từ điển  📊 Tiến độ |  ← thanh điều hướng dưới
+----------------------------------------+
```

### SCR-10 — Màn bài tập *(mobile)*

```
+----------------------------------------+
| ←            ▓▓▓▓▓░░░░░  4/10       ✕  |  ← thoát có xác nhận
+----------------------------------------+
|                                        |
|   ┌──────────────────────────────┐     |
|   │                              │     |
|   │      [VIDEO KÝ HIỆU]         │     |  ← nền --bg-video, phần tử lớn nhất
|   │                              │     |
|   │   🐢 0.5×   ↻ lặp   ⛶ toàn  │     |  ← nút "rùa" giảm tốc (FR-11)
|   └──────────────────────────────┘     |
|                                        |
|   Ký hiệu này nghĩa là gì?             |
|                                        |
|   ┌────────────┐  ┌────────────┐       |
|   │  Tạm biệt  │  │  Xin chào  │       |  ← vùng chạm ≥44px
|   └────────────┘  └────────────┘       |
|   ┌────────────┐  ┌────────────┐       |
|   │   Cảm ơn   │  │   Xin lỗi  │       |
|   └────────────┘  └────────────┘       |
+----------------------------------------+
|           [  KIỂM TRA  ]               |
+----------------------------------------+

── Sau khi trả lời SAI (khay phản hồi trượt lên) ──
+----------------------------------------+
| ✗  CHƯA ĐÚNG                           |  ← nền --danger-050, chữ --danger-700
|    Đáp án đúng: "Tạm biệt"             |     CÓ biểu tượng + CHỮ, không chỉ màu
|    [▶ Xem lại ký hiệu]                 |
|           [  TIẾP TỤC  ]               |
+----------------------------------------+
```

### SCR-14 — Luyện đánh vần có camera *(desktop)*

```
+--------------------------------------------------------------+
| ←   Luyện đánh vần                        Chữ 3/26        ✕  |
+--------------------------------------------------------------+
|                                                              |
|   ┌─────────────────────┐   ┌─────────────────────┐          |
|   │   VIDEO MẪU         │   │   CAMERA CỦA BẠN    │          |
|   │   chữ "C"           │   │   (đã lật gương)    │          |
|   │                     │   │   ┌───────────────┐ │          |
|   │   🐢 0.5×           │   │   │ khung bàn tay │ │          |
|   └─────────────────────┘   │   └───────────────┘ │          |
|                             │  ▓▓▓▓▓▓▓░░░ 72%     │          |  ← độ tin cậy thời gian thực
|                             └─────────────────────┘          |
|                                                              |
|   🔒 Hình ảnh camera chỉ xử lý trên máy bạn, không gửi đi     |  ← luôn hiển thị (tin cậy)
|                                                              |
|   [ ▶ Xem lại cách ký hiệu ]        [ Bỏ qua chữ này ]        |
+--------------------------------------------------------------+
```

### SCR-31 🤖 — Luyện ký hiệu động với AI *(desktop)*

```
+--------------------------------------------------------------+
| ←   Luyện ký hiệu: "CÁI BÀN"          Còn 3/5 lượt hôm nay ✕ |
+--------------------------------------------------------------+
|   ┌─────────────────────┐   ┌─────────────────────┐          |
|   │   VIDEO MẪU         │   │   CAMERA CỦA BẠN    │          |
|   │   "Cái bàn"         │   │   (đã lật gương)    │          |
|   │                     │   │                     │          |
|   │   🐢 0.5×   ↻ lặp   │   │   ● ĐANG GHI 1.4s   │  ← đồng hồ|
|   └─────────────────────┘   │   ✓ Thấy cả hai tay │  ← chất lượng
|                             └─────────────────────┘    thời gian thực
|                                                              |
|   🔒 Hình ảnh camera chỉ xử lý trên máy bạn, không gửi đi     |
|                                                              |
|              [  ⏹  KẾT THÚC  ]                               |
+--------------------------------------------------------------+
| Công cụ hỗ trợ luyện tập, không phải thông dịch viên ·        |  ← LUÔN hiện
| Dữ liệu: VSL400 (Zenodo) — CC BY 4.0                          |     (SC-12, SC-13)
+--------------------------------------------------------------+

── Khay kết quả khi nhận ra ký hiệu KHÁC (trượt lên) ──
+--------------------------------------------------------------+
| ✗  CHƯA ĐÚNG                                                 |  ← nền --danger-050
|    Hệ thống thấy bạn đang ký hiệu "Cái cửa" (71%)            |     biểu tượng + CHỮ
|                                                              |
|    Ký hiệu nhận được chưa khớp từ đang luyện.                |  ← tối đa 2 câu
|    Hãy xem lại video mẫu.                                    |
|                                                              |
|    Hệ thống cân nhắc:  Cái cửa 71% · Cái bàn 18% · Cửa sổ 6% |  ← top-3
|                                                              |
|    [ ▶ Xem lại mẫu ]        [  THỬ LẠI  ]                    |
+--------------------------------------------------------------+

── Sau 3 lần chưa thành công (lối thoát — BR-A122) ──
+--------------------------------------------------------------+
| Ký hiệu này hơi khó. Bạn muốn:                               |  ← KHÔNG trách móc
|  [ ▶ Xem lại mẫu chậm ]  [ 🪞 Chế độ Gương ]  [ Bỏ qua ]     |
+--------------------------------------------------------------+
```

### SCR-33 — Cài đặt góp dữ liệu *(mobile)*

```
+----------------------------------------+
| ←   Góp dữ liệu luyện tập              |
+----------------------------------------+
|  Góp dữ liệu luyện tập      [  OFF  ]  |  ← MẶC ĐỊNH TẮT
+----------------------------------------+
|  Nếu bật, chúng tôi sẽ:                |
|                                        |
|  📹 Lưu gì: clip ~2 giây của lượt      |
|     luyện tập, không có âm thanh       |
|  ⏳ Lưu bao lâu: tối đa 24 tháng       |
|  🎯 Dùng làm gì: huấn luyện AI nhận    |
|     diện ký hiệu tốt hơn               |
|  👤 Ai xem được: chỉ đội phát triển    |
|     AI, gắn mã ẩn danh — không gắn     |
|     tên hay email của bạn              |
|  ↩️ Rút lại: bất cứ lúc nào; toàn bộ   |
|     clip đã góp sẽ bị xoá trong 30 ngày|
+----------------------------------------+
|  Tính năng AI hoạt động đầy đủ dù bạn  |  ← BR-A131 / AC-46.5
|  không bật mục này.                    |
+----------------------------------------+
```

### SCR-19 — Trang tiến độ *(mobile)*

```
+----------------------------------------+
|  Ngôn ngữ ký hiệu — Cơ bản       ⇄     |  ← TÊN KHOÁ nổi bật (BR-A56)
+----------------------------------------+
|  🔥 5 ngày        Kỷ lục: 9 ngày       |
|  ❄ 2 Freeze                            |
+----------------------------------------+
|  Hôm nay   ●●●●●●●●●●●  11.5/10 phút ✓ |
+----------------------------------------+
|  7 ngày qua                            |
|    ▁ ▅ ▇ ▂ ▇ ▇ ▅                       |
|   T2 T3 T4 T5 T6 T7 CN                 |
+----------------------------------------+
|  214 ký hiệu · 42 bài · 6 chương · ★18 |
+----------------------------------------+
|  HUY HIỆU                              |
|  🔥 Người giữ lửa      Cấp 2  9→14     |
|  📚 Người mê ký hiệu   Cấp 3  42→60    |
|  🪄 Phù thuỷ không sai Cấp 2  12→15    |
+----------------------------------------+
|  KHÁM PHÁ   7/30 đã mở                 |
+----------------------------------------+
```

## 5. Component & Trạng thái

| Component | Trạng thái | Ghi chú |
|-----------|------------|---------|
| **Nút chính** (`ButtonPrimary`) | default `--brand-600` · hover `--brand-700` · active lún 1px · **focus: viền 3px `--focus-ring` cách 2px** · disabled nền `#E2E8F0` chữ `--ink-400` · loading: spinner + chữ giữ nguyên chiều rộng | Cao 48px mobile / 44px desktop; **không bao giờ chỉ dùng màu để báo disabled** — thêm `aria-disabled` + con trỏ `not-allowed` |
| **Nút phụ** (`ButtonSecondary`) | viền `--border-strong`, chữ `--ink-900`; hover nền `--bg-subtle` | |
| **Thẻ đáp án** (`OptionCard`) | default viền `--border-default` · hover viền `--brand-600` · **selected** nền `--brand-050` + viền 2px + dấu ✓ · **correct** nền `--success-050` + biểu tượng ✓ + chữ "Chính xác" · **incorrect** nền `--danger-050` + biểu tượng ✗ + chữ "Chưa đúng" · disabled sau khi chấm | **Ba lớp tín hiệu: màu + biểu tượng + chữ** (nguyên tắc 3) |
| **Trình phát video** (`SignVideoPlayer`) | loading: khung xương · playing · paused · **slow (0.5×) — biểu tượng rùa sáng lên** · lỗi: "Không tải được video" + nút thử lại · offline | Điều khiển luôn hiện trên mobile (không ẩn tự động); phím tắt: `Space` phát/dừng, `S` bật/tắt chậm, `R` lặp |
| **Khung camera** (`CameraFrame`) | chưa cấp quyền (màn giải thích) · đang tải mô hình · đang chạy (kèm thanh tin cậy) · không thấy tay · thành công · bị từ chối quyền · không hỗ trợ trình duyệt | **Luôn hiển thị dòng "hình ảnh không rời khỏi máy bạn"**; có đèn báo camera đang bật |
| **Vòng mục tiêu ngày** (`DailyGoalRing`) | 0% · đang tiến triển · đạt 100% (kèm dấu ✓ + chữ "Đã đạt") · vượt mục tiêu | Không chỉ dùng màu — có **chữ `11.5/10 phút`** |
| **Huy hiệu streak** (`StreakBadge`) | hoạt động (🔥 + số) · dùng Freeze (❄) · nguy cơ mất (viền `--warning-700` + chữ "Sắp mất chuỗi") · đã mất (xám + kỷ lục) | |
| **Thẻ huy hiệu** (`AwardCard`) | đã khoá (bóng mờ + "Chưa mở") · đã mở cấp N · **vừa lên cấp (hoạt ảnh một lần)** | Hoạt ảnh tôn trọng `prefers-reduced-motion` |
| **Ổ khoá Premium** (`PremiumLock`) | trên bài học (🔒 + tên bài vẫn đọc được) · trên nút chứng chỉ · trong Trainer khi hết lượt | Bấm vào → màn giới thiệu Premium, **không** phải màn lỗi |
| **Ô nhập** (`TextField`) | default · focus (viền 3px) · lỗi (viền `--danger-700` + **chữ lỗi bên dưới** + `aria-describedby`) · disabled · có nhãn nổi | Nhãn **luôn hiển thị**, không dùng placeholder thay nhãn |
| **Thanh tiến trình bài học** | `i/n` dạng số **và** thanh | |
| **Thông báo nổi** (`Toast`) | thành công · thông tin · cảnh báo · lỗi | Tự ẩn sau 5s nhưng **có nút đóng**; `role="status"` (không phải `alert`) để không cắt ngang trình đọc màn hình |
| **Hộp thoại** (`Dialog`) | mở/đóng, bẫy focus, `Esc` đóng, trả focus về nút mở | Dùng Radix Dialog |
| **Trạng thái rỗng** (`EmptyState`) | từ điển không có kết quả · Trainer chưa tới hạn ôn · chưa có huy hiệu | Luôn kèm **hành động gợi ý** |
| 🤖 **Nút ghi ký hiệu** (`SignRecordButton`) | sẵn sàng · đếm ngược 3-2-1 · **đang ghi (có đồng hồ)** · đang gửi · disable (mô hình chưa tải) | Trạng thái "đang ghi" phải **rất rõ** — chấm đỏ nhấp nháy + chữ "ĐANG GHI" + số giây |
| 🤖 **Chỉ báo chất lượng** (`CaptureQualityBadge`) | thấy cả hai tay ✓ · chỉ thấy một tay · không thấy tay · thiếu sáng | **Cập nhật tại chỗ, không gọi API**; dùng `aria-live="polite"` để trình đọc màn hình theo kịp |
| 🤖 **Khay kết quả AI** (`AiResultSheet`) | đúng · sai-nhận-ký-hiệu-khác (kèm top-3) · chưa chắc · chất lượng kém · **lỗi dịch vụ** | **Lỗi dịch vụ phải trông khác hẳn lỗi của người học** — nền trung tính, không dùng màu đỏ "sai" |
| 🤖 **Danh sách top-3** (`Top3List`) | — | Mỗi dòng: tên ký hiệu + thanh % + nút xem video. **Không** tô đỏ dòng nào — đây là thông tin, không phải phán xét |
| 🤖 **Bộ đếm hạn mức** (`AiQuotaBadge`) | còn lượt · còn 1 lượt (cảnh báo) · hết lượt | Ẩn hoàn toàn với người dùng Premium |
| 🤖 **Lối thoát sau 3 lần sai** (`StuckHelper`) | ẩn · hiện | Giọng khuyến khích: "Ký hiệu này hơi khó" — **không** "Bạn đã sai 3 lần" |
| **Công tắc đồng ý** (`ConsentToggle`) | tắt (mặc định) · bật · đang xử lý | Nút bật **chỉ enable sau khi người dùng đã cuộn hết khối giải thích**; **không** tick sẵn |
| **Thẻ gia hạn** (`RenewalCard`) | còn nhiều ngày · còn ≤ 7 ngày (nhắc) · đã hết hạn · đang chờ xác nhận giao dịch | Khi hết hạn **phải** trấn an: "Tiến độ học của bạn vẫn còn nguyên" |

## 6. Accessibility

> Đây là mục **bắt buộc**, không phải "nên có": sản phẩm phục vụ cộng đồng khiếm thính (BRD §6, NFR-14).

| Hạng mục | Yêu cầu | Cách kiểm |
|----------|---------|-----------|
| Tương phản chữ | ≥ **4.5:1** (chữ thường), ≥ 3:1 (chữ ≥ 24px hoặc ≥ 19px đậm) | Bảng §2.1 đã tính sẵn; kiểm tự động bằng axe trong CI |
| Tương phản thành phần | Viền ô nhập, biểu tượng mang nghĩa ≥ **3:1** | axe |
| **Không phụ thuộc màu** | Mọi trạng thái đúng/sai/cảnh báo có **biểu tượng + chữ** | Rà thủ công theo danh sách component §5 |
| **Không phụ thuộc âm thanh** | Không có thông tin nào chỉ truyền bằng tiếng; video ký hiệu có phụ đề/chú giải chữ | Rà thủ công ở B4 |
| Bàn phím | Mọi chức năng dùng được **chỉ bằng bàn phím**; thứ tự tab hợp lý; không bẫy focus ngoài hộp thoại | Playwright chạy kịch bản chỉ dùng bàn phím |
| Viền focus | **Luôn hiển thị**, 3px, cách 2px, tương phản ≥ 3:1. **Cấm `outline: none` không thay thế** | Rà lint CSS |
| Vùng chạm | ≥ **44 × 44 px** | Kiểm trong Playwright |
| Nhãn | Mọi ô nhập có `<label>` liên kết; nút chỉ có biểu tượng có `aria-label` | axe |
| Thông báo lỗi | Bằng **chữ**, đặt cạnh ô lỗi, liên kết `aria-describedby`; không chỉ đổi màu viền | axe + rà thủ công |
| Thu phóng | Dùng được ở mức phóng **200%** không mất nội dung, không cuộn ngang | Rà thủ công |
| Chuyển động | Tôn trọng `prefers-reduced-motion`; **không có nội dung nhấp nháy > 3 lần/giây** | Rà thủ công |
| Ngôn ngữ trang | `<html lang="vi">` / `lang="en"` đúng theo ngôn ngữ giao diện | axe |
| Trình đọc màn hình | Luồng học chính đọc được logic (dùng cho người Điếc-mù hoặc người dùng bàn phím) | Rà thủ công 1 lần/phát hành |

**Ba điểm dễ sai nhất của sản phẩm này — ghi riêng để không bỏ sót:**
1. Khung camera không được là "hộp đen" với trình đọc màn hình — phải có mô tả trạng thái bằng chữ
   (`aria-live="polite"`: "Đang nhận dạng… Đã nhận đúng chữ C").
2. Phản hồi đúng/sai không được chỉ là màu nền đổi — phải có chữ "Chính xác"/"Chưa đúng".
3. Bộ đếm streak không được chỉ là biểu tượng 🔥 — phải có chữ "5 ngày liên tiếp".

## 7. Truy vết màn hình → FR

| Màn hình | FR phục vụ |
|----------|-----------|
| SCR-01 Chào mừng / SCR-02 Onboarding | FR-05 |
| SCR-03 Đăng nhập | FR-02, FR-03 |
| SCR-04 Quên mật khẩu / SCR-05 Đặt lại mật khẩu | FR-04 |
| SCR-06 Đăng ký | FR-01 |
| SCR-07 Xác thực email | FR-01 |
| SCR-08 Lộ trình học | FR-09, FR-10 |
| SCR-09 Giới thiệu bài học | FR-11 |
| SCR-10 Bài tập | FR-11, FR-12 |
| SCR-11 Tổng kết bài học | FR-16, FR-15, FR-23, FR-25 |
| SCR-12 Quiz / SCR-12b Bài mốc | FR-13, FR-14 |
| SCR-13 Trainer từ vựng | FR-17 |
| SCR-14 Trainer đánh vần (camera) | FR-18 |
| SCR-15 Trainer số | FR-19 |
| SCR-16 Chế độ Gương | FR-20 |
| SCR-17 Từ điển — tìm kiếm | FR-21 |
| SCR-18 Từ điển — chi tiết ký hiệu | FR-22 |
| SCR-19 Trang tiến độ | FR-23, FR-24, FR-25, FR-26 |
| SCR-20 Chứng chỉ | FR-27 |
| SCR-21 Hồ sơ & cài đặt | FR-06, FR-07, FR-08, FR-10, FR-24, FR-39 |
| SCR-22 Giới thiệu & bảng giá Premium | FR-28, FR-30 |
| SCR-23 Thanh toán / đang xử lý | FR-29 |
| SCR-24 Quản lý thuê bao | FR-31 |
| SCR-25 CMS — quản lý ký hiệu | FR-33 |
| SCR-26 CMS — soạn bài học & bài tập | FR-34 |
| SCR-27 CMS — hàng đợi duyệt | FR-35 |
| SCR-28 CMS — tra cứu CSKH | FR-36 |
| SCR-29 Landing & blog | FR-37 |
| SCR-30 Form doanh nghiệp | FR-38 |
| **SCR-31 🤖 Luyện ký hiệu động với AI** | **FR-41, FR-42, FR-43** |
| **SCR-32 Báo thiếu ký hiệu** | **FR-45** |
| **SCR-33 Cài đặt góp dữ liệu** | **FR-46** |
| **SCR-34 CMS — Vốn ký hiệu AI** | **FR-44** |
| **SCR-35 CMS — Yêu cầu bổ sung ký hiệu** | **FR-45** |

**Không có màn hình nào không phục vụ FR; không FR nào (FR-01→46) thiếu màn hình, trừ FR-32 và FR-40 là
chức năng hệ thống không có giao diện người học.**

---

## ✅ Checklist
- [x] Có nguyên tắc thiết kế + design token với **giá trị cụ thể** (mã màu, px), gồm cả chế độ tối.
- [x] Mỗi use case chính có **user flow**, vẽ **cả nhánh lỗi** (từ chối camera, thẻ bị từ chối, mất streak…).
- [x] Wireframe mô tả đủ bố cục & nút chính cho các màn quan trọng (lộ trình, bài tập, camera, tiến độ).
- [x] Component liệt kê **đủ trạng thái** (default/hover/selected/correct/incorrect/disabled/loading/lỗi).
- [x] Accessibility vượt mức cơ bản — có bảng kiểm + cách kiểm + 3 điểm dễ sai riêng của sản phẩm.
- [x] **Mỗi màn hình truy vết được về ít nhất một FR**; không có màn "thừa".
- [x] Nhận diện thương hiệu **khác biệt có chủ đích** với đối thủ (ràng buộc pháp lý BRD §6).
- [x] Đã xoá hết khối 💡 Hướng dẫn / 📝 Ví dụ.
