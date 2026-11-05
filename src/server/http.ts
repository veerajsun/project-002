// Safe request/response helpers for the API routes. Server code only.
import { ConfigError, getSiteOrigin } from "./env";

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: BASE_HEADERS });
}

/** Errors always look the same: { error: { code, message, details? } }. No stack traces, no SQL. */
export function apiError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>
): Response {
  return json({ error: { code, message, ...(details ? { details } : {}) } }, status);
}

export type BodyResult = { ok: true; data: unknown } | { ok: false; response: Response };

/** Reads a small JSON body safely: content type, size limit, and valid JSON are all checked. */
export async function readJsonBody(request: Request, maxBytes = 20_000): Promise<BodyResult> {
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.includes("application/json")) {
    return { ok: false, response: apiError(415, "UNSUPPORTED_MEDIA_TYPE", "Send JSON (Content-Type: application/json).") };
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, response: apiError(413, "BODY_TOO_LARGE", "The request is too large.") };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    return { ok: false, response: apiError(413, "BODY_TOO_LARGE", "The request is too large.") };
  }
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, response: apiError(400, "INVALID_JSON", "The request body is not valid JSON.") };
  }
}

/** If SITE_ORIGIN is set, a browser request from any other website is refused. */
export function checkOrigin(request: Request): Response | null {
  const allowed = getSiteOrigin();
  if (!allowed) return null;
  const origin = request.headers.get("origin");
  if (origin && origin !== allowed) {
    return apiError(403, "FORBIDDEN_ORIGIN", "This request is not allowed.");
  }
  return null;
}

function isDatabaseDown(code: unknown): boolean {
  if (typeof code !== "string") return false;

  return [
    "SQLITE_BUSY",
    "SQLITE_LOCKED",
    "SQLITE_CANTOPEN",
    "SQLITE_IOERR",
    "SQLITE_NOTADB",
    "SQLITE_CORRUPT",
  ].some((prefix) => code.startsWith(prefix));
}

/**
 * Wraps a route so that an unexpected error never leaks details to the browser.
 * Details go to the SERVER log only (never the connection string).
 */
export function withErrorHandling(label: string, handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request);
    } catch (err) {
      const e = err as { name?: string; code?: unknown; message?: string };
      const code = typeof e?.code === "string" ? e.code : "";
      console.error(`[api:${label}]`, e?.name ?? "Error", code, String(e?.message ?? "").slice(0, 200));
      if (err instanceof ConfigError) {
        return apiError(503, "SERVER_NOT_CONFIGURED", "The server is not configured yet.");
      }
      if (
  code.startsWith("SQLITE_ERROR") &&
  /no such table/i.test(String(e?.message ?? ""))
) {
  return apiError(503, "DATABASE_NOT_READY", "The database has not been set up yet.");
}
      if (isDatabaseDown(code)) {
        return apiError(503, "DATABASE_UNAVAILABLE", "The database is not reachable right now.");
      }
      return apiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
    }
  };
}
