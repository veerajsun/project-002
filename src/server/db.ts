
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { getSqliteDbPath } from "./env";

if (typeof window !== "undefined") {
  throw new Error("src/server/db.ts must never be loaded in the browser");
}

export type QueryResult<R = any> = {
  rows: R[];
  rowCount: number | null;
};

export type Queryable = {
  query<R = any>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<R>>;
};

type SqliteHandle = InstanceType<typeof Database>;

type DbGlobals = typeof globalThis & {
  __sablandDb?: SqliteHandle;
  __sablandDbLock?: Promise<void>;
  __sablandDbRelease?: () => void;
};

const globals = globalThis as DbGlobals;

function openDatabase(): SqliteHandle {
  const configuredPath = getSqliteDbPath();

  const dbPath =
    configuredPath === ":memory:"
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);

  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);

  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  return db;
}

/**
 * One shared SQLite connection for the running Next.js process.
 */
export function getDatabase(): SqliteHandle {
  if (!globals.__sablandDb) {
    globals.__sablandDb = openDatabase();
  }

  return globals.__sablandDb;
}

/**
 * Serializes database operations so another request cannot
 * interfere with an active transaction on the same connection.
 */
async function acquireLock(): Promise<() => void> {
  const previous = globals.__sablandDbLock ?? Promise.resolve();

  let release!: () => void;

  globals.__sablandDbLock = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;

  return release;
}

function execute<R>(
  db: SqliteHandle,
  text: string,
  params: unknown[] = []
): QueryResult<R> {
  const statement = db.prepare(text);

  // SELECT and INSERT/UPDATE/DELETE with RETURNING
  if (statement.reader) {
    const rows = statement.all(...(params as any[])) as R[];

    return {
      rows,
      rowCount: rows.length,
    };
  }

  // Normal INSERT, UPDATE and DELETE
  const result = statement.run(...(params as any[]));

  return {
    rows: [],
    rowCount: result.changes,
  };
}

/**
 * Standalone query. It waits until any active transaction finishes.
 */
export async function query<R = any>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<R>> {
  const release = await acquireLock();

  try {
    return execute<R>(getDatabase(), text, params);
  } finally {
    release();
  }
}

/**
 * Runs all callback queries inside one SQLite transaction.
 * The lock remains held for the complete callback.
 */
export async function withTransaction<T>(
  fn: (db: Queryable) => Promise<T>
): Promise<T> {
  const release = await acquireLock();
  const db = getDatabase();

  const transactionDb: Queryable = {
    query: async <R = any>(
      text: string,
      params: unknown[] = []
    ): Promise<QueryResult<R>> => {
      return execute<R>(db, text, params);
    },
  };

  try {
    db.exec("BEGIN IMMEDIATE");

    const result = await fn(transactionDb);

    db.exec("COMMIT");

    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Preserve the original transaction error.
    }

    throw error;
  } finally {
    release();
  }
}
