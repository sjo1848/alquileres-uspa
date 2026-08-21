CREATE TYPE "ContactEventState" AS ENUM ('UNREAD', 'READ');

ALTER TABLE "contact_events"
ADD COLUMN "state" "ContactEventState" NOT NULL DEFAULT 'UNREAD';

CREATE INDEX "contact_events_owner_id_state_created_at_idx"
ON "contact_events"("owner_id", "state", "created_at");
