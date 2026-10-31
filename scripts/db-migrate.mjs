// Creates / updates the database tables from the .sql files in db/migrations.
//   node scripts\db-migrate.mjs
// Safe to run again: a file that was already applied is skipped. Each file runs inside ONE
// transaction, so a failure leaves the database exactly as it was.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { connect, describeTarget, loadEnv, root } from "./_db-utils.mjs";

async function main() {
  await loadEnv();
  const dir = path.join(root, "db", "migrations");
  const files = fs.readdirSync(dir).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
  const client = await connect();
  console.log("Database:", describeTarget());
  let failed = false;
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name text PRIMARY KEY,
         checksum text NOT NULL,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`
    );
    const done = new Map(
      (await client.query("SELECT name, checksum FROM schema_migrations")).rows.map((r) => [r.name, r.checksum])
    );
    let applied = 0;
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      const checksum = crypto.createHash("sha256").update(sql).digest("hex");
      if (done.has(file)) {
        if (done.get(file) !== checksum) {
          console.error(`STOP: ${file} was changed after it was applied. Never edit an applied file: add a NEW migration instead.`);
          failed = true;
          break;
        }
        console.log(`  already applied: ${file}`);
        continue;
      }
      console.log(`  applying: ${file}`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [file, checksum]);
        await client.query("COMMIT");
        applied++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  FAILED: ${file}\n  ${err.message}${err.position ? ` (at character ${err.position})` : ""}`);
        console.error("  Nothing was changed. Send me this message and I will fix the SQL.");
        failed = true;
        break;
      }
    }
    if (!failed) console.log(applied ? `Done: ${applied} migration(s) applied.` : "Nothing to do: the database is up to date.");
  } finally {
    await client.end();
  }
  process.exit(failed ? 1 : 0);
}
main().catch((err) => {
  console.error("Unexpected error:", err && err.message ? err.message : err);
  process.exit(1);
});
