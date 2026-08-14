CREATE TABLE "listing_images" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "listing_images_object_key_key" ON "listing_images"("object_key");
CREATE UNIQUE INDEX "listing_images_listing_id_position_key" ON "listing_images"("listing_id", "position");
CREATE INDEX "listing_images_listing_id_position_idx" ON "listing_images"("listing_id", "position");
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
