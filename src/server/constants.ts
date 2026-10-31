// Server-side constants. These are NOT read from the browser.
export const MAX_QTY_PER_ITEM = 10; // same limit as the cart screen (src/lib/cart.ts MAX_QTY)
export const MAX_DISTINCT_ITEMS = 10;
export const SHIPPING_PAISE = 0; // free shipping across India (shipping policy)
export const PAYMENT_METHOD = "COD" as const; // Cash on Delivery is the ONLY payment method

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

export const PHONE_VERIFICATION_UNAVAILABLE_MESSAGE =
  "Phone verification is not available yet. Checkout is in preview mode; no order can be placed.";
