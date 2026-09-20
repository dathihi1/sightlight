# SignLight

Nền tảng học **Ngôn ngữ Ký hiệu Việt Nam (VSL)** trực tuyến, với **AI nhận diện ký hiệu động** cho phản hồi
tức thì — người học thực hiện trọn một ký hiệu trước camera và biết ngay mình làm đúng hay chưa.

> Dự án cá nhân. Tham chiếu tập tính năng: **Lingvano ASL**. Nền tảng AI tái dùng từ repo
> [`dathihi1/EXE101`](https://github.com/dathihi1/EXE101).
> Toàn bộ nội dung dạy học, giao diện và nhận diện thương hiệu **do đội tự sản xuất** — xem ràng buộc pháp
> lý ở [`docs/ba/BRD.md`](docs/ba/BRD.md) §6.

## Trạng thái

**Giai đoạn:** đã hoàn tất **bộ tài liệu B1→B6 phiên bản v0.2**. **Chưa có mã nguồn.**
Cổng đang chờ: **GATE-1 (duyệt BRD)**.

👉 Đọc [`PROJECT_STATE.md`](PROJECT_STATE.md) trước mỗi phiên làm việc.
👉 Bản đồ tài liệu: [`docs/README.md`](docs/README.md).

## Điểm khác biệt cốt lõi

Các app học ngôn ngữ ký hiệu hiện có dạy bằng video, nhưng **không ai sửa sai cho người học**. Người học tự
làm theo mà không biết mình đúng hay sai — rồi hoặc bỏ cuộc, hoặc học sai và giữ cái sai đó.

SignLight giải quyết đúng chỗ đó: **AI nhận diện ký hiệu động**.

| | Lingvano (tham chiếu) | **SignLight** |
|---|---|---|
| Ngôn ngữ | ASL, BSL, ÖGS | **VSL — Ngôn ngữ Ký hiệu Việt Nam** |
| Nhận dạng qua camera | Bảng chữ cái (hình tay **tĩnh**) | **Ký hiệu ĐỘNG trọn vẹn** + bảng chữ cái |
| Phản hồi khi sai | Đúng/sai | **Nêu rõ "hệ thống thấy bạn đang ký hiệu X"** + top-3 + gợi ý sửa |

**Nền tảng kỹ thuật đã được kiểm chứng** (từ repo EXE101): mô hình `vsl_mvp30_v2_lite_transformer` —
**30 ký hiệu VSL**, **top1 = 0.901 · top3 = 1.000**, ONNX INT8 chỉ **0,40 MB**, phân lớp **~0,52 ms**.

## Sản phẩm làm gì

| Nhóm | Nội dung |
|------|----------|
| Học | Lộ trình Unit → Chương → Bài; bài học là **chuỗi bước** (dạy · giải thích · bài tập); **7 loại bài tập**; quiz; bài mốc 1–5 sao |
| 🤖 **AI luyện ký hiệu động** | Quay ~2 giây → AI chấm → phản hồi + gợi ý sửa. Khởi điểm 30 ký hiệu, lộ trình lên 100 |
| Luyện tập | Lặp lại ngắt quãng: từ vựng · bảng chữ cái · số. **Mở khoá theo tiến độ học**, không theo gói |
| Từ điển | Tra không dấu, gợi ý sai chính tả, biến thể vùng miền, **báo thiếu ký hiệu** |
| Động lực | Chuỗi ngày · Freeze · 6 huy hiệu có cấp bậc · Khám phá văn hoá Điếc · chứng chỉ PDF |
| Thanh toán | Premium 1/3/12 tháng qua **VNPay & MoMo** — **mua từng kỳ, không tự động trừ tiền** |
| Quản trị | CMS soạn & duyệt nội dung (**bắt buộc người Điếc duyệt**), quản lý vốn ký hiệu AI |

## Kiến trúc

**Modular monolith + một dịch vụ AI tách riêng:**
Next.js 15 · Spring Boot 3.5 (Java 21) · PostgreSQL 17 · Redis · object storage/CDN ·
**dịch vụ AI Python (FastAPI + ONNX Runtime)**.

Trích đặc trưng chuyển động (MediaPipe Holistic) chạy **trong trình duyệt** → chỉ **tensor số** rời thiết
bị, **không pixel nào**. Lý do chọn và các phương án đã loại: [`docs/sa/HLD.md`](docs/sa/HLD.md) §1 và 10 ADR.

## Bảy bất biến — không được vi phạm ở bất kỳ đâu

1. Hình ảnh camera **không bao giờ được lưu**; không pixel nào rời thiết bị.
2. Chấm bài **luôn ở server**; API không lộ đáp án đúng trước khi chấm.
3. Paywall chặn **ở backend**, không chỉ ẩn nút.
4. Không phân biệt được email tồn tại / không tồn tại.
5. Không có dữ liệu thẻ/ví và không có PII trong log.
6. **`returnUrl` của VNPay/MoMo không bao giờ cấp quyền** — chỉ IPN đã xác thực chữ ký.
7. **Lỗi của dịch vụ AI không bị tính là lỗi của người học.**

## Cấu trúc thư mục

```
.
├── PROJECT_STATE.md              # Trạng thái dự án — đọc đầu tiên
├── docs/
│   ├── README.md                 # Bản đồ tài liệu
│   ├── ba/                       # BRD, SRS, function-map, FSD, user-guide
│   ├── sa/                       # techstack, HLD, architecture, LLD, api-spec
│   ├── design/                   # design.md
│   ├── qa/                       # test-plan, test-cases, test-report
│   └── security/                 # pentest-report
├── deploy/                       # docker-compose UAT (api·web·ai·db·cache·storage), .env.example, runbook
├── src/                          # (chưa có — dựng ở B3)
│   ├── backend/  frontend/       #   Java · Next.js
│   └── ai/                       #   Python — tái dùng src/vsl_mvp/ của EXE101
└── training-skill-software/      # Bộ skill SDLC dùng để sinh tài liệu
```

## Câu hỏi đang chặn

| # | Câu hỏi | Chặn |
|---|---------|------|
| **Q8** | Suy luận AI chạy ở đâu? (SA khuyến nghị: trình duyệt trích landmark, server phân lớp) | GATE-3 |
| **Q1** | Xác nhận version từng dòng trong techstack | GATE-2 |
| **R-11** | Tài khoản merchant VNPay/MoMo | GATE-3 — không có thì không có doanh thu |
| **R-02** | Kiểm độ chính xác AI trên webcam thật (≥ 5 người) | GATE-4 |

Danh sách đầy đủ: [`PROJECT_STATE.md`](PROJECT_STATE.md).
