
// The ONLY file that reads server secrets from process.env.
// Never import this file from a component or from anything with "use client".

if (typeof window !== "undefined") {
  throw new Error("src/server/env.ts must never be loaded in the browser");
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Persistent SQLite database file path.
 * Production hosting must provide an absolute persistent path outside
 * the application deployment directory.
 */
export function getSqliteDbPath(): string {
  const value = process.env.SQLITE_DB_PATH;

  if (!value || !value.trim()) {
    if (process.env.NODE_ENV === "production") {
      throw new ConfigError(
        "SQLITE_DB_PATH is not set. Configure a persistent database path."
      );
    }

    return "./data/sabaland.db";
  }

  return value.trim();
}

/** Optional. Browser POST requests must come from exactly this origin. */
export function getSiteOrigin(): string | null {
  const value = process.env.SITE_ORIGIN;
  return value && value.trim()
    ? value.trim().replace(/\/+$/, "")
    : null;
}
