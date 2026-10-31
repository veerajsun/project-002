# Sabaland: Cart page (/cart)

Project folder: C:\Users\Admin\Desktop\sabaland-frontend-step1
All paths are relative to that folder. Nothing is deleted. Homepage, product pages, Header,
Footer, StoreShell, /track-order and src/data/products.ts are NOT changed.

## NEW files (2)
| File | Purpose |
|---|---|
| src/app/cart/page.tsx | The /cart route (header + footer via StoreShell) |
| src/components/store/cart/CartView.tsx | Cart items, quantity controls, remove, clear bag, order summary, empty state |

## CHANGED file (1)
| File | Change |
|---|---|
| src/lib/cart.ts | Same cart, same storage key "sabaland-cart-v1", same [{slug, quantity}] format. Adds 3 functions: setQuantity, removeFromCart, clearCart |

## How to apply
1. Extract this ZIP into C:\Users\Admin\Desktop\sabaland-frontend-step1
   and choose "Replace the files in the destination" (never "keep both").
2. IMPORTANT, restart the dev server (new files use new Tailwind classes). In a VS Code
   PowerShell terminal:
       taskkill /F /IM node.exe
       Remove-Item -Recurse -Force .next
       npm.cmd run dev
3. In Chrome press Ctrl+0 (100% zoom), open http://localhost:3000/products/khalta-1kg,
   add to cart, then click the bag icon: it opens /cart.

## Notes
- Amounts are calculated from src/data/products.ts: subtotal = sum of price x quantity,
  "You save" = sum of (MRP - price) x quantity, total = subtotal (shipping is free).
- "Proceed to Checkout" is a button that only shows a notice, because checkout is not built yet.
  When the /checkout page exists, set CHECKOUT_READY to true in CartView.tsx.
- Cash on Delivery is the only payment shown. No promo code, GST or card/UPI options.
- The cart is saved only in this browser (localStorage). It is not an order.
