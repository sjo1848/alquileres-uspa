ALTER TABLE "listings"
  ALTER COLUMN "last_confirmed_at" DROP DEFAULT,
  ALTER COLUMN "last_confirmed_at" DROP NOT NULL;

-- Historical timestamps were populated automatically at listing creation and
-- cannot be proven to represent an OWNER availability statement.
UPDATE "listings" SET "last_confirmed_at" = NULL;
