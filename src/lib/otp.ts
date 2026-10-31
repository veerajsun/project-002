// PHONE VERIFICATION SERVICE (NOT CONNECTED).
//
// There is no SMS provider and no server-side verification yet, so NOTHING in this project can
// verify a phone number. Both functions below always answer "unavailable":
//   - they never send an SMS,
//   - they never accept any code (not "123456", not a random code, not a demo code),
//   - they never return a verified result.
//
// The rest of the checkout can only unlock Step 2 when verifyOtp() returns { ok: true }.
// That cannot happen until this file is replaced by calls to a REAL server endpoint that
// talks to an SMS provider and checks the code on the server. When that exists:
//   1. sendOtp()   -> POST to your server, which asks the SMS provider to text the code.
//   2. verifyOtp() -> POST to your server, which compares the code and answers ok / not ok.
//   3. The ORDER endpoint must ALSO re-check verification on the server before saving an
//      order. The browser's "ok" is only for the screen; it is never proof by itself.
import { validateMobile, validateOtpFormat } from "./checkout";

export const PHONE_VERIFICATION_UNAVAILABLE_MESSAGE =
  "Phone verification is not available yet. Checkout is in preview mode; no order can be placed.";

export type SendOtpResult =
  | { ok: true }
  | { ok: false; reason: "invalid-mobile" | "unavailable"; message: string };

export type VerifyOtpResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid-mobile" | "invalid-otp-format" | "unavailable";
      message: string;
    };

export async function sendOtp(mobile: string): Promise<SendOtpResult> {
  const mobileError = validateMobile(mobile);
  if (mobileError) return { ok: false, reason: "invalid-mobile", message: mobileError };
  // NOT IMPLEMENTED: no SMS provider is connected, so nothing is sent.
  return {
    ok: false,
    reason: "unavailable",
    message: `No SMS was sent. ${PHONE_VERIFICATION_UNAVAILABLE_MESSAGE}`,
  };
}

export async function verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResult> {
  const mobileError = validateMobile(mobile);
  if (mobileError) return { ok: false, reason: "invalid-mobile", message: mobileError };
  const otpError = validateOtpFormat(otp);
  if (otpError) return { ok: false, reason: "invalid-otp-format", message: otpError };
  // NOT IMPLEMENTED: the code is NOT compared with anything. Nothing can be verified yet.
  return {
    ok: false,
    reason: "unavailable",
    message: `Not verified. ${PHONE_VERIFICATION_UNAVAILABLE_MESSAGE}`,
  };
}
