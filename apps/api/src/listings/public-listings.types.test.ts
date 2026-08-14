import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { PublicListingsQueryDto } from './public-listings.types.js';

describe('PublicListingsQueryDto', () => {
  it('bounds page and pageSize to safe public pagination limits', async () => {
    const valid = plainToInstance(PublicListingsQueryDto, {
      page: 10_000,
      pageSize: 50,
    });
    const invalid = plainToInstance(PublicListingsQueryDto, {
      page: 10_001,
      pageSize: 51,
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'page' }),
        expect.objectContaining({ property: 'pageSize' }),
      ]),
    );
  });

  it('rejects values above the Prisma/PostgreSQL Int32 maximum', async () => {
    const valid = plainToInstance(PublicListingsQueryDto, {
      minPricePerNight: 2_147_483_647,
      maxPricePerNight: 2_147_483_647,
      maxGuests: 2_147_483_647,
    });
    const invalid = plainToInstance(PublicListingsQueryDto, {
      minPricePerNight: 2_147_483_648,
      maxPricePerNight: 2_147_483_648,
      maxGuests: 2_147_483_648,
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'minPricePerNight' }),
        expect.objectContaining({ property: 'maxPricePerNight' }),
        expect.objectContaining({ property: 'maxGuests' }),
      ]),
    );
  });
});
