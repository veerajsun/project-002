
import { query } from "@/server/db";
import { json, withErrorHandling } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandling("health", async () => {
  await query("SELECT 1");

  const tables = await query<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'orders'"
  );

  return json({
    ok: true,
    database: "up",
    ordersTable: tables.rows.length > 0 ? "exists" : "missing",
  });
});
