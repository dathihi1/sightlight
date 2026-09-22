-- V3 — Tích hợp các tính năng mở rộng từ EXE101:
-- 1. Thêm bảng auth_identity hỗ trợ đăng nhập Google OAuth2 (OIDC).
-- 2. Mở rộng bảng sign_video cho lưu trữ và phát video Google Drive thay vì MinIO cục bộ.
-- 3. Bổ sung các bảng quản lý gói đăng ký và thanh toán payOS (plan, subscription, payment_transaction, payment_webhook_log).

-- ============================================================ 1. auth_identity
CREATE TABLE auth_identity (
    id               UUID PRIMARY KEY,
    user_id          UUID         NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    provider         VARCHAR(20)  NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_auth_provider_user UNIQUE (provider, provider_user_id)
);
CREATE INDEX idx_authid_user ON auth_identity (user_id);

-- ============================================================ 2. sign_video (Google Drive)
ALTER TABLE sign_video ALTER COLUMN object_key DROP NOT NULL;
ALTER TABLE sign_video ADD COLUMN storage_provider VARCHAR(32) NOT NULL DEFAULT 'GDRIVE';
ALTER TABLE sign_video ADD COLUMN drive_file_id VARCHAR(128);
ALTER TABLE sign_video ADD COLUMN direct_url VARCHAR(1024);
CREATE INDEX idx_sv_drive ON sign_video (drive_file_id);

-- ============================================================ 3. billing (payOS)
CREATE TABLE plan (
    id            VARCHAR(32)  PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    description   TEXT,
    duration_days INT          NOT NULL,
    price_vnd     INT          NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO plan (id, name, description, duration_days, price_vnd, is_active) VALUES
    ('PREMIUM_1M', 'Gói Premium 1 Tháng', 'Mở khoá toàn bộ 17 Units, không giới hạn lượt thực hành AI', 30, 99000, true),
    ('PREMIUM_6M', 'Gói Premium 6 Tháng', 'Tiết kiệm chi phí học tập dài hạn', 180, 499000, true),
    ('PREMIUM_1Y', 'Gói Premium 1 Năm', 'Học trọn vẹn toàn bộ kho ký hiệu VSL', 365, 899000, true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE subscription (
    id           UUID        PRIMARY KEY,
    user_id      UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    plan_id      VARCHAR(32) NOT NULL REFERENCES plan (id),
    status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_subscription_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED'))
);
CREATE INDEX idx_sub_user ON subscription (user_id);
CREATE INDEX idx_sub_expires ON subscription (expires_at);

CREATE TABLE payment_transaction (
    id                      UUID        PRIMARY KEY,
    user_id                 UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    plan_id                 VARCHAR(32) NOT NULL REFERENCES plan (id),
    order_code              BIGINT      NOT NULL UNIQUE,
    order_ref               VARCHAR(64) NOT NULL UNIQUE,
    provider                VARCHAR(16) NOT NULL DEFAULT 'PAYOS',
    amount                  INT         NOT NULL,
    status                  VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    payment_link_id         VARCHAR(128),
    checkout_url            VARCHAR(1024),
    qr_code                 TEXT,
    provider_transaction_no VARCHAR(128),
    webhook_signature       VARCHAR(256),
    paid_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_pt_status CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'FAILED', 'EXPIRED'))
);
CREATE INDEX idx_pt_user ON payment_transaction (user_id);
CREATE INDEX idx_pt_order_code ON payment_transaction (order_code);
CREATE INDEX idx_pt_status ON payment_transaction (status);

CREATE TABLE payment_webhook_log (
    id            UUID        PRIMARY KEY,
    provider      VARCHAR(16) NOT NULL,
    order_code    BIGINT,
    raw_payload   TEXT        NOT NULL,
    signature     VARCHAR(256),
    is_valid      BOOLEAN     NOT NULL,
    processed     BOOLEAN     NOT NULL DEFAULT false,
    error_message TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pwl_order_code ON payment_webhook_log (order_code);
