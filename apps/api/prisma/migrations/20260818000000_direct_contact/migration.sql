CREATE TABLE "contact_events" (
  "id" TEXT NOT NULL, "listing_id" TEXT NOT NULL, "owner_id" TEXT NOT NULL,
  "visitor_name" TEXT NOT NULL, "visitor_email" TEXT NOT NULL, "message" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contact_events_listing_id_created_at_idx" ON "contact_events"("listing_id", "created_at");
CREATE INDEX "contact_events_owner_id_created_at_idx" ON "contact_events"("owner_id", "created_at");
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Revert: DROP TABLE "contact_events";
