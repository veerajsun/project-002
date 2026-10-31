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

/** The PostgreSQL connection string. The value is never logged or returned to anyone. */
export function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value || !value.trim()) {
    throw new ConfigError("DATABASE_URL is not set (see .env.example)");
  }
  return value;
}

/** Optional. When set, browser POST requests must come from exactly this origin. */
export function getSiteOrigin(): string | null {
  const value = process.env.SITE_ORIGIN;
  return value && value.trim() ? value.trim().replace(/\/+$/, "") : null;
}
