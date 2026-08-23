import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateListingDto, UpdateListingDto } from './listings.types.js';

const domainFields = {
  priceAmount: 100,
  pricePeriod: 'WEEK',
  rentalDuration: 'MONTHS',
  maxOccupants: 2,
  currency: 'ARS',
};

describe('listing write DTOs', () => {
  it('requires the complete rental domain on create and update', async () => {
    const create = plainToInstance(CreateListingDto, {
      title: 'Casa',
      description: 'Desc',
      location: 'Uspallata',
    });
    const update = plainToInstance(UpdateListingDto, { title: 'Nueva casa' });
    expect(await validate(create)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'priceAmount' }),
        expect.objectContaining({ property: 'pricePeriod' }),
        expect.objectContaining({ property: 'rentalDuration' }),
        expect.objectContaining({ property: 'maxOccupants' }),
        expect.objectContaining({ property: 'currency' }),
      ]),
    );
    expect(await validate(update)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'priceAmount' }),
        expect.objectContaining({ property: 'pricePeriod' }),
        expect.objectContaining({ property: 'rentalDuration' }),
        expect.objectContaining({ property: 'maxOccupants' }),
        expect.objectContaining({ property: 'currency' }),
      ]),
    );
  });

  it('accepts only the approved enum families and positive occupancy', async () => {
    const valid = plainToInstance(CreateListingDto, {
      title: 'Casa',
      description: 'Desc',
      location: 'Uspallata',
      ...domainFields,
    });
    const invalid = plainToInstance(CreateListingDto, {
      title: 'Casa',
      description: 'Desc',
      location: 'Uspallata',
      ...domainFields,
      pricePeriod: 'NIGHT',
      rentalDuration: 'DAYS',
      maxOccupants: 0,
      currency: 'EUR',
    });
    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'pricePeriod' }),
        expect.objectContaining({ property: 'rentalDuration' }),
        expect.objectContaining({ property: 'maxOccupants' }),
        expect.objectContaining({ property: 'currency' }),
      ]),
    );
  });
});
