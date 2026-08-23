const baseUrl = process.env.I13_BASE_URL;
const listingId = process.env.I13_LISTING_ID ?? 'i11-acceptance-available';
const ownerEmail = process.env.I13_OWNER_EMAIL ?? 'owner-i11-a@example.test';
const password = process.env.I13_PASSWORD ?? 'password123';

if (!baseUrl) throw new Error('I13_BASE_URL is required');

async function request(path, options = {}, cookie) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body, cookie: response.headers.get('set-cookie') };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login() {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ownerEmail, password }),
  });
  assert(result.response.status === 201, 'OWNER login failed');
  assert(
    result.cookie?.includes('alquileres_session='),
    'session cookie missing',
  );
  return result.cookie.split(';', 1)[0];
}

const ownerCookie = await login();
const listing = await request(`/listings/${listingId}`, {}, ownerCookie);
assert(listing.response.status === 200, 'OWNER listing read failed');
assert(listing.body.priceAmount !== undefined, 'domain price missing');
assert(listing.body.pricePeriod === 'WEEK', 'price period contract failed');
assert(
  listing.body.rentalDuration === 'MONTHS',
  'rental duration contract failed',
);
assert(listing.body.maxOccupants === 4, 'occupant contract failed');
assert(listing.body.currency === 'ARS', 'currency contract failed');
assert(
  listing.body.pricePerNight === undefined,
  'tourist price leaked from OWNER API',
);

const publicPage = await request(
  '/public/listings?minPriceAmount=50&maxPriceAmount=150&maxOccupants=2&currency=ARS',
);
assert(publicPage.response.status === 200, 'domain public filter failed');
const publicItem = publicPage.body.items?.find((item) => item.id === listingId);
assert(
  publicItem?.domainDataStatus === 'COMPLETE',
  'complete domain status missing',
);
assert(
  publicItem.pricePerNight === undefined,
  'tourist price leaked from public API',
);
assert(publicItem.maxOccupants === 4, 'public occupants contract failed');

const created = await request(
  '/listings',
  {
    method: 'POST',
    body: JSON.stringify({
      title: 'I13 Integration Medium Stay',
      description: 'Synthetic I13 integration fixture.',
      location: 'Uspallata',
      priceAmount: 250,
      pricePeriod: 'MONTH',
      rentalDuration: 'FLEXIBLE',
      maxOccupants: 3,
      currency: 'USD',
    }),
  },
  ownerCookie,
);
assert(created.response.status === 201, 'OWNER domain create failed');
assert(
  created.body.priceAmount === 250 && created.body.currency === 'USD',
  'created domain values failed',
);
assert(
  created.body.pricePerNight === undefined,
  'tourist price leaked from create response',
);

const removed = await request(
  `/listings/${created.body.id}`,
  { method: 'DELETE' },
  ownerCookie,
);
assert(removed.response.status === 200, 'integration fixture cleanup failed');

const contact = await request(`/public/listings/${listingId}/contact`, {
  method: 'POST',
  body: JSON.stringify({
    visitorName: 'I13 Integration Visitor',
    visitorEmail: 'i13-integration@example.test',
    message: 'I13 contact regression',
  }),
});
assert(contact.response.status === 201, 'public contact regression failed');

console.log(
  JSON.stringify({
    status: 'PASS',
    journey:
      'domain catalog/filter → OWNER domain create → cleanup → contact regression',
    listingId,
    migrationStrategy: 'legacy values preserved and never converted',
    touristContractsAbsent: true,
    contactRegression: 'PASS',
  }),
);
