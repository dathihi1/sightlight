# Test Report — SignLight

| Phiên bản | v0.1 | Ngày | 2026-09-20 | Trạng thái | ⚠️ **KHUNG BÁO CÁO — CHƯA CHẠY KIỂM THỬ** |
|-----------|------|------|------------|------------|---------------------------------------------|

> ## ⚠️ Đọc trước
>
> **Báo cáo này CHƯA có kết quả thật.** Tại thời điểm 2026-09-20, dự án mới ở trạng thái hoàn tất tài liệu
> B1–B3; **chưa có mã nguồn**, nên chưa chạy được bất kỳ test case nào.
>
> Tài liệu này được chuẩn bị trước để: (1) chốt **định dạng báo cáo** và **tiêu chí nghiệm thu** ngay từ
> bây giờ, (2) để Tester chỉ việc điền số liệu ở B4 thay vì dựng lại từ đầu.
>
> **Mọi ô ghi `—` hoặc *(chưa chạy)* là chỗ trống chờ số liệu thật.** Không có con số nào ở đây được suy
> đoán hay tạo ra. Báo cáo chỉ được coi là hợp lệ khi Tester đã chạy thật và ký ở §8.

**Tiền đề:** `docs/qa/test-plan.md`, `docs/qa/test-cases.md` (191 case)

---

## 1. Thông tin đợt kiểm thử

| Hạng mục | Giá trị |
|----------|---------|
| Đợt kiểm thử | *(chưa chạy)* |
| Phiên bản mã nguồn kiểm thử | *(commit hash — chưa có)* |
| Môi trường | UAT (`deploy/docker-compose.yml`) — **dải port chờ anh Bryan cấp** |
| Thời gian bắt đầu / kết thúc | — / — |
| Người thực hiện | Tester |
| Bộ test case áp dụng | `test-cases.md` v0.1 — 191 case |

## 2. Tổng hợp kết quả

| Chỉ số | Số lượng | Tỉ lệ |
|--------|:--------:|:-----:|
| Tổng số test case | 191 | 100% |
| Pass | — | — |
| Fail | — | — |
| Blocked | — | — |
| N/A | 1 (`TC-FR32-05` chờ Q3) | 0,5% |
| **Nhóm bất biến INV-1→INV-5** | 17 | **bắt buộc Pass 100%** |

### 2.1 Kết quả theo nhóm bất biến *(quyết định đạt/không đạt GATE-4)*

| Bất biến | Số case | Pass | Fail | Kết luận |
|----------|:-------:|:----:|:----:|----------|
| **INV-1** Khung hình camera không rời thiết bị | 5 | — | — | *(chưa chạy)* |
| **INV-2** Chấm bài ở server, không lộ đáp án | 3 | — | — | *(chưa chạy)* |
| **INV-3** Paywall chặn ở backend | 4 | — | — | *(chưa chạy)* |
| **INV-4** Không phân biệt email tồn tại/không | 3 | — | — | *(chưa chạy)* |
| **INV-5** Không dữ liệu thẻ, không PII trong log | 3 | — | — | *(chưa chạy)* |

> **Quy tắc không thương lượng:** chỉ cần **1 case** ở bảng trên Fail → **không đạt tiêu chí ra**, không
> được trình GATE-4, không được "chấp nhận rủi ro".

## 3. Kết quả theo module

| Module | FR | Số TC | Pass | Fail | Blocked | Ghi chú |
|--------|----|:-----:|:----:|:----:|:-------:|---------|
| M0 Tài khoản & Onboarding | FR-01→08 | 42 | — | — | — | |
| M1 Nội dung & Lộ trình | FR-09→10 | 5 | — | — | — | |
| M2 Học & Bài tập | FR-11→16 | 29 | — | — | — | |
| M3 Luyện tập | FR-17→20 | 23 | — | — | — | |
| M4 Từ điển | FR-21→22 | 8 | — | — | — | |
| M5 Tiến độ & Gamification | FR-23→27 | 20 | — | — | — | |
| M6 Thanh toán | FR-28→32 | 24 | — | — | — | |
| M7 CMS & Hỗ trợ | FR-33→36 | 15 | — | — | — | |
| M8 Marketing | FR-37→38 | 6 | — | — | — | |
| M9 Nền tảng | FR-39→40 | 6 | — | — | — | |
| Phi chức năng | NFR-01→18 | 13 | — | — | — | |

## 4. Độ phủ

| Hạng mục | Mục tiêu | Thực tế | Đạt? |
|----------|----------|---------|:----:|
| FR được phủ ít nhất 1 case | 40/40 (100%) | 40/40 *(theo thiết kế bộ case)* | ✅ *(về thiết kế)* |
| FR có case biên | 40/40 | 36/40 — thiếu FR-10, 19, 22, 26 | ❌ **phải bổ sung ở B4** |
| FR có case luồng lỗi | 40/40 | 34/40 | ❌ **phải bổ sung ở B4** |
| Tiêu chí chấp nhận (97) được phủ | 100% | *(kiểm lại khi chạy)* | — |
| Endpoint có case đúng + case lỗi | 66/66 | *(chưa chạy)* | — |
| Độ phủ unit test tầng service | ≥ 70% | *(chưa có code)* | — |
| Đối chiếu OpenAPI ↔ `api-spec.md` | 0 sai lệch | *(chưa có code)* | — |

## 5. Danh sách lỗi

> Điền khi chạy. Mỗi lỗi phải **tái lập được**: TC-ID, bước, dữ liệu, kết quả thực tế, ảnh/log (đã che PII).

| ID lỗi | TC-ID | Mô tả ngắn | Mức độ | Module | Trạng thái | Người xử lý | Ghi chú |
|--------|-------|------------|--------|--------|------------|-------------|---------|
| — | — | *(chưa có — chưa chạy kiểm thử)* | — | — | — | — | |

### 5.1 Lỗi Blocker / Critical còn mở
*(chưa có)*

### 5.2 Lỗi đã sửa & kiểm lại
*(chưa có)*

## 6. Kết quả phi chức năng

| NFR | Chỉ tiêu | Kết quả đo | Đạt? | Bằng chứng |
|-----|----------|------------|:----:|------------|
| NFR-01 API | P95 < 300 ms @ 300 rps | — | — | *(đính kèm báo cáo k6)* |
| NFR-02 Web | LCP < 2,5 s · INP < 200 ms · CLS < 0,1 | — | — | *(đính kèm Lighthouse)* |
| NFR-03 Video | Bắt đầu phát < 2 s · rebuffer < 1% | — | — | |
| NFR-04 Nhận dạng | ≥ 15 FPS trên máy tầm trung; mô hình ≤ 5 MB | — | — | *(ghi rõ model máy đã đo)* |
| NFR-06 Quy mô | 500 phiên đồng thời không lỗi 5xx | — | — | |
| NFR-14 Tiếp cận | 0 vi phạm axe critical/serious; thao tác đủ bằng bàn phím | — | — | *(đính kèm báo cáo axe)* |
| NFR-15 Tương thích | 4 trình duyệt × desktop/mobile | — | — | |
| NFR-17 Sao lưu | RPO ≤ 24 giờ · RTO ≤ 4 giờ | — | — | *(biên bản diễn tập phục hồi)* |

## 7. Đánh giá tiêu chí ra (theo `test-plan.md` §4.2)

| # | Tiêu chí ra | Đạt? | Ghi chú |
|---|-------------|:----:|---------|
| 1 | 0 lỗi Blocker, 0 lỗi Critical còn mở | — | |
| 2 | **100% case INV-1→INV-5 Pass** | — | Không cho phép ngoại lệ |
| 3 | ≥ 95% tổng case Pass | — | |
| 4 | Độ phủ TC→FR đạt 100% (kể cả case biên & lỗi) | ❌ | Thiếu case biên/lỗi ở FR-10, 19, 22, 26 |
| 5 | Đối chiếu OpenAPI ↔ api-spec không sai lệch | — | |
| 6 | 0 vi phạm tiếp cận mức critical/serious | — | |
| 7 | Đạt NFR-01, NFR-02, NFR-03 | — | |
| 8 | `test-report.md` hoàn chỉnh & đã ký | ❌ | Đang là khung, chưa chạy |

**Kết luận hiện tại: CHƯA ĐỦ ĐIỀU KIỆN TRÌNH GATE-4** — vì chưa có mã nguồn để kiểm thử. Đây là trạng thái
đúng với giai đoạn dự án, không phải lỗi.

## 8. Kết luận & Ký

| Hạng mục | Nội dung |
|----------|----------|
| Khuyến nghị của Tester | *(điền sau khi chạy)* |
| Rủi ro còn lại | *(điền sau khi chạy)* |
| Đề xuất trình GATE-4 | ❌ Chưa — chờ B4 |
| Người thực hiện | *(chưa ký)* |
| Ngày | — |

---

## Phụ lục A — Việc phải làm ở B4 trước khi báo cáo này có giá trị

1. Bổ sung case biên/lỗi cho **FR-10, FR-19, FR-22, FR-26**.
2. Bổ sung `TC-FR32-05` sau khi chốt **Q3 (cổng thanh toán)**.
3. Yêu cầu dev cung cấp **đồng hồ có thể tiêm (injectable clock)** để kiểm streak qua nửa đêm (rủi ro TR-02).
4. Chuẩn bị **proxy chặn giữa** để kiểm INV-1 một cách chắc chắn (rủi ro TR-01) — không chỉ dựa vào DevTools.
5. Nạp bộ dữ liệu gieo đầy đủ theo `test-plan.md` §3 (gồm tài khoản chưa xác thực, chờ xoá, thuê bao sắp hết hạn).
6. Lấy **OpenAPI sinh từ code** (springdoc) để đối chiếu với `api-spec.md`.
