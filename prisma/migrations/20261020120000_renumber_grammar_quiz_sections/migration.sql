-- 文法クイズを「基本」→「紛らわしい表現」の順に並べるため、学習教材のセクション番号を振り直した。
--   フランス語: 05（紛らわしい表現の穴埋め）→ 07、06（数字タイピング）→ 08
--   スペイン語: 05（紛らわしい表現の穴埋め）→ 06、06（数字タイピング）→ 07
--   ドイツ語: 05（数字タイピング）→ 07
-- （空いた番号には新しい文法クイズが入る。フランス語の 05・06 は「基本1」「基本2」、スペイン語の 05 は「基本」、
--   ドイツ語の 05・06 は「格変化」「その他」）
-- 進捗・閲覧履歴・学習ログが元の教材を指したままになるよう、記録側の番号も付け替える。
--


-- section_progress
UPDATE OR IGNORE "section_progress" SET "sectionSlug" = '08'
  WHERE "language" = 'french' AND "sectionSlug" = '06';
DELETE FROM "section_progress" WHERE "language" = 'french' AND "sectionSlug" = '06';
UPDATE OR IGNORE "section_progress" SET "sectionSlug" = '07'
  WHERE "language" = 'french' AND "sectionSlug" = '05';
DELETE FROM "section_progress" WHERE "language" = 'french' AND "sectionSlug" = '05';
UPDATE OR IGNORE "section_progress" SET "sectionSlug" = '07'
  WHERE "language" = 'spanish' AND "sectionSlug" = '06';
DELETE FROM "section_progress" WHERE "language" = 'spanish' AND "sectionSlug" = '06';
UPDATE OR IGNORE "section_progress" SET "sectionSlug" = '06'
  WHERE "language" = 'spanish' AND "sectionSlug" = '05';
DELETE FROM "section_progress" WHERE "language" = 'spanish' AND "sectionSlug" = '05';
UPDATE OR IGNORE "section_progress" SET "sectionSlug" = '07'
  WHERE "language" = 'german' AND "sectionSlug" = '05';
DELETE FROM "section_progress" WHERE "language" = 'german' AND "sectionSlug" = '05';

-- section_views
UPDATE OR IGNORE "section_views" SET "sectionSlug" = '08'
  WHERE "language" = 'french' AND "sectionSlug" = '06';
DELETE FROM "section_views" WHERE "language" = 'french' AND "sectionSlug" = '06';
UPDATE OR IGNORE "section_views" SET "sectionSlug" = '07'
  WHERE "language" = 'french' AND "sectionSlug" = '05';
DELETE FROM "section_views" WHERE "language" = 'french' AND "sectionSlug" = '05';
UPDATE OR IGNORE "section_views" SET "sectionSlug" = '07'
  WHERE "language" = 'spanish' AND "sectionSlug" = '06';
DELETE FROM "section_views" WHERE "language" = 'spanish' AND "sectionSlug" = '06';
UPDATE OR IGNORE "section_views" SET "sectionSlug" = '06'
  WHERE "language" = 'spanish' AND "sectionSlug" = '05';
DELETE FROM "section_views" WHERE "language" = 'spanish' AND "sectionSlug" = '05';
UPDATE OR IGNORE "section_views" SET "sectionSlug" = '07'
  WHERE "language" = 'german' AND "sectionSlug" = '05';
DELETE FROM "section_views" WHERE "language" = 'german' AND "sectionSlug" = '05';

-- study_events・study_time_logs（学習教材の操作では itemId が sectionSlug）。一意制約はないのでそのまま動かす
UPDATE "study_events" SET "itemId" = '08'
  WHERE "eventType" IN ('section_study', 'section_quiz', 'section_review')
    AND "language" = 'french' AND "itemId" = '06';
UPDATE "study_events" SET "itemId" = '07'
  WHERE "eventType" IN ('section_study', 'section_quiz', 'section_review')
    AND "language" = 'french' AND "itemId" = '05';
UPDATE "study_events" SET "itemId" = '07'
  WHERE "eventType" IN ('section_study', 'section_quiz', 'section_review')
    AND "language" = 'spanish' AND "itemId" = '06';
UPDATE "study_events" SET "itemId" = '06'
  WHERE "eventType" IN ('section_study', 'section_quiz', 'section_review')
    AND "language" = 'spanish' AND "itemId" = '05';
UPDATE "study_events" SET "itemId" = '07'
  WHERE "eventType" IN ('section_study', 'section_quiz', 'section_review')
    AND "language" = 'german' AND "itemId" = '05';
UPDATE "study_time_logs" SET "itemId" = '08'
  WHERE "eventType" IN ('section_study', 'section_quiz', 'section_review')
    AND "language" = 'french' AND "itemId" = '06';
UPDATE "study_time_logs" SET "itemId" = '07'
  WHERE "eventType" IN ('section_study', 'section_quiz', 'section_review')
    AND "language" = 'french' AND "itemId" = '05';
UPDATE "study_time_logs" SET "itemId" = '07'
  WHERE "eventType" IN ('section_study', 'section_quiz', 'section_review')
    AND "language" = 'spanish' AND "itemId" = '06';
UPDATE "study_time_logs" SET "itemId" = '06'
  WHERE "eventType" IN ('section_study', 'section_quiz', 'section_review')
    AND "language" = 'spanish' AND "itemId" = '05';
UPDATE "study_time_logs" SET "itemId" = '07'
  WHERE "eventType" IN ('section_study', 'section_quiz', 'section_review')
    AND "language" = 'german' AND "itemId" = '05';
