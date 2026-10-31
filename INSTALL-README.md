# Sabaland: Product Detail Page + working Add to Cart

Project folder: C:\Users\Admin\Desktop\sabaland-frontend-step1
All paths are relative to that folder. Nothing is deleted. Homepage, StoreShell, Footer,
ProductCard, /track-order and your product data are NOT changed.

## NEW files (4)
| File | Purpose |
|---|---|
| src/app/products/[slug]/page.tsx | Product page for /products/khalta-500g, /khalta-1kg, /khalta-250g-course, /khalta-250g-direct. The folder name must be exactly [slug] with the square brackets |
| src/components/store/product/ProductGallery.tsx | Main photo + clickable thumbnails (real product photos) |
| src/components/store/product/AddToCart.tsx | Quantity stepper (1-10) + Add to Cart + confirmation |
| src/lib/cart.ts | Browser-only cart (localStorage). Stores only slug + quantity |

## CHANGED file (1)
| File | Change |
|---|---|
| src/components/store/Header.tsx | Adds an item-count badge on the bag icon (3 small additions: import, hook, badge) |

## How to apply
1. Extract this ZIP into C:\Users\Admin\Desktop\sabaland-frontend-step1
   and choose "Replace the files in the destination" (never "keep both").
2. In VS Code check that src\app\products\[slug]\page.tsx exists, and there are
   no files named "... (2).tsx".
3. If the dev server is running it reloads by itself. If a new route is not found,
   stop it (Ctrl+C), run  Remove-Item -Recurse -Force .next  then  npm run dev.
4. Open http://localhost:3000, click any product card or "View product".

## Notes
- The cart is a placeholder saved only in this browser. It is NOT an order and is not shared
  between devices. The /cart page (bag icon) is the next step, so that link still shows a 404.
- No "Buy now" button yet (checkout is not built). Cash on Delivery is the only payment shown.
- Quantity limit of 10 per product is a UI setting: MAX_QTY in src/lib/cart.ts.
- Product text comes only from your data and sabaland.in. The line "Khalta is a natural wellness
  formula crafted with traditional herbs and essential micronutrients" is the brand's own
  statement from its product pages. Please confirm it before launch.
- No stock line is shown, because sabaland.in itself is inconsistent about stock.
