-- 翻訳セクションの級分けをなくしたため、提出ごとの級（level）を削除する
ALTER TABLE "translation_submissions" DROP COLUMN "level";
