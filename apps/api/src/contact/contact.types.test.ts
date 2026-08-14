import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateContactEventDto } from './contact.types.js';

async function errors(input: object) {
  return validate(plainToInstance(CreateContactEventDto, input), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

describe('CreateContactEventDto', () => {
  it('normalizes name, email, and message before validation', async () => {
    const dto = plainToInstance(CreateContactEventDto, {
      visitorName: '  Ana  ',
      visitorEmail: '  ANA@EXAMPLE.COM  ',
      message: '  Hola  ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({
      visitorName: 'Ana',
      visitorEmail: 'ana@example.com',
      message: 'Hola',
    });
  });

  it('rejects whitespace-only name and message, and invalid email', async () => {
    const validationErrors = await errors({
      visitorName: '   ',
      visitorEmail: 'not-an-email',
      message: '\t\n',
    });

    expect(validationErrors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['visitorName', 'visitorEmail', 'message']),
    );
  });

  it('accepts exact limits and rejects values beyond them', async () => {
    expect(
      await errors({
        visitorName: 'n'.repeat(120),
        visitorEmail: `${'a'.repeat(64)}@${[
          'a'.repeat(62),
          'a'.repeat(62),
          'a'.repeat(63),
        ].join('.')}`,
        message: 'm'.repeat(2_000),
      }),
    ).toHaveLength(0);
    expect(
      await errors({
        visitorName: 'n'.repeat(121),
        visitorEmail: `${'a'.repeat(243)}@example.com`,
        message: 'm'.repeat(2_001),
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'visitorName' }),
        expect.objectContaining({ property: 'visitorEmail' }),
        expect.objectContaining({ property: 'message' }),
      ]),
    );
  });

  it('rejects extra fields', async () => {
    const validationErrors = await errors({
      visitorName: 'Ana',
      visitorEmail: 'ana@example.com',
      message: 'Hola',
      ownerId: 'attacker-controlled',
    });

    expect(validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'ownerId' }),
      ]),
    );
  });
});
