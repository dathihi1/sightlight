# Thư mục mô hình — `vsl_mvp30_v2_lite_transformer`

Đặt vào đây các tệp lấy từ repo [`dathihi1/EXE101`](https://github.com/dathihi1/EXE101),
thư mục `runs/vsl_mvp30_v2_lite_transformer/`:

| Tệp | Bắt buộc | Mô tả |
|-----|:--------:|-------|
| `model_int8.onnx` | ✓ | Bản INT8 (~0,40 MB) — bản dùng để triển khai |
| `model.onnx` | ✗ | Bản FP32 (~1,00 MB) — để đối chiếu |
| `labels.json` | ✓ | 30 nhãn, **đúng thứ tự** chỉ số của mô hình |
| `config.json` | ✓ | `sequence_length = 64`, `feature_dim = 327`, `schema_version = v2_holistic_subset`, ngưỡng tin cậy |

⚠️ **Không có tệp mô hình thì dịch vụ vẫn khởi động, nhưng chạy ở CHẾ ĐỘ STUB**: kết quả nhận dạng
là giả lập tất định theo tensor, chỉ dùng để demo luồng đầu-cuối. `modelVersion` khi đó có hậu tố
`-stub` và mọi phản hồi mang cờ `stubMode: true` để không ai nhầm với số liệu thật.
**Chế độ stub không được dùng để nghiệm thu NFR-19 / GATE-4.**

Trọng số mô hình **không commit vào repo này** (dung lượng nhị phân + nguồn gốc dữ liệu VSL400).
