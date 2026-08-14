import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateContactEventDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  visitorName!: string;
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  visitorEmail!: string;
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  message!: string;
}

export class ContactAcceptedDto {
  status!: 'RECEIVED';
}
