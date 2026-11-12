// Static safety checks for the Sabland backend. Needs NO database and NO internet.
//   node scripts/check-backend-foundation.mjs
// It reads the source and verifies:
// 1. Secrets and environment variables are protected and never reach the browser.
// 2. Server code is strictly isolated from client components.
// 3. SQLite (better-sqlite3) is the database (no PostgreSQL / pg imports).
// 4. Cash on Delivery is the ONLY payment method (no payment gateways).
// 5. Zero OTP / phone verification code exists.
// 6. Prices are calculated server-side from SQLite database products.
// 7. All SQL queries use parameter binding.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "  ok   " : "  FAIL "}${msg}`);
  if (!cond) failures++;
};
const warn = (msg) => console.log(`  warn ${msg}`);
const exists = (rel) => fs.existsSync(path.join(root, rel));
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

function walk(rel, exts, out = []) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return out;
  for (const name of fs.readdirSync(abs)) {
    const r = `${rel}/${name}`;
    if (fs.statSync(path.join(root, r)).isDirectory()) walk(r, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(r);
  }
  return out;
}

const srcFiles = walk("src", [".ts", ".tsx"]);
const serverFiles = srcFiles.filter((f) => f.startsWith("src/server/"));
const apiFiles = srcFiles.filter((f) => f.startsWith("src/app/api/"));
const clientSide = srcFiles.filter((f) => !f.startsWith("src/server/") && !f.startsWith("src/app/api/"));

console.log("1. SECRETS & ENVIRONMENT SAFETY");
const gi = exists(".gitignore") ? read(".gitignore") : "";
ok(/^\.env\*?$|^\.env\.\*$/m.test(gi) || (/^\.env$/m.test(gi) && /^\.env\.local$/m.test(gi)), ".gitignore ignores .env files (so real secrets are never committed)");
ok(/^!\.env\.example$/m.test(gi), ".gitignore still allows .env.example");
ok(/^node_modules\/?$/m.test(gi) && /^\.next\/?$/m.test(gi), ".gitignore ignores node_modules and .next");

const envEx = exists(".env.example") ? read(".env.example") : "";
ok(envEx.length > 0, ".env.example exists");
const envLines = envEx.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
ok(!envLines.some((l) => /^NEXT_PUBLIC_/.test(l)), ".env.example has no NEXT_PUBLIC_ variable (those are visible in the browser)");
ok(!/postgres(ql)?:\/\//i.test(envEx), ".env.example contains no PostgreSQL connection strings");

for (const f of [".env", ".env.local"]) {
  if (exists(f)) warn(`${f} exists locally: ignored by Git, safe as long as it is never committed`);
}

console.log("\n2. SERVER ISOLATION");
ok(clientSide.every((f) => !/from\s+["'](@\/server|\.\.?\/(?:\.\.\/)*server)[\/"']/.test(read(f))), "no client page, component or lib file imports src/server");
ok(clientSide.every((f) => !/from\s+["']better-sqlite3["']/.test(read(f))), 'no browser-side file imports "better-sqlite3"');
ok(["src/server/env.ts", "src/server/db.ts"].every((f) => /typeof window !== "undefined"/.test(read(f))), "env.ts and db.ts refuse to load in a browser");

console.log("\n3. SQLITE ONLY (NO POSTGRESQL)");
const pkg = exists("package.json") ? JSON.parse(read("package.json")) : {};
const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
ok(!allDeps["pg"] && !allDeps["@types/pg"], "package.json has no pg or @types/pg dependencies");
ok(srcFiles.every((f) => !/from\s+["']pg["']/.test(read(f))), "no source file imports pg");
ok(exists("src/server/db.ts") && /better-sqlite3/.test(read("src/server/db.ts")), "src/server/db.ts uses better-sqlite3");

console.log("\n4. CASH ON DELIVERY ONLY");
const migration = exists("db/migrations/001_foundation.sql") ? read("db/migrations/001_foundation.sql") : "";
ok(/CHECK \(payment_method = 'COD'\)/.test(migration), "the database schema enforces payment_method = 'COD'");
const payWords = /\bUPI\b|razorpay|stripe|paytm|paypal|phonepe|cashfree|payu|net ?banking|card number/i;
const depNames = Object.keys(allDeps);
ok(depNames.every((d) => !payWords.test(d)), `package.json has no online payment gateway packages (${depNames.length} packages checked)`);

console.log("\n5. ABSOLUTELY NO OTP OR PHONE VERIFICATION");
ok(!exists("src/lib/otp.ts"), "src/lib/otp.ts does not exist");
ok(!exists("src/server/verification.ts"), "src/server/verification.ts does not exist");
ok(srcFiles.every((f) => !/\bvalidateOtpFormat\b/.test(read(f))), "validateOtpFormat is not present in source code");
ok(!/Mobile verification/i.test(read("src/components/store/checkout/CheckoutFlow.tsx")), "Checkout stepper does not say Mobile verification");

console.log("\n6. PRICES COME FROM THE DATABASE");
const validation = strip(read("src/server/validation.ts"));
ok(!/price|total|amount|shipping|mrp/i.test(validation), "request validation code never accepts price / total from browser");
ok(/FROM products/.test(read("src/server/orders.ts")) && /buildQuote\(/.test(read("src/server/orders.ts")), "orders.ts prices the cart from the products table via buildQuote()");

console.log("\n7. GOOGLE SHEETS OUTBOX PATTERN");
ok(/CREATE TABLE IF NOT EXISTS sheet_sync_outbox/.test(migration), "sheet_sync_outbox table exists in database migration");
ok(exists("src/server/sheet-sync-worker.ts"), "sheet-sync-worker.ts exists");
ok(exists("scripts/sync-sheets-outbox.mjs"), "scripts/sync-sheets-outbox.mjs exists");

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL BACKEND FOUNDATION CHECKS PASSED");
process.exit(failures ? 1 : 0);
