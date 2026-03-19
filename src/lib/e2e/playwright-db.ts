export type PlaywrightDatabaseCandidate = {
  label: string;
  databaseUrl: string;
  directUrl: string;
};

export type PlaywrightDockerFallback = {
  containerName: string;
  image: string;
  host: string;
  hostPort: number;
  containerPort: number;
  username: string;
  password: string;
  database: string;
  candidate: PlaywrightDatabaseCandidate;
};

type CandidateInputs = {
  runtimeEnv?: Record<string, string | undefined>;
  envFileValues?: Record<string, string | undefined>;
};

function normalizeDatabaseUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

function isLocalDatabaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function applySchema(value: string, schema: string): string | null {
  try {
    const parsed = new URL(value);
    parsed.searchParams.set('schema', schema);
    return parsed.toString();
  } catch {
    return null;
  }
}

function replacePort(value: string, port: number): string | null {
  try {
    const parsed = new URL(value);
    if (!isLocalDatabaseUrl(value)) {
      return null;
    }
    parsed.port = String(port);
    return parsed.toString();
  } catch {
    return null;
  }
}

function parseConnectionSettings(value?: string | null) {
  const normalized = normalizeDatabaseUrl(value);
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized);
    return {
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}

export function buildVectorExtensionBootstrapSql(schema: string): string {
  const escapedSchema = schema.replaceAll('"', '""');
  return `CREATE SCHEMA IF NOT EXISTS "${escapedSchema}"; CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA "${escapedSchema}";`;
}

export function buildPlaywrightDatabaseCandidates({
  runtimeEnv = {},
  envFileValues = {},
}: CandidateInputs): PlaywrightDatabaseCandidate[] {
  const candidates: PlaywrightDatabaseCandidate[] = [];
  const seen = new Set<string>();
  const isolatedSchema = runtimeEnv.E2E_DB_SCHEMA ?? envFileValues.E2E_DB_SCHEMA ?? 'playwright_e2e';

  const pushCandidate = (label: string, databaseUrl?: string | null, directUrl?: string | null) => {
    const normalizedDatabaseUrl = normalizeDatabaseUrl(databaseUrl);
    if (!normalizedDatabaseUrl) {
      return;
    }

    const normalizedDirectUrl = normalizeDatabaseUrl(directUrl) ?? normalizedDatabaseUrl;
    const key = `${normalizedDatabaseUrl}::${normalizedDirectUrl}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    candidates.push({
      label,
      databaseUrl: normalizedDatabaseUrl,
      directUrl: normalizedDirectUrl,
    });
  };

  pushCandidate('explicit-e2e', runtimeEnv.E2E_DATABASE_URL, runtimeEnv.E2E_DIRECT_URL ?? runtimeEnv.E2E_DATABASE_URL);
  pushCandidate(
    'runtime-env',
    applySchema(runtimeEnv.DATABASE_URL ?? '', isolatedSchema),
    applySchema(runtimeEnv.DIRECT_URL ?? runtimeEnv.DATABASE_URL ?? '', isolatedSchema),
  );
  pushCandidate(
    'env-file',
    applySchema(envFileValues.DATABASE_URL ?? '', isolatedSchema),
    applySchema(envFileValues.DIRECT_URL ?? envFileValues.DATABASE_URL ?? '', isolatedSchema),
  );

  const runtimeDbPortFallback = replacePort(runtimeEnv.DATABASE_URL ?? '', 5432);
  const runtimeDirectPortFallback = replacePort(runtimeEnv.DIRECT_URL ?? runtimeEnv.DATABASE_URL ?? '', 5432);
  if (runtimeDbPortFallback && runtimeDbPortFallback !== normalizeDatabaseUrl(runtimeEnv.DATABASE_URL)) {
    pushCandidate(
      'runtime-env-db-port-5432',
      applySchema(runtimeDbPortFallback, isolatedSchema),
      applySchema(runtimeDirectPortFallback ?? runtimeDbPortFallback, isolatedSchema),
    );
  }

  const envFileDbPortFallback = replacePort(envFileValues.DATABASE_URL ?? '', 5432);
  const envFileDirectPortFallback = replacePort(envFileValues.DIRECT_URL ?? envFileValues.DATABASE_URL ?? '', 5432);
  if (envFileDbPortFallback && envFileDbPortFallback !== normalizeDatabaseUrl(envFileValues.DATABASE_URL)) {
    pushCandidate(
      'env-file-db-port-5432',
      applySchema(envFileDbPortFallback, isolatedSchema),
      applySchema(envFileDirectPortFallback ?? envFileDbPortFallback, isolatedSchema),
    );
  }

  pushCandidate(
    'local-default',
    applySchema('postgresql://eaf_user:eaf_password@127.0.0.1:5432/eaf_local', isolatedSchema),
    applySchema('postgresql://eaf_user:eaf_password@127.0.0.1:5432/eaf_local', isolatedSchema),
  );

  return candidates;
}

export function buildPlaywrightDockerFallback({
  runtimeEnv = {},
  envFileValues = {},
}: CandidateInputs): PlaywrightDockerFallback {
  const isolatedSchema = runtimeEnv.E2E_DB_SCHEMA ?? envFileValues.E2E_DB_SCHEMA ?? 'playwright_e2e';
  const baseSettings =
    parseConnectionSettings(runtimeEnv.DATABASE_URL) ??
    parseConnectionSettings(envFileValues.DATABASE_URL) ??
    parseConnectionSettings(runtimeEnv.E2E_DATABASE_URL) ??
    parseConnectionSettings(envFileValues.E2E_DATABASE_URL) ?? {
      username: 'eaf_user',
      password: 'eaf_password',
      database: 'eaf_local',
    };

  const host = runtimeEnv.E2E_DOCKER_DB_HOST ?? '127.0.0.1';
  const hostPort = Number(runtimeEnv.E2E_DOCKER_DB_PORT ?? '5433');
  const containerPort = 5432;
  const username = runtimeEnv.E2E_DOCKER_DB_USER ?? baseSettings.username;
  const password = runtimeEnv.E2E_DOCKER_DB_PASSWORD ?? baseSettings.password;
  const database = runtimeEnv.E2E_DOCKER_DB_NAME ?? baseSettings.database;
  const image = runtimeEnv.E2E_DOCKER_DB_IMAGE ?? 'pgvector/pgvector:pg15';
  const containerName = `eaf-playwright-pg-${hostPort}`;
  const baseUrl = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${hostPort}/${database}`;
  const databaseUrl = applySchema(baseUrl, isolatedSchema) ?? `${baseUrl}?schema=${isolatedSchema}`;

  return {
    containerName,
    image,
    host,
    hostPort,
    containerPort,
    username,
    password,
    database,
    candidate: {
      label: 'docker-pgvector',
      databaseUrl,
      directUrl: databaseUrl,
    },
  };
}
