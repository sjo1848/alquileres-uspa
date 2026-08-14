import { BadRequestException } from '@nestjs/common';

export const SUPPORTED_IMAGE_TYPES = {
  'image/jpeg': {
    extension: 'jpg',
    signature: (b: Buffer) =>
      b.length >= 4 &&
      b[0] === 0xff &&
      b[1] === 0xd8 &&
      b[b.length - 2] === 0xff &&
      b[b.length - 1] === 0xd9,
  },
  'image/png': {
    extension: 'png',
    signature: (b: Buffer) =>
      b.length >= 24 &&
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      b.toString('ascii', 12, 16) === 'IHDR',
  },
  'image/webp': {
    extension: 'webp',
    signature: (b: Buffer) =>
      b.length >= 16 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP',
  },
} as const;

export function validateListingImage(file: Express.Multer.File | undefined) {
  const maxBytes = Number(
    process.env.LISTING_IMAGE_MAX_BYTES ?? 5 * 1024 * 1024,
  );
  if (!file?.buffer) throw new BadRequestException('An image file is required');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1)
    throw new Error('Invalid LISTING_IMAGE_MAX_BYTES');
  const actualSize = file.buffer.length;
  if (actualSize !== file.size)
    throw new BadRequestException('Image size metadata does not match content');
  if (actualSize < 16 || actualSize > maxBytes)
    throw new BadRequestException('Image size is invalid');
  if (
    !/^[^/\\\0-]{1,120}$/.test(file.originalname) ||
    file.originalname.startsWith('.')
  ) {
    throw new BadRequestException('Image name is invalid');
  }
  const type =
    SUPPORTED_IMAGE_TYPES[file.mimetype as keyof typeof SUPPORTED_IMAGE_TYPES];
  if (!type || !type.signature(file.buffer))
    throw new BadRequestException('Unsupported or invalid image content');
  return {
    contentType: file.mimetype,
    extension: type.extension,
    sizeBytes: actualSize,
  };
}
