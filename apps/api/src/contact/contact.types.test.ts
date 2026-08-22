import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  CreateContactEventDto,
  UpdateContactEventStateDto,
} from './contact.types.js';

async function errors<T extends object>(type: new () => T, input: object) {
  return validate(plainToInstance(type, input), {
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
    const validationErrors = await errors(CreateContactEventDto, {
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
      await errors(CreateContactEventDto, {
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
      await errors(CreateContactEventDto, {
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
    const validationErrors = await errors(CreateContactEventDto, {
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

describe('UpdateContactEventStateDto', () => {
  it('accepts only the explicit UNREAD/READ state values', async () => {
    expect(
      await validate(
        plainToInstance(UpdateContactEventStateDto, { state: 'READ' }),
      ),
    ).toHaveLength(0);
    expect(
      await validate(
        plainToInstance(UpdateContactEventStateDto, { state: 'CLOSED' }),
      ),
    ).not.toHaveLength(0);
  });

  it('rejects ownerId even if an attacker includes it', async () => {
    const validationErrors = await errors(UpdateContactEventStateDto, {
      state: 'READ',
      ownerId: 'attacker-controlled',
    });
    expect(validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'ownerId' }),
      ]),
    );
  });
});
