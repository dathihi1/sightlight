# BRD — SignLight (Nền tảng học Ngôn ngữ Ký hiệu Việt Nam có AI luyện tập)

| Phiên bản | **v0.3** | Ngày | 2026-09-20 | Người viết | BA | Trạng thái | DRAFT — chờ GATE-1 |
|-----------|------|------|------------|------------|----|-----------|---------------------|

**Thay đổi so với v0.2 — anh Duy chốt TOÀN BỘ câu hỏi mở ngày 2026-09-20:**
**Q8** = phương án B (trình duyệt trích landmark, server phân lớp) · **Q9** = CÓ (bật góp dữ liệu tự nguyện) ·
**Q10** = nội dung giả lập trước · **Q11** = tăng độ chính xác MVP-30 trước · **Q6** = KHÔNG làm B2B/tutor ở GĐ1 ·
**Q5** = hoãn tới sau GATE-4 · **R-07** = tuổi tối thiểu **16** cho góp dữ liệu · **R-11 đã đóng** (có tài khoản
merchant/sandbox VNPay + MoMo). **BRD không còn câu hỏi nào chặn GATE-1.**

**Thay đổi so với v0.1:** chốt **VSL** thay ASL (Q4) · chốt **VNPay + MoMo** (Q3) · bổ sung **module AI nhận
diện ký hiệu động** là tính năng cốt lõi (Q7) · bổ sung §9 ghi nhận khảo sát sản phẩm đối thủ ở trạng thái
đã đăng nhập.

**Tài liệu liên quan:** `docs/ba/SRS.md` · `docs/sa/techstack.md`, `docs/sa/HLD.md` · `PROJECT_STATE.md`

---

## 1. Bối cảnh & Vấn đề

Việt Nam có khoảng **2,5 triệu người khiếm thính**, trong đó cộng đồng dùng **Ngôn ngữ Ký hiệu Việt Nam
(VSL)** làm ngôn ngữ mẹ đẻ. Rào cản giao tiếp giữa cộng đồng Điếc và người nghe chủ yếu đến từ việc
**người nghe không biết ký hiệu**, chứ không phải ngược lại.

Người muốn học VSL hiện gặp bốn trở ngại:

1. **Gần như không có sản phẩm học VSL bài bản.** Tài nguyên tiếng Việt phần lớn là video rời rạc trên mạng
   xã hội, không lộ trình, không kiểm chứng được tính chính xác. Đây là **khác biệt lớn nhất so với ASL** —
   ASL có Lingvano, ASL Bloom, hàng chục app; VSL gần như trống.
2. **Lớp học trực tiếp đắt và kém linh hoạt**, lại chỉ có ở vài thành phố lớn.
3. **Ngôn ngữ ký hiệu là ngôn ngữ THỊ GIÁC và CHUYỂN ĐỘNG.** Flashcard chữ, bài đọc, bài nghe đều vô nghĩa.
   Người học cần **xem video** và cần **tự làm động tác**.
4. **Không có ai sửa sai.** Đây là trở ngại nặng nhất. Người học tự xem video rồi tự làm theo, nhưng
   **không biết mình làm đúng hay sai**. Không có phản hồi thì người học hoặc bỏ cuộc, hoặc học sai và
   giữ cái sai đó.

**Trở ngại số 4 chính là thứ dự án này giải quyết bằng AI.**

Đã có bằng chứng thị trường cho mô hình sản phẩm: **Lingvano** (tham chiếu tập tính năng) đạt ~**4 triệu
người học**, **4.9/5 với ~78.7K đánh giá** — với bài học video ngắn do người Điếc bản ngữ dạy, luyện tập lặp
lại, và nhận dạng ký hiệu qua camera. Thị trường **chấp nhận trả tiền** cho mô hình này. Tuy nhiên Lingvano
chỉ nhận dạng **bảng chữ cái ngón tay** (hình tay tĩnh) — SignLight nhận dạng **ký hiệu động trọn vẹn**,
đây là bước tiến thật chứ không phải sao chép.

**Vì sao làm bây giờ:** dự án đã có sẵn **tài sản kỹ thuật đã được kiểm chứng** — mô hình nhận diện 30 ký
hiệu VSL đạt **top1 = 0.901, top3 = 1.000**, kích thước chỉ **0,40 MB**, độ trễ phân lớp **dưới 1 ms**
(repo [`dathihi1/EXE101`](https://github.com/dathihi1/EXE101)). Phần khó nhất về kỹ thuật đã được chứng minh
là khả thi; việc còn lại là dựng sản phẩm quanh nó.

## 2. Mục tiêu kinh doanh (đo được)

| ID | Mục tiêu | Chỉ số (baseline → target) | Thời hạn |
|----|----------|-----------------------------|----------|
| **BG-01** | Đưa người học mới tới được giao tiếp VSL cơ bản | 0 → **60%** người học hoàn thành Chương 1 trong 7 ngày kể từ khi đăng ký | 6 tháng sau go-live |
| **BG-02** | Giữ chân người học bằng thói quen hằng ngày | 0 → **D7 retention ≥ 35%** và **D30 retention ≥ 18%** | 6 tháng sau go-live |
| **BG-03** | Chuyển đổi người dùng miễn phí sang trả phí | 0 → **tỉ lệ free→premium ≥ 4%** trong 30 ngày đầu vòng đời | 9 tháng sau go-live |
| **BG-04** | Xây kho nội dung VSL đủ giữ người học 6 tháng | 0 → **≥ 300 bài học** và **≥ 1.500 ký hiệu** trong từ điển | 9 tháng sau go-live |
| **BG-05** | Chứng minh chất lượng bằng phản hồi thị trường | 0 → **đánh giá trung bình ≥ 4.5/5** với **≥ 300 lượt** | 12 tháng sau go-live |
| **BG-06** | Kiểm soát chi phí hạ tầng trên mỗi người học | — → **≤ 0,15 USD / MAU** | liên tục, đo từ tháng 3 |
| **BG-07** | **Chứng minh AI luyện tập thực sự giúp người học** | 0 → **≥ 70%** người dùng AI luyện tập đạt ký hiệu đúng trong **≤ 3 lần thử**; và nhóm có dùng AI có **D30 cao hơn ≥ 8 điểm phần trăm** so với nhóm không dùng | 9 tháng sau go-live |
| **BG-08** | **Mở rộng vốn ký hiệu AI nhận diện được** | **30 → 100 ký hiệu** đạt top1 ≥ 0.85 trên tập kiểm định chia theo người ký hiệu | 12 tháng sau go-live |

> Mọi FR/NFR trong `SRS.md` phải truy vết về ít nhất một `BG-xx`.
> **BG-07 là mục tiêu quan trọng nhất của dự án** — nếu AI không giúp người học tiến bộ thật, thì nó chỉ là
> điểm nhấn tiếp thị và không đáng giữ.

## 3. Phạm vi

### 3.1 Trong phạm vi — Giai đoạn 1 (MVP thương mại)

| Nhóm | Nội dung |
|------|----------|
| **Nền tảng** | **Web responsive** (desktop + mobile browser). Một codebase frontend phục vụ cả hai. |
| **Tài khoản** | Đăng ký/đăng nhập email + mật khẩu, đăng nhập Google, quên mật khẩu, onboarding nhiều bước, hồ sơ, đổi email/mật khẩu, xoá tài khoản, đặt lại tiến độ |
| **Học** | Lộ trình Unit → Chương → Bài; **bài học là chuỗi bước hỗn hợp** (thẻ dạy · thẻ giải thích · bài tập); trình phát video có chế độ chậm; **7 loại bài tập**; quiz cuối chương; bài mốc chấm 1–5 sao |
| **Luyện tập** | **Trainer** lặp lại ngắt quãng cho từ vựng · bảng chữ cái ngón tay · số đếm. **Mở khoá theo tiến độ học**, không phải theo gói |
| **🤖 AI luyện ký hiệu động** | **Người học thực hiện trọn một ký hiệu trước camera → AI nhận diện → phản hồi đúng/sai + gợi ý sửa cụ thể.** Khởi điểm **30 ký hiệu VSL** (mô hình MVP-30), lộ trình mở rộng lên 50 rồi 100 |
| **Nhận dạng bảng chữ cái** | Nhận dạng hình tay tĩnh cho bảng chữ cái ngón tay |
| **Gương (Mirror)** | Xem video mẫu song song camera của chính mình, không chấm điểm, không ghi hình |
| **Từ điển** | Tra cứu không dấu + duyệt theo **chủ đề** + video ký hiệu + biến thể vùng miền + **báo thiếu ký hiệu** |
| **Tiến độ & Gamification** | Chuỗi ngày học · streak freeze · mục tiêu phút/ngày · 6 **Award** có cấp bậc · **Curiosity** · sao mốc · chứng chỉ PDF |
| **Thanh toán** | Gói miễn phí + **Premium 1 / 3 / 12 tháng** qua **VNPay và MoMo**. **Mua từng kỳ, nhắc gia hạn thủ công** — xem §3.3 |
| **CMS nội dung** | Quản lý ký hiệu, video, bài học, bài tập, chương; xuất bản có duyệt |
| **Marketing & SEO** | Trang chủ, giới thiệu, trang doanh nghiệp (chỉ form liên hệ), blog SEO "ký hiệu của từ X", trang pháp lý |
| **Nội dung** | **VSL — Ngôn ngữ Ký hiệu Việt Nam**. Data model thiết kế đa ngôn ngữ ngay từ đầu |

**30 ký hiệu VSL khởi điểm của mô hình MVP-30** *(✅ Q10 đã chốt — dùng làm **bộ seed giả lập**, xem SRS §3.4)*:

| Chủ đề | Ký hiệu |
|--------|---------|
| **Xưng hô & gia đình** (8) | Anh · Chị · Em · Cháu · Chú · Cô · Cậu · Họ hàng |
| **Đồ vật trong nhà** (9) | Cái bàn · Cái cửa · Cái đèn · Cái chảo · Cửa sổ · Giường · Nồi cơm điện · Máy điều hòa · Quạt (đứng) |
| **Địa điểm** (5) | Trường học · Trường Đại học · Ngân hàng · Nhà hàng · Nhà trọ |
| **Thời gian & thời tiết** (6) | Chủ nhật · Mùa hè · Mùa khô · Nắng · Ướt · Ngày Nhà giáo Việt Nam |
| **Khác** (2) | Nghề nghiệp · Dễ |

> Bộ 30 ký hiệu này nghiêng về **danh từ đồ vật và xưng hô**, thiếu động từ và câu chào hỏi — tức là
> **chưa đủ để dựng Chương 1 "Chào hỏi"** theo lẽ thường của một giáo trình.
>
> ✅ **Q10 đã chốt (anh Duy, 2026-09-20): làm giả lập trước, chưa cần quan tâm nội dung; nội dung thật
> bổ sung sau.** Vì vậy 30 ký hiệu này **không** phải là giáo trình chính thức — chúng là **bộ dữ liệu
> seed** để dựng và nghiệm thu chức năng (SRS §3.4, NFR-21). Giáo trình thật sẽ được thiết kế lại ở một
> bước riêng, **sau GATE-4**.
>
> ⚠️ **Điều này chỉ dời rủi ro R-01, không gỡ nó.** GATE-6 (phát hành) vẫn cần **ít nhất 1 Unit nội dung
> thật**. Q5 (nguồn video) đã được chốt là **hoãn tới sau GATE-4** — hoãn, **không phải đã giải quyết**.

### 3.2 Ngoài phạm vi — Giai đoạn 2 trở đi

| Nội dung | Lý do hoãn |
|----------|------------|
| **Ứng dụng di động native** | Web responsive đủ kiểm chứng thị trường. *(Lưu ý: repo EXE101 đã có `flutter_mvp/` — có thể tái dùng ở GĐ2)* |
| **Cổng B2B**: tổ chức, ghế, dashboard quản trị | Cần khách hàng doanh nghiệp thật trước; GĐ1 chỉ form liên hệ |
| **Đặt lịch luyện tập với giáo viên Điếc** | Bài toán vận hành con người, không phải phần mềm |
| **Ngôn ngữ ký hiệu thứ hai (ASL, BSL…)** | Mỗi ngôn ngữ là một kho nội dung **và một mô hình AI** độc lập |
| **AI nhận diện câu / hội thoại liên tục** | Khó hơn hẳn nhận diện từ đơn; cần phân đoạn tự động và dữ liệu lớn |
| **AI tự động phân đoạn (auto start/stop)** | Repo khuyến nghị giữ **phân đoạn thủ công** tới khi ổn định — đồng ý |
| **Chế độ học ngoại tuyến** | Phụ thuộc app native |
| **Gói gia đình, tặng quà, mã khuyến mãi** | Bổ sung sau khi luồng thanh toán cơ bản chạy ổn |

### 3.3 Hệ quả của việc chọn VNPay + MoMo *(cần đọc kỹ)*

**VNPay và MoMo không hỗ trợ tự động gia hạn (auto-renew) cho merchant thông thường.** Tính năng thanh
toán định kỳ/tokenization yêu cầu hợp đồng riêng và thường chỉ mở cho đối tác lớn. Hệ quả trực tiếp:

| Điều v0.1 giả định | Thực tế với VNPay/MoMo | Xử lý |
|--------------------|------------------------|-------|
| Thuê bao tự động gia hạn | **Không có** | Mỗi kỳ là **một giao dịch riêng** người dùng chủ động thực hiện |
| "Huỷ tự động gia hạn" | Không còn ý nghĩa | Thay bằng **nhắc gia hạn** trước 7/3/1 ngày và màn "Gia hạn ngay" |
| Rời bỏ do quên huỷ | Không xảy ra | ✅ **Có lợi cho người dùng** — không bị trừ tiền ngoài ý muốn |
| Doanh thu định kỳ dự đoán được | Khó hơn | ⚠️ **Rủi ro kinh doanh R-10** — tỉ lệ gia hạn sẽ thấp hơn auto-renew; bù bằng nhắc nhở đúng lúc và ưu đãi gói dài |
| Đa tiền tệ | Không cần ở GĐ1 | Chỉ **VND** |

**Điều này thực ra làm sản phẩm trung thực hơn** — không có "bẫy đăng ký". Nhưng phải chấp nhận tỉ lệ gia
hạn thấp hơn và **thiết kế nhắc gia hạn thật tốt** (FR-31).

## 4. Stakeholders

| Vai trò | Người/Bộ phận | Quan tâm chính / Quyền quyết |
|---------|---------------|-------------------------------|
| **Chủ đầu tư (duyệt)** | anh Duy | Duyệt mọi cổng; quyết phạm vi, ngân sách, techstack, thời điểm phát hành |
| Người học phổ thông | Người nghe có người thân/bạn/đồng nghiệp Điếc | Học được thật, rẻ, linh hoạt, **biết mình làm đúng hay sai** |
| Người học nghề nghiệp | Giáo viên, y tá, nhân viên dịch vụ công, bán hàng | Học nhanh vốn từ dùng được trong công việc |
| **Cố vấn/giáo viên người Điếc** | Người Điếc bản ngữ cộng tác sản xuất & duyệt nội dung | Tính chính xác ngôn ngữ, tôn trọng văn hoá Điếc, được ghi nhận & trả công xứng đáng |
| **Nhóm phát triển AI** | Chủ repo EXE101 | Chất lượng mô hình, dữ liệu huấn luyện, ghi nguồn VSL400 |
| Đội nội dung | Biên tập viên khoá học | CMS đủ dùng để lên bài nhanh |
| Đội phát triển | BA · SA · Designer · Backend · Frontend · AI · Tester · Security · DevOps | Yêu cầu rõ tới mức code được |
| CSKH | Hỗ trợ khách hàng | Tra cứu trạng thái thuê bao, tiến độ, hoàn tiền |

## 5. Yêu cầu mức nghiệp vụ

| ID | Yêu cầu nghiệp vụ | Ưu tiên | Phục vụ mục tiêu |
|----|-------------------|---------|------------------|
| **BR-01** | Người học tạo tài khoản và bắt đầu học trong vài phút, không cần thanh toán | Cao | BG-01, BG-03 |
| **BR-02** | Hệ thống hỏi mục tiêu & thời lượng học mỗi ngày lúc onboarding rồi cá nhân hoá theo đó | Cao | BG-01, BG-02 |
| **BR-03** | Người học theo lộ trình tuyến tính có thứ tự, luôn biết bài kế tiếp | Cao | BG-01 |
| **BR-04** | Mỗi bài học dạy bằng **video người Điếc bản ngữ thật**, xem chậm được | Cao | BG-01, BG-05 |
| **BR-05** | Người học được kiểm tra bằng nhiều dạng bài tập khác nhau | Cao | BG-01, BG-02 |
| **BR-06** | **Người học thực hiện ký hiệu trước camera và được AI cho biết đúng/sai kèm gợi ý sửa** | **Rất cao** | **BG-01, BG-07** |
| **BR-07** | Hệ thống chủ động đưa lại ký hiệu người học sắp quên | Cao | BG-01, BG-02 |
| **BR-08** | Người học tra được ký hiệu bất kỳ đã có trong kho, kể cả chưa học tới | TB | BG-02, BG-04 |
| **BR-09** | Hệ thống ghi nhận và tôn vinh tiến độ | Cao | BG-02 |
| **BR-10** | Người học lấy được chứng chỉ cho phần đã hoàn thành | TB | BG-02, BG-03 |
| **BR-11** | Dùng thử miễn phí một phần, muốn học tiếp thì trả phí theo kỳ 1/3/12 tháng | Cao | BG-03 |
| **BR-12** | **Người học được nhắc gia hạn đúng lúc và gia hạn trong vài thao tác** | Cao | BG-03, BG-05 |
| **BR-13** | Tiến độ học đồng bộ theo tài khoản, không mất khi đổi thiết bị | Cao | BG-02, BG-05 |
| **BR-14** | Đội nội dung tự lên bài, gắn video, xuất bản không cần lập trình viên | Cao | BG-04 |
| **BR-15** | Thu hút người học mới qua nội dung SEO | TB | BG-03 |
| **BR-16** | Người học xoá được tài khoản và dữ liệu cá nhân | Cao | BG-05 |
| **BR-17** | Doanh nghiệp liên hệ được để mua theo nhóm (GĐ1 chỉ tiếp nhận) | Thấp | BG-03 |
| **BR-18** | Vận hành nắm được chi phí hạ tầng và điểm nghẽn hiệu năng | TB | BG-06 |
| **BR-19** | **Hình ảnh camera của người học được bảo vệ tuyệt đối; muốn góp dữ liệu phải là hành động tự nguyện, tách bạch, rút lại được** | **Rất cao** | BG-05, tuân thủ |
| **BR-20** | **Đội đo được AI có thật sự giúp người học hay không** | Cao | BG-07 |
| **BR-21** | **Vốn ký hiệu AI nhận diện được mở rộng theo thời gian mà không phải viết lại hệ thống** | TB | BG-08 |

## 6. Ràng buộc & Giả định

### Ràng buộc

**Pháp lý — sở hữu trí tuệ:**
- Không sao chép video, ảnh, văn bản bài học, giáo trình, logo của Lingvano hay bên thứ ba. Nhận diện
  thương hiệu phải **riêng biệt**. Tham chiếu đối thủ chỉ để xác định *tập tính năng*.
- **Bộ dữ liệu VSL400 (Zenodo — https://zenodo.org/records/17943574) có giấy phép CC BY 4.0.**
  ⇒ **BẮT BUỘC ghi nguồn (attribution) trong sản phẩm và mọi bản demo.** Đây là nghĩa vụ giấy phép, không
  phải lựa chọn. Vị trí ghi nguồn: trang Giới thiệu + trang pháp lý + màn giới thiệu tính năng AI.

**Pháp lý — tuyên bố về năng lực AI:**
- Sản phẩm phải nêu rõ AI là **công cụ hỗ trợ học tập, KHÔNG phải thông dịch viên chính thức**. Không được
  quảng cáo hay hàm ý rằng người dùng có thể dùng SignLight để thông dịch trong tình huống thật
  (y tế, pháp lý, khẩn cấp). *(Ràng buộc này cũng đã được ghi trong chính repo EXE101.)*

**Pháp lý — dữ liệu cá nhân:**
- Tuân **Nghị định 13/2023/NĐ-CP (PDPL)**. Không PII thật trong tài liệu, log, dữ liệu thử.
- **Dữ liệu sinh trắc học:** hình ảnh khuôn mặt và bàn tay có thể được coi là dữ liệu nhạy cảm. Vì vậy
  **mặc định không lưu**; muốn lưu phải có **đồng ý riêng biệt, tường minh, rút lại được** (BR-19).

**Ràng buộc kỹ thuật:**
- Mô hình hiện tại nhận **64 khung × 327 đặc trưng**, dùng **MediaPipe Holistic**. Mọi thiết kế phải bám
  schema này để tái dùng được mô hình đã huấn luyện.
- Mô hình nhận diện **từ đơn, phân đoạn thủ công** (người học bấm bắt đầu/kết thúc). **Không** hứa hẹn
  nhận diện câu liên tục.
- Chỉ nhận diện được **30 ký hiệu** ở thời điểm bắt đầu. Giao diện phải **nói rõ điều này** thay vì để
  người dùng thử một ký hiệu ngoài danh sách rồi nhận kết quả sai.

**Ràng buộc nội dung:** mọi nội dung dạy VSL phải được **người Điếc bản ngữ duyệt** trước khi xuất bản.

**Ràng buộc khả năng tiếp cận:** phục vụ cộng đồng khiếm thính → **bắt buộc WCAG 2.1 AA**; **không có thông
tin chỉ truyền tải bằng âm thanh**.

**Ràng buộc đội ngũ & chi phí:** đội nhỏ → kiến trúc phải vận hành được bởi 1–2 người; video bắt buộc qua CDN.

### Giả định *(cần kiểm chứng)*
- **GĐ-01:** Người học chấp nhận bật camera để luyện ký hiệu. *(Kiểm: tỉ lệ cấp quyền camera ≥ 60%.)*
- **GĐ-02:** Độ chính xác **0.901 đo trên tập VSL400** giữ được ở mức **≥ 0.80 với webcam thật, người thật,
  điều kiện ánh sáng thường**. ⚠️ *Đây là giả định rủi ro nhất — dữ liệu quay chuẩn khác hẳn webcam đời thực.
  Repo cũng đã nêu "Run real webcam validation with 3-5 people" là bước tiếp theo. **Bắt buộc kiểm trước GATE-2.***
- **GĐ-03:** Tìm và hợp tác được với người Điếc bản ngữ để sản xuất nội dung ngoài 30 ký hiệu VSL400.
- **GĐ-04:** Người dùng mục tiêu có băng thông đủ xem video 720p.
- **GĐ-05:** VNPay và/hoặc MoMo phê duyệt tài khoản merchant cho dự án. *(Nếu không → chặn toàn bộ BG-03.)*
- **GĐ-06:** MediaPipe Holistic chạy đủ nhanh trên **trình duyệt** ở máy tầm trung. *(Kiểm cùng GĐ-02.)*

## 7. Tiêu chí thành công / Nghiệm thu

- **SC-01:** Đạt `BG-01` — ≥ 60% người đăng ký mới hoàn thành Chương 1 trong 7 ngày.
- **SC-02:** Đạt `BG-02` — D7 ≥ 35%, D30 ≥ 18%.
- **SC-03:** Đạt `BG-03` — free→premium ≥ 4% trong 30 ngày.
- **SC-04:** Đạt `BG-04` — ≥ 300 bài học, ≥ 1.500 ký hiệu đã xuất bản.
- **SC-05:** Đạt `BG-05` — ≥ 4.5/5 với ≥ 300 đánh giá.
- **SC-06:** **Không sự cố Sev-1** (sập dịch vụ, mất dữ liệu học, rò rỉ dữ liệu cá nhân **hoặc rò rỉ hình
  ảnh camera**) trong 30 ngày đầu.
- **SC-07:** Đạt **WCAG 2.1 AA** trên toàn luồng học, có biên bản kiểm tra.
- **SC-08:** **0 finding Critical/High còn mở** tại GATE-5.
- **SC-09:** Đạt `BG-06` — chi phí hạ tầng ≤ 0,15 USD/MAU trong 3 tháng liên tiếp.
- **SC-10:** Hành vi hệ thống **khớp đúng chính sách camera đã công bố**, chứng minh bằng theo dõi lưu
  lượng mạng thật ở B5.
- **SC-11:** Đạt `BG-07` — ≥ 70% người dùng AI đạt ký hiệu đúng trong ≤ 3 lần thử.
- **SC-12:** **Ghi nguồn VSL400 hiển thị đúng vị trí** đã cam kết (nghĩa vụ CC BY 4.0).
- **SC-13:** **Tuyên bố "không phải thông dịch viên" hiển thị** ở màn AI và trang pháp lý.

## 8. Rủi ro & Câu hỏi mở

| Rủi ro / Câu hỏi | Ảnh hưởng | Giảm thiểu / Ai quyết | Hạn chót |
|-------------------|-----------|------------------------|----------|
| **R-01** Sản xuất nội dung là nút thắt lớn nhất — 30 ký hiệu VSL400 **không đủ** dựng một khoá học | **Rất cao** — chặn BG-01, BG-04 | ⏸️ **ĐÃ DỜI, chưa gỡ.** Q10 chốt dùng **nội dung giả lập** để dựng & nghiệm thu chức năng (SRS §3.4) → không còn chặn GATE-2/GATE-4. **Vẫn chặn GATE-6** — cần ≥ 1 Unit nội dung thật. **Q5 vẫn mở** | **Dời: trước GATE-6** |
| **R-02** **Độ chính xác tụt khi dùng webcam thật** (0.901 đo trên video quay chuẩn) | **Rất cao** — chặn BR-06, BG-07 | **Bắt buộc kiểm với 3–5 người thật, webcam thật, trước GATE-2**; có phương án hạ cấp sang chế độ Gương không chấm điểm | Trước GATE-2 |
| **R-03** Rủi ro pháp lý nếu clone quá sát đối thủ | Cao | Nhận diện thương hiệu & nội dung tự sản xuất 100%; rà soát pháp lý trước go-live | Trước GATE-6 |
| **R-04** Chi phí băng thông video vượt dự toán | TB–Cao | CDN + HLS đa bitrate + theo dõi chi phí hằng tuần | Từ tháng 3 |
| **R-05** ~~Chọn sai ngôn ngữ ký hiệu~~ | ✅ **Đã đóng** | Q4 chốt **VSL** | 2026-09-20 |
| **R-06** ~~Cổng thanh toán chưa chốt~~ | ✅ **Đã đóng**, phát sinh R-10 | Q3 chốt **VNPay + MoMo** | 2026-09-20 |
| **R-07** Tuân thủ PDPL với người học chưa thành niên | TB–Cao | ✅ **Đã chốt chính sách tuổi (2026-09-20): mốc 16 tuổi.** Người **dưới 16** vẫn **học được đầy đủ**, nhưng **không được mời và không được bật** góp dữ liệu (BR-A137). Ghi vào Điều khoản + thêm bước khai năm sinh ở onboarding. ⚠️ **Cảnh báo:** khai năm sinh là tự khai, không xác minh được — đây là biện pháp **giảm nhẹ**, không phải bảo đảm pháp lý | Hiện thực trước GATE-5 |
| **R-08** Đội 1–2 người không kham nổi web + CMS + AI + nội dung | Cao *(tăng so với v0.1 vì thêm AI)* | Modular monolith + dịch vụ AI tái dùng nguyên trạng; cắt phạm vi theo §3.2 | Liên tục |
| **R-09** **Dữ liệu huấn luyện quá ít** (701 mẫu / 30 lớp) để mở rộng | Cao → **TB** *(hạ mức 2026-09-20)* | ✅ **Q9 = BẬT** góp dữ liệu (FR-46 vào phạm vi GĐ1) → có kênh thu dữ liệu hợp pháp. ✅ **Q11 = tăng độ chính xác MVP-30 trước** → **không mở rộng lớp ở GĐ1**, nên 701 mẫu/30 lớp là **đủ dùng cho GĐ1**; R-09 chuyển thành rủi ro của **BG-08 (mốc 12 tháng)**, không còn là rủi ro giao hàng. ⚠️ Kênh góp dữ liệu chỉ sinh dữ liệu **sau khi có người dùng thật** | BG-08: 12 tháng |
| **R-10** **Không có tự động gia hạn → tỉ lệ gia hạn thấp** | Cao — ảnh hưởng BG-03 | Nhắc gia hạn 7/3/1 ngày; ưu đãi gói dài; gia hạn ≤ 3 thao tác; theo dõi tỉ lệ gia hạn từ tháng 2 | Từ go-live |
| **R-11** ~~Merchant VNPay/MoMo không được duyệt~~ | ✅ **Đã đóng** *(2026-09-20)* | Anh Duy xác nhận đã có **tài khoản merchant/sandbox** VNPay và MoMo (SĐT `0866678802`) → lấy được `vnp_TmnCode`/`vnp_HashSecret` và `partnerCode`/`accessKey`/`secretKey`. **Việc còn lại là thao tác, không còn là rủi ro:** lấy 5 khoá, đặt vào `deploy/.env`. 🔐 Khoá **không được commit** và **không được ghi log** (NFR-11) | 2026-09-20 |
| **R-12** Người dùng hiểu nhầm AI là thông dịch viên | TB — rủi ro pháp lý & uy tín | Tuyên bố rõ ở màn AI, trang pháp lý, mọi tài liệu tiếp thị (SC-13) | Trước GATE-6 |
| **Q8** ~~Suy luận AI chạy ở đâu~~ | ✅ **Đã đóng** | Chốt **phương án B**: trình duyệt trích landmark, server phân lớp (HLD ADR-08, NFR-12) | 2026-09-20 |
| **Q9** ~~Có bật "Góp dữ liệu luyện tập"~~ | ✅ **Đã đóng** | Chốt **CÓ** — FR-46 vào phạm vi GĐ1 | 2026-09-20 |
| **Q10** ~~Giáo trình bám 30 ký hiệu?~~ | ✅ **Đã đóng** | Chốt **nội dung giả lập trước** (SRS §3.4, NFR-21); giáo trình thật làm sau GATE-4 | 2026-09-20 |
| **Q5** ~~Nguồn video bài học ngoài 30 ký hiệu VSL400~~ | ⏸️ **Hoãn có chủ đích** | Chốt **để sau GATE-4** (2026-09-20) — hợp lệ vì Q10 cho phép nghiệm thu bằng nội dung giả lập. ⚠️ **Không phải đã giải quyết:** vẫn chặn GATE-6 và vẫn là hạng mục tốn kém nhất. Phải mở lại **ngay khi GATE-4 xong**, nếu không sẽ thành nút thắt cuối dự án | **Mở lại sau GATE-4** |
| **Q6** ~~GĐ1 có gồm B2B & đặt lịch tutor không?~~ | ✅ **Đã đóng** | Chốt **KHÔNG** (2026-09-20) — giữ nguyên phạm vi BRD, tiết kiệm ~6 tuần công. B2B chỉ còn **form liên hệ** ở trang doanh nghiệp; đặt lịch tutor đẩy sang GĐ2 | 2026-09-20 |
| **Q11** ~~MVP-50 hay tăng độ chính xác MVP-30?~~ | ✅ **Đã đóng** | Chốt **tăng độ chính xác MVP-30 trước** (2026-09-20). Giữ nguyên 30 nhãn; toàn bộ công sức AI dồn vào hạ rủi ro **R-02**. MVP-50 lùi sang sau GATE-6 | 2026-09-20 |

## 9. Ghi nhận khảo sát sản phẩm đối thủ *(bổ sung ở v0.2)*

Sau khi đăng nhập vào sản phẩm của Lingvano, đội phát hiện **5 điểm khác với giả định ở v0.1**. Các điểm
này **đã được sửa vào SRS/FSD v0.2**:

| # | Giả định v0.1 | Thực tế quan sát được | Đã sửa ở |
|---|----------------|------------------------|----------|
| 1 | Trainer giới hạn **1 phiên/ngày** với người dùng miễn phí | Trainer **khoá theo tiến độ học**: từ vựng mở sau Chương 1 · đánh vần mở sau Chương 3 (chương dạy bảng chữ cái) · số mở khi tới Unit 2. Hợp lý hơn hẳn — *không thể luyện đánh vần trước khi học bảng chữ cái* | SRS FR-17→19, FR-30 |
| 2 | Bài học = danh sách bài tập | Bài học là **chuỗi bước hỗn hợp**: thẻ "Học ký hiệu mới" (video + nhãn) · thẻ giải thích (ví dụ "Tay trái hay tay phải?") · bài tập chấm điểm | SRS FR-12, LLD `lesson_step` |
| 3 | Bài tập trắc nghiệm luôn có **4 lựa chọn** | Số lựa chọn **thay đổi (2–4)**, có **phím tắt số** 1/2/3/4 | SRS FR-12, FR-34 |
| 4 | Từ điển duyệt theo chủ đề chung chung | **26 chủ đề có số lượng cụ thể** (~1.773 ký hiệu): Bảng chữ cái 28 · Số 216 · Động từ 213 · Cảm xúc 142 · Công việc 134 … và nút **"Thiếu ký hiệu?"** để người dùng báo thiếu | SRS FR-21, **FR-45 mới** |
| 5 | Gói miễn phí vĩnh viễn | Có khái niệm **"Dùng thử miễn phí" (free trial)** tách bạch với gói miễn phí | SRS FR-28, FR-30 |

**Ghi chú đạo đức & pháp lý:** các quan sát trên là **đặc điểm chức năng**, dùng để tránh thiết kế sai
những thứ đối thủ đã kiểm chứng. **Không** sao chép nội dung, văn bản, hình ảnh hay mã nguồn của họ.

---

## ✅ Checklist BRD (trước khi báo PO trình GATE-1)
- [x] Mọi mục tiêu `BG-xx` đo được (baseline → target + thời hạn) — 8 mục tiêu.
- [x] Có cả "trong" lẫn "ngoài" phạm vi; hệ quả của quyết định Q3 được phân tích riêng (§3.3).
- [x] Mọi `BR-xx` nối về một `BG-xx`; không lấn sang chi tiết SRS.
- [x] Ràng buộc PDPL, **CC BY 4.0 của VSL400**, và **tuyên bố không phải thông dịch viên** đã ghi nhận.
- [x] Câu hỏi mở kèm người quyết + hạn chót.
- [x] Ghi nhận khảo sát đối thủ ở §9 với ranh giới pháp lý rõ ràng.
- [x] ✅ **Toàn bộ câu hỏi mở đã được chốt (2026-09-20):** Q1, Q2, Q5 (hoãn), Q6, Q8, Q9, Q10, Q11, R-07, R-11.
- [x] ✅ **BRD không còn câu hỏi nào chặn GATE-1.**
- [ ] ⚠️ **R-02 giờ là rủi ro lớn nhất còn lại và có thể giết dự án** — 0.901 đo trên video quay chuẩn, chưa đo webcam thật. **Phải kiểm với ≥ 5 người, ≥ 3 điều kiện ánh sáng trước GATE-2.** Q11 đã chốt dồn toàn bộ công sức AI vào việc này.
- [ ] ⚠️ **R-01 đã dời chứ chưa gỡ** — GATE-6 vẫn cần ≥ 1 Unit nội dung thật; phải mở lại Q5 ngay sau GATE-4.
