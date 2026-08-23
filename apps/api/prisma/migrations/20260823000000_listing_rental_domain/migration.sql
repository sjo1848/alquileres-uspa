-- CreateEnum
CREATE TYPE "PricePeriod" AS ENUM ('WEEK', 'MONTH');
CREATE TYPE "RentalDuration" AS ENUM ('WEEKS', 'MONTHS', 'PERMANENT', 'FLEXIBLE');
CREATE TYPE "Currency" AS ENUM ('ARS', 'USD');

-- Safe I13 migration: legacy price_per_night and max_guests remain untouched.
-- Their values have unknown semantics and must never be converted or inferred.
ALTER TABLE "listings"
  ADD COLUMN "price_amount" INTEGER,
  ADD COLUMN "price_period" "PricePeriod",
  ADD COLUMN "rental_duration" "RentalDuration",
  ADD COLUMN "max_occupants" INTEGER,
  ADD COLUMN "currency" "Currency";

-- New domain rows must not be forced to invent tourist semantics. Historical
-- values remain intact; future rows leave these quarantined columns NULL.
ALTER TABLE "listings"
  ALTER COLUMN "price_per_night" DROP NOT NULL,
  ALTER COLUMN "max_guests" DROP NOT NULL;

ALTER TABLE "listings"
  ADD CONSTRAINT "listings_price_amount_check"
    CHECK ("price_amount" IS NULL OR "price_amount" >= 0),
  ADD CONSTRAINT "listings_max_occupants_check"
    CHECK ("max_occupants" IS NULL OR "max_occupants" > 0);
