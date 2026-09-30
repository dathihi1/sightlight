# -*- coding: utf-8 -*-
import base64
import hashlib
import hmac
import json
import time
import urllib.request
import psycopg2

def b64(b):
    return base64.urlsafe_b64encode(b).decode().rstrip("=")

header = b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
now = int(time.time())
payload = b64(json.dumps({
    "sub": "c81542d6-9329-4ffe-bf1b-0417d7125e7a",
    "iss": "signlight",
    "roles": ["LEARNER_FREE", "LEARNER_PREMIUM"],
    "jti": "test",
    "iat": now,
    "exp": now + 3600
}).encode())
msg = f"{header}.{payload}".encode()
sig = b64(hmac.new(b"vCEPEfv6syrGzMhFqWFYAHsNpq15V5zobjAovyjwy9l", msg, hashlib.sha256).digest())
token = f"{header}.{payload}.{sig}"

conn = psycopg2.connect("postgresql://signlight:signlight@localhost:5432/signlight")
cur = conn.cursor()
cur.execute("SELECT l.id, l.title, u.title FROM lesson l JOIN chapter c ON c.id = l.chapter_id JOIN unit u ON u.id = c.unit_id ORDER BY u.order_index, c.order_index, l.order_index LIMIT 10")
lessons = cur.fetchall()

print(f"Kiểm tra {len(lessons)} bài học đầu tiên qua API /api/v1/lessons/{{id}}:\n")
for lid, title, unit_title in lessons:
    url = f"http://localhost:8080/api/v1/lessons/{lid}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            res = data.get("result", {})
            blocks = res.get("blocks", [])
            sign_cards = [b for b in blocks if b.get("blockType") == "SIGN_CARD"]
            ex_count = len(res.get("exercises", []))
            print(f"[{unit_title}] Bài: '{title}' -> Có {len(sign_cards)} thẻ học từ mới (SIGN_CARD), {ex_count} bài tập")
            for sc in sign_cards:
                has_video = bool(sc.get("mediaRef"))
                print(f"    - Từ: '{sc.get('title')}' | Nghĩa: '{sc.get('bodyText')}' | Có Video: {has_video}")
    except Exception as e:
        print(f"Bài: '{title}' -> LỖI: {e}")
