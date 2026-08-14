import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PublicListingsQueryDto {
  @IsOptional() @IsString() @MaxLength(240) location?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  minPricePerNight?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  maxPricePerNight?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  maxGuests?: number;
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
  pricePerNight!: number;
  maxGuests!: number;
  images!: PublicListingImageDto[];
  availabilityStatus!: 'AVAILABLE' | 'UNAVAILABLE';
  lastConfirmedAt!: Date;
  freshnessStatus!: 'FRESH' | 'STALE';
}

export class PublicListingsPageDto {
  items!: PublicListingDto[];
  page!: number;
  pageSize!: number;
  totalItems!: number;
  totalPages!: number;
}
