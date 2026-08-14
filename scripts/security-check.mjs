import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const excludedDirectory = /(?:^|\/)(?:node_modules|dist)(?:\/|$)/;
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean)
  .filter((file) => !excludedDirectory.test(file))
  .filter((file) => !file.endsWith('.env.example'));
const binaryExtensions = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|pdf|zip)$/i;
const privateKey = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
const trackedEnv = /(^|\/)\.env(?:\.|$)/;
const suspiciousSecret =
  /(?:api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{20,}/i;
const findings = [];

for (const file of files) {
  if (binaryExtensions.test(file)) continue;
  if (!existsSync(file)) continue;
  if (!statSync(file).isFile()) continue;
  if (trackedEnv.test(file)) {
    findings.push(`${file}: tracked environment file`);
    continue;
  }
  const content = readFileSync(file, 'utf8');
  if (privateKey.test(content)) findings.push(`${file}: private key material`);
  if (suspiciousSecret.test(content))
    findings.push(`${file}: hard-coded secret-like value`);
}

if (findings.length) {
  console.error('Security check failed:\n' + findings.join('\n'));
  process.exit(1);
}
console.log(`Security check passed (${files.length} text files scanned).`);
