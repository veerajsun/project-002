# Sabaland: 3-step Cash on Delivery checkout (/checkout)

Project folder: C:\Users\Admin\Desktop\sabaland-frontend-step1
All paths are relative to that folder. Nothing is deleted. Homepage, product pages, Header,
Footer, StoreShell, Track Order, products.ts and src/lib/cart.ts are NOT changed.

## NEW files (6)
| File | Purpose |
|---|---|
| src/app/checkout/page.tsx | The /checkout route (header + footer via StoreShell) |
| src/components/store/checkout/CheckoutFlow.tsx | Wizard container: stepper, order summary, step rules |
| src/components/store/checkout/StepContact.tsx | Step 1: +91 mobile + 6-digit OTP UI (development placeholder) |
| src/components/store/checkout/StepAddress.tsx | Step 2: delivery address with validation |
| src/components/store/checkout/StepReview.tsx | Step 3: review, Cash on Delivery, Place order (creates nothing) |
| src/lib/checkout.ts | Validation, list of states/UTs, tab-only saved details |

## CHANGED file (1)
| File | Change |
|---|---|
| src/components/store/cart/CartView.tsx | One constant: CHECKOUT_READY = true, so "Proceed to Checkout" now links to /checkout |

## How to apply
1. Extract this ZIP into C:\Users\Admin\Desktop\sabaland-frontend-step1
   and choose "Replace the files in the destination" (never "keep both").
2. Restart the dev server (new files use new Tailwind classes). In a VS Code PowerShell terminal:
       taskkill /F /IM node.exe
       Remove-Item -Recurse -Force .next
       npm.cmd run dev
3. In Chrome press Ctrl+0, add a product to the cart, open /cart, click Proceed to Checkout.

## What is real and what is a placeholder
- Cart: read through the existing useCart(); checkout never changes it.
- Step 1: NO SMS is sent and NO OTP is verified. The screen says so, and the number stays
  "Not verified". You can continue in preview mode.
- Step 3: "Place order" creates, saves and sends NOTHING. No order ID, no confirmation.
- Cash on Delivery is the only payment shown.
- Mobile + address are kept only in this browser tab (sessionStorage) so a refresh does not lose
  them. They are never sent anywhere. "Clear my details" removes them.
