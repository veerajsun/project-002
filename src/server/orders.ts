
import { randomUUID, createHash } from "node:crypto";
import { withTransaction } from "./db";
import type { Queryable } from "./db";
import { buildQuote } from "./pricing";
import type { PricedProduct } from "./pricing";
import { PAYMENT_METHOD } from "./constants";

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
  replayed: boolean;
};

export class OrderError extends Error {
  code: "IDEMPOTENCY_CONFLICT";

  constructor(code: OrderError["code"], message: string) {
    super(message);
    this.name = "OrderError";
    this.code = code;
  }
}

function makeRequestHash(input: NewOrderInput): string {
  const canonical = {
    items: [...input.items]
      .map((item) => ({
        slug: item.slug,
        quantity: item.quantity,
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug)),
    address: {
      fullName: input.address.fullName.trim(),
      mobile: input.address.mobile.trim(),
      house: input.address.house.trim(),
      street: input.address.street.trim(),
      landmark: input.address.landmark.trim(),
      city: input.address.city.trim(),
      state: input.address.state.trim(),
      pin: input.address.pin.trim(),
    },
  };

  return createHash("sha256")
    .update(JSON.stringify(canonical))
    .digest("hex");
}

async function createOrder(
  db: Queryable,
  input: NewOrderInput
): Promise<CreatedOrder> {
  const requestHash = makeRequestHash(input);

  // A repeated request with the same payload returns the original order.
  const prior = await db.query<{
    id: string;
    order_number: string;
    total_paise: number;
    request_hash: string;
  }>(
    `SELECT id, order_number, total_paise, request_hash
       FROM orders
      WHERE idempotency_key = ?`,
    [input.idempotencyKey]
  );

  const existing = prior.rows[0];

  if (existing) {
    if (existing.request_hash !== requestHash) {
      throw new OrderError(
        "IDEMPOTENCY_CONFLICT",
        "This request key was already used with different order details."
      );
    }

    return {
      orderId: existing.id,
      orderNumber: existing.order_number,
      totalPaise: existing.total_paise,
      replayed: true,
    };
  }

  if (input.items.length === 0) {
    throw new Error("The order must contain at least one product.");
  }

  const slugs = [...new Set(input.items.map((item) => item.slug))];
  const placeholders = slugs.map(() => "?").join(", ");

  const found = await db.query<{
  id: string;
  slug: string;
  name: string;
  pack_grams: number;
  price_paise: number;
  mrp_paise: number;
}>(
  `SELECT id, slug, name, pack_grams, price_paise,
          mrp_paise
     FROM products
    WHERE slug IN (${placeholders})
      AND is_available = 1`,
  slugs
);

  const priced: PricedProduct[] = found.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    packGrams: row.pack_grams,
    pricePaise: row.price_paise,
    mrpPaise: row.mrp_paise,
  }));

  // buildQuote validates quantities and calculates all totals
  // using prices fetched from the database.
  const quote = buildQuote(priced, input.items);

  const now = new Date().toISOString();
  const orderId = randomUUID();
  const currentYear = new Date().getFullYear();

  // SQLite transaction is already protected by withTransaction().
  const counter = await db.query<{ last_number: number }>(
    `INSERT INTO order_number_counters (year, last_number)
     VALUES (?, 1)
     ON CONFLICT(year)
    DO UPDATE SET last_number = order_number_counters.last_number + 1
     RETURNING last_number`,
    [currentYear]
  );

  const orderNumber =
    `SBL-${currentYear}-${String(counter.rows[0].last_number).padStart(6, "0")}`;

  const address = input.address;

  await db.query(
    `INSERT INTO orders (
       id, order_number, idempotency_key, request_hash, status,
       payment_method, currency, customer_name, customer_phone,
       subtotal_paise, savings_paise, shipping_paise, total_paise,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, 'NEW', ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId,
      orderNumber,
      input.idempotencyKey,
      requestHash,
      PAYMENT_METHOD,
      address.fullName,
      address.mobile,
      quote.subtotalPaise,
      quote.savingsPaise,
      quote.shippingPaise,
      quote.totalPaise,
      now,
      now,
    ]
  );

  for (const line of quote.lines) {
    await db.query(
      `INSERT INTO order_items (
         id, order_id, product_id, product_slug, product_name,
         unit_price_paise, quantity, line_total_paise
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        orderId,
        line.productId,
        line.slug,
        line.name,
        line.unitPricePaise,
        line.quantity,
        line.lineTotalPaise,
      ]
    );
  }

  await db.query(
    `INSERT INTO delivery_addresses (
       id, order_id, recipient_name, phone, address_line1,
       address_line2, landmark, city, state, postal_code,
       country, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'India', ?)`,
    [
      randomUUID(),
      orderId,
      address.fullName,
      address.mobile,
      address.house,
      address.street,
      address.landmark,
      address.city,
      address.state,
      address.pin,
      now,
    ]
  );

  await db.query(
    `INSERT INTO order_status_events (
       id, order_id, status, note, created_at
     ) VALUES (?, ?, 'NEW', ?, ?)`,
    [
      randomUUID(),
      orderId,
      "Order placed (Cash on Delivery)",
      now,
    ]
  );

  // Save a Sheets-sync event in the same transaction.
  // A future worker will send this payload to Google Sheets.
  const sheetPayload = {
    orderNumber,
    status: "NEW",
    paymentMethod: PAYMENT_METHOD,
    customerName: address.fullName,
    customerPhone: address.mobile,
    address: {
      house: address.house,
      street: address.street,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      pin: address.pin,
    },
    items: quote.lines.map((line) => ({
      slug: line.slug,
      name: line.name,
      quantity: line.quantity,
      unitPricePaise: line.unitPricePaise,
      lineTotalPaise: line.lineTotalPaise,
    })),
    subtotalPaise: quote.subtotalPaise,
    savingsPaise: quote.savingsPaise,
    shippingPaise: quote.shippingPaise,
    totalPaise: quote.totalPaise,
    createdAt: now,
  };

  await db.query(
    `INSERT INTO sheet_sync_outbox (
       id, order_id, payload_json, status, attempts,
       created_at, updated_at
     ) VALUES (?, ?, ?, 'PENDING', 0, ?, ?)`,
    [
      randomUUID(),
      orderId,
      JSON.stringify(sheetPayload),
      now,
      now,
    ]
  );

  return {
    orderId,
    orderNumber,
    totalPaise: quote.totalPaise,
    replayed: false,
  };
}

export async function placeOrder(
  input: NewOrderInput
): Promise<CreatedOrder> {
  return withTransaction((db) => createOrder(db, input));
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

export async function getOrderByNumber(
  db: Queryable,
  orderNumber: string
): Promise<OrderDetails | null> {
  const result = await db.query<{
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
    created_at: string;
  }>(
    `SELECT id, order_number, status, payment_method,
            customer_name, customer_phone, subtotal_paise,
            savings_paise, shipping_paise, total_paise, created_at
       FROM orders
      WHERE order_number = ?`,
    [orderNumber]
  );

  const order = result.rows[0];
  if (!order) return null;

  const items = await db.query<{
    product_slug: string;
    product_name: string;
    pack_grams: number;
    unit_price_paise: number;
    quantity: number;
    line_total_paise: number;
  }>(
    `SELECT oi.product_slug, oi.product_name, p.pack_grams,
            oi.unit_price_paise, oi.quantity, oi.line_total_paise
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.product_name`,
    [order.id]
  );

  const addressResult = await db.query<{
    recipient_name: string;
    phone: string;
    address_line1: string;
    address_line2: string;
    landmark: string;
    city: string;
    state: string;
    postal_code: string;
  }>(
    `SELECT recipient_name, phone, address_line1, address_line2,
            landmark, city, state, postal_code
       FROM delivery_addresses
      WHERE order_id = ?`,
    [order.id]
  );

  const address = addressResult.rows[0];

  return {
    orderNumber: order.order_number,
    status: order.status,
    paymentMethod: order.payment_method,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    subtotalPaise: order.subtotal_paise,
    savingsPaise: order.savings_paise,
    shippingPaise: order.shipping_paise,
    totalPaise: order.total_paise,
    createdAt: new Date(order.created_at).toISOString(),
    items: items.rows.map((item) => ({
      productSlug: item.product_slug,
      productName: item.product_name,
      packGrams: item.pack_grams ?? 0,
      unitPricePaise: item.unit_price_paise,
      quantity: item.quantity,
      lineTotalPaise: item.line_total_paise,
    })),
    address: address
      ? {
          fullName: address.recipient_name,
          mobile: address.phone,
          house: address.address_line1,
          street: address.address_line2,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          pinCode: address.postal_code,
        }
      : null,
  };
}
