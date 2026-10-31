// Checks that NO fake phone number / fake OTP can ever produce a "verified" result.
//
// Run from the project folder (needs nothing new, it uses the project's own `typescript`):
//     node scripts\check-checkout-verification.mjs
//
// Part 1 runs the real src/lib/otp.ts against many fake inputs.
// Part 2 scans the checkout source for fake-verification patterns.
// It exits with an error code if anything fails.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "  ok   " : "  FAIL "}${msg}`);
  if (!cond) failures++;
};

/* ---------- Part 1: run the real verification code ---------- */
console.log("PART 1: fake inputs must never verify");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sabaland-check-"));
for (const name of ["checkout", "otp"]) {
  const src = fs.readFileSync(path.join(root, "src", "lib", `${name}.ts`), "utf8");
  let js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  js = js.replace(/from\s+["']\.\/(\w+)["']/g, 'from "./$1.mjs"');
  fs.writeFileSync(path.join(tmp, `${name}.mjs`), js);
}
const otp = await import(pathToFileURL(path.join(tmp, "otp.mjs")).href);
const gate = await import(pathToFileURL(path.join(tmp, "checkout.mjs")).href);

const demoOtps = ["123456", "000000", "111111", "222222", "654321", "999999", "123123", "121212", "696969", "246810", "135790", "112233"];
const mobiles = ["9876543210", "9999999999", "6000000000", "7012345678", "8888888888", "9123456789", "9000000000"];
const allowedKeys = new Set(["ok", "reason", "message"]);
const clean = (r) => r && r.ok === false && Object.keys(r).every((k) => allowedKeys.has(k));

let badVerify = 0;
for (const m of mobiles) for (const c of demoOtps) {
  const r = await otp.verifyOtp(m, c);
  if (!(clean(r) && r.reason === "unavailable")) badVerify++;
}
ok(badVerify === 0, `${mobiles.length * demoOtps.length} combinations of hardcoded numbers x fixed/demo OTPs: none verified`);

let badRandom = 0;
for (let i = 0; i < 3000; i++) {
  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  const r = await otp.verifyOtp("9876543210", code);
  if (!(clean(r) && r.reason === "unavailable")) badRandom++;
}
ok(badRandom === 0, "3000 random 6-digit codes: none verified");

const parallel = await Promise.all(Array.from({ length: 100 }, (_, i) => otp.verifyOtp("9876543210", String(100000 + i))));
ok(parallel.every((r) => r.ok === false), "100 simultaneous verify calls: none verified");

for (const m of ["", "123", "12345678901", "5876543210", "abcdefghij", "+919876543210", " 9876543210", "98765 43210"]) {
  const r = await otp.verifyOtp(m, "123456");
  if (!(clean(r) && r.reason === "invalid-mobile")) ok(false, `invalid mobile ${JSON.stringify(m)} must be rejected as invalid-mobile (got ${JSON.stringify(r)})`);
}
ok(true, "invalid mobile numbers are rejected before anything else");

for (const c of ["", "12345", "1234567", "12345a", " 123456", "123 456", "١٢٣٤٥٦"]) {
  const r = await otp.verifyOtp("9876543210", c);
  if (!(clean(r) && r.reason === "invalid-otp-format")) ok(false, `invalid code ${JSON.stringify(c)} must be rejected as invalid-otp-format (got ${JSON.stringify(r)})`);
}
ok(true, "malformed codes are rejected as invalid-otp-format");

for (const m of mobiles) {
  const r = await otp.sendOtp(m);
  if (!(clean(r) && r.reason === "unavailable" && /No SMS was sent/.test(r.message))) ok(false, `sendOtp(${m}) must say no SMS was sent`);
}
ok(true, "sendOtp never claims an SMS was sent");

const sample = await otp.verifyOtp("9876543210", "123456");
ok(sample.message.includes("Phone verification is not available yet. Checkout is in preview mode; no order can be placed."), "the required 'not available yet' message is returned");
ok(!("token" in sample) && !("verified" in sample), "result carries no token / verified flag");

// The gate that decides which step is shown: exhaustive test of every combination.
let gateBad = 0;
let gateCases = 0;
for (const access of ["none", "preview", "verified"])
  for (const previewAllowed of [true, false])
    for (const mobileOk of [true, false])
      for (const addressOk of [true, false])
        for (const requested of [1, 2, 3]) {
          gateCases++;
          const s = gate.effectiveStep(requested, { access, previewAllowed, mobileOk, addressOk });
          const open = access === "verified" || (access === "preview" && previewAllowed);
          let want = requested;
          if (!open) want = 1;
          else if (requested >= 2 && !mobileOk) want = 1;
          else if (requested === 3 && !addressOk) want = 2;
          if (s !== want) gateBad++;
          if (!open && s !== 1) gateBad++; // never beyond Step 1 without access
        }
ok(gateBad === 0, `${gateCases} gate combinations: without a verified phone (or the dev preview) Step 1 is always shown`);
const tampered = ["VERIFIED", "verified ", "true", true, 1, null, undefined, "", "admin", {}];
ok(tampered.every((a) => gate.isFlowOpen(a, true) === false && gate.isFlowOpen(a, false) === false), "unknown / tampered access values never open the flow");
ok(gate.isFlowOpen("none", true) === false && gate.isFlowOpen("preview", false) === false, "no access, or preview switched off -> closed");

/* ---------- Part 2: scan the source ---------- */
console.log("\nPART 2: source must not contain fake-verification patterns");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
const checkoutDir = path.join(root, "src", "components", "store", "checkout");
const uiFiles = fs.readdirSync(checkoutDir).filter((f) => f.endsWith(".tsx")).map((f) => `src/components/store/checkout/${f}`);
const files = ["src/lib/otp.ts", "src/lib/checkout.ts", ...uiFiles];

const forbidden = [
  [/\b(DEMO|FAKE|TEST|MOCK|BYPASS|SKIP)_?(OTP|CODE|VERIF\w*)\b/i, "demo / fake / bypass verification constant"],
  [/\b(otp|code)\s*[!=]==?\s*["'`]\d+["'`]/i, "OTP compared with a hard-coded code"],
  [/["'`]\d{4,8}["'`]\s*[!=]==?\s*(otp|code)\b/i, "hard-coded code compared with OTP"],
  [/\.includes\(\s*otp\s*\)/i, "OTP looked up in a list"],
  [/Math\.random|crypto\.getRandomValues|crypto\.randomUUID/, "random value generation"],
  [/\b(orderId|order_id|ORD-|uuid|nanoid)\b|Date\.now\(\)/, "order ID generation"],
  [/\bfetch\(|XMLHttpRequest|sendBeacon/, "network call (no real service exists yet)"],
  [/verified\s*[:=]\s*true/i, "verified set to true"],
  [/localStorage\.setItem/, "localStorage write in checkout code"],
];
for (const f of files) {
  const code = stripComments(read(f));
  for (const [re, label] of forbidden) ok(!re.test(code), `${f}: no ${label}`);
}

const otpSrc = read("src/lib/otp.ts");
const okTrueLines = otpSrc.split("\n").filter((l) => !/^\s*\/\//.test(l) && l.includes("ok: true"));
ok(okTrueLines.length > 0 && okTrueLines.every((l) => /^\s*\|\s*\{ ok: true \}\s*$/.test(l)), "otp.ts: `ok: true` appears only inside type declarations, never in a return");
ok(!/return\s*\{\s*ok:\s*true/.test(stripComments(otpSrc)), "otp.ts: no function returns a successful result");

const contact = read("src/components/store/checkout/StepContact.tsx");
const calls = [...contact.matchAll(/^\s*onVerified\(/gm)];
ok(calls.length === 1, "StepContact: onVerified() is called exactly once");
const before = contact.slice(0, calls[0]?.index ?? 0).split("\n").slice(-4).join("\n");
ok(/if \(result\.ok\)/.test(before), "StepContact: that call sits directly inside `if (result.ok)`");
ok(!/onEnterPreview\([^)]*\)\s*;?[\s\S]{0,40}onVerified/.test(contact), "StepContact: preview never calls onVerified");

const flow = read("src/components/store/checkout/CheckoutFlow.tsx");
ok(/useState<Access>\("none"\)/.test(flow), 'CheckoutFlow: access starts as "none" on every load');
const verifiedGrants = [...flow.matchAll(/openFlow\([^)]*"verified"\)/g)];
ok(verifiedGrants.length === 1 && /onVerified=\{\(mobile\) => openFlow\(mobile, "verified"\)\}/.test(flow), 'CheckoutFlow: "verified" access is granted only from onVerified');
ok(!/(sessionStorage|localStorage)[\s\S]{0,80}access/.test(flow) && !/loadDraft\(\)[\s\S]{0,60}setAccess/.test(flow), "CheckoutFlow: access is never read from storage");
ok(/effectiveStep\(\s*draft\.step/.test(flow) && !/let step\b/.test(flow), "CheckoutFlow: the shown step always comes from effectiveStep(), with no own shortcut");
ok(/isFlowOpen\(access, CHECKOUT_PREVIEW_ALLOWED\)/.test(flow), "CheckoutFlow: the preview banner / flow state use isFlowOpen()");

const lib = read("src/lib/checkout.ts");
const draftType = lib.match(/export type Draft = \{[\s\S]*?\n\};/)?.[0] ?? "";
ok(draftType.length > 0 && !/verif/i.test(draftType), "checkout.ts: the saved draft has no verification field (nothing to tamper with)");
ok(!/verif/i.test(lib.slice(lib.indexOf("const DRAFT_KEY"))), "checkout.ts: storage code never mentions verification");
ok((stripComments(lib).match(/NEXT_PUBLIC_CHECKOUT_PREVIEW/g) ?? []).length === 1, "checkout.ts: the preview switch is defined in one place only");

const review = read("src/components/store/checkout/StepReview.tsx");
const previewBranch = review.slice(review.indexOf('mode === "preview" ? ('), review.indexOf("<>"));
ok(previewBranch.length > 50 && !/placeOrder/.test(previewBranch) && /Place order unavailable \(preview\)/.test(previewBranch), "StepReview: in preview mode Place order is disabled and cannot call placeOrder()");

fs.rmSync(tmp, { recursive: true, force: true });
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL VERIFICATION CHECKS PASSED");
process.exit(failures ? 1 : 0);
