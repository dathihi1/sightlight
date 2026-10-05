# Dịch vụ AI nhận diện ký hiệu động — SignLight
# Chạy ở mạng nội bộ Docker, KHÔNG expose port (HLD ADR-10, pentest DR-12).
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MODEL_DIR=/app/runs/vsl_mvp400_v2_lite_transformer \
    ONNX_INTRA_OP_THREADS=2

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY runs ./runs

# Chạy bằng người dùng thường — không cần quyền root (secure-coding).
RUN useradd --create-home --uid 10001 aiuser && chown -R aiuser:aiuser /app
USER aiuser

EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
