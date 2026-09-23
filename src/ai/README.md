---
title: SignLight AI
description: SignLight feature-tensor inference service
sdk: docker
app_port: 7860
---

# SignLight AI

This Space serves the SignLight ONNX inference API. It accepts numeric feature
sequences only; it does not accept or retain images, video, or user uploads.

Endpoints:

- `GET /health`
- `GET /api/labels`
- `POST /api/infer/features`

Set `MODEL_DIR` and keep `LOG_WEBHOOK_URL`, `LOG_WEBHOOK_SECRET`, and
`GDRIVE_FOLDER_ID` empty. For a public Space, set Space secrets
`SIGNLIGHT_AI_SERVICE_TOKEN` and `SIGNLIGHT_AI_REQUIRE_TOKEN=true`. Configure
the same token as a Render secret; the backend sends it as a Bearer token.
The backend should call this service over HTTPS using `SIGNLIGHT_AI_BASE_URL`.
