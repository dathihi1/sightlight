# -*- coding: utf-8 -*-
import base64
import hashlib
import hmac
import json
import time
import urllib.request

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

url = "http://localhost:8080/api/v1/lessons/01b9e2d4-975f-49c1-8f7a-e5bf04a6e365"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode("utf-8"))
    res = data.get("result", {})
    print("Lesson Title:", res.get("title"))
    print("Exercises Count:", len(res.get("exercises", [])))
    blocks = res.get("blocks", [])
    print(f"Blocks Count: {len(blocks)}")
    for i, b in enumerate(blocks):
        print(f"  [{i+1}] Type: {b.get('blockType')} | Word: {b.get('title')} | Meaning: {b.get('bodyText')} | Video: {b.get('mediaRef')}")
