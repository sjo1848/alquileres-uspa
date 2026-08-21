const baseUrl = process.env.I10_BASE_URL;
const listingId = process.env.I10_LISTING_ID;
const ownerAEmail = process.env.I10_OWNER_A_EMAIL;
const ownerBEmail = process.env.I10_OWNER_B_EMAIL;
const password = process.env.I10_PASSWORD;

for (const [name, value] of Object.entries({
  I10_BASE_URL: baseUrl,
  I10_LISTING_ID: listingId,
  I10_OWNER_A_EMAIL: ownerAEmail,
  I10_OWNER_B_EMAIL: ownerBEmail,
  I10_PASSWORD: password,
})) {
  if (!value) throw new Error(`${name} is required`);
}

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

async function login(email) {
  const { response, body, cookie } = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert(response.status === 201, `login failed for ${email}`);
  assert(cookie?.includes('alquileres_session='), 'session cookie missing');
  return cookie.split(';', 1)[0];
}

const ownerACookie = await login(ownerAEmail);
const before = await request('/owner/contact-events', {}, ownerACookie);
assert(before.response.status === 200, 'OWNER A initial inbox failed');

for (const suffix of ['one', 'two']) {
  const contact = await request(`/public/listings/${listingId}/contact`, {
    method: 'POST',
    body: JSON.stringify({
      visitorName: `I10 Integration Visitor ${suffix}`,
      visitorEmail: `i10-integration-${suffix}@example.test`,
      message: `I10 integration consultation ${suffix}`,
    }),
  });
  assert(
    contact.response.status === 201,
    `public contact ${suffix} did not return 201`,
  );
  assert(
    contact.body.status === 'RECEIVED',
    `public contact ${suffix} was not RECEIVED`,
  );
}

const ownerAInbox = await request('/owner/contact-events', {}, ownerACookie);
assert(ownerAInbox.response.status === 200, 'OWNER A inbox failed');
const event = ownerAInbox.body.items?.find(
  (item) => item.visitorEmail === 'i10-integration-one@example.test',
);
assert(event?.state === 'UNREAD', 'new contact was not UNREAD');
assert(
  ownerAInbox.body.unreadCount >= before.body.unreadCount + 2,
  'unread count did not increase for both contacts',
);

const read = await request(
  `/owner/contact-events/${event.id}/state`,
  {
    method: 'PATCH',
    body: JSON.stringify({ state: 'READ' }),
  },
  ownerACookie,
);
assert(
  read.response.status === 200 && read.body.state === 'READ',
  'READ transition failed',
);

const afterRead = await request('/owner/contact-events', {}, ownerACookie);
assert(
  afterRead.body.unreadCount === ownerAInbox.body.unreadCount - 1,
  'unread count did not decrease by one',
);

const unread = await request(
  `/owner/contact-events/${event.id}/state`,
  {
    method: 'PATCH',
    body: JSON.stringify({ state: 'UNREAD' }),
  },
  ownerACookie,
);
assert(
  unread.response.status === 200 && unread.body.state === 'UNREAD',
  'UNREAD restore failed',
);
const afterRestore = await request('/owner/contact-events', {}, ownerACookie);
assert(
  afterRestore.body.unreadCount === ownerAInbox.body.unreadCount,
  'unread count did not restore after UNREAD transition',
);

const ownerBCookie = await login(ownerBEmail);
const ownerBList = await request('/owner/contact-events', {}, ownerBCookie);
assert(
  ownerBList.response.status === 200 && ownerBList.body.items.length === 0,
  'OWNER B saw OWNER A lead',
);
const crossOwner = await request(
  `/owner/contact-events/${event.id}`,
  {},
  ownerBCookie,
);
assert(
  crossOwner.response.status === 404,
  'OWNER B cross-owner read was not rejected',
);

console.log(
  JSON.stringify({
    status: 'PASS',
    journey: 'public contact → UNREAD → OWNER A inbox → READ → UNREAD',
    ownerBIsolation: 'PASS',
    adminInbox: 'not exposed by I10 route design',
    retention: '180 days documented; automated deletion not implemented',
  }),
);
