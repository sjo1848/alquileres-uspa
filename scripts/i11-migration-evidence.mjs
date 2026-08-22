import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const migrationPath = fileURLToPath(
  new URL(
    '../apps/api/prisma/migrations/20260822000000_truthful_availability_confirmation/migration.sql',
    import.meta.url,
  ),
);
if (!existsSync(migrationPath))
  throw new Error('I11 migration file is missing');
const migrationSql = readFileSync(migrationPath, 'utf8');
const migrationsRoot = fileURLToPath(
  new URL('../apps/api/prisma/migrations/', import.meta.url),
);

const schema = `i11_evidence_${Date.now()}_${randomBytes(3).toString('hex')}`;
const baseUrl = new URL(databaseUrl);
baseUrl.searchParams.delete('schema');
const useLocalPsql =
  Boolean(process.env.I11_PSQL_BIN) || existsSync('/usr/bin/psql');
const postgresContainer = process.env.I11_POSTGRES_CONTAINER;
const psqlBaseArgs = useLocalPsql
  ? [baseUrl.toString()]
  : postgresContainer
    ? [
        'exec',
        '-e',
        `PGPASSWORD=${decodeURIComponent(baseUrl.password)}`,
        postgresContainer,
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

function psql(sql, url = baseUrl.toString()) {
  const args = useLocalPsql
    ? [url, '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql]
    : [...psqlBaseArgs, '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql];
  return (
    execFileSync(
      useLocalPsql ? (process.env.I11_PSQL_BIN ?? 'psql') : 'docker',
      args,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
    )
      .trim()
      .split('\n')
      .at(-1) ?? ''
  );
}

function executeSql(sql) {
  const args = useLocalPsql
    ? [
        baseUrl.toString(),
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `SET search_path TO "${schema}"; ${sql}`,
      ]
    : [
        ...psqlBaseArgs,
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `SET search_path TO "${schema}"; ${sql}`,
      ];
  execFileSync(
    useLocalPsql ? (process.env.I11_PSQL_BIN ?? 'psql') : 'docker',
    args,
    {
      stdio: 'inherit',
    },
  );
}

try {
  psql(`CREATE SCHEMA "${schema}"`);
  const migrationDirs = readdirSync(migrationsRoot)
    .filter(
      (entry) =>
        entry !== 'migration_lock.toml' &&
        entry !== '20260822000000_truthful_availability_confirmation',
    )
    .sort();
  for (const migrationDir of migrationDirs) {
    executeSql(
      readFileSync(`${migrationsRoot}${migrationDir}/migration.sql`, 'utf8'),
    );
  }

  // Make the final migration's data cleanup observable: simulate a legacy row
  // that still has the old creation-time timestamp before applying its SQL.
  psql(
    `SET search_path TO "${schema}"; ` +
      `INSERT INTO users (id, email, password_hash, role, updated_at) ` +
      `VALUES ('i11-owner', 'i11-owner@example.test', 'fixture', 'OWNER', now()); ` +
      `INSERT INTO listings ` +
      `(id, owner_id, title, description, location, price_per_night, max_guests, last_confirmed_at, updated_at) ` +
      `VALUES ('i11-listing', 'i11-owner', 'I11 fixture', 'fixture', 'Uspallata', 1, 1, '2020-01-01T00:00:00Z', now())`,
  );
  const before = psql(
    `SET search_path TO "${schema}"; ` +
      `SELECT count(*) FROM listings WHERE id = 'i11-listing' AND last_confirmed_at IS NOT NULL`,
  )
    .split('\n')
    .pop();
  if (before !== '1') throw new Error('I11 fixture was not seeded');

  executeSql(migrationSql);

  const result = psql(
    `SELECT is_nullable || '|' || COALESCE(column_default, '<NULL>') ` +
      `FROM information_schema.columns ` +
      `WHERE table_schema = '${schema}' AND table_name = 'listings' AND column_name = 'last_confirmed_at'`,
  );
  const cleared = psql(
    `SET search_path TO "${schema}"; ` +
      `SELECT count(*) FROM listings WHERE id = 'i11-listing' AND last_confirmed_at IS NULL`,
  )
    .split('\n')
    .pop();
  if (result !== 'YES|<NULL>' || cleared !== '1')
    throw new Error(
      `I11 migration evidence failed: ${result} / cleared=${cleared}`,
    );

  console.log(
    JSON.stringify({
      status: 'PASS',
      schema,
      migration: '20260822000000_truthful_availability_confirmation',
    }),
  );
} finally {
  psql(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
}
