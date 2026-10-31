// All product database access lives here (not in pages or components).
import { query, type Queryable } from "./db";
import type { PricedProduct } from "./pricing";

export type Product = PricedProduct & {
  isAvailable: boolean;
  sortOrder: number;
  images: string[];
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  pack_grams: number;
  price_paise: number;
  mrp_paise: number;
};

const defaultDb: Queryable = { query };

export function toPriced(row: ProductRow): PricedProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    packGrams: row.pack_grams,
    pricePaise: row.price_paise,
    mrpPaise: row.mrp_paise,
  };
}

/** Every product shown in the shop (including ones temporarily out of stock), with photos. */
export async function listActiveProducts(db: Queryable = defaultDb): Promise<Product[]> {
  const result = await db.query<
    ProductRow & { is_available: boolean; sort_order: number; images: string[] }
  >(
    `SELECT p.id, p.slug, p.name, p.pack_grams, p.price_paise, p.mrp_paise,
            p.is_available, p.sort_order,
            COALESCE(array_agg(i.path ORDER BY i.sort_order) FILTER (WHERE i.path IS NOT NULL), ARRAY[]::text[]) AS images
       FROM products p
       LEFT JOIN product_images i ON i.product_id = p.id
      WHERE p.status = 'ACTIVE'
      GROUP BY p.id
      ORDER BY p.sort_order, p.name`
  );
  return result.rows.map((row) => ({
    ...toPriced(row),
    isAvailable: row.is_available,
    sortOrder: row.sort_order,
    images: row.images ?? [],
  }));
}

/** Only products that can be bought right now. These rows are the TRUSTED source of prices. */
export async function getPurchasableProductsBySlugs(
  slugs: string[],
  db: Queryable = defaultDb
): Promise<PricedProduct[]> {
  if (slugs.length === 0) return [];
  const result = await db.query<ProductRow>(
    `SELECT id, slug, name, pack_grams, price_paise, mrp_paise
       FROM products
      WHERE slug = ANY($1::text[]) AND status = 'ACTIVE' AND is_available = true`,
    [slugs]
  );
  return result.rows.map(toPriced);
}
