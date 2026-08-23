import {
  PrismaClient,
  ListingAvailabilityStatus,
  ListingPublicationStatus,
  ListingStatus,
  Role,
} from '../apps/api/node_modules/@prisma/client/index.js';
import bcrypt from '../apps/api/node_modules/bcryptjs/index.js';

const prisma = new PrismaClient();
const password = process.env.I11_PASSWORD ?? 'password123';
const passwordHash = await bcrypt.hash(password, 4);
const now = new Date();
const stale = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

const ownerA = await prisma.user.upsert({
  where: { email: 'owner-i11-a@example.test' },
  update: { passwordHash, role: Role.OWNER },
  create: { email: 'owner-i11-a@example.test', passwordHash, role: Role.OWNER },
});
const ownerB = await prisma.user.upsert({
  where: { email: 'owner-i11-b@example.test' },
  update: { passwordHash, role: Role.OWNER },
  create: { email: 'owner-i11-b@example.test', passwordHash, role: Role.OWNER },
});

const listings = [
  {
    id: 'i11-acceptance-available',
    ownerId: ownerA.id,
    title: 'I11 Disponible sin confirmar',
    availabilityStatus: ListingAvailabilityStatus.AVAILABLE,
    lastConfirmedAt: null,
  },
  {
    id: 'i11-acceptance-unavailable',
    ownerId: ownerB.id,
    title: 'I11 No disponible',
    availabilityStatus: ListingAvailabilityStatus.UNAVAILABLE,
    lastConfirmedAt: now,
  },
  {
    id: 'i11-acceptance-stale',
    ownerId: ownerA.id,
    title: 'I11 Disponible con confirmación vencida',
    availabilityStatus: ListingAvailabilityStatus.AVAILABLE,
    lastConfirmedAt: stale,
  },
];

for (const listing of listings) {
  await prisma.listing.upsert({
    where: { id: listing.id },
    update: {
      ownerId: listing.ownerId,
      title: listing.title,
      description: 'Fixture sintético para Human Product Acceptance de I11.',
      location: 'Uspallata',
      priceAmount: 100,
      pricePeriod: 'WEEK',
      rentalDuration: 'MONTHS',
      maxOccupants: 4,
      currency: 'ARS',
      status: ListingStatus.APPROVED,
      publicationStatus: ListingPublicationStatus.PUBLISHED,
      availabilityStatus: listing.availabilityStatus,
      lastConfirmedAt: listing.lastConfirmedAt,
    },
    create: {
      id: listing.id,
      ownerId: listing.ownerId,
      title: listing.title,
      description: 'Fixture sintético para Human Product Acceptance de I11.',
      location: 'Uspallata',
      priceAmount: 100,
      pricePeriod: 'WEEK',
      rentalDuration: 'MONTHS',
      maxOccupants: 4,
      currency: 'ARS',
      status: ListingStatus.APPROVED,
      publicationStatus: ListingPublicationStatus.PUBLISHED,
      availabilityStatus: listing.availabilityStatus,
      lastConfirmedAt: listing.lastConfirmedAt,
    },
  });
}

console.log(
  JSON.stringify({
    status: 'PASS',
    password,
    owners: [ownerA.email, ownerB.email],
    listingIds: listings.map(({ id }) => id),
    states: ['AVAILABLE/UNCONFIRMED', 'UNAVAILABLE/FRESH', 'AVAILABLE/STALE'],
  }),
);
await prisma.$disconnect();
