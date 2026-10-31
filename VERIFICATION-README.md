# Sabaland: checkout phone-verification fix

Project folder: C:\Users\Admin\Desktop\sabaland-frontend-step1
All paths are relative to that folder. Nothing is deleted. Homepage, product pages, cart, Header,
Footer, StoreShell, Track Order, StepAddress.tsx and src/data/products.ts are NOT changed.

## NEW files (2)
| File | Purpose |
|---|---|
| src/lib/otp.ts | The ONLY place phone verification can come from. sendOtp()/verifyOtp() always answer "unavailable" until a real server service replaces them |
| scripts/check-checkout-verification.mjs | Check script: throws fake OTPs / numbers at the code and scans the source for fake-verification patterns |

## CHANGED files (4)
| File | Change |
|---|---|
| src/lib/checkout.ts | Adds the step gate (isFlowOpen, effectiveStep) and the development-only preview switch |
| src/components/store/checkout/CheckoutFlow.tsx | Steps 2 and 3 need a real verification result (or the dev-only preview). Access lives in memory only |
| src/components/store/checkout/StepContact.tsx | Step 1: required message, Continue locked, Send/Verify always end in "Not verified" |
| src/components/store/checkout/StepReview.tsx | Place order is disabled in preview mode; no order, no order ID |

## How to apply
1. Extract this ZIP into C:\Users\Admin\Desktop\sabaland-frontend-step1
   and choose "Replace the files in the destination" (never "keep both"). A new folder "scripts" is created.
2. Restart the dev server:
       taskkill /F /IM node.exe
       Remove-Item -Recurse -Force .next
       npm.cmd run dev
3. Run the check script (needs no new packages):
       node scripts\check-checkout-verification.mjs
   It must end with: ALL VERIFICATION CHECKS PASSED

## Behaviour now
- Step 1 always shows: "Phone verification is not available yet. Checkout is in preview mode; no order can be placed."
- No number and no code (123456, 000000, any random code) can verify anything. Continue stays locked.
- Development (npm run dev): a clearly marked "Design preview" box lets you look at Steps 2 and 3. A PREVIEW
  banner shows on every screen, the number is "Not verified", and "Place order unavailable (preview)" is disabled.
- Production build (npm run build / start): there is NO preview. Nobody can pass Step 1.
  (To allow the preview in a production build on purpose: set NEXT_PUBLIC_CHECKOUT_PREVIEW=true in .env.local.)
- Refreshing the page always returns to Step 1. Verification is never saved in the browser.

## What stays blocked until the real OTP backend exists
- Verifying a phone number, and therefore Step 2 and Step 3 for customers.
- Placing any order. No order is ever created, saved or sent, and no order ID or confirmation exists.

## What the real backend must do (not built yet)
1. Connect an SMS provider on the SERVER; send a code to the number; store only a hash of it with an expiry,
   an attempt limit and rate limits.
2. Replace sendOtp()/verifyOtp() in src/lib/otp.ts with calls to your own server endpoints.
3. After a correct code, the server remembers "this browser session verified this number" (for example in a
   signed, httpOnly session). The browser's "ok" is only for the screen.
4. The order-creation endpoint must re-check that server-side verification itself before saving any order.
