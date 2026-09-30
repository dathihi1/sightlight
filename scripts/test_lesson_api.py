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
    "roles": ["LEARNER_FREE"],
    "jti": "test",
    "iat": now,
    "exp": now + 3600
}).encode())
msg = f"{header}.{payload}".encode()
sig = b64(hmac.new(b"vCEPEfv6syrGzMhFqWFYAHsNpq15V5zobjAovyjwy9l", msg, hashlib.sha256).digest())
token = f"{header}.{payload}.{sig}"

conn = psycopg2.connect("postgresql://signlight:signlight@localhost:5432/signlight")
cur = conn.cursor()
cur.execute("SELECT id, title FROM lesson WHERE title = 'Anh, Bà ngoại, Bà nội'")
lid, title = cur.fetchone()

url = f"http://localhost:8080/api/v1/lessons/{lid}"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode("utf-8"))
    res = data.get("result", {})
    print("Lesson:", res.get("title"))
    print("Sign Cards count:", len(res.get("blocks", [])))
    for b in res.get("blocks", []):
        print(f"  - Thẻ từ: '{b.get('title')}' | Nghĩa: '{b.get('bodyText')}'")
    
    exs = res.get("exercises", [])
    print(f"\nTổng số bài tập: {len(exs)}")
    for i, ex in enumerate(exs[:6]):
        print(f"  [Bài tập #{i+1} {ex.get('type')}]")
        print(f"    Đề bài: {ex.get('promptText')}")
        if ex.get("options"):
            opt_labels = [o.get("labelText") for o in ex.get("options")]
            print(f"    Options: {opt_labels}")
