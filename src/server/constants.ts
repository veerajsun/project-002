
// Server-side constants. Never import server secrets into browser code.

export const MAX_QTY_PER_ITEM = 10;
export const MAX_DISTINCT_ITEMS = 10;

export const SHIPPING_PAISE = 0;

export const PAYMENT_METHOD = "COD" as const;

export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RTO",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
