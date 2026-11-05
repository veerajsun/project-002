
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

type ProductImageRow = {
  product_id: string;
  image_url: string;
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

/**
 * Returns all active products, including unavailable products,
 * together with their images.
 */
export async function listActiveProducts(
  db: Queryable = defaultDb
): Promise<Product[]> {
  const result = await db.query<
    ProductRow & {
      is_available: number;
      sort_order: number;
    }
  >(
    `SELECT
       id, slug, name, pack_grams, price_paise, mrp_paise,
       is_available, sort_order
     FROM products
     ORDER BY sort_order, name`
  );

  if (result.rows.length === 0) return [];

  const productIds = result.rows.map((row) => row.id);
  const placeholders = productIds.map(() => "?").join(", ");

  const imageResult = await db.query<ProductImageRow>(
    `SELECT product_id, image_url
       FROM product_images
      WHERE product_id IN (${placeholders})
      ORDER BY sort_order`,
    productIds
  );

  const imagesByProduct = new Map<string, string[]>();

  for (const image of imageResult.rows) {
    const images = imagesByProduct.get(image.product_id) ?? [];
    images.push(image.image_url);
    imagesByProduct.set(image.product_id, images);
  }

  return result.rows.map((row) => ({
    ...toPriced(row),
    isAvailable: row.is_available === 1,
    sortOrder: row.sort_order,
    images: imagesByProduct.get(row.id) ?? [],
  }));
}

/**
 * Returns only products that can currently be purchased.
 * Prices always come from the database, never from the browser.
 */
export async function getPurchasableProductsBySlugs(
  slugs: string[],
  db: Queryable = defaultDb
): Promise<PricedProduct[]> {
  if (slugs.length === 0) return [];

  const uniqueSlugs = [...new Set(slugs)];
  const placeholders = uniqueSlugs.map(() => "?").join(", ");

  const result = await db.query<ProductRow>(
    `SELECT
       id, slug, name, pack_grams, price_paise, mrp_paise
     FROM products
     WHERE slug IN (${placeholders})
       AND is_available = 1`,
    uniqueSlugs
  );

  return result.rows.map(toPriced);
}
