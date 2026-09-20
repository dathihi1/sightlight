# Test Plan — SignLight

| Phiên bản | **v0.3** | Ngày | 2026-09-20 | Trạng thái | DRAFT — soạn ở B3, chạy ở B4 |
|-----------|------|------|------------|------------|------------------------------|

**Tiền đề:** `docs/ba/SRS.md`, `docs/ba/FSD.md`, `docs/sa/api-spec.md`, `docs/sa/LLD.md`
**Đi kèm:** `docs/qa/test-cases.md` (bộ case), `docs/qa/test-report.md` (kết quả — điền ở B4)

---

## 1. Mục tiêu & Phạm vi

**Mục tiêu:** chứng minh hệ thống làm **đúng SRS/api-spec**, và **đặc biệt** chứng minh 5 bất biến dưới đây
— đây là những thứ nếu sai thì sản phẩm hỏng về bản chất chứ không chỉ là lỗi chức năng:

| # | Bất biến | Vì sao sống còn | Nguồn |
|---|----------|------------------|-------|
| **INV-1** | **Khung hình camera không bao giờ rời khỏi thiết bị người dùng** | Là cam kết công khai với người dùng và là yêu cầu tuân thủ; vi phạm = khủng hoảng niềm tin | NFR-12, BR-A35 |
| **INV-2** | **Chấm bài luôn ở server; API không lộ đáp án đúng trước khi chấm** | Nếu sai, mọi số liệu học tập (BG-01, BG-02) vô nghĩa và chứng chỉ mất giá trị | ADR-04, BR-A19 |
| **INV-3** | **Paywall chặn ở backend, không chỉ ẩn nút** | Nếu sai, toàn bộ doanh thu (BG-03) bị vô hiệu bằng một lệnh gọi API | BR-A67 |
| **INV-4** | **Không phân biệt được email tồn tại / không tồn tại** ở đăng ký, đăng nhập, quên mật khẩu | Chống dò tài khoản — nghĩa vụ bảo vệ dữ liệu cá nhân | NFR-08 |
| **INV-5** | **Không có dữ liệu thẻ và không có PII trong log** | Giữ phạm vi PCI-DSS ở SAQ-A và tuân thủ PDPL | NFR-11, NFR-13, BR-A90 |
| **INV-6** 🆕 | **`returnUrl` của cổng thanh toán không bao giờ cấp quyền Premium** — chỉ IPN đã xác thực chữ ký mới làm điều đó | Nếu sai, bất kỳ ai cũng tự cấp Premium cho mình bằng cách gõ một URL; toàn bộ doanh thu (BG-03) sụp đổ | BR-A110, AC-29.7 |
| **INV-7** 🆕 | **Lỗi của dịch vụ AI không được tính là lỗi của người học** — không trừ hạn mức, không ghi sai, không ảnh hưởng lịch ôn tập | Nếu sai, người học bị phạt vì sự cố hệ thống; phá hỏng niềm tin vào chính tính năng cốt lõi (BG-07) | NFR-20, AC-41.6 |

**Trong phạm vi kiểm thử:** toàn bộ **FR-01→FR-46**; **NFR-01→NFR-21**; **35 màn hình** SCR-01→SCR-35;
**75 endpoint** + hợp đồng nội bộ với dịch vụ AI.

**Ngoài phạm vi:** app native (chưa có ở GĐ1) · hạ tầng của nhà cung cấp bên thứ ba (cổng thanh toán, CDN,
dịch vụ email — chỉ kiểm phần tích hợp của SignLight) · kiểm thử xâm nhập chuyên sâu (thuộc B5,
`pentest-report.md`).

## 2. Chiến lược kiểm thử

| Mức | Ai làm | Công cụ | Phạm vi | Tiêu chí |
|-----|--------|---------|---------|----------|
| **Unit** | Dev (tự viết) | JUnit 5 + Mockito · Vitest | Logic nghiệp vụ thuần: SM-2, tính streak, chấm bài, tính giá | Độ phủ **≥ 70%** tầng service (NFR-16) |
| **Tích hợp** | Dev + Tester | Testcontainers (PostgreSQL thật) | Repository, transaction, di trú Flyway, idempotency | Mọi luồng giao dịch ở `LLD.md` §4 |
| **API (hợp đồng)** | Tester | REST Client / Postman + script | 66 endpoint: schema, mã lỗi, phân quyền | Mỗi endpoint ≥ 1 case đúng + ≥ 1 case lỗi |
| **Hệ thống / E2E** | Tester | Playwright | 30 màn hình theo FSD, trên Chrome + Safari (mobile viewport) | Mọi luồng chính + luồng ngoại lệ chính |
| **Khả năng tiếp cận** | Tester | axe-core trong Playwright + rà thủ công bàn phím | Toàn luồng học | **0 vi phạm mức critical/serious**; WCAG 2.1 AA |
| **Hiệu năng** | Tester | k6 (API) · Lighthouse (web) | NFR-01, NFR-02, NFR-03 | P95 < 300 ms @ 300 rps; LCP < 2,5 s |
| **Bảo mật (chức năng)** | Tester | Case thủ công + script | **INV-1→INV-7**, phân quyền, rate-limit | 0 case Fail |
| 🤖 **Chất lượng mô hình AI** | Tester + AI dev | Bộ kiểm định + **webcam thật** | NFR-19: top1 ≥ 0,85 / top3 ≥ 0,95 | **≥ 5 người thật × ≥ 3 điều kiện ánh sáng** — xem §2.3 |
| 🤖 **Cô lập dịch vụ AI** | Tester | Tắt/làm chậm dịch vụ AI có chủ đích | NFR-20: luồng học không hỏng | 0 case Fail |
| 💳 **Thanh toán VNPay/MoMo** | Tester | Sandbox của cổng + script giả mạo | FR-29→32, INV-6 | 0 case Fail |
| **Hồi quy** | Tester | Bộ E2E tự động | Trước mỗi lần trình cổng | 100% case Blocker/Critical xanh |
| **Chấp nhận (UAT)** | PO + anh Bryan | Thủ công | Luồng nghiệp vụ chính trên môi trường UAT | B6, GATE-6 |

### 2.1 Cách suy ra test case
1. **Mỗi tiêu chí chấp nhận Given–When–Then trong SRS → ít nhất 1 test case.** SRS v0.1 có **97 tiêu chí chấp nhận** (AC-01.1 → AC-40.2).
2. **Mỗi endpoint trong `api-spec.md` → 1 case đúng schema + ≥ 1 case mã lỗi.**
3. Mỗi FR phủ đủ 3 lớp: **happy path · biên (boundary) · luồng lỗi**.
4. Mỗi bất biến INV-1→INV-5 có **bộ case riêng, mức Blocker**.

### 2.3 🤖 Quy trình kiểm chất lượng mô hình AI *(mới ở v0.2 — bắt buộc trước GATE-4)*

Con số **top1 = 0.901** trong repo đo trên **video VSL400 quay chuẩn**. Điều đó **không** chứng minh mô
hình chạy tốt với webcam của người dùng thật. Đây là rủi ro R-02 của BRD và phải được đóng lại bằng một
quy trình kiểm cụ thể:

| Bước | Nội dung | Tiêu chí đạt |
|------|----------|--------------|
| 1 | **Kiểm lại trên tập kiểm định gốc** (`group_shuffle_by_signer`) để xác nhận mô hình triển khai đúng bản đã huấn luyện | top1 ≥ 0,85 · top3 ≥ 0,95 |
| 2 | **Kiểm webcam thật:** ≥ **5 người** chưa từng xuất hiện trong dữ liệu huấn luyện, mỗi người thực hiện đủ **30 ký hiệu × 3 lần** = 450 lượt | top1 ≥ **0,80** *(chấp nhận thấp hơn tập chuẩn)* |
| 3 | **Kiểm theo điều kiện ánh sáng:** đủ sáng · thiếu sáng · ngược sáng | Ghi lại top1 từng điều kiện; **ngược sáng được phép thấp hơn** nhưng phải sinh đúng gợi ý chất lượng |
| 4 | **Kiểm theo nền:** nền trơn · nền lộn xộn | Ghi lại; nền lộn xộn phải sinh gợi ý phù hợp |
| 5 | **Hiệu chỉnh ngưỡng** `confidence_threshold` và `confidence_margin` trên dữ liệu bước 2–4 | Cân bằng: **báo đúng nhầm** (người học được khen sai) vs **báo sai nhầm** (người học nản). Ưu tiên giảm **báo đúng nhầm** — khen sai làm hỏng việc học |
| 6 | **Ma trận nhầm lẫn:** liệt kê các cặp ký hiệu hay bị lẫn | Cặp lẫn > 20% → đưa vào danh sách cần quay thêm dữ liệu hoặc **tạm tắt** một trong hai (BR-A125) |
| 7 | **Kiểm người thuận tay trái** — ít nhất 1 trong 5 người ở bước 2 | Không được thấp hơn người thuận tay phải quá 10 điểm phần trăm |

> ⚠️ **Nếu top1 ở bước 2 < 0,80:** không được phát hành tính năng chấm AI. Hạ cấp toàn bộ về **chế độ
> Gương** (FR-20) và ghi vào state như một Change Request. Đây là quyết định đã được thoả thuận trước ở
> BRD R-02 để tránh tranh luận khi số liệu xấu.

### 2.2 Kỹ thuật thiết kế case
Phân hoạch tương đương + phân tích giá trị biên (ví dụ: mật khẩu 9/10/128/129 ký tự; `size` phân trang
0/1/50/51/500; điểm nhận dạng 0.79/0.80/0.81; streak với 0/1/3/4 Freeze) · bảng quyết định cho paywall ·
kiểm thử chuyển trạng thái cho `Subscription` và `ContentItem` · kiểm thử dựa trên lỗi cho INV-1→INV-5.

## 3. Môi trường & Dữ liệu thử

| Hạng mục | Cấu hình |
|----------|----------|
| **Môi trường** | `uat` theo `deploy/docker-compose.yml` — dải port **`18080–18090`** (api `18080`, web `18081`, storage `18082/18083`) |
| **Dữ liệu** | Bộ dữ liệu gieo (seed) **hoàn toàn ẩn danh** — email dạng `hocvien{n}@example.com`, tên dạng "Hoc Vien 01". **Cấm tuyệt đối dữ liệu thật của người dùng** (PDPL) |
| **Nội dung thử** | 1 khoá · 3 Unit (Unit 1 miễn phí) · 9 chương · 30 bài · 120 ký hiệu có video `READY` · 6 loại bài tập đều có mẫu |
| **Tài khoản thử** | `free@example.com` (LEARNER_FREE) · `premium@example.com` (LEARNER_PREMIUM) · `editor@example.com` · `approver@example.com` · `support@example.com` · `admin@example.com` · 1 tài khoản `PENDING_VERIFICATION` · 1 tài khoản `PENDING_DELETION` |
| **Thanh toán** | **Sandbox VNPay + MoMo**; dùng thẻ/ví thử do cổng cung cấp, **không dùng tiền thật**. Cần **tunnel** để IPN tới được UAT |
| 🤖 **Dịch vụ AI** | Container `ai` chạy mô hình `vsl_mvp30_v2_lite_transformer` INT8. Cần thêm **chế độ giả lập** để ép trả `503`/timeout phục vụ kiểm INV-7 |
| 🤖 **Người kiểm AI** | **≥ 5 người thật**, trong đó **≥ 1 người thuận tay trái**, **không ai** nằm trong dữ liệu huấn luyện VSL400 |
| 🤖 **Điều kiện quay** | 3 mức ánh sáng (đủ sáng ≥ 300 lux · thiếu sáng · ngược sáng) × 2 loại nền (trơn · lộn xộn) |
| **Thiết bị** | Desktop 1440px · Laptop 1280px · Tablet 768px · Mobile 375px · **1 máy Android tầm trung ≥ 4 năm tuổi** để kiểm NFR-04 |
| **Trình duyệt** | Chrome (mới nhất + n-1) · Edge · Firefox · Safari (macOS + iOS). Thêm **1 trình duyệt không hỗ trợ WASM SIMD** để kiểm hạ cấp mềm |
| **Camera** | Webcam thật + điều kiện ánh sáng: đủ sáng · thiếu sáng · ngược sáng |

## 4. Tiêu chí vào / ra

### 4.1 Tiêu chí vào (bắt đầu kiểm thử ở B4)
- [ ] GATE-3 đã duyệt; `SRS.md`, `FSD.md`, `api-spec.md` ở trạng thái đóng băng.
- [ ] Dev đã handover: build thành công, `/health` trả `UP`, dữ liệu gieo đã nạp.
- [ ] Unit test của dev **xanh** và đạt ≥ 70% độ phủ service.
- [ ] OpenAPI sinh từ code đã có để **đối chiếu với `api-spec.md`**.
- [x] ✅ Dải port đã có (`18080–18090`). [ ] Môi trường UAT chạy được — **chờ mã nguồn ở B4**.

### 4.2 Tiêu chí ra (đủ điều kiện trình GATE-4)
- [ ] **0 lỗi Blocker, 0 lỗi Critical còn mở.**
- [ ] **100% case thuộc INV-1→INV-7 đạt Pass** — *không có ngoại lệ, không được "chấp nhận rủi ro" ở nhóm này.*
- [ ] ≥ 95% tổng số test case Pass; mọi case Fail còn lại là Minor và đã được PO ghi nhận.
- [ ] Độ phủ TC→FR đạt **100%** (mọi **FR-01→46** có ít nhất 1 case).
- [ ] 🤖 **Hoàn tất quy trình §2.3** và đạt **top1 ≥ 0,80 trên webcam thật** — hoặc đã quyết định hạ cấp về chế độ Gương.
- [ ] 🤖 **Ngưỡng tin cậy đã được hiệu chỉnh** trên dữ liệu thật, không còn dùng giá trị mặc định của repo.
- [ ] 💳 **Cả hai cổng VNPay và MoMo** đã chạy thành công ít nhất 1 giao dịch đầy đủ trên sandbox.
- [ ] Đối chiếu OpenAPI (sinh từ code) với `api-spec.md`: **không có sai lệch** về path, mã lỗi, tên trường.
- [ ] Kiểm khả năng tiếp cận: **0 vi phạm critical/serious** của axe trên luồng học.
- [ ] Hiệu năng đạt NFR-01, NFR-02, NFR-03 (có biểu đồ kèm theo).
- [ ] `test-report.md` hoàn chỉnh, đã ký bởi Tester.

## 5. Phân mức lỗi

| Mức | Định nghĩa | Ví dụ trong dự án này | Xử lý |
|-----|------------|------------------------|-------|
| **Blocker** | Không thể kiểm thử tiếp, hoặc vi phạm INV-1→INV-5, hoặc mất dữ liệu | Khung hình camera bị gửi lên server · paywall bỏ qua được bằng gọi API · mất tiến độ học | Dừng, trả dev ngay |
| **Critical** | Chức năng chính hỏng, không có cách vòng | Không hoàn thành được bài học · thanh toán thành công nhưng không kích hoạt Premium · streak tính sai | Trả dev trong ngày |
| **Major** | Chức năng hỏng nhưng có cách vòng | Nút "rùa" không nhớ lựa chọn · gợi ý tìm kiếm sai chính tả không hiện | Sửa trước GATE-4 |
| **Minor** | Sai lệch nhỏ, không cản trở | Lệch khoảng cách so với design · sai chính tả thông điệp | Có thể chuyển sau GATE-4 nếu PO đồng ý |

## 6. Ánh xạ test case → FR (cách đo độ phủ)

- Mỗi test case mang **TC-ID dạng `TC-FR<nn>-<số>`**; các case bất biến mang thêm nhãn `[INV-n]`.
- Bảng §4 của `test-cases.md` liệt kê: mỗi FR có bao nhiêu case, **có case biên chưa**, **có case lỗi chưa**.
- FR nào thiếu case biên hoặc case lỗi → **không đạt tiêu chí ra**, phải bổ sung trước khi trình GATE-4.

## 7. Rủi ro kiểm thử & giảm thiểu

| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|--------|-----------|------------|
| TR-01 | **Không kiểm được INV-1 nếu chỉ nhìn giao diện** | Rất cao — bỏ lọt vi phạm quyền riêng tư | Bắt buộc dùng **công cụ theo dõi lưu lượng mạng** (DevTools Network + proxy chặn giữa) và **rà mã nguồn** phần camera; không chấp nhận "nhìn thấy có vẻ ổn" |
| TR-02 | Streak phụ thuộc múi giờ và thời điểm nửa đêm → khó kiểm thủ công | Cao — lỗi chỉ lộ sau nhiều ngày | Thiết kế **đồng hồ có thể tiêm (injectable clock)** ở backend để test "tua thời gian"; yêu cầu này đã được nêu với dev từ B3 |
| TR-03 | **Không có tài khoản merchant VNPay/MoMo** → không kiểm được FR-29/31/32 | **Rất cao — chặn tiêu chí ra** | Xin sandbox **ngay**; nếu chưa có, case đánh dấu `Blocked` chứ **không** đánh `Pass` (BRD R-11) |
| TR-04 | Độ chính xác nhận dạng phụ thuộc ánh sáng/thiết bị/người | **Rất cao** — dễ ra cả "Fail giả" lẫn "Pass giả" | Quy trình §2.3 quy định rõ số người, điều kiện, tiêu chí; **ghi thiết bị & điều kiện trong mỗi case** |
| TR-07 | 🤖 **Khó kiểm INV-7** vì cần ép dịch vụ AI lỗi đúng lúc | Cao — bỏ lọt lỗi làm người học bị phạt oan | Yêu cầu dev cung cấp **cờ giả lập lỗi** (`AI_SIMULATE_FAILURE=timeout\|500`) từ B3 |
| TR-08 | 🤖 **Kết quả AI không tất định** — cùng một động tác có thể ra kết quả khác nhau | TB — case tự động khó viết | Với case tự động, dùng **tensor cố định đã lưu sẵn** thay vì quay trực tiếp; quay trực tiếp chỉ dùng cho kiểm thủ công §2.3 |
| TR-09 | 💳 **IPN không tới UAT** vì không có IP công khai | Cao | Chuẩn bị **tunnel** từ đầu B4; dự phòng: gửi lại IPN từ cổng quản trị của VNPay/MoMo |
| TR-05 | Kiểm khả năng tiếp cận dễ bị làm qua loa | Cao — vi phạm cam kết cốt lõi với cộng đồng khiếm thính | axe tự động **trong CI** (không chỉ chạy tay) + 1 lượt rà bàn phím thủ công mỗi phát hành |
| TR-06 | Dữ liệu thử không đủ đa dạng (chỉ happy path) | TB | Bộ gieo bắt buộc có: tài khoản chưa xác thực, tài khoản chờ xoá, thuê bao sắp hết hạn, ký hiệu có 3 biến thể, bài học có Curiosity |

## 8. Lịch & phân công *(dự kiến — chốt lại khi có kế hoạch B4)*

| Giai đoạn | Nội dung | Ai |
|-----------|----------|-----|
| B3 (nay) | Soạn `test-plan.md` + nháp `test-cases.md` từ SRS/api-spec | Tester |
| B4-1 | Kiểm API hợp đồng + đối chiếu OpenAPI | Tester |
| B4-2 | Kiểm E2E theo FSD + khả năng tiếp cận | Tester |
| B4-3 | **Kiểm bất biến INV-1→INV-5** (ưu tiên cao nhất) | Tester + Security |
| B4-4 | Kiểm hiệu năng (k6, Lighthouse) | Tester |
| B4-5 | Hồi quy + viết `test-report.md` | Tester |
| B5 | Hỗ trợ security-engineer rà bảo mật | Tester |
| B6 | Hỗ trợ UAT | Tester + PO |

---

## ✅ Checklist Test Plan
- [x] Nêu rõ phạm vi **trong/ngoài**.
- [x] Chiến lược đủ các mức: unit, tích hợp, API, E2E, tiếp cận, hiệu năng, bảo mật, hồi quy, UAT.
- [x] Nêu **cách suy ra test case** từ SRS (tiêu chí chấp nhận) và api-spec (endpoint).
- [x] Môi trường & dữ liệu thử **ẩn danh** (PDPL), có đủ tài khoản/thiết bị/trình duyệt đặc thù.
- [x] Tiêu chí **vào/ra** đo được; nhóm bất biến **không cho phép ngoại lệ**.
- [x] Phân mức lỗi có ví dụ cụ thể của dự án.
- [x] Nêu cách đo **độ phủ TC→FR**.
- [x] Liệt kê rủi ro kiểm thử + giảm thiểu (gồm 2 rủi ro đặc thù: camera và đồng hồ streak).
