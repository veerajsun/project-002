import { PAYMENT_METHOD } from "@/server/constants";
import { apiError, checkOrigin, json, readJsonBody, withErrorHandling } from "@/server/http";
import { buildQuote, QuoteError } from "@/server/pricing";
import { getPurchasableProductsBySlugs } from "@/server/products";
import { parseQuoteRequest } from "@/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "What would this cart cost?" Prices come from the database. The browser sends only
// product slugs and quantities; any price or total it sends is ignored. This creates NO order.
export const POST = withErrorHandling("cart:quote", async (request) => {
  const originProblem = checkOrigin(request);
  if (originProblem) return originProblem;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = parseQuoteRequest(body.data);
  if (!parsed.ok) return apiError(422, parsed.code, parsed.message, parsed.fields);

  try {
    const products = await getPurchasableProductsBySlugs(parsed.value.items.map((i) => i.slug));
    const quote = buildQuote(products, parsed.value.items);
    return json({
      currency: "INR",
      paymentMethod: PAYMENT_METHOD,
      lines: quote.lines.map(({ productId: _productId, ...line }) => line),
      subtotalPaise: quote.subtotalPaise,
      savingsPaise: quote.savingsPaise,
      shippingPaise: quote.shippingPaise,
      totalPaise: quote.totalPaise,
    });
  } catch (err) {
    if (err instanceof QuoteError) return apiError(422, err.code, err.message);
    throw err;
  }
});
