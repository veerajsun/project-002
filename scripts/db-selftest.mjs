// Tests the REAL database rules and the REAL repository code on YOUR database.
//   node scripts\db-selftest.mjs
// Everything happens inside ONE transaction that is ROLLED BACK at the end, so no test data
// is kept. (The order-number counter is restored too.) Run it on your development database.
import crypto from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { connect, describeTarget, loadEnv, transpile } from "./_db-utils.mjs";

let passed = 0;
let failed = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "  ok   " : "  FAIL "}${msg}`);
  cond ? passed++ : failed++;
};

async function main() {
  await loadEnv();
  const outDir = await transpile(
    ["src/server/constants.ts", "src/server/pricing.ts", "src/server/env.ts", "src/server/db.ts", "src/server/orders.ts", "src/server/products.ts"],
    "sabland-selftest"
  );
  const load = (name) => import(pathToFileURL(path.join(outDir, name)).href);
  const { createOrder, getOrderByNumber, OrderError } = await load("orders.mjs");
  const { listActiveProducts, getPurchasableProductsBySlugs } = await load("products.mjs");

  const client = await connect();
  console.log("Database:", describeTarget(), "(all test data is rolled back)\n");

  let seqBefore = null;
  try {
    const seq = await client.query("SELECT last_value, is_called FROM order_number_seq");
    seqBefore = seq.rows[0];
  } catch (err) {
    console.error("The tables are missing. Run first:  node scripts\\db-migrate.mjs");
    await client.end();
    process.exit(1);
  }

  const tag = crypto.randomBytes(5).toString("hex");
  await client.query("BEGIN");

  async function expectError(label, sql, params, code) {
    await client.query("SAVEPOINT t");
    try {
      await client.query(sql, params);
      ok(false, `${label}: the database ACCEPTED it (it must be refused)`);
    } catch (e) {
      ok(e.code === code, `${label} -> refused (${e.code}${e.constraint ? " " + e.constraint : ""})`);
    }
    await client.query("ROLLBACK TO SAVEPOINT t");
  }

  const newProduct = async (slug, price, mrp) =>
    (await client.query(
      "INSERT INTO products (slug, name, pack_grams, price_paise, mrp_paise) VALUES ($1, $2, 500, $3, $4) RETURNING id",
      [slug, "Selftest honey " + slug, price, mrp]
    )).rows[0].id;
  const newVerification = async (phone, status = "VERIFIED", expires = "30 minutes") =>
    (await client.query(
      `INSERT INTO phone_verifications (phone, status, expires_at, verified_at)
       VALUES ($1, $2, now() + $3::interval, CASE WHEN $2 = 'VERIFIED' THEN now() ELSE NULL END) RETURNING id`,
      [phone, status, expires]
    )).rows[0].id;

  try {
    console.log("DATABASE RULES");
    const slugA = `selftest-a-${tag}`;
    const slugB = `selftest-b-${tag}`;
    const productA = await newProduct(slugA, 100000, 120000);
    const productB = await newProduct(slugB, 50000, 60000);
    const P = (slug) => [slug, "x", 500, 1000, 1200];
    const productSql = "INSERT INTO products (slug, name, pack_grams, price_paise, mrp_paise) VALUES ($1, $2, $3, $4, $5)";
    await expectError("product price above MRP", productSql, [`bad-${tag}`, "x", 500, 2000, 1000], "23514");
    await expectError("product price zero", productSql, [`bad-${tag}`, "x", 500, 0, 1000], "23514");
    await expectError("product slug with spaces/capitals", productSql, ["Bad Slug", "x", 500, 1000, 1200], "23514");
    await expectError("duplicate product slug", productSql, P(slugA), "23505");
    await expectError("product status DELETED", "INSERT INTO products (slug, name, pack_grams, price_paise, mrp_paise, status) VALUES ($1,'x',500,1000,1200,'DELETED')", [`bad2-${tag}`], "23514");

    const pvSql = "INSERT INTO phone_verifications (phone, status, expires_at, verified_at) VALUES ($1, $2, now() + interval '5 minutes', $3)";
    await expectError("verification with a bad phone", pvSql, ["1234567890", "PENDING", null], "23514");
    await expectError("VERIFIED without a verified time", pvSql, ["9876543210", "VERIFIED", null], "23514");

    const orderSql = `INSERT INTO orders (payment_method, status, customer_name, customer_phone, subtotal_paise, shipping_paise, total_paise, verification_id, idempotency_key)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
    const v1 = await newVerification("9876543210");
    const base = ["COD", "NEW", "Test Person", "9876543210", 1000, 0, 1000, v1, `selftest-key-${tag}-1`];
    const withChange = (i, v) => base.map((x, n) => (n === i ? v : x));
    await expectError("order WITHOUT a phone verification", orderSql, withChange(7, null), "23502");
    await expectError("order with an unknown verification id", orderSql, withChange(7, crypto.randomUUID()), "23503");
    await expectError("payment method UPI", orderSql, withChange(0, "UPI"), "23514");
    await expectError("payment method CARD", orderSql, withChange(0, "CARD"), "23514");
    await expectError("total does not match subtotal + shipping", orderSql, withChange(6, 999), "23514");
    await expectError("unknown order status", orderSql, withChange(1, "DONE"), "23514");
    await expectError("order with a bad phone", orderSql, withChange(3, "12345"), "23514");
    await expectError("too-short idempotency key", orderSql, withChange(8, "short"), "23514");
    const first = await client.query(orderSql + " RETURNING id, order_number", base);
    ok(first.rowCount === 1 && /^SBL-\d{4}-\d{6}$/.test(first.rows[0].order_number), `a valid COD order is accepted (number ${first.rows[0].order_number})`);
    const orderId = first.rows[0].id;
    const v2 = await newVerification("9876543211");
    await expectError("second order re-using the same verification", orderSql, withChange(8, `selftest-key-${tag}-2`), "23505");
    await expectError("second order re-using the same idempotency key", orderSql, withChange(7, v2), "23505");

    const itemSql = `INSERT INTO order_items (order_id, product_id, product_slug, product_name, pack_grams, unit_price_paise, mrp_paise, quantity, line_total_paise)
                     VALUES ($1, $2, 's', 'n', 500, 100, 120, $3, $4)`;
    await expectError("item quantity 11", itemSql, [orderId, productA, 11, 1100], "23514");
    await expectError("item quantity 0", itemSql, [orderId, productA, 0, 0], "23514");
    await expectError("item line total wrong", itemSql, [orderId, productA, 2, 201], "23514");
    await client.query(itemSql, [orderId, productA, 2, 200]);
    await expectError("same product twice in one order", itemSql, [orderId, productA, 1, 100], "23505");

    const addrSql = `INSERT INTO delivery_addresses (order_id, full_name, mobile, house, street, city, state, pin_code)
                     VALUES ($1, 'Test Person', $2, 'h', 's', 'c', 'st', $3)`;
    await expectError("PIN code starting with 0", addrSql, [orderId, "9876543210", "012345"], "23514");
    await expectError("PIN code with 5 digits", addrSql, [orderId, "9876543210", "56003"], "23514");
    await expectError("address mobile invalid", addrSql, [orderId, "123", "560038"], "23514");
    await client.query(addrSql, [orderId, "9876543210", "560038"]);
    await expectError("second address for one order", addrSql, [orderId, "9876543210", "560038"], "23505");
    await expectError("status event with an unknown status", "INSERT INTO order_status_events (order_id, to_status) VALUES ($1, 'LOST')", [orderId], "23514");

    console.log("\nREAL REPOSITORY CODE (createOrder / getOrderByNumber / products)");
    const proofFor = (verificationId, phone) => ({ verificationId, phone });
    const addressInput = { fullName: "Aria Mehta", mobile: "9811111111", house: "Flat 402", street: "MG Road", landmark: "", city: "Bengaluru", state: "Karnataka", pin: "560038" };
    const input = (key, items) => ({ items, address: addressInput, idempotencyKey: key });
    const items = [{ slug: slugA, quantity: 2 }, { slug: slugB, quantity: 1 }];

    const vOrder = await newVerification("9811111111");
    const proof = proofFor(vOrder, "9811111111");
    const key = `selftest-real-${tag}-1`;
    const created = await createOrder(client, input(key, items), proof);
    ok(created.totalPaise === 250000 && created.replayed === false && /^SBL-\d{4}-\d{6}$/.test(created.orderNumber), `order saved; total computed by the server = ${created.totalPaise} paise (expected 250000)`);
    const details = await getOrderByNumber(client, created.orderNumber);
    ok(details && details.paymentMethod === "COD" && details.status === "NEW" && details.customerPhone === "9811111111", "stored as Cash on Delivery, status NEW, phone from the verification");
    ok(details.items.length === 2 && details.subtotalPaise === 250000 && details.savingsPaise === 50000 && details.shippingPaise === 0, "2 items, subtotal 250000, savings 50000, shipping 0");
    ok(details.address && details.address.pinCode === "560038" && details.address.city === "Bengaluru", "delivery address saved");
    const events = await client.query("SELECT count(*)::int AS n FROM order_status_events WHERE order_id = (SELECT id FROM orders WHERE order_number = $1)", [created.orderNumber]);
    ok(events.rows[0].n === 1, "a NEW status event was recorded");
    const used = await client.query("SELECT status FROM phone_verifications WHERE id = $1", [vOrder]);
    ok(used.rows[0].status === "CONSUMED", "the verification was consumed (single use)");

    const again = await createOrder(client, input(key, items), proof);
    ok(again.replayed === true && again.orderNumber === created.orderNumber, "the SAME request again returns the same order (no duplicate)");
    const dup = await client.query("SELECT count(*)::int AS n FROM orders WHERE idempotency_key = $1", [key]);
    ok(dup.rows[0].n === 1, "still exactly one order for that request");

    const expectOrderError = async (label, fn, code) => {
      try {
        await fn();
        ok(false, `${label}: an order was created (it must be refused)`);
      } catch (e) {
        ok(e && (e.code === code), `${label} -> refused (${e && e.code})`);
      }
    };
    await expectOrderError("re-using a consumed verification", () => createOrder(client, input(`selftest-real-${tag}-2`, items), proof), "VERIFICATION_INVALID");
    const vPending = await newVerification("9822222222", "PENDING");
    await expectOrderError("a PENDING (not verified) phone", () => createOrder(client, input(`selftest-real-${tag}-3`, items), proofFor(vPending, "9822222222")), "VERIFICATION_INVALID");
    const vExpired = await newVerification("9833333333", "VERIFIED", "-1 minutes");
    await expectOrderError("an EXPIRED verification", () => createOrder(client, input(`selftest-real-${tag}-4`, items), proofFor(vExpired, "9833333333")), "VERIFICATION_INVALID");
    const vOther = await newVerification("9844444444");
    await expectOrderError("a proof whose phone does not match the verification", () => createOrder(client, input(`selftest-real-${tag}-5`, items), proofFor(vOther, "9855555555")), "VERIFICATION_INVALID");
    await expectOrderError("a made-up verification id", () => createOrder(client, input(`selftest-real-${tag}-6`, items), proofFor(crypto.randomUUID(), "9866666666")), "VERIFICATION_INVALID");
    const noOrdersLeft = await client.query("SELECT count(*)::int AS n FROM orders WHERE idempotency_key LIKE $1", [`selftest-real-${tag}-%`]);
    ok(noOrdersLeft.rows[0].n === 1, "none of the refused attempts left an order behind (only the 1 valid order exists)");

    await client.query("UPDATE products SET price_paise = 90000, mrp_paise = 120000 WHERE slug = $1", [slugA]);
    const vPrice = await newVerification("9877777777");
    const repriced = await createOrder(client, input(`selftest-real-${tag}-7`, [{ slug: slugA, quantity: 1 }]), proofFor(vPrice, "9877777777"));
    ok(repriced.totalPaise === 90000, "prices come from the database: after a price change the total is 90000 (the browser never sends prices)");

    await client.query("UPDATE products SET is_available = false WHERE slug = $1", [slugB]);
    const vGone = await newVerification("9888888888");
    try {
      await createOrder(client, input(`selftest-real-${tag}-8`, [{ slug: slugB, quantity: 1 }]), proofFor(vGone, "9888888888"));
      ok(false, "a sold-out product was accepted");
    } catch (e) {
      ok(e && e.code === "PRODUCT_UNAVAILABLE", "a product that is not available cannot be ordered");
    }
    const stillVerified = await client.query("SELECT status FROM phone_verifications WHERE id = $1", [vGone]);
    ok(stillVerified.rows[0].status === "VERIFIED", "that refused order did NOT use up the phone verification");

    const listed = await listActiveProducts(client);
    ok(listed.some((p) => p.slug === slugA && p.pricePaise === 90000 && Array.isArray(p.images)), "listActiveProducts() returns products with paise prices");
    const purchasable = await getPurchasableProductsBySlugs([slugA, slugB], client);
    ok(purchasable.length === 1 && purchasable[0].slug === slugA, "getPurchasableProductsBySlugs() skips the unavailable product");
  } catch (err) {
    ok(false, `the self-test stopped unexpectedly: ${err.message}`);
  }

  await client.query("ROLLBACK");
  try {
    await client.query("SELECT setval('order_number_seq', $1, $2)", [seqBefore.last_value, seqBefore.is_called]);
  } catch {
    // not important
  }
  const leftover = await client.query("SELECT (SELECT count(*) FROM products WHERE slug LIKE 'selftest-%')::int AS products, (SELECT count(*) FROM orders WHERE idempotency_key LIKE 'selftest-%')::int AS orders");
  ok(leftover.rows[0]?.products === 0 && leftover.rows[0]?.orders === 0, "rolled back: no test data was kept in your database");
  await client.end();

  console.log(failed ? `\n${failed} CHECK(S) FAILED, ${passed} passed. Send me the FAIL lines.` : `\nALL ${passed} DATABASE CHECKS PASSED`);
  process.exit(failed ? 1 : 0);
}
main().catch((err) => {
  console.error("The self-test could not finish:", err && err.message ? err.message : err);
  process.exit(1);
});
