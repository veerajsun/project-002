// PostgreSQL access. Only server code may import this file.
import { Pool } from "pg";
import { getDatabaseUrl } from "./env";

if (typeof window !== "undefined") {
  throw new Error("src/server/db.ts must never be loaded in the browser");
}

/** Anything that can run a query: the pool, or one client inside a transaction. */
export type Queryable = {
  query<R = any>(
    text: string,
    params?: unknown[]
  ): Promise<{ rows: R[]; rowCount: number | null }>;
};

// Keep ONE pool, even when Next.js reloads modules in development.
const globalForPool = globalThis as unknown as { __sablandPool?: Pool };

export function getPool(): Pool {
  if (!globalForPool.__sablandPool) {
    const pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 5, // small pool: friendly to ordinary hosting plans
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 15_000,
    });
    pool.on("error", (err: Error) => {
      console.error("[db] idle client error:", err.name);
    });
    globalForPool.__sablandPool = pool;
  }
  return globalForPool.__sablandPool;
}

/** Run one query. Always pass values as parameters ($1, $2...), never inside the SQL text. */
export async function query<R = any>(text: string, params?: unknown[]) {
return getPool().query(text, params) as unknown as Promise<{ rows: R[]; rowCount: number | null }>;
}

/** All-or-nothing: everything inside `fn` is saved together, or not at all. */
export async function withTransaction<T>(fn: (db: Queryable) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore: the original error is the one that matters
    }
    throw err;
  } finally {
    client.release();
  }
}
