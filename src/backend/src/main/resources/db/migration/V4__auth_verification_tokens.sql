-- V4 -- Bang luu token xac nhan email (OTP) va token dat lai mat khau.
-- Tham khao thiet ke: docs/sa/LLD.md §1.2, api-spec.md §2, §3.20.

-- ============================================ email_verification_token
CREATE TABLE email_verification_token (
    id          UUID        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_evt_hash UNIQUE (token_hash)
);
CREATE INDEX idx_evt_user    ON email_verification_token (user_id);
CREATE INDEX idx_evt_expires ON email_verification_token (expires_at);

-- ============================================ password_reset_token
CREATE TABLE password_reset_token (
    id          UUID        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_prt_hash UNIQUE (token_hash)
);
CREATE INDEX idx_prt_user    ON password_reset_token (user_id);
CREATE INDEX idx_prt_expires ON password_reset_token (expires_at);
