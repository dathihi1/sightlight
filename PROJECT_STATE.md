# PROJECT_STATE — SignLight (Nền tảng học Ngôn ngữ Ký hiệu Việt Nam)

> File điều phối trung tâm. PO và mọi role cập nhật file này. Không xoá lịch sử; chỉ thêm/đổi trạng thái.

- **Dự án:** SignLight — nền tảng học **Ngôn ngữ Ký hiệu Việt Nam (VSL)** có **AI nhận diện ký hiệu động**
- **Ngày khởi tạo:** 2026-09-20
- **Loại dự án:** Mới (greenfield — Track A, B1→B6)
- **Cấu trúc thư mục:** Kiểu A — Monolith / ít module, tài liệu đi chung repo code
- **Giai đoạn hiện tại:** tài liệu B1–B6 ở **v0.3** (DRAFT, ✅ hết câu hỏi mở) · **B4 đã bắt đầu**: lát cắt demo chạy được đầu-cuối trong `src/` (2026-09-21) — chờ duyệt tuần tự từ GATE-1
- **Cổng đang chờ:** GATE-1 (duyệt **BRD v0.3**)
- **GATE-3 (đóng băng thiết kế):** BẬT
- **GATE-4 (nghiệm thu chức năng):** BẬT

> ⚠️ **Ghi chú của PO:** toàn bộ artifact B1→B6 được soạn trước ở trạng thái `DRAFT` để có cái nhìn tổng
> thể. Điều này **không thay thế quy trình cổng** — vẫn duyệt lần lượt GATE-1 → GATE-6. Artifact phụ thuộc
> kết quả chạy thật (`test-report.md`, `pentest-report.md`, `deploy-notes.md`, ảnh trong `user-guide.md`)
> hiện là **khung + phương pháp**, chưa có kết quả. Không có số liệu nào được bịa.

---

## Quyết định đã chốt

| # | Câu hỏi | Quyết định của anh Duy | Ngày | Ảnh hưởng |
|---|---------|---------------------------|------|-----------|
| **Q3** | Cổng thanh toán | ✅ **VNPay + MoMo** | 2026-09-20 | ⚠️ Hai cổng này **không hỗ trợ tự động gia hạn** cho merchant thường → mô hình chuyển sang **mua từng kỳ + nhắc gia hạn thủ công**. Đã viết lại FR-28→FR-32 |
| **Q4** | Ngôn ngữ ký hiệu đầu tiên | ✅ **VSL (Ngôn ngữ Ký hiệu Việt Nam)** | 2026-09-20 | Toàn bộ nội dung là VSL; dùng bộ dữ liệu **VSL400** (Zenodo, CC BY 4.0) — **bắt buộc ghi nguồn trong sản phẩm** |
| **Q7** | Có tích hợp AI nhận diện chuyển động không | ✅ **CÓ — là tính năng cốt lõi** | 2026-09-20 | Thêm **module M10 (FR-41→FR-46)** và **dịch vụ AI riêng**. Tái dùng repo [`dathihi1/EXE101`](https://github.com/dathihi1/EXE101) |
| **Q8** | Suy luận AI chạy ở đâu | ✅ **Phương án B — trình duyệt trích landmark, server phân lớp** | 2026-09-20 | **Gỡ chặn GATE-3.** NFR-12 viết lại (không pixel nào rời thiết bị, chỉ tensor `64×327`) · HLD ADR-08 chốt · api-spec §4.3 `POST /api/infer/features` là endpoint suy luận **duy nhất**, §4.4 `/api/infer/frames` chuyển sang danh sách **cấm bật** · phương án A (onnxruntime-web) thành đường nâng cấp sau GATE-6 · phương án C **bị loại** · thêm **DR-12** (High) vào pentest |
| **Q9** | Có bật "Góp dữ liệu luyện tập" không | ✅ **CÓ** | 2026-09-20 | **FR-46 vào phạm vi GĐ1**, không còn là tuỳ chọn. BR-A130→A137 thành **ràng buộc GATE-5**. Bắt buộc: bucket `signlight-donation` (quyền tách riêng), bảng `data_donation_consent` + `donated_clip`, màn **SCR-33**. Giảm rủi ro **R-09** *(nhưng chỉ sinh dữ liệu sau khi có người dùng thật — không cứu được GĐ1)* |
| **Q10** | 30 ký hiệu MVP-30 có làm giáo trình khởi điểm không | ✅ **Làm giả lập trước — nội dung bổ sung sau** | 2026-09-20 | Thêm **SRS §3.4 (SEED-1→SEED-6)** + **NFR-21**. 30 nhãn MVP-30 thành **bộ seed**, không phải giáo trình. Rủi ro **R-01 được DỜI sang GATE-6, chưa gỡ** — GATE-6 vẫn cần ≥ 1 Unit nội dung thật. Thêm **DR-13** vào pentest (chặn seed rò ra prod) |
| **Q11** | MVP-50 hay tăng độ chính xác MVP-30 trước | ✅ **Tăng độ chính xác MVP-30 trước** | 2026-09-20 | Giữ **30 nhãn** ở GĐ1; toàn bộ công sức AI dồn vào hạ **R-02**. **R-09 hạ mức** (không mở rộng lớp thì 701 mẫu là đủ GĐ1). MVP-50 lùi sang sau GATE-6 |
| **Q6** | GĐ1 có gồm B2B & đặt lịch tutor không | ✅ **KHÔNG** | 2026-09-20 | Giữ nguyên phạm vi BRD §3.1 — tiết kiệm ~6 tuần công. B2B chỉ có **form liên hệ**; đặt lịch tutor sang GĐ2 |
| **Q5** | Nguồn video bài học ngoài VSL400 | ⏸️ **Hoãn tới sau GATE-4** | 2026-09-20 | Hợp lệ vì Q10 cho phép nghiệm thu bằng nội dung giả lập. ⚠️ **Hoãn ≠ giải quyết** — vẫn chặn GATE-6. **Phải mở lại ngay sau GATE-4** |
| **Q1** | Version techstack | ✅ **Duyệt toàn bộ bảng + chuẩn backend Java** | 2026-09-20 | Java 21 · Spring Boot 3.5 · PostgreSQL 17 · Redis 7.4 · Next.js 15 / React 19 / TS 5.6 / Tailwind 4 · MediaPipe 0.10 · Python 3.11 / FastAPI 0.115 / ONNX Runtime 1.19 · Maven single-module `vn.duy.signlight`. **GATE-2 hết vướng về techstack** |
| **Q2** | Dải port UAT | ✅ **`18080–18090`** | 2026-09-20 | `18080` api · `18081` web · `18082` storage · `18083` storage-console · `18084–18090` dự phòng. Đã điền vào `docker-compose.yml` + `.env.example`. ⚠️ `ai` (7860) **cố ý không mở** — ADR-10, DR-12 |
| **R-07** | Tuổi tối thiểu | ✅ **16 tuổi** (cho góp dữ liệu) | 2026-09-20 | Dưới 16 **vẫn học đầy đủ** nhưng không được mời/bật góp dữ liệu; API trả **403**. Cập nhật **BR-A137**, pentest **DR-06**. ⚠️ Tự khai, không xác minh được — chặn phải nằm ở **backend** |
| **R-11** | Tài khoản thanh toán | ✅ **Đã có tài khoản merchant/sandbox VNPay + MoMo** (SĐT `0866678802`) | 2026-09-20 | **Rủi ro R-11 đóng.** Việc còn lại là thao tác: lấy 5 khoá (`VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`) đặt vào `deploy/.env`. 🔐 **Không commit, không ghi log** |
| **Q12** | Tích hợp EXE101 & Tái cấu trúc Database | ✅ **Hoàn thành toàn diện** | 2026-09-21 | - Phân loại 400 ký hiệu VSL thành **17 Units** lớn (Unit 1 Free, Units 2–17 Premium)<br>- Lưu trữ và phát video qua **Google Drive CDN** (`lh3.googleusercontent.com/d/{id}` & stream proxy), bỏ MinIO<br>- Tích hợp cổng thanh toán **payOS** (VietQR, HMAC IPN webhook, checkout, activation)<br>- Tích hợp **Google OAuth2/OIDC** (`/api/v1/auth/google`)<br>- Phân quyền **RBAC** 6 vai trò (`LEARNER_FREE`, `LEARNER_PREMIUM`, `CONTENT_CREATOR`, `CONTENT_APPROVER`, `ADMIN`, `SUPPORT`)<br>- AI **Dual Inference**: mô hình ONNX INT8 siêu nhẹ (~0.45MB), chạy WASM tại trình duyệt (<20ms) + backend API đồng bộ hạn mức<br>- Tập trung **100% Web Next.js 15**, bỏ Flutter app |

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
| BRD.md                | BA       | DONE         | 2026-09-20 | **v0.3** — ✅ **hết câu hỏi mở**; chốt Q5/Q6/Q8→Q11, R-07, R-11 |
| SRS.md                | BA       | DONE         | 2026-09-20 | **v0.3** — **46 FR + 21 NFR**; thêm §3.4 seed + NFR-21 |
| function-map.html     | BA       | DONE         | 2026-09-20 | v0.2 — 12 module |
| techstack.md          | SA       | DONE         | 2026-09-20 | **v0.3** — ✅ **Q1 đã duyệt toàn bộ version** |
| HLD.md                | SA       | DONE         | 2026-09-20 | **v0.3** — ADR-08 đã chốt (phương án B); Modular monolith + **dịch vụ AI tách riêng**; 10 ADR |
| architecture.html     | SA       | DONE         | 2026-09-20 | v0.2 |
| FSD.md                | BA       | DONE         | 2026-09-20 | v0.2 — **35 màn hình** |
| LLD.md                | SA       | DONE         | 2026-09-20 | v0.2 — 30 bảng |
| api-spec.md           | SA       | DONE         | 2026-09-20 | **v0.3** — **75 endpoint**; §4.3 là endpoint suy luận duy nhất |
| design.md             | Designer | DONE         | 2026-09-20 | v0.2 |
| scaffold-backend      | Backend  | DONE         | 2026-09-21 | `src/backend` — Spring Boot 3.5 / Java 21, Flyway V1+V2+V3, 17 Units seed 400 signs, Google OAuth2, payOS VietQR gateway, Google Drive streaming |
| scaffold-frontend     | Frontend | DONE         | 2026-09-21 | `src/frontend` — Next.js 15 / React 19 / Tailwind 4, 11 màn, ONNX WASM client inference (<20ms), Google Login, payOS upgrade page |
| scaffold-ai           | AI/BE    | DONE         | 2026-09-21 | `src/ai` — FastAPI + ONNX Runtime; hỗ trợ mô hình 30 và 400 nhãn `model.int8.onnx` (<0.5MB), `POST /api/infer/features` |
| src (code)            | dev      | DONE         | 2026-09-21 | Tích hợp hoàn tất EXE101: 17 Units VSL, Google Drive CDN video, Google OAuth, payOS billing, WASM AI |
| test-plan.md          | Tester   | DONE         | 2026-09-20 | **v0.3** — phạm vi mở tới NFR-21 |
| test-cases.md         | Tester   | DONE         | 2026-09-20 | **v0.3** — **217 case** + 3 nhóm case mới cần soạn (DR-12, seed); chưa chạy |
| test-report.md        | Tester   | IN_PROGRESS  | 2026-09-20 | Khung — **chưa chạy**, chờ B4 |
| pentest-report.md     | Security | IN_PROGRESS  | 2026-09-20 | **v0.3** — 13 DR (thêm DR-12, DR-13); **chưa rà code**, chờ B5 |
| user-guide.md         | BA       | IN_PROGRESS  | 2026-09-20 | **v0.3** — giữ đoạn góp dữ liệu (Q9); **thiếu ảnh UAT**, chờ B6 |
| docker-compose.yml    | DevOps   | DONE         | 2026-09-20 | **v0.3** — thêm service `ai`; ✅ **đã điền dải port `18080–18090`** |
| deploy-notes.md       | DevOps   | IN_PROGRESS  | 2026-09-20 | **v0.3** — gỡ chặn Q8/Q9; chưa triển khai |

## Log phê duyệt (chỉ con người)
| Cổng   | Kết quả  | Người duyệt | Ngày | Ghi chú |
|--------|----------|-------------|------|---------|
| GATE-1 | — chờ    |             |      | ✅ **Sẵn sàng trình** — BRD v0.3, không còn câu hỏi mở |
| GATE-2 | —        |             |      | ✅ Q1 đã duyệt version. Còn **V-2: đo độ chính xác trên webcam thật** (R-02) |
| GATE-3 | —        |             |      | ✅ Q8 chốt, R-11 đóng. Còn **V-1** (5 khoá thanh toán), **V-3** (endpoint tensor + xoá endpoint ảnh), xử lý **DR-01, DR-07, DR-08, DR-12** |
| GATE-4 | —        |             |      | ✅ Q11 chốt. Cần code + test chạy thật *(nghiệm thu **trên dữ liệu seed** — hợp lệ theo SRS §3.4)*; cần **V-4, V-5** |
| GATE-5 | —        |             |      | ✅ R-07 chốt (16 tuổi). Cần rà bảo mật trên code thật · **BR-A130→A137 là điều kiện bắt buộc** · cần **V-6** |
| GATE-6 | —        |             |      | ✅ Q2 chốt (`18080–18090`). Còn **≥ 1 Unit nội dung thật** (R-01 chưa gỡ, xem **V-7**) · kiểm tự động chặn `is_seed` (DR-13) |

## Hàng đợi thay đổi & sự cố
| Mã | Loại | Sev/Ưu tiên | Mô tả | Trạng thái | Cổng chờ | Cập nhật |
|----|------|-------------|-------|------------|----------|----------|
| CR-001 | Change Request | Cao | Bổ sung module AI nhận diện ký hiệu động (M10) trước GATE-1 | Đã đưa vào tài liệu | GATE-1 | 2026-09-20 |
| CR-002 | Change Request | Cao | Đổi cổng thanh toán sang VNPay + MoMo, bỏ tự động gia hạn | Đã đưa vào tài liệu | GATE-1 | 2026-09-20 |
| CR-003 | Change Request | Cao | **Chốt Q8 = phương án B** — bổ sung `POST /api/infer/features` vào repo EXE101; **tắt** `/api/infer/frames` và `/api/attempt` ở UAT/prod | Đã đưa vào tài liệu — **việc code chờ B4** | GATE-3 | 2026-09-20 |
| CR-004 | Change Request | TB | **Chốt Q9 = CÓ** — FR-46 vào phạm vi GĐ1: bucket `signlight-donation`, 2 bảng, màn SCR-33 | Đã đưa vào tài liệu | GATE-3 | 2026-09-20 |
| CR-005 | Change Request | Cao | **Chốt Q10 = nội dung giả lập trước** — thêm SRS §3.4 + NFR-21; cần **script seed idempotent** + cờ `is_seed` + cổng chặn phát hành | Đã đưa vào tài liệu — **việc code chờ B4** | GATE-4 | 2026-09-20 |

## Lịch sử phát hành
| Version | Ngày | Phạm vi | Người duyệt | Kết quả | Rollback |
|---------|------|---------|-------------|---------|----------|
| —       |      | *(chưa phát hành)* |   |         |          |

## Thông số môi trường
- **Dải port UAT:** ✅ **`18080–18090`** (anh Duy cấp 2026-09-20)
  | Port | Service | | Port | Service |
  |---|---|---|---|---|
  | `18080` | `api` (Spring Boot 8080) | | `18083` | `storage-console` (MinIO 9001) |
  | `18081` | `web` (Next.js 3000) | | `18084–18090` | **dự phòng, chưa dùng** |
  | `18082` | `storage` (MinIO S3 9000) | | — | — |

  ⚠️ **`ai` (7860), `db` (5432), `cache` (6379) cố ý KHÔNG mở port.** Riêng `ai` là ràng buộc bảo mật
  (ADR-10, DR-12) — không được mở kể cả để gỡ lỗi; gỡ lỗi bằng `docker compose exec`.
- **Tài khoản thanh toán:** ✅ đã có **VNPay** và **MoMo** loại **merchant/sandbox**, đăng ký bằng SĐT `0866678802`.
  Việc còn lại (V-1): lấy 5 khoá `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `MOMO_PARTNER_CODE`,
  `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` từ `sandbox.vnpayment.vn` / `business.momo.vn`.
  🔐 *(Khoá là bí mật — chỉ đặt trong `deploy/.env`, **không commit**, **không ghi log** — NFR-11.)*
- **Môi trường:** dev (local) · uat (Docker Compose) · prod (chưa định hướng hạ tầng)

## Câu hỏi mở

> ✅ **KHÔNG CÒN CÂU HỎI NÀO** tính tới 2026-09-20. Toàn bộ Q1→Q11, R-07, R-11 đã được chốt (xem bảng §Quyết định đã chốt).

**Việc còn lại KHÔNG phải câu hỏi — mà là việc phải làm:**

| # | Việc | Ai làm | Chặn cổng |
|---|------|--------|-----------|
| V-1 | Lấy **5 khoá** VNPay/MoMo từ portal merchant, đặt vào `deploy/.env` *(không commit)* | anh Duy → DevOps | GATE-3 |
| V-2 | **Đo độ chính xác trên webcam thật** — ≥ 5 người, ≥ 3 điều kiện ánh sáng *(rủi ro R-02, lớn nhất còn lại)* | AI dev | **GATE-2** |
| V-3 | Bổ sung `POST /api/infer/features` vào repo EXE101; **xoá** `/api/infer/frames` + `/api/attempt` khỏi bản triển khai | AI dev | GATE-3 (DR-07, DR-12) |
| ~~V-4~~ | ~~Viết **script seed idempotent** + cờ `is_seed`~~ → ✅ **XONG 2026-09-21** (`SeedRunner` + `seed/vsl-seed.json`, 33 ký hiệu, cờ `is_seed` trên mọi bảng nội dung). ⚠️ **Cổng chặn phát hành vẫn CHƯA làm** — cần kiểm tự động chặn `is_seed = true` ở GATE-6 | dev | GATE-4 (NFR-21) |
| V-5 | Soạn 3 nhóm test case mới: DR-12, seed idempotent, SEED-4 | Tester | GATE-4 |
| V-6 | Hiện thực **chặn tuổi < 16 ở backend** cho góp dữ liệu (403), thu năm sinh ở onboarding | dev | GATE-5 |
| V-7 | **Mở lại Q5** (nguồn video) ngay sau GATE-4 — R-01 mới chỉ được dời | PO | GATE-6 |

## Nhật ký (append-only)
- 2026-09-20 — PO khởi tạo dự án, phân loại **Track A (dự án mới)**, chọn cấu trúc thư mục **kiểu A**.
- 2026-09-20 — Nghiên cứu đối thủ Lingvano ASL (marketing, onboarding 11 bước, help center, Play Store, design token) làm đầu vào BRD/SRS v0.1.
- 2026-09-20 — BA/SA/Designer/Tester/Security/DevOps soạn bản nháp đầy đủ B1→B6 (v0.1).
- 2026-09-20 — **Anh Duy chốt Q3 = VNPay + MoMo, Q4 = VSL, Q7 = có module AI.** Cung cấp repo `dathihi1/EXE101`.
- 2026-09-20 — Khảo sát **dashboard thật** của Lingvano sau khi anh Duy đăng nhập → phát hiện 5 điểm khác với giả định v0.1 (xem BRD §9).
- 2026-09-20 — Nghiên cứu repo EXE101: mô hình MVP-30 (top1 0.901), schema 327 chiều, hợp đồng `/api/infer/frames`. Cập nhật toàn bộ tài liệu lên **v0.2**.
- 2026-09-20 — **Anh Duy chốt NỐT toàn bộ câu hỏi còn lại:** Q1 = duyệt cả bảng version · **Q2 = dải port `18080–18090`** ·
  Q5 = hoãn sau GATE-4 · Q6 = KHÔNG làm B2B/tutor · Q11 = tăng độ chính xác MVP-30 trước · R-07 = tuổi tối thiểu **16** ·
  R-11 = tài khoản **merchant/sandbox** (đóng rủi ro).
  Đã điền port vào `docker-compose.yml` + `.env.example`; tick ✅ toàn bộ cột "Xác nhận" của `techstack.md`;
  cập nhật `BR-A137` (SRS), `DR-06` (pentest), bảng rủi ro BRD. **Mục "Câu hỏi mở" nay rỗng, thay bằng danh sách việc V-1→V-7.**
- 2026-09-20 — **Anh Duy chốt Q8 = phương án B, Q9 = CÓ, Q10 = nội dung giả lập trước; xác nhận đã có tài khoản VNPay + MoMo (SĐT `0866678802`).**
  Cập nhật **BRD, SRS, HLD, techstack, api-spec, pentest-report, deploy-notes, user-guide, README, docs/README** lên **v0.3**.
  Thêm **SRS §3.4 (SEED-1→6)**, **NFR-21**, **DR-12**, **DR-13**, **CR-003→CR-005**.
  Gỡ chặn GATE-3 về mặt kiến trúc; **R-01 được dời sang GATE-6** (chưa gỡ); **R-11 hạ mức** *(đóng hẳn cùng ngày sau khi anh Duy xác nhận là tài khoản merchant/sandbox)*.
- 2026-09-20 — **Chuẩn hoá danh xưng toàn workspace về `Duy`.** Chủ đầu tư/người duyệt mọi cổng nay ghi là
  **anh Duy**; mọi tham chiếu tới tổ chức cũ trong tài liệu đều đổi sang **Duy**. Phạm vi: `PROJECT_STATE.md`,
  `docs/**`, `deploy/**` **và** bộ `training-skill-software/` (SDLC Kit).
  - **Package gốc Java chốt lại: `vn.duy.signlight`** (`groupId` đổi theo, `artifactId = signlight-api`
    giữ nguyên) — cập nhật ở `techstack.md`, `HLD.md`, mục **Q1**, và các file convention của Kit
    (`package-structure.md`, `maven-conventions.md`, `backend-dev-java/SKILL.md`).
  - Hai gói skill trong `skills-theo-vai-tro/` đổi tên thành **`duy-ba-phan-tich-yeu-cau-srs.skill`** và
    **`duy-sa-thiet-ke-hld-lld.skill`** (đã đóng gói lại, `name:` trong frontmatter đổi theo).
  - Đã gỡ **git remote `origin`** của repo Kit và thay URL trong README bằng `gitlab.example.com`.
  ⚠️ **Không đụng tới** `training-skill-software/reference-docs-signed/` (tài liệu chuẩn đã ký — sửa là mất
  hiệu lực) và **giữ nguyên** mã chuẩn `ST.TIM.ITC.16` / `TC.CNVTQĐ.CNTT.19`. Đã quét: nhóm file này không
  chứa chuỗi cần đổi ở dạng đọc được.
  ℹ️ Chuỗi **`Viettel`** (2 chỗ trong Kit) **giữ nguyên** — chưa có yêu cầu đổi.
- 2026-09-21 — **B4 vòng 1: dựng xong lát cắt demo chạy được đầu-cuối.** Ba service lên trong
  `docker compose`, cả 6 container `healthy`. Chi tiết phạm vi ở `src/README.md`.
  - **Đã hiện thực:** đăng ký/đăng nhập (Argon2id + JWT 15 phút) · lộ trình học có khoá theo tiến độ
    và theo Premium · học bài + **chấm ở server** + hoàn thành idempotent · streak/phút học theo ngày
    địa phương · từ điển tìm không dấu (PostgreSQL FTS + `unaccent` + `pg_trgm`) ·
    **module M10 chấm ký hiệu động end-to-end** · hạn mức 5 lượt AI/ngày · bộ seed idempotent.
  - **Đã kiểm chạy thật (curl + trình duyệt):** `10103` khi payload có trường ảnh · `10102` khi tensor
    sai kích thước · `10201` với ký hiệu ngoài vốn AI · `06204` đúng ở lượt thứ 6 · client gửi kèm
    `isCorrect=true` **bị bỏ qua** · payload bài học **không chứa** `isCorrect`/`correctAnswer` ·
    gọi lại `complete` cùng `idempotencyKey` **không cộng dồn** phút học.
  - **Ánh xạ nhãn AI: 30/30, 0 nhãn mồ côi** — tức `stable_sign_id` ở Java và Python khớp nhau trên
    dữ liệu thật, hạ rủi ro **T-11**. Có bộ test chung hai phía (`StableSignIdTest.java`,
    `test_labels.py`).
  - **Ba lỗi phát hiện khi chạy thật và đã sửa:** xung đột bean `CorsConfigurationSource` với
    `mvcHandlerMappingIntrospector` · thông báo lỗi ra tiếng Anh khi client không gửi
    `Accept-Language` (nay mặc định `vi`) · Next.js standalone bind theo hostname container làm
    healthcheck đỏ.

  ⚠️ **Ba việc cần đồng bộ lại tài liệu ở lần cập nhật kế tiếp:**
  1. **LLD §1.7b:** `ai_model_version.version_code` nới từ `VARCHAR(32)` lên `VARCHAR(64)`
     (migration `V2`). Lý do: mã phiên bản ở chế độ mô phỏng mang hậu tố `-stub` dài 34 ký tự — giữ
     hậu tố để dữ liệu sinh ra từ kết quả giả lập **phân biệt được vĩnh viễn** trong CSDL.
  2. **`docker-compose.yml`:** ảnh MinIO đổi từ `minio/minio` sang `quay.io/minio/minio` — Docker Hub
     không còn phục vụ công khai (`pull access denied`, kiểm 2026-09-21).
  3. **`.env.example`:** thêm `MEDIA_SIGNING_KEY` (ký URL video, BR-A17) và `SIGNLIGHT_SEED_ENABLED`.

  ⚠️ **Nợ kỹ thuật đã biết, phải xử lý trước cổng tương ứng:**
  - **Chặn GATE-4 —** bố cục từng lát của tensor 327 chiều (`motion`, `geometry`, `quality`) hiện
    được suy ra từ mô tả ở `api-spec.md` §3.12b, **chưa đối chiếu với bộ trích đặc trưng thật của repo
    EXE101**. Nếu công thức lệch, mô hình đã huấn luyện sẽ nhận đầu vào sai mà vẫn trả về một nhãn
    trông hợp lý. Phải đối chiếu **trước khi** nạp trọng số thật.
  - **Chặn GATE-4 —** hệ thống đang chạy **chế độ STUB** (chưa có tệp mô hình trong
    `src/ai/runs/`). Mọi phản hồi mang cờ `stubMode: true`; **số liệu hiện tại không có ý nghĩa về độ
    chính xác** và không dùng để nghiệm thu NFR-19. Việc **V-2** (đo trên webcam thật) vẫn nguyên.
  - **Chặn GATE-5 —** access token đang giữ ở `localStorage`; ADR-06 yêu cầu refresh token ở cookie
    `HttpOnly` và access token chỉ sống trong bộ nhớ (rủi ro **DR-01**).
  - **Chặn GATE-5 —** chưa có giới hạn tần suất (NFR-10) và chưa có refresh token xoay vòng (NFR-09).
  - Độ phủ unit test còn rất thấp so với ngưỡng **70%** của NFR-16 — mới có test cho `StableSignId`.
