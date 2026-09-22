-- V5 -- Bang luu refresh token xoay vong (30 ngay).
-- Tham khao thiet ke: docs/sa/LLD.md §1.2, api-spec.md §2, §3.20, BR-A04.

CREATE TABLE IF NOT EXISTS refresh_token (
    id          UUID        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    family_id   UUID        NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_rt_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_rt_user    ON refresh_token (user_id);
CREATE INDEX IF NOT EXISTS idx_rt_family  ON refresh_token (family_id);
CREATE INDEX IF NOT EXISTS idx_rt_expires ON refresh_token (expires_at);
