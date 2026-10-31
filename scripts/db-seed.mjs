// Copies the shop's products from src/data/products.ts into the database (prices become paise).
//   node scripts\db-seed.mjs
// Safe to run again: a product that already exists is LEFT UNCHANGED (never overwritten).
import path from "node:path";
import { pathToFileURL } from "node:url";
import { connect, describeTarget, loadEnv, transpile } from "./_db-utils.mjs";

async function main() {
  await loadEnv();
  const outDir = await transpile(["src/data/products.ts"], "sabland-seed");
  const { products } = await import(pathToFileURL(path.join(outDir, "products.mjs")).href);

  const client = await connect();
  console.log("Database:", describeTarget());
  let failed = false;
  try {
    await client.query("BEGIN");
    for (const [index, p] of products.entries()) {
      const pricePaise = Math.round(p.price * 100);
      const mrpPaise = Math.round(p.mrp * 100);
      const res = await client.query(
        `INSERT INTO products (slug, name, pack_grams, price_paise, mrp_paise, is_available, status, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [p.slug, p.name, p.grams, pricePaise, mrpPaise, p.inStock, index]
      );
      if (res.rowCount === 0) {
        console.log(`  kept (already in the database): ${p.slug}`);
        continue;
      }
      for (const [imageOrder, imagePath] of p.images.entries()) {
        await client.query(
          "INSERT INTO product_images (product_id, path, sort_order) VALUES ($1, $2, $3)",
          [res.rows[0].id, imagePath, imageOrder]
        );
      }
      console.log(`  added: ${p.slug}  Rs ${p.price} = ${pricePaise} paise, ${p.images.length} photos`);
    }
    await client.query("COMMIT");
    console.log("Done.");
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "42P01") console.error("The tables do not exist yet. Run first:  node scripts\\db-migrate.mjs");
    else console.error("Seeding failed. Nothing was saved:", err.message);
    failed = true;
  } finally {
    await client.end();
  }
  process.exit(failed ? 1 : 0);
}
main().catch((err) => {
  console.error("Unexpected error:", err && err.message ? err.message : err);
  process.exit(1);
});
