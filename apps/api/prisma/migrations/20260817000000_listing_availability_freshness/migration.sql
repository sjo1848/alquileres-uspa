CREATE TYPE "ListingAvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

ALTER TABLE "listings"
  ADD COLUMN "availability_status" "ListingAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
  ADD COLUMN "last_confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "listings_publication_status_availability_status_last_confirmed_at_idx"
  ON "listings"("publication_status", "availability_status", "last_confirmed_at");
