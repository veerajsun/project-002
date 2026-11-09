
if (typeof window !== "undefined") {
  throw new Error("src/server/sheets-mapper.ts must never be loaded in the browser");
}

export const ORDER_SHEET_HEADERS = [
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
] as const;

export type OrderSheetHeader = (typeof ORDER_SHEET_HEADERS)[number];

export type OrderItemPayload = {
  slug?: string;
  productSlug?: string;
  name?: string;
  productName?: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
};

export type OrderAddressPayload = {
  house?: string;
  street?: string;
  landmark?: string | null;
  city?: string;
  state?: string;
  pin?: string;
  pinCode?: string;
  fullName?: string;
  mobile?: string;
};

export type OrderSheetInput = {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  address: OrderAddressPayload | null;
  items: OrderItemPayload[];
  subtotalPaise: number;
  savingsPaise?: number;
  shippingPaise: number;
  totalPaise: number;
};

/**
 * Combines address components into a clean, single-cell formatted delivery address.
 */
export function formatDeliveryAddress(
  address: OrderAddressPayload | null | undefined
): string {
  if (!address) return "";

  const parts: string[] = [];
  if (address.house?.trim()) parts.push(address.house.trim());
  if (address.street?.trim()) parts.push(address.street.trim());
  if (address.landmark?.trim()) {
    const lm = address.landmark.trim();
    parts.push(/^near\s+/i.test(lm) ? lm : `Near ${lm}`);
  }
  if (address.city?.trim()) parts.push(address.city.trim());
  if (address.state?.trim()) {
    const pin = address.pin?.trim() || address.pinCode?.trim() || "";
    parts.push(pin ? `${address.state.trim()} - ${pin}` : address.state.trim());
  } else if (address.pin?.trim() || address.pinCode?.trim()) {
    parts.push(address.pin?.trim() || address.pinCode?.trim() || "");
  }

  return parts.join(", ");
}

/**
 * Summarizes purchased order items into a clean human-readable string.
 * Example: "Khalta 500g (x2), Khalta 250g (x1)"
 */
export function formatItemsSummary(items: OrderItemPayload[] | undefined): string {
  if (!items || items.length === 0) return "";

  return items
    .map((item) => {
      const name = item.name?.trim() || item.productName?.trim() || item.slug || item.productSlug || "Product";
      const qty = Number(item.quantity) || 1;
      return `${name} (x${qty})`;
    })
    .join(", ");
}

/**
 * Computes the total unit count of all items in an order.
 */
export function calculateTotalQuantity(items: OrderItemPayload[] | undefined): number {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

/**
 * Converts amount in paise to a decimal rupee value formatted to 2 decimal places.
 */
export function paiseToRupees(paise: number | undefined): number {
  if (typeof paise !== "number" || isNaN(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}

/**
 * Formats an ISO date string into a clean, human-readable date/time string.
 */
export function formatOrderDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
  } catch {
    return isoString;
  }
}

/**
 * Sanitizes cell values to prevent spreadsheet formula injection.
 * Any string starting with =, +, -, @, tab, or carriage return is escaped
 * with a leading single quote (') so Google Sheets treats it as plain text.
 * Numeric values are preserved as numbers.
 */
export function sanitizeCellValue(val: unknown): string | number {
  if (typeof val === "number") {
    return isNaN(val) ? 0 : val;
  }
  if (val === null || val === undefined) {
    return "";
  }
  const str = String(val);
  if (!str) return "";

  // Check if string begins with formula-triggering characters
  if (/^[\s]*[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }

  return str;
}

/**
 * Maps an SQLite order payload to a typed row array matching ORDER_SHEET_HEADERS.
 * Every cell value is sanitized against formula injection while preserving numbers.
 */
export function mapOrderToSheetRow(order: OrderSheetInput): (string | number)[] {
  const pin = order.address?.pin?.trim() || order.address?.pinCode?.trim() || "";

  const rawRow = [
    order.orderNumber,
    formatOrderDate(order.createdAt),
    order.status,
    order.paymentMethod,
    order.customerName,
    order.customerPhone,
    formatDeliveryAddress(order.address),
    order.address?.city?.trim() || "",
    order.address?.state?.trim() || "",
    pin,
    formatItemsSummary(order.items),
    calculateTotalQuantity(order.items),
    paiseToRupees(order.subtotalPaise),
    paiseToRupees(order.shippingPaise),
    paiseToRupees(order.totalPaise),
  ];

  return rawRow.map(sanitizeCellValue);
}

/**
 * Safely parses the outbox JSON payload stored in sheet_sync_outbox.payload_json.
 */
export function parseOutboxPayload(payloadJson: string): OrderSheetInput {
  const parsed = JSON.parse(payloadJson);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid outbox payload: expected a JSON object");
  }
  if (!parsed.orderNumber) {
    throw new Error("Invalid outbox payload: missing orderNumber");
  }
  return parsed as OrderSheetInput;
}
