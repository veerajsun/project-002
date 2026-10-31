import { json, withErrorHandling } from "@/server/http";
import { listActiveProducts } from "@/server/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public, read-only: the shop's products as stored in the database (prices in paise).
export const GET = withErrorHandling("products:list", async () => {
  const products = await listActiveProducts();
  return json({ currency: "INR", products });
});
