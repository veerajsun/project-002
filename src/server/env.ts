
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

export type GoogleSheetsConfig = {
  clientEmail: string;
  privateKey: string;
  sheetId: string;
  tabName: string;
};

/**
 * Checks if the minimal Google Sheets environment variables are present.
 */
export function isGoogleSheetsConfigured(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  return Boolean(email && key && sheetId);
}

/**
 * Google Sheets service account credentials and spreadsheet configuration.
 * Formats escaped newlines in private keys and validates required fields.
 */
export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME?.trim() || "Orders";

  const missing: string[] = [];
  if (!clientEmail) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!rawKey) missing.push("GOOGLE_PRIVATE_KEY");
  if (!sheetId) missing.push("GOOGLE_SHEET_ID");

  if (missing.length > 0) {
    throw new ConfigError(
      `Google Sheets configuration is incomplete. Missing: ${missing.join(", ")}`
    );
  }

  // Sanitize private key: handle escaped \n sequences and outer quotes
  const unquotedKey = rawKey!.replace(/^["']|["']$/g, "");
  const privateKey = unquotedKey.replace(/\\n/g, "\n");

  return {
    clientEmail: clientEmail!,
    privateKey,
    sheetId: sheetId!,
    tabName,
  };
}
