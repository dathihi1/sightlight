-- Extension cần cho từ điển ký hiệu (FR-21, ADR-05)
-- unaccent : tìm không dấu  ("chao" -> "chào")   — AC-21.1
-- pg_trgm  : gợi ý khi gõ sai chính tả            — AC-21.5
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
