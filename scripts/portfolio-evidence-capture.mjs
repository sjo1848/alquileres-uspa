import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
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
const debuggingPort = Number(process.env.PORTFOLIO_EVIDENCE_DEBUG_PORT ?? 9222);
const browserProfile = resolve('.data/portfolio-evidence-chrome');

const captures = [
  {
    name: 'catalog-results-desktop',
    pathname: '/',
    width: 1440,
    height: 1200,
    scrollSelector: '.listing-grid',
  },
  {
    name: 'listing-detail-desktop',
    pathname: '/listings/portfolio-demo-casa-montana',
    width: 1440,
    height: 1200,
  },
  {
    name: 'catalog-results-mobile',
    pathname: '/',
    width: 390,
    height: 844,
    scrollSelector: '.listing-grid',
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

async function waitForDebugger() {
  const endpoint = `http://127.0.0.1:${debuggingPort}/json/version`;
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const payload = await response.json();
        if (payload.webSocketDebuggerUrl) return payload.webSocketDebuggerUrl;
      }
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }

  throw new Error('Chrome DevTools endpoint did not become ready.');
}

async function stopChrome(process) {
  if (process.exitCode === null) {
    process.kill('SIGTERM');
    await Promise.race([
      new Promise((resolvePromise) => process.once('exit', resolvePromise)),
      new Promise((resolvePromise) => setTimeout(resolvePromise, 3_000)),
    ]);
  }

  await rm(browserProfile, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolvePromise, rejectPromise) => {
      this.socket.addEventListener('open', resolvePromise, { once: true });
      this.socket.addEventListener('error', rejectPromise, { once: true });
    });

    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result ?? {});
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId;
    this.nextId += 1;

    return new Promise((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise });
      this.socket.send(
        JSON.stringify({
          id,
          method,
          params,
          ...(sessionId ? { sessionId } : {}),
        }),
      );
    });
  }

  close() {
    this.socket.close();
  }
}

function runtimeReadyExpression(scrollSelector) {
  return `
    new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000;
      const selector = ${JSON.stringify(scrollSelector ?? null)};
      const check = async () => {
        const target = selector ? document.querySelector(selector) : document.body;
        if (document.readyState === 'complete' && target) {
          if (selector) target.scrollIntoView({ block: 'start' });
          const images = Array.from(document.images);
          await Promise.all(images.map((image) => {
            if (image.complete) return Promise.resolve();
            return new Promise((done) => {
              image.addEventListener('load', done, { once: true });
              image.addEventListener('error', done, { once: true });
            });
          }));
          requestAnimationFrame(() => setTimeout(() => resolve(true), 350));
          return;
        }
        if (Date.now() > deadline) {
          reject(new Error(selector ? 'Timed out waiting for ' + selector : 'Timed out waiting for page readiness'));
          return;
        }
        setTimeout(check, 100);
      };
      check();
    })
  `;
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
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await rm(browserProfile, { recursive: true, force: true });

const chromeProcess = spawn(
  chrome,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${browserProfile}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'inherit'] },
);

try {
  const debuggerUrl = await waitForDebugger();
  const client = new CdpClient(debuggerUrl);
  await client.connect();

  try {
    for (const capture of captures) {
      const targetUrl = new URL(capture.pathname, baseUrl).toString();
      const filename = `${capture.name}-${capture.width}x${capture.height}.png`;
      const output = join(outputDir, filename);
      const { targetId } = await client.send('Target.createTarget', {
        url: 'about:blank',
      });
      const { sessionId } = await client.send('Target.attachToTarget', {
        targetId,
        flatten: true,
      });

      await client.send('Page.enable', {}, sessionId);
      await client.send(
        'Emulation.setDeviceMetricsOverride',
        {
          width: capture.width,
          height: capture.height,
          deviceScaleFactor: 1,
          mobile: capture.width < 600,
        },
        sessionId,
      );
      await client.send('Page.navigate', { url: targetUrl }, sessionId);
      await client.send(
        'Runtime.evaluate',
        {
          expression: runtimeReadyExpression(capture.scrollSelector),
          awaitPromise: true,
          returnByValue: true,
        },
        sessionId,
      );

      const { data } = await client.send(
        'Page.captureScreenshot',
        {
          format: 'png',
          fromSurface: true,
          captureBeyondViewport: false,
        },
        sessionId,
      );
      await writeFile(output, Buffer.from(data, 'base64'));
      await validateScreenshot(output, capture.width, capture.height);
      await client.send('Target.closeTarget', { targetId });
      console.log(`Captured and validated ${filename}`);
    }
  } finally {
    client.close();
  }
} finally {
  await stopChrome(chromeProcess);
}

console.log(
  `Portfolio evidence capture passed: ${captures.length} screenshots in ${outputDir}.`,
);
