import { access, mkdir, readFile, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawn } from 'node:child_process';
import { basename, join, resolve } from 'node:path';

const baseUrl = new URL(
  process.env.PORTFOLIO_EVIDENCE_BASE_URL ?? 'http://127.0.0.1:5173',
);
const outputDir = resolve(
  process.env.PORTFOLIO_EVIDENCE_OUTPUT ?? 'docs/media/portfolio',
);
const minimumBytes = 10_000;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const captures = [
  {
    name: 'catalog-desktop',
    pathname: '/',
    width: 1440,
    height: 1200,
  },
  {
    name: 'listing-detail-desktop',
    pathname: '/listings/portfolio-demo-casa-montana',
    width: 1440,
    height: 1200,
  },
  {
    name: 'catalog-mobile',
    pathname: '/',
    width: 390,
    height: 844,
  },
];

async function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Continue through known runner/browser locations.
    }
  }
  throw new Error('No supported Chrome or Chromium executable was found.');
}

function run(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.once('error', rejectPromise);
    child.once('exit', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function validateScreenshot(file, expectedWidth, expectedHeight) {
  const [bytes, metadata] = await Promise.all([readFile(file), stat(file)]);
  if (!bytes.subarray(0, pngSignature.length).equals(pngSignature)) {
    throw new Error(`${basename(file)} is not a PNG.`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(
      `${basename(file)} expected ${expectedWidth}x${expectedHeight}, received ${width}x${height}.`,
    );
  }
  if (metadata.size < minimumBytes) {
    throw new Error(
      `${basename(file)} is unexpectedly small (${metadata.size} bytes).`,
    );
  }
}

const chrome = await findChrome();
await mkdir(outputDir, { recursive: true });

for (const capture of captures) {
  const target = new URL(capture.pathname, baseUrl).toString();
  const filename = `${capture.name}-${capture.width}x${capture.height}.png`;
  const output = join(outputDir, filename);

  await run(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=5000',
    `--window-size=${capture.width},${capture.height}`,
    `--screenshot=${output}`,
    target,
  ]);

  await validateScreenshot(output, capture.width, capture.height);
  console.log(`Captured and validated ${filename}`);
}

console.log(
  `Portfolio evidence capture passed: ${captures.length} screenshots in ${outputDir}.`,
);
