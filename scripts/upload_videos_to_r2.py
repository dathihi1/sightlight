"""Đẩy các video web (public/videos/web/*.mp4) lên bucket Cloudflare R2.

R2 tương thích S3, nên dùng boto3 với endpoint R2. Object key giữ nguyên tiền tố `web/`
để khớp với `SignVideo.objectKey` trong seed và `MediaUrlService.resolveVideoUrl`.

Cấu hình qua biến môi trường (không hardcode secret):
  R2_ACCOUNT_ID        - Account ID của Cloudflare (dùng để dựng endpoint mặc định)
  R2_ENDPOINT          - (tuỳ chọn) ghi đè endpoint, vd https://<account>.r2.cloudflarestorage.com
  R2_ACCESS_KEY_ID     - Access Key ID của R2 API token
  R2_SECRET_ACCESS_KEY - Secret Access Key của R2 API token
  R2_BUCKET            - Tên bucket

Chạy:
  python scripts/upload_videos_to_r2.py
  python scripts/upload_videos_to_r2.py --dry-run
"""

from __future__ import annotations

import argparse
import mimetypes
import os
import sys
from pathlib import Path

# Windows console mặc định cp1252 không in được tiếng Việt -> ép UTF-8.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parents[1]
VIDEO_DIR = REPO_ROOT / "src" / "frontend" / "public" / "videos" / "web"
KEY_PREFIX = "web/"


def build_client():
    import boto3

    account_id = os.environ.get("R2_ACCOUNT_ID", "").strip()
    endpoint = os.environ.get("R2_ENDPOINT", "").strip()
    if not endpoint and account_id:
        endpoint = f"https://{account_id}.r2.cloudflarestorage.com"

    access_key = os.environ.get("R2_ACCESS_KEY_ID", "").strip()
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY", "").strip()

    missing = [
        name
        for name, value in (
            ("R2_ENDPOINT/R2_ACCOUNT_ID", endpoint),
            ("R2_ACCESS_KEY_ID", access_key),
            ("R2_SECRET_ACCESS_KEY", secret_key),
        )
        if not value
    ]
    if missing:
        print(f"Thiếu biến môi trường: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload video web lên Cloudflare R2")
    parser.add_argument("--dry-run", action="store_true", help="Chỉ liệt kê, không upload")
    args = parser.parse_args()

    bucket = os.environ.get("R2_BUCKET", "").strip()
    if not bucket and not args.dry_run:
        print("Thiếu biến môi trường: R2_BUCKET", file=sys.stderr)
        sys.exit(1)

    if not VIDEO_DIR.is_dir():
        print(f"Không tìm thấy thư mục video: {VIDEO_DIR}", file=sys.stderr)
        sys.exit(1)

    files = sorted(p for p in VIDEO_DIR.glob("*.mp4") if p.is_file())
    if not files:
        print(f"Không có tệp .mp4 nào trong {VIDEO_DIR}", file=sys.stderr)
        sys.exit(1)

    print(f"Tìm thấy {len(files)} video trong {VIDEO_DIR}")

    if args.dry_run:
        for path in files:
            print(f"[dry-run] {path.name} -> {KEY_PREFIX}{path.name}")
        return

    client = build_client()
    uploaded = 0
    for path in files:
        key = f"{KEY_PREFIX}{path.name}"
        content_type = mimetypes.guess_type(path.name)[0] or "video/mp4"
        client.upload_file(
            str(path),
            bucket,
            key,
            ExtraArgs={"ContentType": content_type},
        )
        uploaded += 1
        print(f"[{uploaded}/{len(files)}] đã tải {key}")

    print(f"Hoàn tất: {uploaded} video lên bucket '{bucket}'.")


if __name__ == "__main__":
    main()
