
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { connect, describeTarget, root } from "./_db-utils.mjs";

async function main() {
  const db = await connect();

  try {
    console.log(`[migration] Target: ${describeTarget()}`);

    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationDir = path.join(root, "db", "migrations");

    if (!fs.existsSync(migrationDir)) {
      throw new Error(`Migration directory not found: ${migrationDir}`);
    }

    const files = fs
      .readdirSync(migrationDir)
      .filter((file) => /^\d+.*\.sql$/i.test(file))
      .sort();

    if (files.length === 0) {
      console.log("[migration] No migration files found.");
      return;
    }

    for (const filename of files) {
      const fullPath = path.join(migrationDir, filename);
      const sql = fs.readFileSync(fullPath, "utf8");

      const checksum = crypto
        .createHash("sha256")
        .update(sql)
        .digest("hex");

      const existing = db
        .prepare(
          "SELECT checksum FROM schema_migrations WHERE filename = ?"
        )
        .get(filename);

      if (existing) {
        if (existing.checksum !== checksum) {
          throw new Error(
            `Migration checksum mismatch: ${filename}. Do not edit an already-applied migration.`
          );
        }

        console.log(`[migration] Already applied: ${filename}`);
        continue;
      }

      const applyMigration = db.transaction(() => {
        db.exec(sql);

        db.prepare(`
          INSERT INTO schema_migrations (filename, checksum)
          VALUES (?, ?)
        `).run(filename, checksum);
      });

      applyMigration();

      console.log(`[migration] Applied: ${filename}`);
    }

    console.log("[migration] All migrations completed.");
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error("[migration] Failed:", error.message);
  process.exitCode = 1;
});
