import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import {
  PrismaClient,
  Currency,
  ListingAvailabilityStatus,
  ListingPublicationStatus,
  ListingStatus,
  PricePeriod,
  RentalDuration,
  Role,
} from '../apps/api/node_modules/@prisma/client/index.js';
import bcrypt from '../apps/api/node_modules/bcryptjs/index.js';

const prisma = new PrismaClient();
const storageRoot = resolve(
  process.env.LISTING_IMAGE_STORAGE_DIR ?? '.data/listing-images',
);
const now = new Date();
const stale = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function mix(a, b, amount) {
  return Math.round(a + (b - a) * amount);
}

function createDemoPng(width, height, palette) {
  const stride = 1 + width * 4;
  const raw = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const nx = x / width;
      const ny = y / height;
      const skyT = Math.min(1, ny / 0.68);
      let r = mix(palette.skyTop[0], palette.skyBottom[0], skyT);
      let g = mix(palette.skyTop[1], palette.skyBottom[1], skyT);
      let b = mix(palette.skyTop[2], palette.skyBottom[2], skyT);

      const rearMountain =
        0.43 +
        0.08 * Math.sin(nx * Math.PI * 3.1) +
        0.035 * Math.sin(nx * Math.PI * 8.3);
      if (ny > rearMountain) [r, g, b] = palette.mountainRear;

      const frontMountain =
        0.56 +
        0.07 * Math.sin(nx * Math.PI * 2.4 + 0.8) +
        0.025 * Math.sin(nx * Math.PI * 7.2);
      if (ny > frontMountain) [r, g, b] = palette.mountainFront;

      if (ny > 0.7) [r, g, b] = palette.ground;

      const houseLeft = 0.17;
      const houseRight = 0.39;
      const houseTop = 0.57;
      const houseBottom = 0.76;
      const roofPeakX = (houseLeft + houseRight) / 2;
      const roofTop = 0.47;
      const roofSlope = (houseTop - roofTop) / (roofRight() - roofPeakX);

      function roofRight() {
        return houseRight + 0.025;
      }

      const roofLeft = houseLeft - 0.025;
      const roofY = roofTop + Math.abs(nx - roofPeakX) * roofSlope;
      if (nx >= roofLeft && nx <= roofRight() && ny >= roofY && ny <= houseTop) {
        [r, g, b] = palette.roof;
      }
      if (
        nx >= houseLeft &&
        nx <= houseRight &&
        ny >= houseTop &&
        ny <= houseBottom
      ) {
        [r, g, b] = palette.house;
      }

      const door =
        nx >= 0.265 && nx <= 0.315 && ny >= 0.65 && ny <= houseBottom;
      if (door) [r, g, b] = palette.door;

      const windowA =
        nx >= 0.19 && nx <= 0.245 && ny >= 0.61 && ny <= 0.665;
      const windowB =
        nx >= 0.335 && nx <= 0.375 && ny >= 0.61 && ny <= 0.665;
      if (windowA || windowB) [r, g, b] = palette.window;

      const pathCenter = 0.29 + (ny - 0.76) * 0.3;
      const pathHalfWidth = 0.025 + Math.max(0, ny - 0.76) * 0.16;
      if (
        ny > 0.76 &&
        nx >= pathCenter - pathHalfWidth &&
        nx <= pathCenter + pathHalfWidth
      ) {
        [r, g, b] = palette.path;
      }

      const offset = row + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const palettes = [
  {
    skyTop: [180, 215, 235],
    skyBottom: [238, 225, 190],
    mountainRear: [120, 140, 135],
    mountainFront: [78, 101, 91],
    ground: [123, 118, 83],
    house: [216, 196, 164],
    roof: [96, 73, 58],
    door: [83, 61, 46],
    window: [164, 215, 226],
    path: [181, 161, 123],
  },
  {
    skyTop: [164, 205, 229],
    skyBottom: [245, 217, 176],
    mountainRear: [132, 143, 145],
    mountainFront: [90, 104, 96],
    ground: [135, 122, 76],
    house: [198, 178, 142],
    roof: [78, 68, 57],
    door: [92, 67, 44],
    window: [180, 224, 231],
    path: [192, 169, 126],
  },
  {
    skyTop: [171, 211, 234],
    skyBottom: [238, 220, 185],
    mountainRear: [118, 137, 143],
    mountainFront: [73, 95, 91],
    ground: [114, 116, 79],
    house: [224, 204, 173],
    roof: [101, 75, 55],
    door: [82, 57, 42],
    window: [166, 219, 232],
    path: [176, 157, 117],
  },
];

const passwordHash = await bcrypt.hash('portfolio-demo-only', 4);
const owner = await prisma.user.upsert({
  where: { email: 'portfolio-demo-owner@example.test' },
  update: { passwordHash, role: Role.OWNER },
  create: {
    email: 'portfolio-demo-owner@example.test',
    passwordHash,
    role: Role.OWNER,
  },
});

const listings = [
  {
    id: 'portfolio-demo-casa-montana',
    title: 'Casa de montaña — demo',
    description:
      'Publicación sintética para evidencia visual reproducible del catálogo.',
    priceAmount: 420000,
    pricePeriod: PricePeriod.MONTH,
    rentalDuration: RentalDuration.MONTHS,
    maxOccupants: 4,
    currency: Currency.ARS,
    availabilityStatus: ListingAvailabilityStatus.AVAILABLE,
    lastConfirmedAt: now,
    imageName: 'casa-montana-demo.png',
  },
  {
    id: 'portfolio-demo-cabana-centro',
    title: 'Cabaña céntrica — demo',
    description:
      'Fixture sintético para mostrar disponibilidad, frescura y ficha pública.',
    priceAmount: 310000,
    pricePeriod: PricePeriod.MONTH,
    rentalDuration: RentalDuration.FLEXIBLE,
    maxOccupants: 3,
    currency: Currency.ARS,
    availabilityStatus: ListingAvailabilityStatus.AVAILABLE,
    lastConfirmedAt: stale,
    imageName: 'cabana-centro-demo.png',
  },
  {
    id: 'portfolio-demo-refugio',
    title: 'Refugio cordillerano — demo',
    description:
      'Datos exclusivamente sintéticos; no representa una propiedad real.',
    priceAmount: 180000,
    pricePeriod: PricePeriod.WEEK,
    rentalDuration: RentalDuration.WEEKS,
    maxOccupants: 2,
    currency: Currency.ARS,
    availabilityStatus: ListingAvailabilityStatus.UNAVAILABLE,
    lastConfirmedAt: now,
    imageName: 'refugio-demo.png',
  },
];

for (const [index, listing] of listings.entries()) {
  await prisma.listing.upsert({
    where: { id: listing.id },
    update: {
      ownerId: owner.id,
      title: listing.title,
      description: listing.description,
      location: 'Uspallata',
      priceAmount: listing.priceAmount,
      pricePeriod: listing.pricePeriod,
      rentalDuration: listing.rentalDuration,
      maxOccupants: listing.maxOccupants,
      currency: listing.currency,
      status: ListingStatus.APPROVED,
      publicationStatus: ListingPublicationStatus.PUBLISHED,
      availabilityStatus: listing.availabilityStatus,
      lastConfirmedAt: listing.lastConfirmedAt,
      rejectionReason: null,
    },
    create: {
      id: listing.id,
      ownerId: owner.id,
      title: listing.title,
      description: listing.description,
      location: 'Uspallata',
      priceAmount: listing.priceAmount,
      pricePeriod: listing.pricePeriod,
      rentalDuration: listing.rentalDuration,
      maxOccupants: listing.maxOccupants,
      currency: listing.currency,
      status: ListingStatus.APPROVED,
      publicationStatus: ListingPublicationStatus.PUBLISHED,
      availabilityStatus: listing.availabilityStatus,
      lastConfirmedAt: listing.lastConfirmedAt,
    },
  });

  const objectKey = `portfolio/${listing.imageName}`;
  const image = createDemoPng(1200, 760, palettes[index]);
  const imagePath = join(storageRoot, objectKey);
  await mkdir(dirname(imagePath), { recursive: true });
  await writeFile(imagePath, image);

  await prisma.listingImage.upsert({
    where: { objectKey },
    update: {
      listingId: listing.id,
      originalName: listing.imageName,
      contentType: 'image/png',
      sizeBytes: image.length,
      position: 0,
    },
    create: {
      id: `portfolio-image-${index + 1}`,
      listingId: listing.id,
      objectKey,
      originalName: listing.imageName,
      contentType: 'image/png',
      sizeBytes: image.length,
      position: 0,
    },
  });
}

console.log(
  JSON.stringify({
    status: 'PASS',
    synthetic: true,
    owner: owner.email,
    listingIds: listings.map(({ id }) => id),
    storageRoot,
  }),
);

await prisma.$disconnect();
