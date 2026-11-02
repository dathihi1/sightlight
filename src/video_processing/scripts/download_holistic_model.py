from __future__ import annotations

import hashlib
import os
import pathlib
import sys
import urllib.request


MODEL_URL = os.getenv(
    "HOLISTIC_MODEL_URL",
    "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/"
    "holistic_landmarker/float16/1/holistic_landmarker.task",
)
EXPECTED_SHA256 = "e2dab61191e2dcd0a15f943d8e3ed1dce13c82dfa597b9dd39f562975a50c3f8"


def main() -> int:
    destination = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "models/holistic_landmarker.task")
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".part")
    digest = hashlib.sha256()

    with urllib.request.urlopen(MODEL_URL, timeout=60) as response, temporary.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            digest.update(chunk)
            output.write(chunk)

    actual = digest.hexdigest()
    if actual != EXPECTED_SHA256:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(f"Holistic model checksum mismatch: {actual}")
    temporary.replace(destination)
    print(f"Downloaded verified MediaPipe model to {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
