# -*- coding: utf-8 -*-
import base64
import hashlib
import hmac
import json
import time
import urllib.request
import urllib.error
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
cur.execute("SELECT l.id, l.title FROM lesson l WHERE l.title = 'Cháu, Chú, Chị'")
lid, title = cur.fetchone()
url = f"http://localhost:8080/api/v1/lessons/{lid}"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req) as resp:
        print(resp.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("Status:", e.code, e.read().decode("utf-8"))
