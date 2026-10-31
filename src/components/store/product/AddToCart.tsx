"use client";

import { useState } from "react";
import { addToCart, MAX_QTY } from "@/lib/cart";

export default function AddToCart({
  slug,
  name,
  inStock,
}: {
  slug: string;
  name: string;
  inStock: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

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

  const stepBtn =
    "flex h-10 w-10 items-center justify-center rounded text-xl leading-none text-charcoal-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent";

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
        <div className="inline-flex h-12 w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-1 shadow-sm sm:w-36">
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
            className="text-base font-semibold text-charcoal-900"
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

        {inStock ? (
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-honey-500 px-8 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-honey-600"
          >
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            <span>Add to Cart</span>
          </button>
        ) : (
          <span className="flex h-12 flex-1 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-8 text-xs font-bold uppercase tracking-wider text-charcoal-500">
            Sold out
          </span>
        )}
      </div>

      <div role="status" aria-live="polite">
        {message && (
          <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <span className="material-symbols-outlined icon-fill mt-0.5 text-[18px]">
              check_circle
            </span>
            <span>{message}</span>
          </p>
        )}
      </div>
    </div>
  );
}
