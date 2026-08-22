const baseUrl = process.env.I11_BASE_URL;
const listingId = process.env.I11_LISTING_ID ?? 'i11-acceptance-available';
const ownerEmail = process.env.I11_OWNER_EMAIL ?? 'owner-i11-a@example.test';
const password = process.env.I11_PASSWORD ?? 'password123';

if (!baseUrl) throw new Error('I11_BASE_URL is required');

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
  const { response, cookie } = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ownerEmail, password }),
  });
  assert(response.status === 201, 'OWNER login failed');
  assert(cookie?.includes('alquileres_session='), 'session cookie missing');
  return cookie.split(';', 1)[0];
}

const ownerCookie = await login();
const initial = await request('/listings/' + listingId, {}, ownerCookie);
assert(initial.response.status === 200, 'OWNER listing read failed');
assert(
  initial.body.lastConfirmedAt === null,
  'creation was treated as confirmation',
);

const defaultCatalog = await request('/public/listings');
assert(defaultCatalog.response.status === 200, 'default public catalog failed');
const defaultItem = defaultCatalog.body.items?.find(
  (item) => item.id === listingId,
);
assert(defaultItem, 'unconfirmed listing missing from default catalog');

const filteredBefore = await request('/public/listings?availableOnly=true');
assert(
  filteredBefore.response.status === 200 &&
    filteredBefore.body.items?.some((item) => item.id === listingId),
  'available listing missing from opt-in filter',
);

const unavailable = await request(
  `/listings/${listingId}/availability`,
  {
    method: 'PATCH',
    body: JSON.stringify({ availabilityStatus: 'UNAVAILABLE' }),
  },
  ownerCookie,
);
assert(
  unavailable.response.status === 200 && unavailable.body.lastConfirmedAt,
  'OWNER availability change did not confirm listing',
);

const filteredAfter = await request('/public/listings?availableOnly=true');
assert(
  filteredAfter.response.status === 200 &&
    !filteredAfter.body.items?.some((item) => item.id === listingId),
  'unavailable listing remained in opt-in available filter',
);
const defaultAfter = await request('/public/listings');
assert(
  defaultAfter.body.items?.some(
    (item) =>
      item.id === listingId && item.availabilityStatus === 'UNAVAILABLE',
  ),
  'unavailable listing disappeared from default catalog',
);

const available = await request(
  `/listings/${listingId}/availability`,
  {
    method: 'PATCH',
    body: JSON.stringify({ availabilityStatus: 'AVAILABLE' }),
  },
  ownerCookie,
);
assert(available.response.status === 200, 'OWNER availability restore failed');
const reconfirmed = await request(
  `/listings/${listingId}/reconfirm`,
  {
    method: 'POST',
  },
  ownerCookie,
);
assert(
  reconfirmed.response.status === 201 && reconfirmed.body.lastConfirmedAt,
  'OWNER reconfirm did not update confirmation',
);

const contact = await request(`/public/listings/${listingId}/contact`, {
  method: 'POST',
  body: JSON.stringify({
    visitorName: 'I11 Integration Visitor',
    visitorEmail: 'i11-integration@example.test',
    message: 'I11 contact regression',
  }),
});
assert(contact.response.status === 201, 'public contact regression failed');

console.log(
  JSON.stringify({
    status: 'PASS',
    journey:
      'catalog default → opt-in available filter → OWNER availability confirmation → reconfirm → public contact',
    listingId,
    unavailableVisibleByDefault: true,
    unavailableExcludedWhenFiltered: true,
    contactRegression: 'PASS',
  }),
);
