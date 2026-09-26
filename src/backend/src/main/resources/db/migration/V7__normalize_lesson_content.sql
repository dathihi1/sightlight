-- V7 — Chuẩn hóa nội dung bài học và bổ sung stable keys
-- Mục tiêu:
--   1. Thêm stable_key cho unit, chapter, lesson, exercise để không phụ thuộc UUID hoặc orderIndex
--   2. Thêm metadata cho lesson: summary, topic, targetLevel, contentVersion
--   3. Thêm metadata cho exercise: skill, difficulty, instructionText, evaluationVersion
--   4. Hỗ trợ versioning đơn giản cho nội dung
-- Migration này an toàn với dữ liệu hiện có: các cột nullable trước, backfill sau

-- ============================================================ unit
-- Thêm stable_key để có thể upsert seed theo key thay vì dựa vào orderIndex

ALTER TABLE unit ADD COLUMN stable_key VARCHAR(100);
COMMENT ON COLUMN unit.stable_key IS 'Stable identifier for seed upsert, e.g., vsl.family-and-relations';

-- Index và constraint sẽ thêm sau khi backfill
-- CREATE UNIQUE INDEX uq_unit_stable_key ON unit (course_id, stable_key) WHERE stable_key IS NOT NULL;

-- ============================================================ chapter
-- Thêm stable_key để seed upsert ổn định

ALTER TABLE chapter ADD COLUMN stable_key VARCHAR(150);
COMMENT ON COLUMN chapter.stable_key IS 'Stable identifier for seed upsert, e.g., vsl.family.basic-vocabulary';

-- CREATE UNIQUE INDEX uq_chapter_stable_key ON chapter (unit_id, stable_key) WHERE stable_key IS NOT NULL;

-- ============================================================ lesson
-- Thêm stable_key và metadata mô tả bài học

ALTER TABLE lesson ADD COLUMN stable_key VARCHAR(200);
ALTER TABLE lesson ADD COLUMN summary TEXT;
ALTER TABLE lesson ADD COLUMN topic VARCHAR(64);
ALTER TABLE lesson ADD COLUMN target_level VARCHAR(20);
ALTER TABLE lesson ADD COLUMN content_version INT NOT NULL DEFAULT 1;
ALTER TABLE lesson ADD COLUMN content_hash VARCHAR(64);
ALTER TABLE lesson ADD COLUMN published_at TIMESTAMPTZ;

COMMENT ON COLUMN lesson.stable_key IS 'Stable identifier for seed upsert, e.g., vsl.family.basic-vocabulary.introducing-family';
COMMENT ON COLUMN lesson.summary IS 'Brief description of what this lesson covers';
COMMENT ON COLUMN lesson.topic IS 'Main topic/theme of the lesson, e.g., FAMILY, DAILY_LIFE, SCHOOL';
COMMENT ON COLUMN lesson.target_level IS 'Target proficiency level, e.g., BEGINNER, INTERMEDIATE, ADVANCED';
COMMENT ON COLUMN lesson.content_version IS 'Version number for content changes, increments on material updates';
COMMENT ON COLUMN lesson.content_hash IS 'Hash of published content for change detection';
COMMENT ON COLUMN lesson.published_at IS 'Timestamp when this version was published';

-- CREATE UNIQUE INDEX uq_lesson_stable_key ON lesson (chapter_id, stable_key) WHERE stable_key IS NOT NULL;
CREATE INDEX idx_lesson_topic ON lesson (topic) WHERE topic IS NOT NULL;
CREATE INDEX idx_lesson_level ON lesson (target_level) WHERE target_level IS NOT NULL;
CREATE INDEX idx_lesson_version ON lesson (content_version);

-- ============================================================ exercise
-- Thêm stable_key, skill, difficulty và versioning

ALTER TABLE exercise ADD COLUMN stable_key VARCHAR(200);
ALTER TABLE exercise ADD COLUMN instruction_text TEXT;
ALTER TABLE exercise ADD COLUMN skill VARCHAR(32);
ALTER TABLE exercise ADD COLUMN difficulty VARCHAR(20);
ALTER TABLE exercise ADD COLUMN content_version INT NOT NULL DEFAULT 1;
ALTER TABLE exercise ADD COLUMN evaluation_version INT NOT NULL DEFAULT 1;
ALTER TABLE exercise ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN exercise.stable_key IS 'Stable identifier for seed upsert, e.g., sign-to-meaning-01';
COMMENT ON COLUMN exercise.instruction_text IS 'Detailed instruction for learner, shown before exercise';
COMMENT ON COLUMN exercise.skill IS 'Learning skill category: RECOGNITION, RECALL, PRODUCTION, ORDERING, COMPREHENSION, DISCRIMINATION';
COMMENT ON COLUMN exercise.difficulty IS 'Difficulty level: INTRO, BASIC, INTERMEDIATE, CHALLENGE';
COMMENT ON COLUMN exercise.content_version IS 'Version of exercise content (prompt, options, media)';
COMMENT ON COLUMN exercise.evaluation_version IS 'Version of grading logic/accepted answers';
COMMENT ON COLUMN exercise.active IS 'Whether this exercise is currently active (for soft delete or A/B testing)';

-- CREATE UNIQUE INDEX uq_exercise_stable_key ON exercise (lesson_id, stable_key) WHERE stable_key IS NOT NULL;
CREATE INDEX idx_exercise_skill ON exercise (skill) WHERE skill IS NOT NULL;
CREATE INDEX idx_exercise_difficulty ON exercise (difficulty) WHERE difficulty IS NOT NULL;
CREATE INDEX idx_exercise_active ON exercise (active);

-- ============================================================ user_lesson_state
-- Thêm current_exercise_key để resume ổn định khi nội dung thay đổi

ALTER TABLE user_lesson_state ADD COLUMN current_exercise_key VARCHAR(200);
ALTER TABLE user_lesson_state ADD COLUMN content_version_seen INT;

COMMENT ON COLUMN user_lesson_state.current_exercise_key IS 'Stable key of current exercise for resume (preferred over index)';
COMMENT ON COLUMN user_lesson_state.content_version_seen IS 'Content version user is currently working on';

-- ============================================================ Notes
--
-- Backfill plan (run separately after migration):
--   1. Generate stable keys for existing records based on title/order/UUID
--   2. Update stable_key for all units, chapters, lessons, exercises
--   3. Verify no duplicates
--   4. Add UNIQUE constraints:
--        CREATE UNIQUE INDEX uq_unit_stable_key ON unit (course_id, stable_key);
--        CREATE UNIQUE INDEX uq_chapter_stable_key ON chapter (unit_id, stable_key);
--        CREATE UNIQUE INDEX uq_lesson_stable_key ON lesson (chapter_id, stable_key);
--        CREATE UNIQUE INDEX uq_exercise_stable_key ON exercise (lesson_id, stable_key);
--   5. Optionally make stable_key NOT NULL for new records
--
-- Version policy:
--   - Change title/summary/media: increment content_version, keep progress
--   - Add/remove exercises: increment content_version, resume by stable_key
--   - Change grading logic/accepted answers: increment evaluation_version
--   - Do NOT recalculate historical attempts on evaluation_version change
