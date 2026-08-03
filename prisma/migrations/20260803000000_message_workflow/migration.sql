CREATE TYPE "message_status" AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'SENT',
  'REJECTED',
  'CANCELLED'
);

CREATE TYPE "message_audience" AS ENUM (
  'ALL',
  'STAFF',
  'PARENT',
  'STUDENT'
);

ALTER TABLE "messages"
  ADD COLUMN "author_user_id" UUID,
  ADD COLUMN "approver_user_id" UUID,
  ADD COLUMN "status" "message_status" NOT NULL DEFAULT 'SENT',
  ADD COLUMN "audience" "message_audience",
  ADD COLUMN "target_student_id" UUID,
  ADD COLUMN "target_class_id" UUID,
  ADD COLUMN "rejection_reason" TEXT,
  ADD COLUMN "submitted_at" TIMESTAMPTZ(6),
  ADD COLUMN "approved_at" TIMESTAMPTZ(6),
  ADD COLUMN "sent_at" TIMESTAMPTZ(6),
  ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "messages"
SET
  "author_user_id" = "sender_user_id",
  "sent_at" = COALESCE("sent_at", "created_at"),
  "updated_at" = "created_at"
WHERE "author_user_id" IS NULL;

CREATE INDEX "messages_status_created_at_idx"
  ON "messages"("status", "created_at" DESC);

CREATE INDEX "messages_author_user_id_status_created_at_idx"
  ON "messages"("author_user_id", "status", "created_at" DESC);

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_approver_user_id_fkey"
  FOREIGN KEY ("approver_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_target_student_id_fkey"
  FOREIGN KEY ("target_student_id") REFERENCES "students"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_target_class_id_fkey"
  FOREIGN KEY ("target_class_id") REFERENCES "classes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;