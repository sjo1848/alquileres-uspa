import { lstat, mkdir, open, readFile, unlink } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { Injectable } from '@nestjs/common';

export const LISTING_IMAGE_STORAGE = Symbol('LISTING_IMAGE_STORAGE');

export interface ListingImageStorage {
  put(objectKey: string, content: Buffer): Promise<void>;
  get(objectKey: string): Promise<Buffer>;
  /**
   * Deletes an object idempotently. A successful delete must not be reported
   * as failed merely because the object was already absent.
   *
   * Adapters backed by remote/object storage should make this operation
   * idempotent too; callers compensate a successful delete when a later
   * metadata operation fails and the original bytes are available.
   */
  delete(objectKey: string): Promise<void>;
}

@Injectable()
export class LocalListingImageStorage implements ListingImageStorage {
  private readonly root = resolve(
    process.env.LISTING_IMAGE_STORAGE_DIR ?? '.data/listing-images',
  );

  async put(objectKey: string, content: Buffer) {
    const path = this.safePath(objectKey);
    await this.assertNoSymlinkPath(path);
    await mkdir(dirname(path), { recursive: true });
    await this.assertNoSymlinkPath(path);
    let file;
    try {
      file = await open(path, 'wx');
      await file.writeFile(content);
    } catch (error) {
      // Only remove a file after wx opened it successfully. An EEXIST from
      // open means this operation did not create the pre-existing object.
      if (file) await this.unlinkRegularFile(path);
      throw error;
    } finally {
      await file?.close();
    }
  }

  async delete(objectKey: string) {
    const path = this.safePath(objectKey);
    await this.assertNoSymlinkPath(path);
    await this.unlinkRegularFile(path);
  }

  async get(objectKey: string) {
    const path = this.safePath(objectKey);
    await this.assertNoSymlinkPath(path);
    return readFile(path);
  }

  private safePath(objectKey: string) {
    const segments = objectKey.split('/');
    if (
      !objectKey ||
      objectKey.includes('\\') ||
      objectKey.includes('\0') ||
      objectKey.startsWith('/') ||
      segments.some(
        (segment) => !segment || segment === '.' || segment === '..',
      )
    )
      throw new Error('Unsafe object key');

    const path = resolve(this.root, join(...segments));
    const withinRoot = relative(this.root, path);
    if (!withinRoot || withinRoot.startsWith(`..${sep}`) || withinRoot === '..')
      throw new Error('Unsafe object key');
    return path;
  }

  private async assertNoSymlinkPath(path: string) {
    let current = path;
    while (current.startsWith(`${this.root}${sep}`)) {
      try {
        if ((await lstat(current)).isSymbolicLink())
          throw new Error('Unsafe storage path');
      } catch (error: any) {
        if (error?.code !== 'ENOENT') throw error;
      }
      if (current === this.root) break;
      current = dirname(current);
    }
    const rootStat = await lstat(this.root).catch(() => undefined);
    if (rootStat?.isSymbolicLink()) throw new Error('Unsafe storage root');
  }

  private async unlinkRegularFile(path: string) {
    try {
      const stat = await lstat(path);
      if (stat.isSymbolicLink()) throw new Error('Unsafe storage path');
      await unlink(path);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}
