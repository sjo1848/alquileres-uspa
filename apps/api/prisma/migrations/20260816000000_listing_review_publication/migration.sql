CREATE TYPE "ListingStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'REJECTED', 'APPROVED');
ALTER TABLE "listings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "listings" ALTER COLUMN "status" TYPE "ListingStatus_new" USING ("status"::text::"ListingStatus_new");
ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
DROP TYPE "ListingStatus";
ALTER TYPE "ListingStatus_new" RENAME TO "ListingStatus";
CREATE TYPE "ListingPublicationStatus" AS ENUM ('UNPUBLISHED', 'PUBLISHED');
ALTER TABLE "listings" ADD COLUMN "publication_status" "ListingPublicationStatus" NOT NULL DEFAULT 'UNPUBLISHED';
ALTER TABLE "listings" ADD COLUMN "rejection_reason" TEXT;
