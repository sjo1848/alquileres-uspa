const baseUrl = (process.env.SMOKE_BASE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);
const response = await fetch(`${baseUrl}/health`);
const body = await response.text();

if (!response.ok) {
  console.error(
    `Smoke failed: GET ${baseUrl}/health returned ${response.status}: ${body}`,
  );
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(body);
} catch {
  console.error('Smoke failed: /health did not return JSON.');
  process.exit(1);
}

if (payload.status !== 'ok' || payload.checks?.database !== 'ok') {
  console.error(`Smoke failed: unexpected health payload: ${body}`);
  process.exit(1);
}

console.log(
  `Smoke passed: ${baseUrl}/health reports API and database healthy.`,
);
