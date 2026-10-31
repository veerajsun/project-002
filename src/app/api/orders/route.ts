import {
  PAYMENT_METHOD,
  PHONE_VERIFICATION_UNAVAILABLE_MESSAGE,
} from "@/server/constants";
import { apiError, checkOrigin, json, readJsonBody, withErrorHandling } from "@/server/http";
import { OrderError, placeOrder } from "@/server/orders";
import { QuoteError } from "@/server/pricing";
import { parseOrderRequest } from "@/server/validation";
import { getVerifiedPhone } from "@/server/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Creating an order requires a phone number verified BY THE SERVER. That does not exist yet,
// so today this route ALWAYS refuses, before it even reads the request.
export const POST = withErrorHandling("orders:create", async (request) => {
  const originProblem = checkOrigin(request);
  if (originProblem) return originProblem;

  const proof = await getVerifiedPhone(request);
  if (!proof) {
    return apiError(503, "PHONE_VERIFICATION_UNAVAILABLE", PHONE_VERIFICATION_UNAVAILABLE_MESSAGE);
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = parseOrderRequest(body.data);
  if (!parsed.ok) return apiError(422, parsed.code, parsed.message, parsed.fields);

  try {
    const created = await placeOrder(parsed.value, proof);
    return json(
      {
        order: {
          orderNumber: created.orderNumber,
          status: "NEW",
          paymentMethod: PAYMENT_METHOD,
          totalPaise: created.totalPaise,
        },
      },
      created.replayed ? 200 : 201
    );
  } catch (err) {
    if (err instanceof QuoteError) return apiError(422, err.code, err.message);
    if (err instanceof OrderError) {
      return apiError(err.code === "IDEMPOTENCY_CONFLICT" ? 409 : 403, err.code, err.message);
    }
    throw err;
  }
});
