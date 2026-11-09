
import { google, sheets_v4 } from "googleapis";
import { getGoogleSheetsConfig, type GoogleSheetsConfig } from "./env";
import { ORDER_SHEET_HEADERS } from "./sheets-mapper";

if (typeof window !== "undefined") {
  throw new Error("src/server/sheets-client.ts must never be loaded in the browser");
}

export type SheetsService = {
  sheets: sheets_v4.Sheets;
  config: GoogleSheetsConfig;
};

/**
 * Initializes an authenticated Google Sheets v4 client using
 * service account credentials from the environment.
 */
export function createSheetsClient(customConfig?: GoogleSheetsConfig): SheetsService {
  const config = customConfig ?? getGoogleSheetsConfig();

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  return { sheets, config };
}

/**
 * Ensures that the header row exists in the specified tab.
 * - If the first row is completely empty, it inserts ORDER_SHEET_HEADERS and returns true.
 * - If the first row exists and exactly matches headers, it returns false.
 * - If the first row exists but headers are missing, swapped, or renamed, it throws a descriptive Error.
 */
export async function ensureHeaderRow(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tabName: string,
  headers: readonly string[] = ORDER_SHEET_HEADERS
): Promise<boolean> {
  const range = `'${tabName}'!1:1`;

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = existing.data.values;
  if (rows && rows.length > 0 && rows[0].length > 0) {
    const existingHeaders = rows[0].map((c) => String(c).trim());
    const expectedHeaders = headers.map((h) => h.trim());

    const isMatch =
      existingHeaders.length === expectedHeaders.length &&
      expectedHeaders.every((h, i) => existingHeaders[i] === h);

    if (!isMatch) {
      throw new Error(
        `Sheet header mismatch in tab "${tabName}".\n` +
        `Expected (${expectedHeaders.length}): [${expectedHeaders.join(", ")}]\n` +
        `Found (${existingHeaders.length}): [${existingHeaders.join(", ")}]`
      );
    }

    return false;
  }

  // Row 1 is empty, populate headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[...headers]],
    },
  });

  return true;
}

/**
 * Reads existing order numbers in Column A of the target sheet tab.
 * Enables the sync worker to verify whether an order was already appended,
 * ensuring idempotent synchronization across network crashes and restarts.
 */
export async function findExistingOrderNumbers(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tabName: string
): Promise<Set<string>> {
  const range = `'${tabName}'!A:A`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];
  const orderNumbers = new Set<string>();

  for (const row of rows) {
    if (row && row.length > 0 && row[0]) {
      orderNumbers.add(String(row[0]).trim());
    }
  }

  return orderNumbers;
}

/**
 * Appends one or more rows to the target sheet tab using USER_ENTERED formatting.
 */
export async function appendOrderRows(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tabName: string,
  rows: (string | number)[][]
): Promise<sheets_v4.Schema$AppendValuesResponse> {
  if (rows.length === 0) {
    return {};
  }

  const range = `'${tabName}'!A:A`;

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });

  return response.data;
}
