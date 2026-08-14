import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateListingImage } from './listing-images.validator.js';

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  Buffer.alloc(4),
  Buffer.from('IHDR'),
  Buffer.alloc(8),
]);

function file(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'image',
    originalname: 'cabin.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: png.length,
    destination: '',
    filename: '',
    path: '',
    buffer: png,
    stream: undefined as never,
    ...overrides,
  };
}

describe('listing image validation', () => {
  it('accepts a supported image when its bytes match its MIME type', () => {
    expect(validateListingImage(file())).toMatchObject({
      contentType: 'image/png',
      extension: 'png',
    });
  });

  it('rejects MIME spoofing and unsafe names', () => {
    expect(() =>
      validateListingImage(file({ mimetype: 'image/jpeg' })),
    ).toThrow(BadRequestException);
    expect(() =>
      validateListingImage(file({ originalname: '../secret.png' })),
    ).toThrow(BadRequestException);
  });

  it('rejects files that are too small', () => {
    expect(() =>
      validateListingImage(file({ buffer: Buffer.alloc(2), size: 2 })),
    ).toThrow(BadRequestException);
  });

  it('uses buffer length as the authoritative size and rejects mismatches', () => {
    expect(() => validateListingImage(file({ size: png.length + 1 }))).toThrow(
      BadRequestException,
    );
    expect(validateListingImage(file({ size: png.length })).sizeBytes).toBe(
      png.length,
    );
  });

  it('rejects content above the configured byte limit', () => {
    const previous = process.env.LISTING_IMAGE_MAX_BYTES;
    process.env.LISTING_IMAGE_MAX_BYTES = String(png.length - 1);
    expect(() => validateListingImage(file())).toThrow(BadRequestException);
    if (previous === undefined) delete process.env.LISTING_IMAGE_MAX_BYTES;
    else process.env.LISTING_IMAGE_MAX_BYTES = previous;
  });
});
