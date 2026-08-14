import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { LocalListingImageStorage } from './listing-image.storage.js';

describe('LocalListingImageStorage path safety', () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
    );
    delete process.env.LISTING_IMAGE_STORAGE_DIR;
  });

  async function makeStorage() {
    await mkdir(join(process.cwd(), '.data'), { recursive: true });
    const root = await mkdtemp(
      join(process.cwd(), '.data/listing-image-storage-'),
    );
    roots.push(root);
    process.env.LISTING_IMAGE_STORAGE_DIR = root;
    return { root, storage: new LocalListingImageStorage() };
  }

  it('rejects traversal and invalid separators before filesystem access', async () => {
    const { storage } = await makeStorage();
    const content = Buffer.from('image');
    await expect(storage.put('listings/../outside', content)).rejects.toThrow(
      'Unsafe object key',
    );
    await expect(storage.put('listings\\outside', content)).rejects.toThrow(
      'Unsafe object key',
    );
  });

  it('rejects symlinked directories without touching the target outside storage', async () => {
    const { root, storage } = await makeStorage();
    const outside = await mkdtemp(
      join(process.cwd(), '.data/listing-image-outside-'),
    );
    roots.push(outside);
    await writeFile(join(outside, 'sentinel.txt'), 'untouched');
    await symlink(outside, join(root, 'listings'));

    await expect(
      storage.put('listings/listing-a/image.png', Buffer.from('image')),
    ).rejects.toThrow('Unsafe storage path');
    expect(await readFile(join(outside, 'sentinel.txt'), 'utf8')).toBe(
      'untouched',
    );
  });

  it('makes delete idempotent for absent objects', async () => {
    const { storage } = await makeStorage();
    await expect(
      storage.delete('listings/listing-a/missing.png'),
    ).resolves.toBeUndefined();
    await expect(
      storage.delete('listings/listing-a/missing.png'),
    ).resolves.toBeUndefined();
  });

  it('preserves an existing object when an exclusive put collides', async () => {
    const { root, storage } = await makeStorage();
    const path = join(root, 'listings/listing-a/image.png');
    await mkdir(join(root, 'listings/listing-a'), { recursive: true });
    await writeFile(path, 'original');

    await expect(
      storage.put('listings/listing-a/image.png', Buffer.from('new')),
    ).rejects.toMatchObject({ code: 'EEXIST' });
    expect(await readFile(path, 'utf8')).toBe('original');
  });
});
