import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  Max,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { Currency, PricePeriod, RentalDuration } from '@prisma/client';

export class PublicListingsQueryDto {
  @IsOptional() @IsString() @MaxLength(240) location?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  minPriceAmount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  maxPriceAmount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  maxOccupants?: number;
  @IsOptional() @IsEnum(PricePeriod) pricePeriod?: PricePeriod;
  @IsOptional() @IsEnum(RentalDuration) rentalDuration?: RentalDuration;
  @IsOptional() @IsEnum(Currency) currency?: Currency;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  availableOnly = false;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10_000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize = 20;
}

export class PublicListingImageDto {
  id!: string;
  contentType!: string;
  sizeBytes!: number;
  position!: number;
}

export class PublicListingDto {
  id!: string;
  title!: string;
  description!: string;
  location!: string;
  priceAmount!: number | null;
  pricePeriod!: PricePeriod | null;
  rentalDuration!: RentalDuration | null;
  maxOccupants!: number | null;
  currency!: Currency | null;
  domainDataStatus!: 'COMPLETE' | 'MISSING';
  images!: PublicListingImageDto[];
  availabilityStatus!: 'AVAILABLE' | 'UNAVAILABLE';
  lastConfirmedAt!: Date | null;
  freshnessStatus!: 'FRESH' | 'STALE' | 'UNCONFIRMED';
}

export class PublicListingsPageDto {
  items!: PublicListingDto[];
  page!: number;
  pageSize!: number;
  totalItems!: number;
  totalPages!: number;
}
