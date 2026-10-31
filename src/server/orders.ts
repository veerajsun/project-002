// All order database access lives here. Server code only.
//
// createOrder() is NOT reachable today: it needs a VerifiedPhoneProof, and
// src/server/verification.ts cannot produce one yet (no real SMS/OTP check exists).
import { withTransaction } from "./db";
import type { Queryable } from "./db";
import { buildQuote } from "./pricing";
import type { PricedProduct } from "./pricing";
import { PAYMENT_METHOD } from "./constants";
import type { VerifiedPhoneProof } from "./verification";

export type DeliveryAddressInput = {
  fullName: string;
  mobile: string;
  house: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pin: string;
};

export type NewOrderInput = {
  items: { slug: string; quantity: number }[];
  address: DeliveryAddressInput;
  idempotencyKey: string;
};

export type CreatedOrder = {
  orderId: string;
  orderNumber: string;
  totalPaise: number;
  replayed: boolean; // true when the same request was already saved earlier
};

export class OrderError extends Error {
  code: "VERIFICATION_INVALID" | "IDEMPOTENCY_CONFLICT";
  constructor(code: OrderError["code"], message: string) {
    super(message);
    this.name = "OrderError";
    this.code = code;
  }
}

/**
 * Saves one order, all-or-nothing, inside the CALLER'S transaction.
 *  1. the same request twice -> returns the first order (no duplicate)
 *  2. prices and totals come from the products table, never from the browser
 *  3. the phone verification is consumed (single use), or nothing is saved
 */
export async function createOrder(
  db: Queryable,
  input: NewOrderInput,
  proof: VerifiedPhoneProof
): Promise<CreatedOrder> {
  const prior = await db.query<{
    id: string;
    order_number: string;
    total_paise: number;
    verification_id: string;
  }>(
    "SELECT id, order_number, total_paise, verification_id FROM orders WHERE idempotency_key = $1",
    [input.idempotencyKey]
  );
  const existing = prior.rows[0];
  if (existing) {
    if (existing.verification_id !== proof.verificationId) {
      throw new OrderError("IDEMPOTENCY_CONFLICT", "This request key was already used.");
    }
    return {
      orderId: existing.id,
      orderNumber: existing.order_number,
      totalPaise: existing.total_paise,
      replayed: true,
    };
  }

  const found = await db.query<{
    id: string;
    slug: string;
    name: string;
    pack_grams: number;
    price_paise: number;
    mrp_paise: number;
  }>(
    `SELECT id, slug, name, pack_grams, price_paise, mrp_paise
       FROM products
      WHERE slug = ANY($1::text[]) AND status = 'ACTIVE' AND is_available = true`,
    [input.items.map((i) => i.slug)]
  );
  const priced: PricedProduct[] = found.rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    packGrams: r.pack_grams,
    pricePaise: r.price_paise,
    mrpPaise: r.mrp_paise,
  }));
  const quote = buildQuote(priced, input.items);

  const used = await db.query(
    `UPDATE phone_verifications
        SET status = 'CONSUMED', consumed_at = now()
      WHERE id = $1 AND phone = $2 AND status = 'VERIFIED'
        AND consumed_at IS NULL AND expires_at > now()
      RETURNING id`,
    [proof.verificationId, proof.phone]
  );
  if (used.rowCount !== 1) {
    throw new OrderError("VERIFICATION_INVALID", "Phone verification is missing, used or expired.");
  }

  const order = await db.query<{ id: string; order_number: string }>(
    `INSERT INTO orders
       (payment_method, customer_name, customer_phone, subtotal_paise, savings_paise,
        shipping_paise, total_paise, verification_id, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, order_number`,
    [
      PAYMENT_METHOD,
      input.address.fullName,
      proof.phone,
      quote.subtotalPaise,
      quote.savingsPaise,
      quote.shippingPaise,
      quote.totalPaise,
      proof.verificationId,
      input.idempotencyKey,
    ]
  );
  const orderId = order.rows[0].id;

  for (const line of quote.lines) {
    await db.query(
      `INSERT INTO order_items
         (order_id, product_id, product_slug, product_name, pack_grams,
          unit_price_paise, mrp_paise, quantity, line_total_paise)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        orderId,
        line.productId,
        line.slug,
        line.name,
        line.packGrams,
        line.unitPricePaise,
        line.mrpPaise,
        line.quantity,
        line.lineTotalPaise,
      ]
    );
  }

  const a = input.address;
  await db.query(
    `INSERT INTO delivery_addresses
       (order_id, full_name, mobile, house, street, landmark, city, state, pin_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [orderId, a.fullName, a.mobile, a.house, a.street, a.landmark || null, a.city, a.state, a.pin]
  );

  await db.query(
    "INSERT INTO order_status_events (order_id, from_status, to_status, note) VALUES ($1, NULL, 'NEW', $2)",
    [orderId, "Order placed (Cash on Delivery)"]
  );

  return {
    orderId,
    orderNumber: order.rows[0].order_number,
    totalPaise: quote.totalPaise,
    replayed: false,
  };
}

/** createOrder inside its own transaction. If two identical requests race, the second one returns the first order. */
export async function placeOrder(input: NewOrderInput, proof: VerifiedPhoneProof): Promise<CreatedOrder> {
  try {
    return await withTransaction((db) => createOrder(db, input, proof));
  } catch (err) {
    const duplicate =
      (err as { code?: string })?.code === "23505" ||
      (err instanceof OrderError && err.code === "VERIFICATION_INVALID");
    if (!duplicate) throw err;
    // the first request may have just been saved: look again once (it will be returned, not re-created)
    return withTransaction((db) => createOrder(db, input, proof));
  }
}

export type OrderDetails = {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  subtotalPaise: number;
  savingsPaise: number;
  shippingPaise: number;
  totalPaise: number;
  createdAt: string;
  items: {
    productSlug: string;
    productName: string;
    packGrams: number;
    unitPricePaise: number;
    quantity: number;
    lineTotalPaise: number;
  }[];
  address: {
    fullName: string;
    mobile: string;
    house: string;
    street: string;
    landmark: string | null;
    city: string;
    state: string;
    pinCode: string;
  } | null;
};

export async function getOrderByNumber(db: Queryable, orderNumber: string): Promise<OrderDetails | null> {
  const o = await db.query<{
    id: string;
    order_number: string;
    status: string;
    payment_method: string;
    customer_name: string;
    customer_phone: string;
    subtotal_paise: number;
    savings_paise: number;
    shipping_paise: number;
    total_paise: number;
    created_at: Date;
  }>(
    `SELECT id, order_number, status, payment_method, customer_name, customer_phone,
            subtotal_paise, savings_paise, shipping_paise, total_paise, created_at
       FROM orders WHERE order_number = $1`,
    [orderNumber]
  );
  const row = o.rows[0];
  if (!row) return null;

  const items = await db.query<{
    product_slug: string;
    product_name: string;
    pack_grams: number;
    unit_price_paise: number;
    quantity: number;
    line_total_paise: number;
  }>(
    `SELECT product_slug, product_name, pack_grams, unit_price_paise, quantity, line_total_paise
       FROM order_items WHERE order_id = $1 ORDER BY product_name`,
    [row.id]
  );
  const addr = await db.query<{
    full_name: string;
    mobile: string;
    house: string;
    street: string;
    landmark: string | null;
    city: string;
    state: string;
    pin_code: string;
  }>(
    `SELECT full_name, mobile, house, street, landmark, city, state, pin_code
       FROM delivery_addresses WHERE order_id = $1`,
    [row.id]
  );
  const a = addr.rows[0];

  return {
    orderNumber: row.order_number,
    status: row.status,
    paymentMethod: row.payment_method,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    subtotalPaise: row.subtotal_paise,
    savingsPaise: row.savings_paise,
    shippingPaise: row.shipping_paise,
    totalPaise: row.total_paise,
    createdAt: new Date(row.created_at).toISOString(),
    items: items.rows.map((i) => ({
      productSlug: i.product_slug,
      productName: i.product_name,
      packGrams: i.pack_grams,
      unitPricePaise: i.unit_price_paise,
      quantity: i.quantity,
      lineTotalPaise: i.line_total_paise,
    })),
    address: a
      ? {
          fullName: a.full_name,
          mobile: a.mobile,
          house: a.house,
          street: a.street,
          landmark: a.landmark,
          city: a.city,
          state: a.state,
          pinCode: a.pin_code,
        }
      : null,
  };
}
