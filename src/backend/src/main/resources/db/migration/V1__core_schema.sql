-- V1 — Lược đồ lõi SignLight (nguồn sự thật: docs/sa/LLD.md §1).
-- Phạm vi lát cắt demo: identity, content, learning, airecognition, gamification (streak/daily_activity).
-- Các module còn lại (billing, cms, platform) sẽ đến ở migration sau — KHÔNG sửa file này.

-- ============================================================ identity

CREATE TABLE app_user (
    id                      UUID PRIMARY KEY,
    email                   VARCHAR(254) NOT NULL,
    email_verified_at       TIMESTAMPTZ,
    password_hash           VARCHAR(255),
    status                  VARCHAR(24)  NOT NULL DEFAULT 'PENDING_VERIFICATION',
    deletion_requested_at   TIMESTAMPTZ,
    failed_login_count      SMALLINT     NOT NULL DEFAULT 0,
    locked_until            TIMESTAMPTZ,
    birth_year              SMALLINT,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_user_status CHECK (status IN
        ('PENDING_VERIFICATION','ACTIVE','SUSPENDED','PENDING_DELETION','DELETED'))
);
COMMENT ON COLUMN app_user.birth_year IS 'R-07: chặn mời/bật góp dữ liệu khi dưới 16 tuổi';
CREATE UNIQUE INDEX uq_user_email_ci ON app_user (lower(email));
CREATE INDEX idx_user_status ON app_user (status);

CREATE TABLE user_profile (
    user_id             UUID PRIMARY KEY REFERENCES app_user (id) ON DELETE CASCADE,
    display_name        VARCHAR(50) NOT NULL,
    avatar_object_key   VARCHAR(512),
    timezone            VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh'
);

CREATE TABLE user_preference (
    user_id                 UUID PRIMARY KEY REFERENCES app_user (id) ON DELETE CASCADE,
    active_course_id        UUID,
    daily_goal_minutes      SMALLINT      NOT NULL DEFAULT 10,
    pending_goal_minutes    SMALLINT,
    learning_reason         VARCHAR(20),
    ui_locale               VARCHAR(10)   NOT NULL DEFAULT 'vi',
    video_speed             NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    marketing_email_opt_in  BOOLEAN       NOT NULL DEFAULT false,
    CONSTRAINT ck_pref_goal  CHECK (daily_goal_minutes IN (5, 10, 15, 20)),
    CONSTRAINT ck_pref_speed CHECK (video_speed IN (0.50, 0.75, 1.00))
);

CREATE TABLE user_role (
    user_id UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    role    VARCHAR(24) NOT NULL,
    PRIMARY KEY (user_id, role)
);

CREATE TABLE login_history (
    id              UUID PRIMARY KEY,
    user_id         UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    ip_hash         CHAR(64),
    user_agent_hash CHAR(64),
    result          VARCHAR(16) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lh_user_time ON login_history (user_id, created_at DESC);

-- ============================================================= content
-- `is_seed` (SEED-5): mọi bản ghi nội dung giả lập phải mang cờ này.
-- GATE-6 chặn phát hành prod nếu còn bất kỳ bản ghi is_seed = true.

CREATE TABLE course (
    id                UUID PRIMARY KEY,
    code              VARCHAR(16)  NOT NULL UNIQUE,
    name              VARCHAR(150) NOT NULL,
    status            VARCHAR(16)  NOT NULL DEFAULT 'DRAFT',
    alphabet_letters  VARCHAR(64)  NOT NULL DEFAULT '',
    is_seed           BOOLEAN      NOT NULL DEFAULT false
);
CREATE INDEX idx_course_status ON course (status);

ALTER TABLE user_preference
    ADD CONSTRAINT fk_pref_course FOREIGN KEY (active_course_id) REFERENCES course (id);

CREATE TABLE unit (
    id          UUID PRIMARY KEY,
    course_id   UUID         NOT NULL REFERENCES course (id) ON DELETE CASCADE,
    title       VARCHAR(150) NOT NULL,
    order_index INT          NOT NULL,
    is_free     BOOLEAN      NOT NULL DEFAULT false,
    is_seed     BOOLEAN      NOT NULL DEFAULT false,
    CONSTRAINT uq_unit_order UNIQUE (course_id, order_index),
    CONSTRAINT ck_unit_order CHECK (order_index >= 0)
);
CREATE INDEX idx_unit_course_order ON unit (course_id, order_index);

CREATE TABLE chapter (
    id                UUID PRIMARY KEY,
    unit_id           UUID         NOT NULL REFERENCES unit (id) ON DELETE CASCADE,
    title             VARCHAR(150) NOT NULL,
    order_index       INT          NOT NULL,
    quiz_pass_percent SMALLINT     NOT NULL DEFAULT 80,
    is_seed           BOOLEAN      NOT NULL DEFAULT false,
    CONSTRAINT uq_chapter_order UNIQUE (unit_id, order_index)
);

CREATE TABLE curiosity (
    id      UUID PRIMARY KEY,
    title   VARCHAR(150) NOT NULL,
    content TEXT         NOT NULL,
    is_seed BOOLEAN      NOT NULL DEFAULT false
);

CREATE TABLE lesson (
    id                UUID PRIMARY KEY,
    chapter_id        UUID         NOT NULL REFERENCES chapter (id) ON DELETE CASCADE,
    title             VARCHAR(150) NOT NULL,
    order_index       INT          NOT NULL,
    type              VARCHAR(20)  NOT NULL DEFAULT 'STANDARD',
    estimated_minutes SMALLINT     NOT NULL DEFAULT 5,
    curiosity_id      UUID REFERENCES curiosity (id),
    status            VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    is_seed           BOOLEAN      NOT NULL DEFAULT false,
    CONSTRAINT uq_lesson_order UNIQUE (chapter_id, order_index),
    CONSTRAINT ck_lesson_type  CHECK (type IN ('STANDARD','QUIZ','MILESTONE','DIALOGUE'))
);
CREATE INDEX idx_lesson_status ON lesson (status);

CREATE TABLE sign (
    id          UUID PRIMARY KEY,
    course_id   UUID         NOT NULL REFERENCES course (id) ON DELETE CASCADE,
    word        VARCHAR(100) NOT NULL,
    meaning     VARCHAR(255),
    word_class  VARCHAR(24),
    topic       VARCHAR(64),
    cefr_level  VARCHAR(4),
    description TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    is_seed     BOOLEAN      NOT NULL DEFAULT false,
    CONSTRAINT uq_sign_word UNIQUE (course_id, word, meaning)
);
CREATE INDEX idx_sign_topic  ON sign (topic);
CREATE INDEX idx_sign_status ON sign (status);

-- Tìm kiếm không dấu (ADR-05). `unaccent` mặc định là STABLE nên không dùng được trong cột sinh;
-- bọc lại thành hàm IMMUTABLE có chỉ rõ từ điển — cách chính thống của PostgreSQL.
CREATE FUNCTION signlight_unaccent(input TEXT) RETURNS TEXT
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    RETURN public.unaccent('public.unaccent'::regdictionary, input);

ALTER TABLE sign ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('simple',
            signlight_unaccent(coalesce(word, '') || ' ' ||
                               coalesce(meaning, '') || ' ' ||
                               coalesce(topic, '')))
    ) STORED;
CREATE INDEX idx_sign_fts  ON sign USING GIN (search_vector);
CREATE INDEX idx_sign_trgm ON sign USING GIN (signlight_unaccent(word) gin_trgm_ops);

CREATE TABLE sign_video (
    id                UUID PRIMARY KEY,
    sign_id           UUID         NOT NULL REFERENCES sign (id) ON DELETE CASCADE,
    object_key        VARCHAR(512) NOT NULL,
    hls_manifest_key  VARCHAR(512),
    status            VARCHAR(16)  NOT NULL DEFAULT 'UPLOADED',
    region_label      VARCHAR(64),
    signer_label      VARCHAR(64),
    is_primary        BOOLEAN      NOT NULL DEFAULT false,
    duration_ms       INT,
    is_seed           BOOLEAN      NOT NULL DEFAULT false,
    CONSTRAINT ck_sv_duration CHECK (duration_ms IS NULL OR duration_ms <= 60000)
);
CREATE INDEX idx_sv_sign   ON sign_video (sign_id);
CREATE INDEX idx_sv_status ON sign_video (status);

CREATE TABLE exercise (
    id                   UUID PRIMARY KEY,
    lesson_id            UUID        NOT NULL REFERENCES lesson (id) ON DELETE CASCADE,
    order_index          INT         NOT NULL,
    type                 VARCHAR(28) NOT NULL,
    sign_id              UUID REFERENCES sign (id),
    prompt_text          VARCHAR(500),
    correct_answer_text  VARCHAR(200),
    accepted_answers     JSONB       NOT NULL DEFAULT '[]',
    correct_order        JSONB,
    is_seed              BOOLEAN     NOT NULL DEFAULT false,
    CONSTRAINT uq_exercise_order UNIQUE (lesson_id, order_index)
);
COMMENT ON COLUMN exercise.correct_answer_text IS 'BR-A19: KHONG BAO GIO tra ra client';
COMMENT ON COLUMN exercise.correct_order IS 'SENTENCE_ORDER: KHONG BAO GIO tra ra client';
CREATE INDEX idx_ex_lesson_order ON exercise (lesson_id, order_index);
CREATE INDEX idx_ex_sign         ON exercise (sign_id);

CREATE TABLE exercise_option (
    id            UUID PRIMARY KEY,
    exercise_id   UUID    NOT NULL REFERENCES exercise (id) ON DELETE CASCADE,
    order_index   INT     NOT NULL DEFAULT 0,
    is_correct    BOOLEAN NOT NULL DEFAULT false,
    label_text    VARCHAR(200),
    sign_video_id UUID REFERENCES sign_video (id),
    is_seed       BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON COLUMN exercise_option.is_correct IS 'AC-12.4: KHONG BAO GIO serialize ra client';
CREATE INDEX idx_opt_exercise ON exercise_option (exercise_id);

-- ============================================================ learning

CREATE TABLE user_lesson_state (
    user_id                 UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    lesson_id               UUID        NOT NULL REFERENCES lesson (id) ON DELETE CASCADE,
    status                  VARCHAR(16) NOT NULL DEFAULT 'NOT_STARTED',
    best_score_percent      SMALLINT,
    first_try_perfect       BOOLEAN     NOT NULL DEFAULT false,
    current_exercise_index  SMALLINT    NOT NULL DEFAULT 0,
    completed_at            TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id),
    CONSTRAINT ck_uls_status CHECK (status IN ('NOT_STARTED','IN_PROGRESS','COMPLETED')),
    CONSTRAINT ck_uls_score  CHECK (best_score_percent IS NULL
                                    OR best_score_percent BETWEEN 0 AND 100)
);
CREATE INDEX idx_uls_user ON user_lesson_state (user_id);

CREATE TABLE exercise_attempt (
    id                UUID PRIMARY KEY,
    user_id           UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    exercise_id       UUID        NOT NULL REFERENCES exercise (id) ON DELETE CASCADE,
    attempt_no        SMALLINT    NOT NULL,
    is_correct        BOOLEAN     NOT NULL,
    answer_payload    JSONB,
    client_elapsed_ms INT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON COLUMN exercise_attempt.is_correct IS 'BR-A19: do server cham, khong nhan tu client';
CREATE INDEX idx_ea_user_time ON exercise_attempt (user_id, created_at DESC);
CREATE INDEX idx_ea_user_ex   ON exercise_attempt (user_id, exercise_id);

CREATE TABLE lesson_completion (
    id                UUID PRIMARY KEY,
    user_id           UUID          NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    lesson_id         UUID          NOT NULL REFERENCES lesson (id) ON DELETE CASCADE,
    idempotency_key   UUID          NOT NULL,
    score_percent     SMALLINT      NOT NULL,
    effective_minutes NUMERIC(5, 2) NOT NULL,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_lc_idempotency UNIQUE (user_id, idempotency_key)
);

-- ========================================================= gamification

CREATE TABLE streak (
    user_id                   UUID     NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    course_id                 UUID     NOT NULL REFERENCES course (id) ON DELETE CASCADE,
    current_count             INT      NOT NULL DEFAULT 0,
    longest_count             INT      NOT NULL DEFAULT 0,
    freeze_count              SMALLINT NOT NULL DEFAULT 0,
    last_goal_met_date_local  DATE,
    PRIMARY KEY (user_id, course_id),
    CONSTRAINT ck_streak_counts CHECK (current_count >= 0 AND longest_count >= 0),
    CONSTRAINT ck_streak_freeze CHECK (freeze_count BETWEEN 0 AND 3)
);

CREATE TABLE daily_activity (
    user_id             UUID          NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    course_id           UUID          NOT NULL REFERENCES course (id) ON DELETE CASCADE,
    activity_date_local DATE          NOT NULL,
    total_minutes       NUMERIC(5, 2) NOT NULL DEFAULT 0,
    goal_minutes        SMALLINT      NOT NULL,
    goal_met            BOOLEAN       NOT NULL DEFAULT false,
    PRIMARY KEY (user_id, course_id, activity_date_local)
);

-- ======================================================= airecognition

CREATE TABLE ai_model_version (
    id                   UUID PRIMARY KEY,
    version_code         VARCHAR(32)   NOT NULL UNIQUE,
    num_classes          SMALLINT      NOT NULL,
    sequence_length      SMALLINT      NOT NULL,
    feature_dim          SMALLINT      NOT NULL,
    schema_version       VARCHAR(32)   NOT NULL,
    confidence_threshold NUMERIC(4, 3) NOT NULL DEFAULT 0.550,
    confidence_margin    NUMERIC(4, 3) NOT NULL DEFAULT 0.030,
    is_active            BOOLEAN       NOT NULL DEFAULT false,
    synced_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);
-- BR-A127: chỉ một phiên bản hoạt động tại một thời điểm.
CREATE UNIQUE INDEX uq_ai_model_active ON ai_model_version (is_active) WHERE is_active;

CREATE TABLE ai_sign_label (
    id               UUID PRIMARY KEY,
    model_version_id UUID         NOT NULL REFERENCES ai_model_version (id) ON DELETE CASCADE,
    label_index      SMALLINT     NOT NULL,
    raw_label        VARCHAR(100) NOT NULL,
    stable_sign_id   VARCHAR(100) NOT NULL,
    sign_id          UUID REFERENCES sign (id),
    is_enabled       BOOLEAN      NOT NULL DEFAULT false,
    CONSTRAINT uq_aisl_index UNIQUE (model_version_id, label_index)
);
COMMENT ON COLUMN ai_sign_label.sign_id IS 'NULL = nhan mo coi, khong kich hoat (BR-A125)';
CREATE INDEX idx_aisl_stable ON ai_sign_label (stable_sign_id);

-- NFR-12: TUYỆT ĐỐI KHÔNG có cột ảnh/video/landmark thô ở bảng này.
CREATE TABLE sign_attempt (
    id                     UUID PRIMARY KEY,
    user_id                UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    target_sign_id         UUID        NOT NULL REFERENCES sign (id),
    model_version_id       UUID        NOT NULL REFERENCES ai_model_version (id),
    status                 VARCHAR(24) NOT NULL,
    verified               BOOLEAN     NOT NULL,
    predicted_sign_id      UUID REFERENCES sign (id),
    confidence             NUMERIC(4, 3),
    top3                   JSONB,
    quality                JSONB,
    duration_ms            INT,
    counted_against_quota  BOOLEAN     NOT NULL DEFAULT false,
    inference_latency_ms   INT,
    session_id             UUID,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_sa_duration   CHECK (duration_ms IS NULL OR duration_ms <= 6000),
    CONSTRAINT ck_sa_confidence CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1)
);
CREATE INDEX idx_sa_user_time ON sign_attempt (user_id, created_at DESC);

CREATE TABLE ai_daily_quota (
    user_id          UUID     NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    quota_date_local DATE     NOT NULL,
    used_count       SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, quota_date_local)
);

CREATE TABLE data_donation_consent (
    user_id              UUID PRIMARY KEY REFERENCES app_user (id) ON DELETE CASCADE,
    granted_at           TIMESTAMPTZ,
    revoked_at           TIMESTAMPTZ,
    consent_text_version VARCHAR(16) NOT NULL,
    pseudonym_id         UUID        NOT NULL UNIQUE
);

CREATE TABLE missing_sign_request (
    id             UUID PRIMARY KEY,
    normalized_key VARCHAR(100) NOT NULL UNIQUE,
    word           VARCHAR(100) NOT NULL,
    request_count  INT          NOT NULL DEFAULT 1,
    status         VARCHAR(16)  NOT NULL DEFAULT 'OPEN',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE missing_sign_requester (
    request_id UUID NOT NULL REFERENCES missing_sign_request (id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    PRIMARY KEY (request_id, user_id)
);
