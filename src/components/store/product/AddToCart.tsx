"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart, buyNow, MAX_QTY } from "@/lib/cart";

export default function AddToCart({
  slug,
  name,
  inStock,
}: {
  slug: string;
  name: string;
  inStock: boolean;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  function change(delta: number) {
    setQty((q) => Math.min(MAX_QTY, Math.max(1, q + delta)));
    setMessage(null);
  }

  function handleAdd() {
    const total = addToCart(slug, qty);
    if (total === 0) return;
    setMessage(
      `Added ${qty} × ${name} to your cart. You now have ${total} of this item in your cart.`
    );
  }

  function handleBuyNow() {
    if (!inStock || isBuyingNow) return;
    setIsBuyingNow(true);
    const finalQty = buyNow(slug, qty);
    if (finalQty > 0) {
      router.push("/checkout");
    } else {
      setIsBuyingNow(false);
    }
  }

  const stepBtn =
    "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded text-xl leading-none text-charcoal-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent";

  return (
    <div className="space-y-4">
      {/* Quantity Selector: visually balanced with label on mobile and desktop */}
      <div className="flex items-center justify-between sm:justify-start sm:gap-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-charcoal-700">
          Quantity
        </span>
        <div className="inline-flex h-11 w-32 items-center justify-between rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => change(-1)}
            disabled={qty <= 1}
            className={stepBtn}
          >
            −
          </button>
          <span
            aria-live="polite"
            aria-label={`Quantity ${qty}`}
            className="w-10 text-center text-sm sm:text-base font-semibold text-charcoal-900"
          >
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => change(1)}
            disabled={qty >= MAX_QTY}
            className={stepBtn}
          >
            +
          </button>
        </div>
      </div>

      {/* Side-by-side Add to Cart and Buy Now buttons */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {inStock ? (
          <>
            {/* ADD TO CART: Navy / Charcoal brand styling */}
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-12 sm:h-13 min-h-[48px] items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-charcoal-900 px-3 sm:px-6 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-charcoal-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal-900 focus-visible:ring-offset-2"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                shopping_bag
              </span>
              <span className="truncate">Add to Cart</span>
            </button>

            {/* BUY NOW: Golden / Honey brand styling */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isBuyingNow}
              className="flex h-12 sm:h-13 min-h-[48px] items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-honey-500 px-3 sm:px-6 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-honey-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-500 focus-visible:ring-offset-2 disabled:opacity-75 disabled:cursor-wait"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                bolt
              </span>
              <span className="truncate">
                {isBuyingNow ? "Proceeding…" : "Buy Now"}
              </span>
            </button>
          </>
        ) : (
          <span className="col-span-2 flex h-12 sm:h-13 min-h-[48px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider text-charcoal-500">
            Sold out
          </span>
        )}
      </div>

      {/* Cart Feedback */}
      <div role="status" aria-live="polite">
        {message && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-800">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined icon-fill mt-0.5 text-[18px] text-emerald-700">
                check_circle
              </span>
              <span>{message}</span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="shrink-0 font-bold uppercase underline tracking-wider text-emerald-900 hover:text-emerald-700 text-xs"
            >
              View Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
