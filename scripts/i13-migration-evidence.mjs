import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const migrationName = '20260823000000_listing_rental_domain';
const migrationPath = fileURLToPath(
  new URL(
    `../apps/api/prisma/migrations/${migrationName}/migration.sql`,
    import.meta.url,
  ),
);
if (!existsSync(migrationPath))
  throw new Error('I13 migration file is missing');
const migrationsRoot = fileURLToPath(
  new URL('../apps/api/prisma/migrations/', import.meta.url),
);
const baseUrl = new URL(databaseUrl);
baseUrl.searchParams.delete('schema');
const schema = `i13_evidence_${Date.now()}_${randomBytes(3).toString('hex')}`;
const useLocalPsql =
  Boolean(process.env.I13_PSQL_BIN) || existsSync('/usr/bin/psql');
const container = process.env.I13_POSTGRES_CONTAINER;
const psqlBaseArgs = useLocalPsql
  ? [baseUrl.toString()]
  : container
    ? [
        'exec',
        '-e',
        `PGPASSWORD=${decodeURIComponent(baseUrl.password)}`,
        container,
        'psql',
        '-U',
        decodeURIComponent(baseUrl.username),
        '-d',
        decodeURIComponent(baseUrl.pathname.slice(1)),
      ]
    : [
        'compose',
        'exec',
        '-T',
        '-e',
        `PGPASSWORD=${decodeURIComponent(baseUrl.password)}`,
        'postgres',
        'psql',
        '-U',
        decodeURIComponent(baseUrl.username),
        '-d',
        decodeURIComponent(baseUrl.pathname.slice(1)),
      ];

function psql(sql, scoped = false) {
  const prefix = scoped ? `SET search_path TO "${schema}"; ` : '';
  const args = useLocalPsql
    ? [
        baseUrl.toString(),
        '-v',
        'ON_ERROR_STOP=1',
        '-At',
        '-c',
        `${prefix}${sql}`,
      ]
    : [
        ...psqlBaseArgs,
        '-v',
        'ON_ERROR_STOP=1',
        '-At',
        '-c',
        `${prefix}${sql}`,
      ];
  return (
    execFileSync(
      useLocalPsql ? (process.env.I13_PSQL_BIN ?? 'psql') : 'docker',
      args,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
    )
      .trim()
      .split('\n')
      .at(-1) ?? ''
  );
}

try {
  psql(`CREATE SCHEMA "${schema}"`);
  for (const dir of readdirSync(migrationsRoot)
    .filter(
      (entry) => entry !== 'migration_lock.toml' && entry !== migrationName,
    )
    .sort())
    psql(readFileSync(`${migrationsRoot}${dir}/migration.sql`, 'utf8'), true);

  psql(
    `INSERT INTO users (id, email, password_hash, role, updated_at) VALUES ('i13-owner', 'i13-owner@example.test', 'fixture', 'OWNER', now()); INSERT INTO listings (id, owner_id, title, description, location, price_per_night, max_guests, updated_at) VALUES ('i13-listing', 'i13-owner', 'I13 legacy fixture', 'fixture', 'Uspallata', 123, 7, now());`,
    true,
  );
  psql(readFileSync(migrationPath, 'utf8'), true);
  const result = psql(
    `SELECT price_per_night || '|' || max_guests || '|' || COALESCE(price_amount::text, '<NULL>') || '|' || COALESCE(price_period::text, '<NULL>') || '|' || COALESCE(rental_duration::text, '<NULL>') || '|' || COALESCE(max_occupants::text, '<NULL>') || '|' || COALESCE(currency::text, '<NULL>') || '|' || (SELECT is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'listings' AND column_name = 'price_per_night') || '|' || (SELECT is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'listings' AND column_name = 'max_guests') FROM listings WHERE id = 'i13-listing'`,
    true,
  );
  const expected = '123|7|<NULL>|<NULL>|<NULL>|<NULL>|<NULL>|YES|YES';
  if (result !== expected)
    throw new Error(`I13 migration evidence failed: ${result}`);
  console.log(
    JSON.stringify({
      status: 'PASS',
      schema,
      migration: migrationName,
      legacyValuesPreserved: true,
      newDomainValuesNull: true,
    }),
  );
} finally {
  psql(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
}
