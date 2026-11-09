import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { root, transpile } from "./_db-utils.mjs";

let passed = 0;
let failed = 0;

function ok(condition, message) {
  console.log(`${condition ? "  ok   " : "  FAIL "} ${message}`);
  if (condition) {
    passed++;
  } else {
    failed++;
  }
}

async function main() {
  console.log("\n==================================================");
  console.log("  Sabaland: Phase 4 Tests (Sync Trigger & Scheduler)");
  console.log("==================================================\n");

  try {
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
      "sheets-phase4-tests"
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
    const workerMod = await load("sheet-sync-worker.mjs");

    console.log("--- 1. triggerBackgroundSync Functionality ---");
    ok(typeof workerMod.triggerBackgroundSync === "function", "triggerBackgroundSync is exported as a function");

    // Non-blocking & exception isolation test
    let threwException = false;
    try {
      workerMod.triggerBackgroundSync();
    } catch {
      threwException = true;
    }
    ok(threwException === false, "triggerBackgroundSync executes synchronously without throwing (fire-and-forget)");

    console.log("\n--- 2. Route Integration Verification ---");
    const routeFile = path.join(root, "src", "app", "api", "orders", "route.ts");
    const routeSource = fs.readFileSync(routeFile, "utf8");

    ok(
      routeSource.includes("triggerBackgroundSync"),
      "src/app/api/orders/route.ts imports and calls triggerBackgroundSync"
    );
    ok(
      routeSource.includes("if (!created.replayed)"),
      "triggerBackgroundSync is only called for new orders (!created.replayed)"
    );
    ok(
      /try\s*\{\s*triggerBackgroundSync\(\);\s*\}\s*catch/.test(routeSource),
      "triggerBackgroundSync call is wrapped in try/catch to guarantee zero impact on order placement"
    );

    console.log("\n--- 3. CLI Worker Scheduling Arguments Verification ---");
    const workerCliFile = path.join(root, "scripts", "sync-sheets-outbox.mjs");
    const cliSource = fs.readFileSync(workerCliFile, "utf8");

    ok(cliSource.includes("--interval"), "CLI worker supports --interval flag");
    ok(cliSource.includes("--watch"), "CLI worker supports --watch flag");
    ok(cliSource.includes("Continuous Scheduler"), "CLI worker supports continuous scheduling mode");
    ok(cliSource.includes("One-shot"), "CLI worker supports one-shot cron mode");
    ok(cliSource.includes("SIGINT") && cliSource.includes("SIGTERM"), "CLI worker handles graceful shutdown signals");

    console.log("\n==================================================");
    console.log(`  Phase 4 Tests Completed: ${passed} passed, ${failed} failed`);
    console.log("==================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

main();
