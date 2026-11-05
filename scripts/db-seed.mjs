
// Copies products from src/data/products.ts into SQLite.
// Prices are stored as integer paise.
// Safe to run again: existing products are left unchanged.
//
// Run: node scripts/db-seed.mjs

import path from "node:path";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  connect,
  describeTarget,
  loadEnv,
  transpile,
} from "./_db-utils.mjs";

async function main() {
  await loadEnv();

  const outDir = await transpile(
    ["src/data/products.ts"],
    "sabland-seed"
  );

  const { products } = await import(
    pathToFileURL(path.join(outDir, "products.mjs")).href
  );

  const db = await connect();

  console.log("Database:", describeTarget());

  try {
    const seed = db.transaction(() => {
      const findProduct = db.prepare(
        "SELECT id FROM products WHERE slug = ?"
      );

      const insertProduct = db.prepare(`
        INSERT INTO products (
          id,
          slug,
          name,
          description,
          pack_grams,
          price_paise,
          mrp_paise,
          stock,
          is_available,
          sort_order,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertImage = db.prepare(`
        INSERT INTO product_images (
          id,
          product_id,
          image_url,
          alt_text,
          sort_order,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const [index, product] of products.entries()) {
        const existing = findProduct.get(product.slug);

        if (existing) {
          console.log(`  kept (already exists): ${product.slug}`);
          continue;
        }

        const now = new Date().toISOString();
        const productId = randomUUID();

        const pricePaise = Math.round(product.price * 100);
        const mrpPaise = Math.round(product.mrp * 100);

        insertProduct.run(
          productId,
          product.slug,
          product.name,
          product.description ?? "",
          product.grams,
          pricePaise,
          mrpPaise,
          product.inStock ? 10 : 0,
          product.inStock ? 1 : 0,
          index,
          now,
          now
        );

        for (const [imageOrder, imagePath] of (
          product.images ?? []
        ).entries()) {
          insertImage.run(
            randomUUID(),
            productId,
            imagePath,
            product.name,
            imageOrder,
            now
          );
        }

        console.log(
          `  added: ${product.slug} | Rs ${product.price} | ${product.images?.length ?? 0} photos`
        );
      }
    });

    seed();

    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error(
      "Seeding failed. Transaction rolled back:",
      error.message
    );
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});
