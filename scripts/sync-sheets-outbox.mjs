import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv, transpile } from "./_db-utils.mjs";

async function loadServerModules() {
  const outDir = await transpile(
    [
      "src/server/constants.ts",
      "src/server/pricing.ts",
      "src/server/env.ts",
      "src/server/db.ts",
      "src/server/sheets-mapper.ts",
      "src/server/sheets-client.ts",
      "src/server/sheet-sync-worker.ts",
    ],
    "sheets-worker"
  );

  const compiledFiles = fs
    .readdirSync(outDir)
    .filter((file) => file.endsWith(".mjs"));

  for (const file of compiledFiles) {
    const filePath = path.join(outDir, file);
    const source = fs.readFileSync(filePath, "utf8");
    const fixed = source.replace(
      /(["'])(\.{1,2}\/[^"']+?)(["'])/g,
      (match, quote, specifier, endQuote) => {
        if (path.extname(specifier)) return match;
        return `${quote}${specifier}.mjs${endQuote}`;
      }
    );
    fs.writeFileSync(filePath, fixed);
  }

  const load = (name) => import(pathToFileURL(path.join(outDir, name)).href);

  const envMod = await load("env.mjs");
  const workerMod = await load("sheet-sync-worker.mjs");

  return { envMod, workerMod };
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  let intervalSec = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--interval" || args[i] === "-i") {
      const val = parseInt(args[i + 1], 10);
      if (!isNaN(val) && val > 0) {
        intervalSec = val;
      }
      i++;
    } else if (args[i] === "--watch" || args[i] === "-w") {
      intervalSec = intervalSec || 60;
    }
  }

  return { intervalSec };
}

async function runSingleBatch(syncOutboxBatch, silentIfEmpty = false) {
  const startTime = Date.now();
  const result = await syncOutboxBatch();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (silentIfEmpty && result.processed === 0) {
    return result;
  }

  console.log(`[${new Date().toISOString()}] Batch completed in ${duration}s:`);
  console.log(`  Processed : ${result.processed}`);
  console.log(`  Synced    : ${result.synced}`);
  console.log(`  Skipped   : ${result.skipped} (already recorded in sheet)`);
  console.log(`  Failed    : ${result.failed}`);

  if (result.details.length > 0) {
    for (const item of result.details) {
      if (item.status === "SYNCED") {
        console.log(`    ✓ ${item.orderNumber}: Synced successfully`);
      } else if (item.status === "SKIPPED_DUPLICATE") {
        console.log(`    ↷ ${item.orderNumber}: Skipped (already in Google Sheets)`);
      } else if (item.status === "FAILED") {
        console.error(`    ✗ ${item.orderNumber}: Failed - ${item.error}`);
      }
    }
  }
  console.log("");
  return result;
}

async function main() {
  await loadEnv();

  console.log("\n==================================================");
  console.log("  Sabaland: Google Sheets Outbox Sync Worker");
  console.log("==================================================\n");

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME?.trim() || "Orders";

  if (!email || !rawKey || !sheetId) {
    console.warn("⚠️  Google Sheets configuration is incomplete in .env.local.");
    console.warn("   Required: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID.");
    console.warn("   Sync run skipped.\n");
    process.exit(0);
  }

  const { workerMod } = await loadServerModules();
  const { acquireWorkerLock, syncOutboxBatch, LockAcquisitionError } = workerMod;

  let releaseLock;
  try {
    releaseLock = acquireWorkerLock();
  } catch (err) {
    if (err instanceof LockAcquisitionError) {
      console.log(`ℹ️  ${err.message}`);
      console.log("   Exiting cleanly to prevent overlapping execution.\n");
      process.exit(0);
    }
    throw err;
  }

  const { intervalSec } = parseCliArgs();

  try {
    const maskedEmail =
      email.length > 6
        ? `${email.slice(0, 3)}...${email.slice(email.indexOf("@"))}`
        : "[Configured]";

    console.log(`Target Spreadsheet : ${sheetId.slice(0, 6)}...${sheetId.slice(-4)}`);
    console.log(`Target Tab Name    : "${tabName}"`);
    console.log(`Service Account    : ${maskedEmail}`);

    if (intervalSec) {
      console.log(`Mode               : Continuous Scheduler (every ${intervalSec} seconds)`);
      console.log("Press Ctrl+C to terminate cleanly.\n");

      let keepRunning = true;
      const shutdown = () => {
        if (!keepRunning) return;
        keepRunning = false;
        console.log("\nReceived shutdown signal. Stopping scheduler cleanly...");
      };
      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);

      while (keepRunning) {
        try {
          await runSingleBatch(syncOutboxBatch, false);
        } catch (batchErr) {
          console.error("Batch error during scheduler tick:", batchErr.message || batchErr);
        }

        if (!keepRunning) break;
        await new Promise((resolve) => setTimeout(resolve, intervalSec * 1000));
      }
    } else {
      console.log("Mode               : One-shot (CLI / Cron)\n");
      await runSingleBatch(syncOutboxBatch, false);
    }
  } catch (error) {
    console.error("❌ Outbox Sync encountered an unhandled error:");
    console.error(`   ${error.message || error}\n`);
    process.exit(1);
  } finally {
    if (releaseLock) releaseLock();
  }
}

main();
