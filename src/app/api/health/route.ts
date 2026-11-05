import { query } from "@/server/db";
import { json, withErrorHandling } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Shows whether the database can be reached. Reveals nothing else.
export const GET = withErrorHandling("health", async () => {
  await query("SELECT 1");
  return json({ ok: true, database: "up" });
});