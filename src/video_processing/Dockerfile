FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    MPLCONFIGDIR=/tmp/matplotlib \
    XDG_CACHE_HOME=/tmp/.cache \
    PORT=8000

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y libegl1 libgles2 libglib2.0-0 libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python -m pip install --upgrade pip \
    && python -m pip install -r requirements.txt

COPY scripts/download_holistic_model.py ./scripts/download_holistic_model.py
RUN python ./scripts/download_holistic_model.py /app/models/holistic_landmarker.task

COPY app ./app

RUN addgroup --system signlight \
    && adduser --system --ingroup signlight --no-create-home signlight \
    && chown -R signlight:signlight /app

USER signlight

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=3)"

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
