import { google } from "googleapis";
import { loadEnv } from "./_db-utils.mjs";

async function main() {
  await loadEnv();

  console.log("\n==================================================");
  console.log("  Sabaland: Google Sheets Connection Test (Read-only)");
  console.log("==================================================\n");

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME?.trim() || "Orders";

  const missing = [];
  if (!email) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!rawKey) missing.push("GOOGLE_PRIVATE_KEY");
  if (!sheetId) missing.push("GOOGLE_SHEET_ID");

  if (missing.length > 0) {
    console.error("❌ Configuration Incomplete:");
    console.error(`   Missing environment variable(s): ${missing.join(", ")}`);
    console.error("\n   Please configure these in your local .env.local file.");
    console.error("   (Refer to .env.example for required variable formats)\n");
    process.exit(1);
  }

  // Mask email for safe terminal output
  const maskedEmail =
    email.length > 6
      ? `${email.slice(0, 3)}...${email.slice(email.indexOf("@"))}`
      : "[Configured]";

  console.log(`✓ Service Account Email : ${maskedEmail}`);
  console.log(`✓ Private Key           : [Configured - ${rawKey.length} characters]`);
  console.log(`✓ Spreadsheet ID        : ${sheetId.slice(0, 6)}...${sheetId.slice(-4)}`);
  console.log(`✓ Target Tab Name       : "${tabName}"`);
  console.log("\nAuthenticating with Google APIs...");

  // Sanitize private key: handle escaped \n sequences and outer quotes
  const unquotedKey = rawKey.replace(/^["']|["']$/g, "");
  const privateKey = unquotedKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    console.log("Fetching spreadsheet metadata (read-only)...");
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "properties.title,sheets.properties(sheetId,title)",
    });

    const title = response.data.properties?.title || "(Untitled)";
    const sheetsList = response.data.sheets || [];
    const sheetTitles = sheetsList.map((s) => s.properties?.title).filter(Boolean);

    console.log("\n✅ Connection Successful!");
    console.log(`   Spreadsheet Title : "${title}"`);
    console.log(`   Available Tabs    : [${sheetTitles.map((t) => `"${t}"`).join(", ")}]`);

    const hasTargetTab = sheetTitles.includes(tabName);
    if (hasTargetTab) {
      console.log(`   Target Tab Status : Found "${tabName}" tab.`);
    } else {
      console.warn(`   ⚠️ Target Tab Warning: Tab "${tabName}" was not found.`);
      console.warn(`   Please create a tab named "${tabName}" in the spreadsheet, or update GOOGLE_SHEET_TAB_NAME.`);
    }

    console.log("\nZero rows were modified (read-only test).\n");
  } catch (error) {
    console.error("\n❌ Connection Failed:");
    if (error.code === 403 || error.status === 403) {
      console.error("   Permission Denied (403):");
      console.error("   Ensure your Google Sheet is shared with your Service Account email as 'Editor'.");
    } else if (error.code === 404 || error.status === 404) {
      console.error("   Spreadsheet Not Found (404):");
      console.error("   Please verify that GOOGLE_SHEET_ID is correct.");
    } else {
      console.error(`   ${error.message || error}`);
    }
    console.error("");
    process.exit(1);
  }
}

main();
