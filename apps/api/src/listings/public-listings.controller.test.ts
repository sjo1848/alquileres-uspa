import { describe, expect, it, vi } from 'vitest';
import { PublicListingsController } from './public-listings.controller.js';

describe('PublicListingsController', () => {
  it('marks catalog and detail JSON as non-cacheable', async () => {
    const listings = {
      listPublic: vi.fn().mockResolvedValue({ items: [] }),
      getPublic: vi.fn().mockResolvedValue({ id: 'listing-1' }),
    } as any;
    const response = { setHeader: vi.fn() } as any;
    const controller = new PublicListingsController(listings);

    await controller.list({} as any, response);
    await controller.get('listing-1', response);

    expect(response.setHeader).toHaveBeenCalledTimes(2);
    expect(response.setHeader).toHaveBeenNthCalledWith(
      1,
      'Cache-Control',
      'no-store, no-cache',
    );
    expect(response.setHeader).toHaveBeenNthCalledWith(
      2,
      'Cache-Control',
      'no-store, no-cache',
    );
  });

  it('sends public image bytes with safe browser headers', async () => {
    const listings = {
      getPublicImage: vi.fn().mockResolvedValue({
        contentType: 'image/jpeg',
        sizeBytes: 4,
        content: Buffer.from('jpeg'),
      }),
    } as any;
    const response = {
      setHeader: vi.fn(),
      send: vi.fn((content) => content),
    } as any;
    await new PublicListingsController(listings).image(
      'listing-1',
      'image-1',
      response,
    );
    expect(listings.getPublicImage).toHaveBeenCalledWith(
      'listing-1',
      'image-1',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'image/jpeg',
    );
    expect(response.setHeader).toHaveBeenCalledWith('Content-Length', 4);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store, no-cache',
    );
    expect(response.send).toHaveBeenCalledWith(Buffer.from('jpeg'));
  });
});
