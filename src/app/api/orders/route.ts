
import {
  PAYMENT_METHOD,
} from "@/server/constants";
import {
  apiError,
  checkOrigin,
  json,
  readJsonBody,
  withErrorHandling,
} from "@/server/http";
import { OrderError, placeOrder } from "@/server/orders";
import { QuoteError } from "@/server/pricing";
import { triggerBackgroundSync } from "@/server/sheet-sync-worker";
import { parseOrderRequest } from "@/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling("orders:create", async (request) => {
  const originProblem = checkOrigin(request);
  if (originProblem) return originProblem;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = parseOrderRequest(body.data);
  if (!parsed.ok) {
    return apiError(
      422,
      parsed.code,
      parsed.message,
      parsed.fields
    );
  }

  try {
    const created = await placeOrder(parsed.value);

    // Non-blocking trigger: attempt immediate background sync without waiting or failing
    if (!created.replayed) {
      try {
        triggerBackgroundSync();
      } catch {
        // Safe: background trigger errors never affect successful order response
      }
    }

    return json(
      {
        order: {
          orderId: created.orderId,
          orderNumber: created.orderNumber,
          status: "NEW",
          paymentMethod: PAYMENT_METHOD,
          totalPaise: created.totalPaise,
        },
      },
      created.replayed ? 200 : 201
    );
  } catch (err) {
    if (err instanceof QuoteError) {
      return apiError(422, err.code, err.message);
    }

    if (err instanceof OrderError) {
      return apiError(
        err.code === "IDEMPOTENCY_CONFLICT" ? 409 : 422,
        err.code,
        err.message
      );
    }

    throw err;
  }
});
