import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ListingAvailabilityStatus } from '@prisma/client';

export class CreateListingDto {
  @IsString() @MinLength(1) @MaxLength(120) title!: string;
  @IsString() @MaxLength(5000) description!: string;
  @IsString() @MinLength(1) @MaxLength(240) location!: string;
  @IsInt() @Min(0) pricePerNight!: number;
  @IsInt() @Min(1) maxGuests!: number;
}

export class UpdateListingDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(240) location?: string;
  @IsOptional() @IsInt() @Min(0) pricePerNight?: number;
  @IsOptional() @IsInt() @Min(1) maxGuests?: number;
}

export class UpdateListingAvailabilityDto {
  @IsEnum(ListingAvailabilityStatus)
  availabilityStatus!: ListingAvailabilityStatus;
}
