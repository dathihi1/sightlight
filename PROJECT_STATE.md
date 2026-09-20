# PROJECT_STATE — SignLight (Nền tảng học Ngôn ngữ Ký hiệu Việt Nam)

> File điều phối trung tâm. PO và mọi role cập nhật file này. Không xoá lịch sử; chỉ thêm/đổi trạng thái.

- **Dự án:** SignLight — nền tảng học **Ngôn ngữ Ký hiệu Việt Nam (VSL)** có **AI nhận diện ký hiệu động**
- **Ngày khởi tạo:** 2026-09-20
- **Loại dự án:** Mới (greenfield — Track A, B1→B6)
- **Cấu trúc thư mục:** Kiểu A — Monolith / ít module, tài liệu đi chung repo code
- **Giai đoạn hiện tại:** B1–B6 đã soạn **bản nháp đầy đủ** (DRAFT) — chờ duyệt tuần tự từ GATE-1
- **Cổng đang chờ:** GATE-1 (duyệt BRD)
- **GATE-3 (đóng băng thiết kế):** BẬT
- **GATE-4 (nghiệm thu chức năng):** BẬT

> ⚠️ **Ghi chú của PO:** toàn bộ artifact B1→B6 được soạn trước ở trạng thái `DRAFT` để có cái nhìn tổng
> thể. Điều này **không thay thế quy trình cổng** — vẫn duyệt lần lượt GATE-1 → GATE-6. Artifact phụ thuộc
> kết quả chạy thật (`test-report.md`, `pentest-report.md`, `deploy-notes.md`, ảnh trong `user-guide.md`)
> hiện là **khung + phương pháp**, chưa có kết quả. Không có số liệu nào được bịa.

---

## Quyết định đã chốt

| # | Câu hỏi | Quyết định của anh Bryan | Ngày | Ảnh hưởng |
|---|---------|---------------------------|------|-----------|
| **Q3** | Cổng thanh toán | ✅ **VNPay + MoMo** | 2026-09-20 | ⚠️ Hai cổng này **không hỗ trợ tự động gia hạn** cho merchant thường → mô hình chuyển sang **mua từng kỳ + nhắc gia hạn thủ công**. Đã viết lại FR-28→FR-32 |
| **Q4** | Ngôn ngữ ký hiệu đầu tiên | ✅ **VSL (Ngôn ngữ Ký hiệu Việt Nam)** | 2026-09-20 | Toàn bộ nội dung là VSL; dùng bộ dữ liệu **VSL400** (Zenodo, CC BY 4.0) — **bắt buộc ghi nguồn trong sản phẩm** |
| **Q7** | Có tích hợp AI nhận diện chuyển động không | ✅ **CÓ — là tính năng cốt lõi** | 2026-09-20 | Thêm **module M10 (FR-41→FR-46)** và **dịch vụ AI riêng**. Tái dùng repo [`dathihi1/EXE101`](https://github.com/dathihi1/EXE101) |

### Tài sản kỹ thuật đã có sẵn (từ repo EXE101)

| Hạng mục | Giá trị thực đo | Nguồn |
|----------|------------------|-------|
| Mô hình khuyến nghị | `vsl_mvp30_v2_lite_transformer` — **30 lớp ký hiệu VSL** | `runs/vsl_mvp30_v2_lite_transformer/` |
| Độ chính xác | **top1 = 0.901 · top3 = 1.000 · macro-F1 = 0.895** | `docs/VSL_MVP_IMPLEMENTATION_RESULTS.md` |
| Cách chia tập | `group_shuffle_by_signer` *(không rò rỉ người ký hiệu — chia đúng chuẩn)* | idem |
| Dữ liệu | 701 mẫu / 30 lớp (MVP-30) · 1.126 mẫu / 50 lớp (MVP-50) | idem |
| Đặc trưng | **327 chiều × 64 khung** — schema `v2_holistic_subset` | `config.json` |
| Kích thước mô hình | ONNX FP32 ~1,00 MB · **INT8 ~0,40 MB** | idem |
| Độ trễ phân lớp | **~0,52 ms/mẫu** (CPU) — nút cổ chai là MediaPipe, không phải mô hình | idem |
| Mô hình mở rộng | MVP-50: top1 = 0.871 · top3 = 0.970 | idem |
| Hợp đồng API sẵn có | `POST /api/infer/frames` · `GET /api/labels` · `GET /api/sample/{i}` | `src/vsl_mvp/deploy_app.py` |

---

## Trạng thái artifact
Trạng thái: `NOT_STARTED` → `IN_PROGRESS` → `DONE` → `APPROVED` (hoặc `NEEDS_REVISION`)

| Artifact              | Role     | Trạng thái   | Cập nhật   | Ghi chú |
|-----------------------|----------|--------------|------------|---------|
| BRD.md                | BA       | DONE         | 2026-09-20 | v0.2 — VSL + AI + VNPay/MoMo |
| SRS.md                | BA       | DONE         | 2026-09-20 | v0.2 — **46 FR + 20 NFR** |
| function-map.html     | BA       | DONE         | 2026-09-20 | v0.2 — 12 module |
| techstack.md          | SA       | DONE         | 2026-09-20 | v0.2 — ⚠️ **Version chờ anh Bryan xác nhận** |
| HLD.md                | SA       | DONE         | 2026-09-20 | v0.2 — Modular monolith + **dịch vụ AI tách riêng**; 10 ADR |
| architecture.html     | SA       | DONE         | 2026-09-20 | v0.2 |
| FSD.md                | BA       | DONE         | 2026-09-20 | v0.2 — **35 màn hình** |
| LLD.md                | SA       | DONE         | 2026-09-20 | v0.2 — 30 bảng |
| api-spec.md           | SA       | DONE         | 2026-09-20 | v0.2 — **75 endpoint** |
| design.md             | Designer | DONE         | 2026-09-20 | v0.2 |
| scaffold-backend      | Backend  | NOT_STARTED  |            | B3 |
| scaffold-frontend     | Frontend | NOT_STARTED  |            | B3 |
| scaffold-ai           | AI/BE    | **CÓ SẴN**   | 2026-09-20 | Tái dùng `src/vsl_mvp/` của EXE101 |
| src (code)            | dev      | NOT_STARTED  |            | B4 |
| test-plan.md          | Tester   | DONE         | 2026-09-20 | v0.2 — thêm nhóm bất biến INV-6 |
| test-cases.md         | Tester   | DONE         | 2026-09-20 | v0.2 — **217 case**, phủ 46/46 FR; chưa chạy |
| test-report.md        | Tester   | IN_PROGRESS  | 2026-09-20 | Khung — **chưa chạy**, chờ B4 |
| pentest-report.md     | Security | IN_PROGRESS  | 2026-09-20 | Threat model xong — **chưa rà code**, chờ B5 |
| user-guide.md         | BA       | IN_PROGRESS  | 2026-09-20 | Bản thảo — **thiếu ảnh UAT**, chờ B6 |
| docker-compose.yml    | DevOps   | DONE         | 2026-09-20 | v0.2 — thêm service `ai`; ⚠️ **chờ dải port** |
| deploy-notes.md       | DevOps   | IN_PROGRESS  | 2026-09-20 | Runbook — chưa triển khai |

## Log phê duyệt (chỉ con người)
| Cổng   | Kết quả  | Người duyệt | Ngày | Ghi chú |
|--------|----------|-------------|------|---------|
| GATE-1 | — chờ    |             |      | Trình BRD v0.2 |
| GATE-2 | —        |             |      | Cần xác nhận version techstack (Q1) |
| GATE-3 | —        |             |      | Cần chốt vị trí suy luận AI (Q8) |
| GATE-4 | —        |             |      | Cần code + test chạy thật |
| GATE-5 | —        |             |      | Cần rà bảo mật trên code thật |
| GATE-6 | —        |             |      | Cần dải port UAT (Q2) |

## Hàng đợi thay đổi & sự cố
| Mã | Loại | Sev/Ưu tiên | Mô tả | Trạng thái | Cổng chờ | Cập nhật |
|----|------|-------------|-------|------------|----------|----------|
| CR-001 | Change Request | Cao | Bổ sung module AI nhận diện ký hiệu động (M10) trước GATE-1 | Đã đưa vào tài liệu | GATE-1 | 2026-09-20 |
| CR-002 | Change Request | Cao | Đổi cổng thanh toán sang VNPay + MoMo, bỏ tự động gia hạn | Đã đưa vào tài liệu | GATE-1 | 2026-09-20 |

## Lịch sử phát hành
| Version | Ngày | Phạm vi | Người duyệt | Kết quả | Rollback |
|---------|------|---------|-------------|---------|----------|
| —       |      | *(chưa phát hành)* |   |         |          |

## Thông số môi trường
- **Dải port UAT (anh Bryan cấp):** ❓ *chưa có — cần **5–6 port** (api, web, ai, storage, storage-console)*
- **Môi trường:** dev (local) · uat (Docker Compose) · prod (chưa định hướng hạ tầng)

## Câu hỏi mở đang chờ anh Bryan quyết

| # | Câu hỏi | Ảnh hưởng | Artifact liên quan |
|---|---------|-----------|--------------------|
| **Q8** | **Suy luận AI chạy ở đâu?** (A) Toàn bộ trong trình duyệt — ảnh không rời máy, cần port MediaPipe Holistic + ONNX sang web; (B) **Trình duyệt trích landmark, gửi tensor 64×327 lên server** — không có pixel rời máy, đổi mô hình không cần đổi client *(SA khuyến nghị)*; (C) Gửi 8–32 ảnh JPEG lên server như repo hiện tại — dùng lại được ngay nhưng pixel rời máy | **Chặn GATE-3** — quyết định này định hình NFR-12, HLD §2, FR-41 | HLD ADR-08, SRS NFR-12 |
| **Q9** | Có bật tính năng **"Góp dữ liệu luyện tập"** (người dùng tự nguyện cho phép lưu clip để cải thiện mô hình) không? Đây là cách thực tế nhất để tăng 701 mẫu lên mức đủ tốt | Chất lượng mô hình dài hạn; nghĩa vụ đồng ý theo PDPL | SRS FR-46, pentest DR-07 |
| **Q10** | 30 ký hiệu của MVP-30 có được dùng làm **giáo trình khởi điểm** không? *(Nhãn hiện tại nghiêng về chủ đề gia đình/đồ vật/thời tiết — xem BRD §3.1)* | Thiết kế chương trình học | BRD §3, SRS FR-41 |
| **Q11** | Ưu tiên **mở rộng lên MVP-50** hay **tăng độ chính xác MVP-30** trước? | Lộ trình nội dung AI | BRD §8 R-09 |
| Q1 | Xác nhận **version** từng dòng trong `techstack.md` | Chặn GATE-2 | docs/sa/techstack.md |
| Q2 | Dải port UAT (5–6 port) | Chặn GATE-6 | deploy/docker-compose.yml |
| Q5 | Nguồn video bài học ngoài 30 ký hiệu của VSL400 | Chi phí & tiến độ lớn nhất | BRD §6, §8 |
| Q6 | GĐ1 có gồm B2B & đặt lịch tutor không? | ±6 tuần công | BRD §3 |

## Nhật ký (append-only)
- 2026-09-20 — PO khởi tạo dự án, phân loại **Track A (dự án mới)**, chọn cấu trúc thư mục **kiểu A**.
- 2026-09-20 — Nghiên cứu đối thủ Lingvano ASL (marketing, onboarding 11 bước, help center, Play Store, design token) làm đầu vào BRD/SRS v0.1.
- 2026-09-20 — BA/SA/Designer/Tester/Security/DevOps soạn bản nháp đầy đủ B1→B6 (v0.1).
- 2026-09-20 — **Anh Bryan chốt Q3 = VNPay + MoMo, Q4 = VSL, Q7 = có module AI.** Cung cấp repo `dathihi1/EXE101`.
- 2026-09-20 — Khảo sát **dashboard thật** của Lingvano sau khi anh Bryan đăng nhập → phát hiện 5 điểm khác với giả định v0.1 (xem BRD §9).
- 2026-09-20 — Nghiên cứu repo EXE101: mô hình MVP-30 (top1 0.901), schema 327 chiều, hợp đồng `/api/infer/frames`. Cập nhật toàn bộ tài liệu lên **v0.2**.
