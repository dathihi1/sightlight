CREATE TABLE user_lesson_sign_practice (
    user_id      UUID        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    lesson_id    UUID        NOT NULL REFERENCES lesson (id) ON DELETE CASCADE,
    sign_id      UUID        NOT NULL REFERENCES sign (id) ON DELETE CASCADE,
    attempt_id   UUID        REFERENCES sign_attempt (id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id, sign_id)
);

CREATE INDEX idx_ulsp_user_lesson
    ON user_lesson_sign_practice (user_id, lesson_id);
