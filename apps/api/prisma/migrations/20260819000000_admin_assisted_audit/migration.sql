CREATE TABLE "admin_audit_logs" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "listing_id" TEXT,
  "target_owner_id" TEXT,
  "metadata" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "admin_audit_logs_actor_id_created_at_idx" ON "admin_audit_logs"("actor_id", "created_at");
CREATE INDEX "admin_audit_logs_listing_id_created_at_idx" ON "admin_audit_logs"("listing_id", "created_at");
CREATE INDEX "admin_audit_logs_target_owner_id_created_at_idx" ON "admin_audit_logs"("target_owner_id", "created_at");
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_target_owner_id_fkey" FOREIGN KEY ("target_owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Revert: drop the foreign keys, indexes, and admin_audit_logs table.
