
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  connect,
  describeTarget,
  loadEnv,
  transpile,
} from "./_db-utils.mjs";

let passed = 0;
let failed = 0;

const ok = (condition, message) => {
  console.log(`${condition ? "  ok   " : "  FAIL "}${message}`);
  condition ? passed++ : failed++;
};

async function main() {
  let load;
  await loadEnv();

  // Use an isolated temporary database so real shop data is untouched.
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "sabaland-selftest-")
  );

  process.env.SQLITE_DB_PATH = path.join(tempDir, "selftest.db");

  let db;

  try {
    const dbPath = path.resolve(process.env.SQLITE_DB_PATH);
    const migration = fs.readFileSync(
      path.join(process.cwd(), "db/migrations/001_foundation.sql"),
      "utf8"
    );

    const outDir = await transpile(
      [
        "src/server/constants.ts",
        "src/server/pricing.ts",
        "src/server/env.ts",
        "src/server/db.ts",
        "src/server/orders.ts",
        "src/server/products.ts",
      ],
      "sabland-selftest"
    );

    const compiledFiles = fs.readdirSync(outDir)
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

   load = (name) =>
  import(pathToFileURL(path.join(outDir, name)).href);

    // Import repository after setting SQLITE_DB_PATH.
    const { placeOrder, getOrderByNumber, OrderError } =
      await load("orders.mjs");

    const {
      listActiveProducts,
      getPurchasableProductsBySlugs,
    } = await load("products.mjs");

    db = await connect();

    console.log("Database:", describeTarget());
    console.log("Isolated test database:", dbPath, "\n");

    db.exec(migration);

    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, slug, name, description, pack_grams,
        price_paise, mrp_paise, stock, is_available,
        sort_order, created_at, updated_at
      )
      VALUES (?, ?, ?, '', ?, ?, ?, 10, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const slugA = `selftest-a-${randomUUID()}`;
    const slugB = `selftest-b-${randomUUID()}`;
    const productA = randomUUID();
    const productB = randomUUID();

    console.log("DATABASE RULES");

    insertProduct.run(
      productA, slugA, "Selftest Honey A",
      500, 100000, 120000, 1, 1, now, now
    );

    insertProduct.run(
      productB, slugB, "Selftest Honey B",
      250, 50000, 60000, 1, 2, now, now
    );

    ok(
      db.prepare("SELECT COUNT(*) AS n FROM products").get().n === 2,
      "two test products inserted"
    );

    try {
      insertProduct.run(
        randomUUID(), slugA, "Duplicate",
        500, 1000, 1200, 1, 3, now, now
      );
      ok(false, "duplicate product slug must be rejected");
    } catch (error) {
      ok(
        error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
        error.code === "SQLITE_CONSTRAINT_UNIQUE",
        "duplicate product slug rejected"
      );
    }

    console.log("\nREAL REPOSITORY CODE (placeOrder / getOrderByNumber / products)");

    const address = {
      fullName: "Aria Mehta",
      mobile: "9811111111",
      house: "Flat 402",
      street: "MG Road",
      landmark: "",
      city: "Bengaluru",
      state: "Karnataka",
      pin: "560038",
    };

    const items = [
      { slug: slugA, quantity: 2 },
      { slug: slugB, quantity: 1 },
    ];

    const key = `selftest-${randomUUID()}`;

    const input = (idempotencyKey, orderItems = items, orderAddress = address) => ({
      items: orderItems,
      address: orderAddress,
      idempotencyKey,
    });

    const created = await placeOrder(input(key));

    const queryable = {
  query: async (text, params = []) => {
    const statement = db.prepare(text);

    if (statement.reader) {
      const rows = statement.all(...params);
      return {
        rows,
        rowCount: rows.length,
      };
    }

    const result = statement.run(...params);

    return {
      rows: [],
      rowCount: result.changes,
    };
  },
};

    ok(
      created.totalPaise === 250000 &&
      created.replayed === false &&
      /^SBL-\d{4}-\d{6}$/.test(created.orderNumber),
      "COD order created with server-calculated total of 250000 paise"
    );

    const details = await getOrderByNumber(
  queryable,
  created.orderNumber
);
    
    ok(
      details &&
      details.paymentMethod === "COD" &&
      details.status === "NEW" &&
      details.customerPhone === address.mobile,
      "order saved with COD payment and NEW status"
    );

    ok(
      details.items.length === 2 &&
      details.subtotalPaise === 250000 &&
      details.savingsPaise === 50000 &&
      details.shippingPaise === 0,
      "order items and totals saved correctly"
    );

    ok(
      details.address &&
      details.address.pinCode === "560038" &&
      details.address.city === "Bengaluru",
      "delivery address saved correctly"
    );

    const event = db.prepare(`
      SELECT COUNT(*) AS n
      FROM order_status_events
      WHERE order_id = ?
    `).get(created.orderId);

    ok(event.n === 1, "NEW order status event recorded");

    const outbox = db.prepare(`
      SELECT status, payload_json
      FROM sheet_sync_outbox
      WHERE order_id = ?
    `).get(created.orderId);

    ok(
      outbox?.status === "PENDING" &&
      JSON.parse(outbox.payload_json).orderNumber === created.orderNumber,
      "Google Sheets sync outbox event saved as PENDING"
    );

    const replay = await placeOrder(input(key));

    ok(
      replay.replayed === true &&
      replay.orderNumber === created.orderNumber,
      "same request returns the original order"
    );

    const orderCount = db.prepare(`
      SELECT COUNT(*) AS n
      FROM orders
      WHERE idempotency_key = ?
    `).get(key);

    ok(orderCount.n === 1, "idempotency prevents duplicate orders");

    try {
      await placeOrder(
        input(key, [{ slug: slugA, quantity: 1 }])
      );
      ok(false, "changed payload with same key must be rejected");
    } catch (error) {
      ok(
        error instanceof OrderError &&
        error.code === "IDEMPOTENCY_CONFLICT",
        "changed payload with same idempotency key rejected"
      );
    }

    // Change database price and verify repository uses the new price.
    db.prepare(`
      UPDATE products
      SET price_paise = 90000, mrp_paise = 120000
      WHERE slug = ?
    `).run(slugA);

    const repriced = await placeOrder(
      input(`selftest-${randomUUID()}`, [
        { slug: slugA, quantity: 1 },
      ])
    );

    ok(
      repriced.totalPaise === 90000,
      "order price is read from the database, not the browser"
    );

    // Mark the second product unavailable and verify it cannot be ordered.
db.prepare(`
  UPDATE products
  SET is_available = 0
  WHERE slug = ?
`).run(slugB);

try {
  await placeOrder(
    input(`selftest-${randomUUID()}`, [
      { slug: slugB, quantity: 1 },
    ])
  );
  ok(false, "unavailable product must be rejected");
} catch (error) {
  ok(
    error.code === "PRODUCT_UNAVAILABLE",
    "unavailable product cannot be ordered"
  );
}

// Verify product listing and purchasable products.
const listed = await listActiveProducts(queryable);

ok(
  listed.some(
    (p) =>
      p.slug === slugA &&
      p.pricePaise === 90000 &&
      Array.isArray(p.images)
  ),
  "listActiveProducts returns products with paise prices"
);

const purchasable = await getPurchasableProductsBySlugs(
  [slugA, slugB],
  queryable
);

ok(
  purchasable.length === 1 &&
    purchasable[0].slug === slugA,
  "unavailable product is excluded from purchasable products"
);
  } finally {
    if (db) db.close();

    // Also close the repository's shared SQLite connection.
    const databaseModule = await load("db.mjs").catch(() => null);
    databaseModule?.getDatabase()?.close();

    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(
    failed
      ? `\n${failed} CHECK(S) FAILED, ${passed} passed. Send me the FAIL lines.`
      : `\nALL ${passed} DATABASE CHECKS PASSED`
  );

  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Self-test could not finish:", error);
  process.exitCode = 1;
});
