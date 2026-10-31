// Static safety checks for the backend. Needs NO database and NO internet.
//   node scripts\check-backend-foundation.mjs
// It reads the source and fails if a secret could reach the browser, if SQL is built from text,
// if a payment gateway appears, if the phone-verification gate was weakened, or if the SQL in the
// code uses a table/column that the migration does not define.
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

console.log("SECRETS");
const gi = exists(".gitignore") ? read(".gitignore") : "";
ok(/^\.env\*?$|^\.env\.\*$/m.test(gi) || (/^\.env$/m.test(gi) && /^\.env\.local$/m.test(gi)), ".gitignore ignores .env files (so real secrets are never committed)");
ok(/^!\.env\.example$/m.test(gi), ".gitignore still allows .env.example");
ok(/^node_modules\/?$/m.test(gi) && /^\.next\/?$/m.test(gi), ".gitignore ignores node_modules and .next");
const envEx = exists(".env.example") ? read(".env.example") : "";
ok(envEx.length > 0, ".env.example exists");
const envLines = envEx.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
ok(envLines.every((l) => /=\s*(""|''|"?[^"\s]*(USER|PASSWORD|change-me|localhost|example)[^"\s]*"?|"http:\/\/localhost:\d+")\s*$/i.test(l)), ".env.example holds only placeholders / local examples, no real values");
ok(!/postgres(ql)?:\/\/[^:\s"]+:(?![^@\s"]*PASSWORD)[^@\s"]+@/i.test(envEx), ".env.example has no real database password (only placeholders such as PASSWORD)");
ok(!envLines.some((l) => /^NEXT_PUBLIC_/.test(l)), ".env.example has no NEXT_PUBLIC_ variable (those are visible in the browser)");
for (const f of [".env", ".env.local"]) if (exists(f)) warn(`${f} exists on this PC: fine, as long as it is never uploaded or shared`);

console.log("\nSERVER CODE NEVER REACHES THE BROWSER");
ok(clientSide.every((f) => !/from\s+["'](@\/server|\.\.?\/(?:\.\.\/)*server)[\/"']/.test(read(f))), "no page, component or lib file imports src/server");
ok(clientSide.every((f) => !/from\s+["']pg["']/.test(read(f))), 'no browser-side file imports "pg"');
ok(srcFiles.filter((f) => f !== "src/server/db.ts").every((f) => !/from\s+["']pg["']/.test(read(f))), 'only src/server/db.ts imports "pg"');
ok(srcFiles.every((f) => !/process\.env\.DATABASE_URL/.test(read(f)) || f === "src/server/env.ts"), "only src/server/env.ts reads DATABASE_URL");
ok(serverFiles.filter((f) => f !== "src/server/env.ts").every((f) => !/process\.env/.test(strip(read(f)))), "no other server file reads process.env directly");
const publicVars = new Set(srcFiles.flatMap((f) => [...read(f).matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)].map((m) => m[0])));
ok([...publicVars].every((v) => v === "NEXT_PUBLIC_CHECKOUT_PREVIEW"), `the only browser-visible variable is NEXT_PUBLIC_CHECKOUT_PREVIEW (found: ${[...publicVars].join(", ") || "none"})`);
ok(["src/server/env.ts", "src/server/db.ts"].every((f) => /typeof window !== "undefined"/.test(read(f))), "env.ts and db.ts refuse to load in a browser");
ok(apiFiles.filter((f) => f.endsWith("route.ts")).every((f) => /export const runtime = "nodejs"/.test(read(f))), 'every API route runs on the Node.js runtime (needed for "pg")');

console.log("\nSQL SAFETY");
const sqlFiles = [...serverFiles, ...apiFiles];
let sqlStrings = [];
for (const f of sqlFiles) {
  const code = read(f);
  for (const m of code.matchAll(/\.query(?:<[^>]*>)?\(\s*(`[^`]*`|"[^"]*"|'[^']*')/g)) sqlStrings.push({ f, sql: m[1].slice(1, -1) });
}
ok(sqlStrings.length > 5, `found ${sqlStrings.length} SQL statements to inspect`);
ok(sqlStrings.every((s) => !s.sql.includes("${")), "no SQL text is built from variables (all values travel as $1, $2... parameters)");
const nonLiteralCalls = sqlFiles
  .filter((f) => f !== "src/server/db.ts")
  .flatMap((f) => [...strip(read(f)).matchAll(/(?<![\w$])(?:\.)?query\s*(?:<[^()]*?>)?\s*\(\s*([^\s`"'])/g)].map((m) => `${f}: query(${m[1]}...)`));
ok(nonLiteralCalls.length === 0, nonLiteralCalls.length ? `SQL passed as a variable/expression: ${nonLiteralCalls.join("; ")}` : "every query() receives a fixed SQL string (no SQL assembled in code)");

console.log("\nCASH ON DELIVERY ONLY");
const migration = exists("db/migrations/001_foundation.sql") ? read("db/migrations/001_foundation.sql") : "";
ok(/CHECK \(payment_method = 'COD'\)/.test(migration), "the database itself only allows payment_method = 'COD'");
const payWords = /\bUPI\b|razorpay|stripe|paytm|paypal|phonepe|cashfree|payu|wallet|net ?banking|debit card|credit card|payment gateway|card number/i;
const pkg = exists("package.json") ? JSON.parse(read("package.json")) : {};
const depNames = Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) });
ok(depNames.every((d) => !payWords.test(d)), `package.json has no payment-gateway package (${depNames.length} packages checked)`);
ok([...sqlFiles, ...walk("db", [".sql"])].every((f) => !payWords.test(strip(read(f)))), "no online-payment gateway wording in the backend code or SQL");

console.log("\nPHONE VERIFICATION GATE");
const ver = strip(read("src/server/verification.ts"));
ok(/return null;/.test(ver) && !/return\s*\{/.test(ver) && !/verificationId\s*:(?!\s*string\b)/.test(ver), "verification.ts ALWAYS returns null (no way to produce a proof yet)");
const ordersRoute = read("src/app/api/orders/route.ts");
ok(ordersRoute.indexOf("getVerifiedPhone(") !== -1 && ordersRoute.indexOf("getVerifiedPhone(") < ordersRoute.indexOf("readJsonBody("), "POST /api/orders checks the verification BEFORE it reads the request");
ok(/PHONE_VERIFICATION_UNAVAILABLE/.test(ordersRoute) && /503/.test(ordersRoute), "POST /api/orders answers 503 PHONE_VERIFICATION_UNAVAILABLE without a proof");
const importsFromOrders = (name) => srcFiles.filter((f) => new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["'](@/server/orders|\\./orders)["']`).test(read(f)));
ok(importsFromOrders("createOrder").length === 0 && (strip(read("src/server/orders.ts")).match(/\bcreateOrder\(/g) ?? []).length === 3, "createOrder() is not imported anywhere (only orders.ts itself uses it)");
ok(JSON.stringify(importsFromOrders("placeOrder")) === JSON.stringify(["src/app/api/orders/route.ts"]), "placeOrder() is imported by the orders route and nothing else");
ok(/verification_id\s+uuid NOT NULL UNIQUE REFERENCES phone_verifications/.test(migration), "the orders table cannot hold a row without a phone verification (NOT NULL + UNIQUE + FOREIGN KEY)");
ok(/status = 'VERIFIED'/.test(read("src/server/orders.ts")) && /consumed_at IS NULL/.test(read("src/server/orders.ts")) && /expires_at > now\(\)/.test(read("src/server/orders.ts")), "createOrder() only accepts a VERIFIED, unused, unexpired verification");

console.log("\nPRICES COME FROM THE DATABASE");
const validation = strip(read("src/server/validation.ts"));
ok(!/price|total|amount|shipping|mrp/i.test(validation), "request validation code never mentions price / total / amount / shipping (the browser only says WHICH product and HOW MANY)");
ok(/FROM products/.test(read("src/server/orders.ts")) && /buildQuote\(/.test(read("src/server/orders.ts")), "createOrder() prices the cart from the products table via buildQuote()");

console.log("\nSCHEMA vs CODE (every table/column used in SQL exists in the migration)");
const tables = new Map();
for (const m of migration.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\n\);/g)) {
  const cols = new Set();
  for (const line of m[2].split("\n")) {
    const col = line.trim().match(/^([a-z_][a-z0-9_]*)\s/);
    if (col) cols.add(col[1]);
  }
  tables.set(m[1], cols);
}
ok(["products", "product_images", "phone_verifications", "orders", "order_items", "delivery_addresses", "order_status_events"].every((t) => tables.has(t)), `migration defines: ${[...tables.keys()].join(", ")}`);
let schemaProblems = [];
for (const { f, sql } of sqlStrings) {
  const s = sql.replace(/\s+/g, " ").trim();
  for (const m of s.matchAll(/\b(?:FROM|JOIN|UPDATE|INSERT INTO)\s+([a-z_]+)/g))
    if (!tables.has(m[1]) && !["information_schema"].includes(m[1])) schemaProblems.push(`${f}: unknown table "${m[1]}"`);
  const ins = s.match(/^INSERT INTO ([a-z_]+) \(([^)]*)\)/);
  if (ins && tables.has(ins[1])) for (const c of ins[2].split(",").map((x) => x.trim())) if (!tables.get(ins[1]).has(c)) schemaProblems.push(`${f}: ${ins[1]} has no column "${c}"`);
  const upd = s.match(/^UPDATE ([a-z_]+) SET (.*?) WHERE/);
  if (upd && tables.has(upd[1])) for (const a of upd[2].split(/,\s*(?=[a-z_]+\s*=)/)) { const c = a.trim().split(/\s*=/)[0]; if (!tables.get(upd[1]).has(c)) schemaProblems.push(`${f}: ${upd[1]} has no column "${c}"`); }
  const sel = s.match(/^SELECT ([a-z_, ]+) FROM ([a-z_]+)(?: WHERE| ORDER|$)/);
  if (sel && tables.has(sel[2])) for (const c of sel[1].split(",").map((x) => x.trim())) if (c && !tables.get(sel[2]).has(c)) schemaProblems.push(`${f}: ${sel[2]} has no column "${c}"`);
}
ok(schemaProblems.length === 0, schemaProblems.length ? schemaProblems.join("; ") : "all tables and columns used in the code's SQL exist in the migration");

console.log("\nSETUP");
if (!exists("node_modules/pg")) warn('the "pg" package is not installed yet: run  npm.cmd install pg@8  and  npm.cmd install -D @types/pg@8');
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL BACKEND FOUNDATION CHECKS PASSED");
process.exit(failures ? 1 : 0);
