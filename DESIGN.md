# SignLight Design System v4 — "Warm Dashboard"

Hướng tham khảo: dashboard e-learning tông cam ấm (bố cục sidebar + cột chi tiết), được làm lại bằng nội dung và widget riêng của SignLight.
Học ngôn ngữ ký hiệu mỗi ngày một chút: có động lực (chuỗi ngày, XP, huy hiệu) nhưng **điềm tĩnh, ấm áp, tôn trọng** —
không bắt chước ngôn ngữ hình ảnh của app học ngoại ngữ khác (không nút khối 3D, không chữ IN HOA, không linh vật có mặt,
không lộ trình zigzag nút tròn, không "mạng" trái tim).
Vì người học Điếc/khiếm thính dựa hoàn toàn vào thị giác, **mọi trạng thái đều có màu + icon + chữ** (không bao giờ chỉ màu), và cặp chữ/nền chính đạt WCAG 2.1 AA.

- **Nguồn sự thật cho token:** `src/frontend/app/globals.css` (`@theme`). File này mô tả cách dùng.
- Palette mặc định của Tailwind bị tắt (`--color-*: initial`) — class như `bg-slate-500` sẽ không ra màu. Chỉ dùng token dưới đây.

## 1. Màu

| Token | Vai trò | Ghi chú tương phản |
|---|---|---|
| `brand` (cam ấm) | Hành động chính, tiến độ, đang chọn, chuỗi ngày | `brand-500` nền chữ trắng 4.6:1 · `brand-600` chữ/link 5.9:1 · `brand-400` cam tươi **chỉ trang trí** (thanh tiến độ sọc, biểu đồ) |
| `sun` (vàng) | XP, sao, phần thưởng | chữ `sun-700` trên `sun-100` 6.3:1 |
| `flame` (cam) | Chuỗi ngày (streak) | |
| `grape` (tím) | Premium, huy hiệu hiếm | `grape-500` nền chữ trắng 5.7:1 |
| `sky` (xanh dương) | Minh hoạ phụ (icon bước, độ chuẩn AI) — không dùng cho nút | `sky-600` chữ 5.5:1 |
| `danger` (đỏ) | Sai, lỗi | chữ `danger-600` 6.6:1 |
| `ink` (trung tính ấm — giấy kem) | Chữ, viền, nền | `ink-900` tiêu đề · `ink-600` chữ phụ · `ink-500` chữ nhỏ tối thiểu (≥5.4:1 cả trên nền kem) · `ink-400` **chỉ icon** · `ink-200` viền · `ink-50` nền trang |

Nền trang: kem `ink-50`; section xen kẽ `bg-white`; thẻ trắng.

## 2. Chữ

- Font: **Be Vietnam Pro** (next/font, subset `vietnamese`) — font do người Việt thiết kế, dấu rõ, không phải font tròn.
- Tiêu đề: `font-bold tracking-tight`. Nhãn/eyebrow: `text-sm font-semibold text-brand-600` — **chữ thường, không IN HOA**.
- Nội dung `text-base` (16px) độ đậm thường. Nhỏ nhất `text-xs` (12px) chỉ cho nhãn phụ.
- `h1–h3` tự `text-wrap: balance`.

## 3. Hình khối & độ sâu

- Radius: nút `rounded-full` (viên thuốc), ô nhập `rounded-xl`, thẻ `rounded-3xl`, banner `rounded-[2.5rem]`.
- Viền mảnh 1px `ink-200`. Độ nổi mềm nhiều lớp: `--shadow-soft` (thẻ), `--shadow-lift` (hover/nổi bật).
- **Không dùng** bóng "khối" đổ thẳng (`0 4px 0 0`) hay `border-b-4`.

## 4. Component class (globals.css `@layer components`)

| Class | Dùng khi |
|---|---|
| `btn` + `btn-primary` | Hành động chính (tối đa 1 mỗi khu vực) — teal, bóng màu mềm |
| `btn-secondary` | Hành động phụ — nền trắng viền mảnh |
| `btn-sun` / `btn-grape` | Nhận thưởng / Premium |
| `btn-danger` / `btn-ghost` | Huỷ/xoá · link dạng nút |
| `btn-sm` / `btn-lg` | Kích cỡ (mặc định cao 48px; `btn-sm` 40px) |
| `card` / `card-flat` / `card-interactive` | Thẻ có độ nổi / phẳng / nổi lên khi hover |
| `chip` | Nhãn ngắn (Premium, +10 XP, độ khó) |
| `input` | Ô nhập (cao 48px, focus viền teal + vầng `brand-100`) |
| `eyebrow` | Nhãn nhỏ phía trên tiêu đề |
| `progress > span` | Thanh tiến độ 10px, fill cam có sọc chéo |

Component React dùng chung: `ui/Mascot` (biểu tượng bàn tay + tia sáng theo logo, **không có mặt**; `mood` đổi tia sáng),
`ui/EmptyState`, `ui/Icons` (icon tô màu: `IconFlame`, `IconGem`, `IconStar`, `IconCrown`, `IconLock`, `IconCheck`, `IconPlay`).

## 5. Khung trang

- **Trang giới thiệu** (`/`, `/about`, `/blog`, auth): `Navbar` trên cùng + `Footer`.
- **Khu học viên** (`/hoc`, `/luyen-ai`, `/tu-dien`, `/hanh-trinh`, `/nang-cap`, `/thanh-toan`) và **Admin**: `AppShell` —
  sidebar trắng 264px (logo, nhãn "Menu", mục đang chọn nền `brand-50` chữ `brand-600`, thẻ Premium ở đáy),
  thanh trên (tiêu đề trang, ô tra ký hiệu, ngôn ngữ, thông báo, avatar, đăng xuất). Dưới `lg` sidebar thành ngăn kéo.
- **Làm bài** (`/hoc/bai…`): không khung, tập trung.
- Chọn khung ở `components/SiteChrome.tsx`.
- **Tổng quan `/hoc`:** cột chính (thẻ "Tiếp tục học", lộ trình dạng thẻ gập/mở) + cột phải 340px (hồ sơ có vòng tiến độ,
  3 chỉ số, lịch chuỗi tuần, biểu đồ phút học trong tuần — dữ liệu thật từ `GET /api/v1/gamification/summary`).

## 6. Mẫu tương tác

- **Lộ trình:** mỗi chủ đề là một thẻ; bài học xếp theo **dòng thời gian dọc** (chấm trạng thái + đường nối). Xong = chấm teal có dấu ✓;
  bài tiếp theo = hàng nền `brand-50` + nút "Bắt đầu/Tiếp tục"; chưa mở = khoá xám + lý do; cần Premium = vương miện tím + lý do.
- **Làm bài:** navbar/footer ẩn; thanh trên = ✕ + tiến độ; phản hồi đúng/sai là **thẻ ngay dưới câu hỏi** (icon + chữ + đáp án đúng);
  thanh đáy nền trắng trung tính chỉ chứa nút.
- **Lựa chọn:** thẻ viền mảnh, số thứ tự bên trái; đang chọn = viền teal + vầng `brand-100`.
- **Tổng kết bài:** 3 ô chỉ số (XP / chính xác / chuỗi ngày).

## 7. Chuyển động

- `animate-pop-in` (đúng), `animate-float-slow` (nhãn nổi), `animate-wave-hand` (biểu tượng tay).
- Nút nhấn: `scale(0.97)`.
- Tất cả tắt khi `prefers-reduced-motion: reduce`; cuộn mượt chỉ bật khi `no-preference`.

## 8. Truy cập (bắt buộc)

- Focus ring 3px `brand-400` cách 2px; vùng chạm ≥ 44px.
- Điều khiển không được ẩn sau hover (tốc độ video, nút sắp xếp từ luôn hiện).
- Dark mode: chưa bật (xem commit 3f1292d). Khi bật, chỉ cần đảo scale `ink`/`brand` trong `globals.css`.
