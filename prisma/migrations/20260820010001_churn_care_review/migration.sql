DROP INDEX IF EXISTS "churn_cases_one_open_case";

CREATE UNIQUE INDEX "churn_cases_one_open_case"
ON "churn_cases" ("student_id")
WHERE "status" IN ('DETECTED', 'COUNSELING', 'PENDING_REVIEW');

ALTER TABLE "counseling_memos"
ADD COLUMN IF NOT EXISTS "churn_case_id" UUID;

CREATE INDEX IF NOT EXISTS "counseling_memos_churn_case_id_idx"
ON "counseling_memos"("churn_case_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'counseling_memos_churn_case_id_fkey'
    ) THEN
        ALTER TABLE "counseling_memos"
        ADD CONSTRAINT "counseling_memos_churn_case_id_fkey"
        FOREIGN KEY ("churn_case_id") REFERENCES "churn_cases"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
