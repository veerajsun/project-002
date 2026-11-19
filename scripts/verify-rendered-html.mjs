import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("==================================================");
console.log("  Sabaland: Verification of Rendered HTML Pages   ");
console.log("==================================================\n");

const routes = [
  "khalta-500g",
  "khalta-1kg",
  "khalta-250g-course",
  "khalta-250g-direct",
];

const requiredHindiSnippets = [
  // 1. Heading & Overview
  "यमनी हनी खलता क्या है और इसका पारंपरिक महत्व क्या है?",
  "सबलैंड यमनी हनी खलता (Sabland Yemeni Honey Khalta) एक अत्यंत प्रतिष्ठित",
  "बाजार में मिलने वाले कृत्रिम उत्तेजक रसायनों",
  // 2. Feature Cards
  "शुद्ध यमनी पहाड़ी शहद",
  "शारीरिक स्टैमिना व स्फूर्ति",
  "अरब परंपरा की ऐतिहासिक विरासत",
  "100% गोपनीय व सुरक्षित डिलीवरी",
  // 3. Men's Vitality
  "पुरुषों का स्वास्थ्य, आंतरिक स्टैमिना और आत्मविश्वास",
  "आधुनिक जीवनशैली, तनाव और पुरुषों की आम समस्याएं",
  "खलता किस प्रकार प्राकृतिक रूप से सहायक बनता है?",
  // 4. Facts Table
  "उत्पाद का संक्षिप्त परिचय एवं मुख्य विशेषताएं (At a Glance)",
  // 5. How to use
  "सेवन की सही विधि और जिम्मेदार उपयोग",
  "दैनिक उचित मात्रा (Daily Dosage)",
  "गुनगुने दूध का सेवन (With Warm Milk)",
  "नियमितता और स्वस्थ आदतें",
  // 6. Natural Wellness Callout
  "प्राकृतिक पोषण के सिद्धांत को समझें",
  // 7. Medical Disclaimer
  "स्वास्थ्य संबंधी आवश्यक अस्वीकरण एवं सुरक्षा परामर्श (Medical Disclaimer)",
  "दवा नहीं है",
  "पूर्ण इलाज (Cure) का दावा",
];

const requiredEnglishSnippets = [
  "What is Yemeni Honey Khalta?",
  "Pure Mountain Honey",
  "Physical Stamina",
  "Traditional Heritage",
  "100% Discreet Delivery",
  "Intimate Wellness",
  "Product Overview at a Glance",
  "How to Use Responsibly",
  "Understanding Natural Wellness",
  "Medical Disclaimer",
];

let totalChecks = 0;

for (const slug of routes) {
  const htmlPath = path.resolve(`.next/server/app/products/${slug}.html`);
  assert(fs.existsSync(htmlPath), `HTML file missing for ${slug}`);
  const html = fs.readFileSync(htmlPath, "utf-8");

  console.log(`Checking route: /products/${slug}`);

  // Check language tabs
  assert(html.includes("role=\"tablist\""), "Language tabs missing in HTML");
  assert(html.includes("English"), "English tab missing");
  assert(html.includes("हिंदी (Hindi)"), "Hindi tab missing");
  totalChecks++;

  // Check all Hindi sections
  for (const snippet of requiredHindiSnippets) {
    assert(html.includes(snippet), `Missing Hindi snippet in ${slug}: "${snippet}"`);
    totalChecks++;
  }

  // Check all English sections
  for (const snippet of requiredEnglishSnippets) {
    assert(html.includes(snippet), `Missing English snippet in ${slug}: "${snippet}"`);
    totalChecks++;
  }

  // Confirm NO duplicate old English sections below
  assert(!html.includes("About this honey"), `Old duplicate "About this honey" should not exist in ${slug}`);
  assert(!html.includes("A simple ritual for everyday wellness"), `Old duplicate HowToUse section should not exist in ${slug}`);
  totalChecks++;

  console.log(`  ✓ All ${requiredHindiSnippets.length + requiredEnglishSnippets.length + 3} section checks passed for ${slug}`);
}

console.log(`\n==================================================`);
console.log(`  Rendered HTML Checks: ${totalChecks} passed, 0 failed `);
console.log(`==================================================\n`);
