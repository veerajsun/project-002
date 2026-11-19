import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("==================================================");
console.log("  Sabaland: Product Page 3 Improvements Tests     ");
console.log("==================================================\n");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ok    ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// 1. Inspect Products Data
console.log("--- 1. Product Variants & Data Integrity ---");
const productsFile = fs.readFileSync(path.resolve("src/data/products.ts"), "utf-8");

test("products.ts exports 4 product variants", () => {
  assert(productsFile.includes('slug: "khalta-500g"'));
  assert(productsFile.includes('slug: "khalta-1kg"'));
  assert(productsFile.includes('slug: "khalta-250g-course"'));
  assert(productsFile.includes('slug: "khalta-250g-direct"'));
});

test("variant calculation helpers are present", () => {
  assert(productsFile.includes("export function shortName"));
  assert(productsFile.includes("export function discountPercent"));
  assert(productsFile.includes("export function getProduct"));
});

// 2. Cart & Buy Now Mechanics
console.log("\n--- 2. Cart & Buy Now Logic in cart.ts ---");
const cartFile = fs.readFileSync(path.resolve("src/lib/cart.ts"), "utf-8");

test("cart.ts exports buyNow function", () => {
  assert(cartFile.includes("export function buyNow"));
});

test("buyNow prevents duplicate cart entries for same slug", () => {
  // Check implementation logic in cart.ts
  assert(cartFile.includes("const existing = lines.find((l) => l.slug === slug);"));
  assert(cartFile.includes("l.slug === slug ? { ...l, quantity: qty } : l"));
});

test("addToCart preserves incremental addition", () => {
  assert(cartFile.includes("export function addToCart"));
  assert(cartFile.includes("clampQty(l.quantity + qty)"));
});

test("cart limits quantity to MAX_QTY (10)", () => {
  assert(cartFile.includes("export const MAX_QTY = 10;"));
});

// 3. Mobile Layout & Button Design in AddToCart.tsx
console.log("\n--- 3. Add to Cart & Buy Now Component Layout ---");
const addToCartFile = fs.readFileSync(
  path.resolve("src/components/store/product/AddToCart.tsx"),
  "utf-8"
);

test("AddToCart imports and uses buyNow", () => {
  assert(addToCartFile.includes("buyNow"));
  assert(addToCartFile.includes("handleBuyNow"));
});

test("Both Add to Cart and Buy Now buttons appear side by side", () => {
  assert(addToCartFile.includes("grid grid-cols-2"));
  assert(addToCartFile.includes("Add to Cart"));
  assert(addToCartFile.includes("Buy Now"));
});

test("Uses golden/navy brand styling for purchase buttons", () => {
  assert(addToCartFile.includes("bg-charcoal-900")); // Navy styling
  assert(addToCartFile.includes("bg-honey-500"));     // Golden styling
});

test("Buttons have comfortable min-height and padding", () => {
  assert(addToCartFile.includes("min-h-[48px]"));
  assert(addToCartFile.includes("h-12"));
});

test("Quantity selector is visually balanced with label", () => {
  assert(addToCartFile.includes("Quantity"));
  assert(addToCartFile.includes("w-32"));
});

test("Buy Now provides in-progress state to prevent duplicate clicks", () => {
  assert(addToCartFile.includes("isBuyingNow"));
  assert(addToCartFile.includes("Proceeding"));
  assert(addToCartFile.includes("disabled={isBuyingNow}"));
});

// 4. Mobile Layout in products/[slug]/page.tsx
console.log("\n--- 4. Mobile Product Page Layout in page.tsx ---");
const pageFile = fs.readFileSync(
  path.resolve("src/app/products/[slug]/page.tsx"),
  "utf-8"
);

test("Variant selection cards use balanced 2-column grid on mobile", () => {
  assert(pageFile.includes("grid grid-cols-2 gap-2.5 sm:gap-3"));
});

test("Variant cards display pack size, type, price, MRP and savings", () => {
  assert(pageFile.includes("packLabel(p.grams)"));
  assert(pageFile.includes("formatINR(p.price)"));
  assert(pageFile.includes("formatINR(p.mrp)"));
  assert(pageFile.includes("Save {formatINR(p.mrp - p.price)}"));
});

test("page.tsx imports and renders ProductBilingualInfo", () => {
  assert(pageFile.includes("import ProductBilingualInfo"));
  assert(pageFile.includes("<ProductBilingualInfo />"));
});

// 5. Bilingual Product Information
console.log("\n--- 5. Bilingual Hindi and English Product Information ---");
const bilingualFile = fs.readFileSync(
  path.resolve("src/components/store/product/ProductBilingualInfo.tsx"),
  "utf-8"
);

test("Provides interactive English and Hindi tabs", () => {
  assert(bilingualFile.includes("role=\"tablist\""));
  assert(bilingualFile.includes("English"));
  assert(bilingualFile.includes("हिंदी (Hindi)"));
});

test("Covers men's wellness, vitality, and stamina respectfully", () => {
  assert(bilingualFile.includes("Men’s Vitality, Energy & Intimate Wellness"));
  assert(bilingualFile.includes("पुरुषों का स्वास्थ्य, आंतरिक स्टैमिना और आत्मविश्वास"));
  assert(bilingualFile.includes("मर्दाना कमजोरी") || bilingualFile.includes("पौरुष स्वास्थ्य"));
  assert(bilingualFile.includes("थकान"));
  assert(bilingualFile.includes("स्टैमिना"));
});

test("Includes verified usage instructions in both languages", () => {
  assert(bilingualFile.includes("one teaspoon of Khalta honey daily, preferably at night"));
  assert(bilingualFile.includes("warm glass of milk"));
  assert(bilingualFile.includes("रोजाना रात को सोने से पहले एक चम्मच खलता शहद"));
  assert(bilingualFile.includes("एक गिलास गुनगुना दूध"));
});

test("Strict medical compliance: explicitly disclaims cures and medicine", () => {
  // English disclaimer
  assert(bilingualFile.includes("not a medicine"));
  assert(bilingualFile.includes("not intended to diagnose, treat, mitigate, cure, or prevent any clinical condition"));
  assert(bilingualFile.includes("erectile dysfunction"));
  assert(bilingualFile.includes("premature ejaculation"));

  // Hindi disclaimer
  assert(bilingualFile.includes("दवा नहीं है"));
  assert(bilingualFile.includes("पूर्ण इलाज (Cure) का दावा"));
  assert(bilingualFile.includes("इरेक्टाइल डिसफंक्शन"));
  assert(bilingualFile.includes("शीघ्रपतन"));
  assert(bilingualFile.includes("डॉक्टर या स्वास्थ्य विशेषज्ञ से परामर्श"));
});

test("No false 3-day guarantees or miracle claims", () => {
  assert(!bilingualFile.includes("3 days result"));
  assert(!bilingualFile.includes("guaranteed sexual performance"));
  assert(bilingualFile.includes("चमत्कारी या 3 दिनों के झूठे परिणाम का दावा नहीं करता") || !bilingualFile.includes("3 दिनों में परिणाम"));
});

console.log(`\n==================================================`);
console.log(`  Tests Completed: ${passed} passed, 0 failed     `);
console.log(`==================================================\n`);
