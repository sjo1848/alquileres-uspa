import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  IsEnum,
} from 'class-validator';
import {
  Currency,
  ListingAvailabilityStatus,
  PricePeriod,
  RentalDuration,
} from '@prisma/client';

export class CreateListingDto {
  @IsString() @MinLength(1) @MaxLength(120) title!: string;
  @IsString() @MaxLength(5000) description!: string;
  @IsString() @MinLength(1) @MaxLength(240) location!: string;
  @IsInt() @Min(0) priceAmount!: number;
  @IsEnum(PricePeriod) pricePeriod!: PricePeriod;
  @IsEnum(RentalDuration) rentalDuration!: RentalDuration;
  @IsInt() @Min(1) maxOccupants!: number;
  @IsEnum(Currency) currency!: Currency;
}

export class UpdateListingDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(240) location?: string;
  @IsInt() @Min(0) priceAmount!: number;
  @IsEnum(PricePeriod) pricePeriod!: PricePeriod;
  @IsEnum(RentalDuration) rentalDuration!: RentalDuration;
  @IsInt() @Min(1) maxOccupants!: number;
  @IsEnum(Currency) currency!: Currency;
}

export class UpdateListingAvailabilityDto {
  @IsEnum(ListingAvailabilityStatus)
  availabilityStatus!: ListingAvailabilityStatus;
}
