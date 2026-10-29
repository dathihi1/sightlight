-- Firebase Cloud Messaging qua Firebase Installation ID (FID).
-- PostgreSQL van la nguon su that cho notification; bang outbox chi phuc vu push bat dong bo.

CREATE TABLE push_installation (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    firebase_installation_id VARCHAR(255) NOT NULL,
    platform VARCHAR(16) NOT NULL DEFAULT 'WEB',
    permission_status VARCHAR(16) NOT NULL DEFAULT 'GRANTED',
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_push_installation_fid UNIQUE (firebase_installation_id),
    CONSTRAINT ck_push_installation_platform CHECK (platform IN ('WEB', 'ANDROID', 'IOS')),
    CONSTRAINT ck_push_installation_permission CHECK (
        permission_status IN ('GRANTED', 'DENIED', 'DEFAULT', 'REVOKED')
    )
);

CREATE INDEX idx_push_installation_user_active
    ON push_installation(user_id, revoked_at);
CREATE INDEX idx_push_installation_last_seen
    ON push_installation(last_seen_at);

CREATE TABLE push_outbox (
    id UUID PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notification(id) ON DELETE CASCADE,
    installation_id UUID NOT NULL REFERENCES push_installation(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    notification_type VARCHAR(30) NOT NULL,
    target_url VARCHAR(255),
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_error_code VARCHAR(100),
    firebase_message_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    CONSTRAINT uq_push_outbox_delivery UNIQUE (notification_id, installation_id),
    CONSTRAINT ck_push_outbox_status CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')),
    CONSTRAINT ck_push_outbox_attempts CHECK (attempt_count >= 0)
);

CREATE INDEX idx_push_outbox_ready
    ON push_outbox(status, next_attempt_at, created_at);
