# Bản đồ tài liệu — SignLight

Bộ tài liệu này (phiên bản **v0.2**) được sinh theo **Mytel SDLC Kit** (`training-skill-software/software-development-skills/`),
cấu trúc **kiểu A** — tài liệu đi chung repo code, phẳng theo vai trò.

**Nguồn sự thật về quy trình:** `training-skill-software/software-development-skills/WORKFLOW.md`
**Trạng thái dự án:** [`../PROJECT_STATE.md`](../PROJECT_STATE.md) ← *đọc file này đầu tiên mỗi phiên làm việc*

---

## 1. Đọc theo thứ tự nào

```
BRD ──► SRS ──┬──► techstack ──► HLD ──┬──► LLD ──► api-spec ──┬──► code
              │                         │                       │
              │                         └──► architecture.html  ├──► test-plan ──► test-cases
              │                                                 │
              └──► function-map.html    design.md ──► FSD ──────┘
```

| Bạn là | Đọc trước | Rồi đọc |
|--------|-----------|---------|
| **Chủ đầu tư / PO** | `PROJECT_STATE.md` → `ba/BRD.md` → `ba/function-map.html` | `sa/architecture.html` |
| **BA** | `ba/BRD.md` → `ba/SRS.md` | `ba/FSD.md` |
| **SA** | `ba/SRS.md` → `sa/techstack.md` → `sa/HLD.md` | `sa/LLD.md`, `sa/api-spec.md` |
| **Designer** | `ba/SRS.md` | `design/design.md` |
| **Backend dev** | `ba/SRS.md`, `sa/techstack.md`, `sa/HLD.md` | `sa/LLD.md`, `sa/api-spec.md` |
| **AI dev** 🤖 | `sa/HLD.md` §1 & ADR-08→10, `ba/SRS.md` §3.3 (FR-41→46) | `sa/api-spec.md` §4 (hợp đồng dịch vụ AI), `qa/test-plan.md` §2.3 |
| **Frontend dev** | `ba/SRS.md`, **`ba/FSD.md`** | `design/design.md`, `sa/api-spec.md` |
| **Tester** | `ba/SRS.md`, `ba/FSD.md`, `sa/api-spec.md` | `qa/test-plan.md`, `qa/test-cases.md` |
| **Security** | `sa/HLD.md`, `sa/LLD.md`, `sa/api-spec.md` | `security/pentest-report.md` |
| **DevOps** | `sa/techstack.md`, `sa/HLD.md` | `../deploy/` |

## 2. Danh mục tài liệu

| Tệp | Vai trò | Giai đoạn | Trả lời câu hỏi gì | Trạng thái |
|-----|---------|:---------:|---------------------|------------|
| [`../PROJECT_STATE.md`](../PROJECT_STATE.md) | PO | xuyên suốt | Đang ở đâu? Chờ duyệt gì? Còn câu hỏi nào chưa trả lời? | Sống |
| [`ba/BRD.md`](ba/BRD.md) | BA | B1 | **Vì sao** làm? Mục tiêu kinh doanh? Phạm vi tới đâu? | v0.2 — chờ GATE-1 |
| [`ba/SRS.md`](ba/SRS.md) | BA | B2 | Hệ thống phải làm **gì**? **46 FR + 20 NFR**, đủ chi tiết để code | v0.2 — chờ GATE-2 |
| [`ba/function-map.html`](ba/function-map.html) | BA | B2 | Bản đồ chức năng: **12 module**, độ phủ đặc tả | v0.2 |
| [`sa/techstack.md`](sa/techstack.md) | SA | B2 | Dùng công nghệ gì, **version nào**, vì sao? | ⚠️ v0.2 — **chờ xác nhận version (Q1)** |
| [`sa/HLD.md`](sa/HLD.md) | SA | B2 | Kiến trúc kiểu gì? Các khối ghép ra sao? **10 ADR** | v0.2 — chờ GATE-2 |
| [`sa/architecture.html`](sa/architecture.html) | SA | B2 | Sơ đồ kiến trúc khối "dễ nhìn" đi kèm HLD | v0.2 |
| [`ba/FSD.md`](ba/FSD.md) | BA | B3 | Từng **màn hình** hành xử ra sao? **35 SCR** + ma trận truy vết | v0.2 — chờ GATE-3 |
| [`sa/LLD.md`](sa/LLD.md) | SA | B3 | Bảng dữ liệu, lớp, luồng, mã lỗi | v0.2 — chờ GATE-3 |
| [`sa/api-spec.md`](sa/api-spec.md) | SA | B3 | Hợp đồng API — **75 endpoint** + hợp đồng nội bộ với dịch vụ AI | v0.2 — chờ GATE-3 |
| [`design/design.md`](design/design.md) | Designer | B3 | Design token, user flow, wireframe, khả năng tiếp cận | v0.2 — chờ GATE-3 |
| [`qa/test-plan.md`](qa/test-plan.md) | Tester | B3–B4 | Kiểm thử thế nào? Tiêu chí vào/ra? **Quy trình kiểm chất lượng mô hình AI** | v0.2 |
| [`qa/test-cases.md`](qa/test-cases.md) | Tester | B3–B4 | **264 test case**, phủ 46/46 FR | v0.2 — **chưa chạy** |
| [`qa/test-report.md`](qa/test-report.md) | Tester | B4 | Kết quả kiểm thử | ⚠️ Khung — **chưa chạy** |
| [`security/pentest-report.md`](security/pentest-report.md) | Security | B5 | Threat model, OWASP, findings | ⚠️ Threat model xong — **chưa rà code** |
| [`ba/user-guide.md`](ba/user-guide.md) | BA | B6 | HDSD cho người học | ⚠️ Bản thảo — **chưa có ảnh UAT** |
| [`../deploy/docker-compose.yml`](../deploy/docker-compose.yml) | DevOps | B6 | Chạy UAT thế nào | ⚠️ DONE — **chờ dải port** |
| [`../deploy/deploy-notes.md`](../deploy/deploy-notes.md) | DevOps | B6 | Runbook triển khai & xử lý sự cố | ⚠️ Runbook — **chưa triển khai** |

## 3. Quy tắc giữ tài liệu không lệch nhau

1. **Mỗi tài liệu có đúng một chủ.** Không role nào sửa output của role khác — cần đổi thì báo PO.
2. **Thứ tự ưu tiên khi mâu thuẫn:** `BRD > SRS > FSD` (nghiệp vụ) và `SRS > HLD > LLD > api-spec` (kỹ thuật).
   Phát hiện mâu thuẫn → **dừng, sửa tài liệu cấp trên trước**.
3. **`LLD.md` là nguồn sự thật về tên bảng/trường.** `api-spec.md` và code phải khớp.
4. **`LLD.md` §5.1 là nguồn sự thật về mã lỗi.** Không tự chế mã mới ở FSD hay ở code.
5. **`api-spec.md` là hợp đồng API.** OpenAPI sinh từ code (springdoc) dùng để **đối chiếu** ở GATE-4; mâu
   thuẫn thì file đã duyệt thắng. **Không viết YAML tay.**
6. Thay đổi sau khi qua cổng → đi theo **Luồng Change Request** của `WORKFLOW.md`.

## 4. Bảy bất biến của sản phẩm

Đây là những ràng buộc **không được phép vi phạm** ở bất kỳ đâu trong code. Chi tiết ở `qa/test-plan.md` §1.
Mỗi bất biến có bộ test case riêng ở mức **Blocker** — chỉ cần 1 case Fail là không qua GATE-4.

| # | Bất biến | Nguồn |
|---|----------|-------|
| **INV-1** | Hình ảnh camera **không bao giờ được lưu**; ở phương án đã chọn, **không pixel nào rời thiết bị** | NFR-12, BR-A35 |
| **INV-2** | Chấm bài luôn ở server; API không lộ đáp án đúng trước khi chấm | ADR-04, BR-A19 |
| **INV-3** | Paywall chặn ở backend, không chỉ ẩn nút ở giao diện | BR-A67 |
| **INV-4** | Không phân biệt được email tồn tại / không tồn tại | NFR-08 |
| **INV-5** | Không có dữ liệu thẻ/ví và không có PII trong log | NFR-11, NFR-13, BR-A90 |
| **INV-6** 🆕 | **`returnUrl` của VNPay/MoMo không bao giờ cấp quyền** — chỉ IPN đã xác thực chữ ký | BR-A110, AC-29.7 |
| **INV-7** 🆕 | **Lỗi của dịch vụ AI không bị tính là lỗi của người học** — không trừ hạn mức, không ghi sai | NFR-20, AC-41.6 |

## 5. Quyết định đã chốt & câu hỏi còn mở

Xem bảng đầy đủ ở [`../PROJECT_STATE.md`](../PROJECT_STATE.md).

**Đã chốt (2026-09-20):**

| # | Quyết định | Hệ quả |
|---|------------|--------|
| **Q3** | ✅ **VNPay + MoMo** | Bỏ tự động gia hạn → mua từng kỳ + nhắc gia hạn (BRD §3.3) |
| **Q4** | ✅ **VSL** (Ngôn ngữ Ký hiệu Việt Nam) | Dùng bộ dữ liệu VSL400, **bắt buộc ghi nguồn CC BY 4.0** |
| **Q7** | ✅ **Có module AI nhận diện ký hiệu động** | Thêm M10 (FR-41→46) + dịch vụ AI Python tách riêng |

**Còn mở:**

| # | Câu hỏi | Đang chặn |
|---|---------|-----------|
| **Q8** | **Suy luận AI chạy ở đâu?** A: toàn bộ trong trình duyệt · **B: trình duyệt trích landmark, server phân lớp (SA khuyến nghị)** · C: gửi ảnh lên server | **GATE-3** — định hình NFR-12 & HLD ADR-08 |
| **Q9** | Có bật tính năng **"Góp dữ liệu luyện tập"** không? | Chất lượng mô hình dài hạn (BG-08) |
| **Q10** | Giáo trình bám theo **30 ký hiệu đã có**, hay quay bổ sung ký hiệu chào hỏi? | Kế hoạch nội dung |
| **Q11** | Ưu tiên **MVP-50** hay **tăng độ chính xác MVP-30**? | Lộ trình AI |
| **Q1** | Xác nhận version từng dòng trong `techstack.md` | GATE-2 |
| **Q2** | Dải port UAT (cần **5–6** port) | GATE-6 |
| **Q5** | Nguồn video bài học ngoài 30 ký hiệu VSL400 | Chi phí & tiến độ lớn nhất |
| **Q6** | GĐ1 có gồm B2B và đặt lịch tutor không? | Phạm vi (±6 tuần công) |

## 6. Hai rủi ro có thể giết dự án

| # | Rủi ro | Phải xử lý trước |
|---|--------|------------------|
| **R-02** | **Độ chính xác 0.901 đo trên video quay chuẩn, chưa đo trên webcam thật.** Nếu tụt dưới 0,80 thì phải hạ cấp tính năng AI về chế độ Gương | **GATE-4** — quy trình kiểm ở `qa/test-plan.md` §2.3 |
| **R-11** | **Chưa có tài khoản merchant VNPay/MoMo.** Không có thì không có doanh thu, và cũng không kiểm thử được M6 | **GATE-3** — nộp hồ sơ ngay, song song phát triển |
