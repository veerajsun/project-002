// Server-side checking of what the browser sends. The browser may only say WHICH products
// (slug) and HOW MANY. Any price, total or shipping figure it sends is never read.
import { validateAddress, type Address } from "@/lib/checkout";
import { MAX_DISTINCT_ITEMS, MAX_QTY_PER_ITEM } from "./constants";

export type Item = { slug: string; quantity: number };

export type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string; fields?: Record<string, string> };

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const IDEMPOTENCY_RE = /^[A-Za-z0-9_-]{16,64}$/;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const fail = (code: string, message: string, fields?: Record<string, string>) =>
  ({ ok: false, code, message, ...(fields ? { fields } : {}) }) as const;

export function parseItems(raw: unknown): Parsed<Item[]> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fail("INVALID_ITEMS", "items must be a non-empty list.");
  }
  if (raw.length > MAX_DISTINCT_ITEMS) {
    return fail("INVALID_ITEMS", `At most ${MAX_DISTINCT_ITEMS} different products per order.`);
  }
  const items: Item[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (!isObject(entry)) return fail("INVALID_ITEMS", "Each item must be an object.");
    const { slug, quantity } = entry; // nothing else (such as a price) is read
    if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
      return fail("INVALID_ITEMS", "Each item needs a valid product slug.");
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_ITEM) {
      return fail("INVALID_QUANTITY", `Quantity must be a whole number from 1 to ${MAX_QTY_PER_ITEM}.`);
    }
    if (seen.has(slug)) return fail("DUPLICATE_ITEM", "The same product appears twice.");
    seen.add(slug);
    items.push({ slug, quantity });
  }
  return { ok: true, value: items };
}

export function parseQuoteRequest(body: unknown): Parsed<{ items: Item[] }> {
  if (!isObject(body)) return fail("INVALID_BODY", "The request body must be a JSON object.");
  const items = parseItems(body.items);
  if (!items.ok) return items;
  return { ok: true, value: { items: items.value } };
}

export type OrderRequest = { items: Item[]; address: Address; idempotencyKey: string };

export function parseOrderRequest(body: unknown): Parsed<OrderRequest> {
  if (!isObject(body)) return fail("INVALID_BODY", "The request body must be a JSON object.");

  const items = parseItems(body.items);
  if (!items.ok) return items;

  if (typeof body.idempotencyKey !== "string" || !IDEMPOTENCY_RE.test(body.idempotencyKey)) {
    return fail("INVALID_IDEMPOTENCY_KEY", "idempotencyKey must be 16 to 64 letters, digits, _ or -.");
  }

  if (!isObject(body.address)) return fail("INVALID_ADDRESS", "address must be an object.");
  const a = body.address;
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const address: Address = {
    fullName: text(a.fullName),
    mobile: text(a.mobile),
    house: text(a.house),
    street: text(a.street),
    landmark: text(a.landmark),
    city: text(a.city),
    state: text(a.state),
    pin: text(a.pin),
  };
  // The same rules the checkout form uses (PIN, mobile, state list...), now enforced on the server
  const problems = validateAddress(address);
  const fields: Record<string, string> = {};
  for (const [key, message] of Object.entries(problems)) if (message) fields[key] = message;
  if (Object.keys(fields).length > 0) {
    return fail("INVALID_ADDRESS", "Some address fields are not valid.", fields);
  }

  return { ok: true, value: { items: items.value, address, idempotencyKey: body.idempotencyKey } };
}
