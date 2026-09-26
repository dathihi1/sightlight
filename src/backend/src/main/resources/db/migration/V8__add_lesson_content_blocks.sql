-- V8 — Thêm lesson content blocks để chuẩn hóa nội dung bài học
-- Mục tiêu:
--   1. Tách nội dung bài học thành các blocks có thể quản lý độc lập
--   2. Hỗ trợ nhiều loại nội dung: intro, objectives, sign cards, tips, examples, summary
--   3. Mỗi block có stable_key riêng để dễ cập nhật
--   4. Không lộ đáp án hoặc dữ liệu internal trong public blocks

CREATE TABLE lesson_content_block (
    id                UUID PRIMARY KEY,
    lesson_id         UUID         NOT NULL REFERENCES lesson (id) ON DELETE CASCADE,
    stable_key        VARCHAR(200) NOT NULL,
    block_type        VARCHAR(32)  NOT NULL,
    order_index       INT          NOT NULL,
    title             VARCHAR(200),
    body_text         TEXT,
    payload           JSONB,
    sign_id           UUID REFERENCES sign (id),
    media_ref         VARCHAR(512),
    is_required       BOOLEAN      NOT NULL DEFAULT true,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PUBLISHED',
    content_version   INT          NOT NULL DEFAULT 1,
    is_seed           BOOLEAN      NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_lesson_block_stable_key UNIQUE (lesson_id, stable_key),
    CONSTRAINT uq_lesson_block_order UNIQUE (lesson_id, order_index),
    CONSTRAINT ck_block_type CHECK (block_type IN (
        'INTRO',
        'OBJECTIVES',
        'CONTEXT',
        'SIGN_CARD',
        'PRONUNCIATION_NOTE',
        'MEMORY_TIP',
        'EXAMPLE',
        'DIALOGUE',
        'VIDEO',
        'CHECKPOINT',
        'SUMMARY'
    )),
    CONSTRAINT ck_block_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

COMMENT ON TABLE lesson_content_block IS 'Các khối nội dung trong bài học, hiển thị trước/sau phần luyện tập';
COMMENT ON COLUMN lesson_content_block.stable_key IS 'Stable identifier within lesson, e.g., intro, objectives, sign-anh, memory-tip-01';
COMMENT ON COLUMN lesson_content_block.block_type IS 'Type of content block determines how it is rendered';
COMMENT ON COLUMN lesson_content_block.body_text IS 'Main text content for text-based blocks';
COMMENT ON COLUMN lesson_content_block.payload IS 'Additional structured data specific to block type (JSON)';
COMMENT ON COLUMN lesson_content_block.sign_id IS 'Reference to sign if this block introduces/explains a specific sign';
COMMENT ON COLUMN lesson_content_block.media_ref IS 'Reference to media (video, image) if applicable';
COMMENT ON COLUMN lesson_content_block.is_required IS 'Whether user must view this block before exercises';
COMMENT ON COLUMN lesson_content_block.status IS 'Only PUBLISHED blocks are returned in public API';

CREATE INDEX idx_lcb_lesson_order ON lesson_content_block (lesson_id, order_index) WHERE status = 'PUBLISHED';
CREATE INDEX idx_lcb_lesson_status ON lesson_content_block (lesson_id, status);
CREATE INDEX idx_lcb_sign ON lesson_content_block (sign_id) WHERE sign_id IS NOT NULL;
CREATE INDEX idx_lcb_type ON lesson_content_block (block_type);

-- ============================================================ Notes
--
-- Block Types Guide:
--
-- INTRO: Introduction text shown at the start of lesson
--   - body_text: introductory paragraph
--   - No payload needed
--
-- OBJECTIVES: Learning objectives list
--   - payload: { "objectives": ["objective 1", "objective 2", ...] }
--
-- CONTEXT: Situational context or use case
--   - body_text: context description
--
-- SIGN_CARD: Detailed information about a specific sign
--   - sign_id: required
--   - title: sign word/phrase
--   - body_text: meaning and usage notes
--   - media_ref: primary video reference
--
-- PRONUNCIATION_NOTE: How to perform the sign correctly
--   - sign_id: optional
--   - body_text: pronunciation/movement notes
--
-- MEMORY_TIP: Mnemonic or memory aid
--   - body_text: tip text
--   - payload: { "category": "visual" | "association" | "story" }
--
-- EXAMPLE: Example sentence or usage
--   - body_text: example text
--   - payload: { "signs": ["word1", "word2"], "translation": "..." }
--
-- DIALOGUE: Short dialogue exchange
--   - payload: { "exchanges": [{"speaker": "A", "text": "...", "signs": [...]}, ...] }
--
-- VIDEO: Standalone video demonstration
--   - media_ref: video reference
--   - body_text: optional caption
--
-- CHECKPOINT: Mid-lesson comprehension check
--   - payload: { "question": "...", "hint": "..." }
--
-- SUMMARY: Lesson summary/recap
--   - body_text: summary text
--   - payload: { "keyPoints": ["point 1", "point 2", ...] }
--
-- Security Note:
--   - Never store answer keys or internal grading logic in blocks
--   - All blocks with status='PUBLISHED' will be returned to client
--   - Use payload for structured data but ensure it's safe for public view
