// Pure price calculation. No database, no browser input for prices.
// Prices ALWAYS come from product rows loaded from the database; the browser only
// ever says WHICH product (slug) and HOW MANY.
import { MAX_QTY_PER_ITEM, SHIPPING_PAISE } from "./constants";

export type PricedProduct = {
  id: string;
  slug: string;
  name: string;
  packGrams: number;
  pricePaise: number;
  mrpPaise: number;
};

export type QuoteLine = {
  productId: string;
  slug: string;
  name: string;
  packGrams: number;
  quantity: number;
  unitPricePaise: number;
  mrpPaise: number;
  lineTotalPaise: number;
};

export type Quote = {
  lines: QuoteLine[];
  subtotalPaise: number;
  savingsPaise: number;
  shippingPaise: number;
  totalPaise: number;
};

export class QuoteError extends Error {
  code: "EMPTY_CART" | "DUPLICATE_ITEM" | "INVALID_QUANTITY" | "PRODUCT_UNAVAILABLE";
  slug?: string;
  constructor(code: QuoteError["code"], message: string, slug?: string) {
    super(message);
    this.name = "QuoteError";
    this.code = code;
    this.slug = slug;
  }
}

export function buildQuote(
  products: PricedProduct[],
  items: { slug: string; quantity: number }[]
): Quote {
  if (items.length === 0) throw new QuoteError("EMPTY_CART", "The cart is empty.");
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const seen = new Set<string>();

  const lines: QuoteLine[] = items.map((item) => {
    if (seen.has(item.slug)) {
      throw new QuoteError("DUPLICATE_ITEM", "The same product appears twice.", item.slug);
    }
    seen.add(item.slug);
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QTY_PER_ITEM) {
      throw new QuoteError("INVALID_QUANTITY", `Quantity must be 1 to ${MAX_QTY_PER_ITEM}.`, item.slug);
    }
    const p = bySlug.get(item.slug);
    if (!p) {
      throw new QuoteError("PRODUCT_UNAVAILABLE", "A product is not available.", item.slug);
    }
    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      packGrams: p.packGrams,
      quantity: item.quantity,
      unitPricePaise: p.pricePaise,
      mrpPaise: p.mrpPaise,
      lineTotalPaise: p.pricePaise * item.quantity,
    };
  });

  const subtotalPaise = lines.reduce((s, l) => s + l.lineTotalPaise, 0);
  const savingsPaise = lines.reduce((s, l) => s + (l.mrpPaise - l.unitPricePaise) * l.quantity, 0);
  const totalPaise = subtotalPaise + SHIPPING_PAISE;
  for (const n of [subtotalPaise, savingsPaise, totalPaise]) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error("Invalid amount while pricing the cart");
  }
  return { lines, subtotalPaise, savingsPaise, shippingPaise: SHIPPING_PAISE, totalPaise };
}
