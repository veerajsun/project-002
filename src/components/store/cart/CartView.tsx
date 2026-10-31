"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MAX_QTY,
  clearCart,
  removeFromCart,
  setQuantity,
  useCart,
} from "@/lib/cart";
import { getProduct, products, shortName, discountPercent } from "@/data/products";
import { formatINR } from "@/lib/format";
import ProductCard, { packLabel, variantOf } from "../ProductCard";

// The /checkout page now exists, so "Proceed to Checkout" is a normal link.
// (Set this back to false to show the "not available yet" notice instead.)
const CHECKOUT_READY = true;
const CHECKOUT_PATH = "/checkout";

const stepBtn =
  "flex h-8 w-8 items-center justify-center rounded text-lg leading-none text-charcoal-900 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent";

const checkoutBtnClass =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-honey-500 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-honey-600";

export default function CartView() {
  const { lines, count } = useCart();

  // The cart lives in the browser, so wait until the page has loaded before
  // deciding it is empty (avoids a flash of "empty cart").
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const [confirmClear, setConfirmClear] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState(false);
  const [removed, setRemoved] = useState<string | null>(null);

  const rows = lines.flatMap((line) => {
    const product = getProduct(line.slug);
    return product ? [{ line, product }] : [];
  });

  // All amounts are calculated from src/data/products.ts
  const subtotal = rows.reduce((sum, r) => sum + r.product.price * r.line.quantity, 0);
  const savings = rows.reduce(
    (sum, r) => sum + (r.product.mrp - r.product.price) * r.line.quantity,
    0
  );
  const total = subtotal; // shipping is free across India; no other charges are added here
  const others = products.filter((p) => !rows.some((r) => r.product.slug === p.slug));

  if (!ready) {
    return (
      <section className="mx-auto max-w-store px-6 py-16 lg:px-12">
        <p className="text-sm text-charcoal-500">Loading your cart…</p>
        <div className="min-h-[50vh]" />
      </section>
    );
  }

  /* ---------- Empty cart ---------- */
  if (rows.length === 0) {
    return (
      <section className="w-full bg-white py-16 lg:py-24">
        <div className="mx-auto flex max-w-xl flex-col items-center px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-honey-100 bg-honey-50 text-honey-600">
            <span className="material-symbols-outlined text-[36px]">local_mall</span>
          </div>
          <h1 className="mt-6 font-serif text-3xl text-charcoal-900 sm:text-4xl">
            Your cart is empty
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal-600">
            Browse our Khalta honey range and add your favourite pack. Free shipping
            across India, paid by Cash on Delivery.
          </p>
          <Link
            href="/#catalog"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-honey-500 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-honey-600"
          >
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            Browse products
          </Link>
        </div>
      </section>
    );
  }

  /* ---------- Cart with items ---------- */
  return (
    <>
      {/* Title + shipping banner */}
      <section className="w-full border-b border-gray-100 bg-white pb-8 pt-10 lg:pt-14">
        <div className="mx-auto max-w-store px-6 lg:px-12">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex items-center gap-2 text-xs uppercase tracking-wider text-charcoal-500"
          >
            <Link href="/" className="transition-colors hover:text-honey-600">
              Home
            </Link>
            <span className="material-symbols-outlined text-[14px] text-gray-400">
              chevron_right
            </span>
            <span className="font-semibold text-charcoal-900">Shopping bag</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-honey-600">
              <span className="h-1.5 w-1.5 rounded-full bg-honey-500" />
              Your order
            </span>
            <h1 className="mt-2 font-serif text-4xl tracking-tight text-charcoal-900 sm:text-5xl">
              Your Shopping Bag
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-charcoal-600">
              Review your items before checkout. Free shipping across India. Pay by
              Cash on Delivery.
            </p>
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-2 rounded-xl border border-honey-100 bg-honey-50 p-4 sm:flex-row sm:items-center">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-charcoal-900">
              <span className="material-symbols-outlined icon-fill text-[20px] text-honey-600">
                local_shipping
              </span>
              Free shipping across India on your order
            </span>
            <span className="rounded bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-honey-700">
              Free shipping applied
            </span>
          </div>
        </div>
      </section>

      {/* Items + summary */}
      <section className="w-full bg-gray-50 py-10 lg:py-14">
        <div className="mx-auto max-w-store px-6 lg:px-12">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* Items */}
            <div className="flex flex-col gap-4 lg:col-span-8">
              <div className="hidden grid-cols-12 gap-5 px-5 pb-1 text-[11px] font-semibold uppercase tracking-widest text-charcoal-500 md:grid">
                <div className="col-span-6">Item</div>
                <div className="col-span-2 text-center">Unit price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Line total</div>
              </div>

              {rows.map(({ line, product }) => {
                const name = shortName(product);
                const variant = variantOf(product.name);
                const lineTotal = product.price * line.quantity;
                return (
                  <article
                    key={product.slug}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12 md:gap-5">
                      {/* Image + details */}
                      <div className="flex items-start gap-4 md:col-span-6">
                        <Link
                          href={`/products/${product.slug}`}
                          aria-label={name}
                          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 sm:h-28 sm:w-28"
                        >
                          <Image
                            src={product.images[0]}
                            alt={name}
                            fill
                            sizes="112px"
                            className="object-contain p-2"
                          />
                        </Link>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-honey-600">
                            Khalta{variant ? ` · ${variant}` : ""}
                          </span>
                          <h2 className="mt-0.5 font-serif text-lg leading-snug text-charcoal-900">
                            <Link
                              href={`/products/${product.slug}`}
                              className="hover:text-honey-600"
                            >
                              {name}
                            </Link>
                          </h2>
                          <div className="mt-2 inline-block rounded-md border border-amber-200/50 bg-amber-50/80 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Pack Size: {packLabel(product.grams)}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                removeFromCart(product.slug);
                                setRemoved(name);
                              }}
                              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 transition-colors hover:text-red-700"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Unit price */}
                      <div className="flex items-baseline justify-between md:col-span-2 md:flex-col md:items-center md:justify-center">
                        <span className="text-[11px] font-semibold uppercase text-charcoal-500 md:hidden">
                          Price
                        </span>
                        <div className="text-right md:text-center">
                          <div className="text-sm font-semibold text-charcoal-900">
                            {formatINR(product.price, 2)}
                          </div>
                          <div className="text-xs text-charcoal-500 line-through">
                            {formatINR(product.mrp, 2)}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-honey-700">
                            Save {discountPercent(product)}%
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center justify-between md:col-span-2 md:justify-center">
                        <span className="text-[11px] font-semibold uppercase text-charcoal-500 md:hidden">
                          Quantity
                        </span>
                        <div className="flex flex-col items-end gap-1 md:items-center">
                          <div className="flex items-center rounded-lg bg-gray-100 p-1">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${name}`}
                              onClick={() => setQuantity(product.slug, line.quantity - 1)}
                              disabled={line.quantity <= 1}
                              className={stepBtn}
                            >
                              −
                            </button>
                            <span
                              aria-label={`Quantity of ${name}: ${line.quantity}`}
                              className="w-8 text-center text-sm font-semibold text-charcoal-900"
                            >
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${name}`}
                              onClick={() => setQuantity(product.slug, line.quantity + 1)}
                              disabled={line.quantity >= MAX_QTY}
                              className={stepBtn}
                            >
                              +
                            </button>
                          </div>
                          {line.quantity >= MAX_QTY && (
                            <span className="text-[10px] text-charcoal-500">
                              Maximum {MAX_QTY} per item
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Line total */}
                      <div className="flex items-baseline justify-between md:col-span-2 md:flex-col md:items-end md:justify-center">
                        <span className="text-[11px] font-semibold uppercase text-charcoal-500 md:hidden">
                          Line total
                        </span>
                        <div className="text-base font-bold text-charcoal-900">
                          {formatINR(lineTotal, 2)}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* Screen-reader message after removing an item */}
              <div role="status" aria-live="polite" className="sr-only">
                {removed ? `${removed} removed from your cart.` : ""}
              </div>

              {/* Continue shopping / clear */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  href="/#catalog"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-charcoal-900 transition-colors hover:text-honey-600"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Continue shopping
                </Link>

                {confirmClear ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-charcoal-600">Remove all items?</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearCart();
                        setConfirmClear(false);
                        setRemoved("All items");
                      }}
                      className="rounded border border-red-200 bg-red-50 px-3 py-1.5 font-bold uppercase tracking-wider text-red-700 transition-colors hover:bg-red-100"
                    >
                      Yes, clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="rounded border border-gray-300 bg-white px-3 py-1.5 font-bold uppercase tracking-wider text-charcoal-700 transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 transition-colors hover:text-red-700"
                  >
                    Clear bag
                  </button>
                )}
              </div>
            </div>

            {/* Order summary */}
            <aside className="lg:col-span-4">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md lg:sticky lg:top-32">
                <div className="flex items-center justify-between pb-3">
                  <h2 className="font-serif text-2xl text-charcoal-900">Order Summary</h2>
                  <span className="rounded bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal-600">
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                </div>

                <dl className="space-y-3 border-y border-gray-100 py-4 text-sm">
                  <div className="flex items-center justify-between text-charcoal-600">
                    <dt>Subtotal</dt>
                    <dd className="font-medium text-charcoal-900">{formatINR(subtotal, 2)}</dd>
                  </div>
                  <div className="flex items-center justify-between text-charcoal-600">
                    <dt>Shipping across India</dt>
                    <dd className="text-xs font-bold uppercase tracking-wide text-honey-700">
                      Free
                    </dd>
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center justify-between rounded bg-emerald-50 px-2.5 py-2 text-emerald-700">
                      <dt className="flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[16px]">savings</span>
                        You save
                      </dt>
                      <dd className="font-bold">{formatINR(savings, 2)}</dd>
                    </div>
                  )}
                </dl>

                <div className="flex items-baseline justify-between pb-5 pt-4">
                  <div>
                    <span className="text-base font-bold text-charcoal-900">Total</span>
                    <span className="block text-[11px] uppercase tracking-wider text-charcoal-500">
                      Pay on delivery
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-3xl font-bold text-charcoal-900">
                      {formatINR(total, 2)}
                    </span>
                    <span className="block text-[11px] font-medium text-charcoal-500">INR</span>
                  </div>
                </div>

                {CHECKOUT_READY ? (
                  <Link href={CHECKOUT_PATH} className={checkoutBtnClass}>
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    Proceed to Checkout
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCheckoutNotice(true)}
                    className={checkoutBtnClass}
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    Proceed to Checkout
                  </button>
                )}

                <div role="status" aria-live="polite">
                  {checkoutNotice && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg border border-honey-100 bg-honey-50 p-3 text-xs leading-relaxed text-charcoal-700">
                      <span className="material-symbols-outlined icon-fill mt-0.5 text-[16px] text-honey-700">
                        info
                      </span>
                      <span>
                        Checkout is not available yet. It will be added in the next
                        step, so no order can be placed right now. Your cart is saved
                        in this browser.
                      </span>
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-2.5 border-t border-gray-100 pt-5 text-xs text-charcoal-600">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-honey-600">payments</span>
                    <span>Cash on Delivery only. Pay in cash when your order arrives.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-honey-600">inventory_2</span>
                    <span>100% discreet packaging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-honey-600">local_shipping</span>
                    <span>Free shipping across India</span>
                  </div>
                </div>

                <p className="mt-5 text-center text-xs text-charcoal-500">
                  Questions about your order?{" "}
                  <a
                    href="mailto:support@sabaland.in"
                    className="font-semibold text-honey-700 hover:underline"
                  >
                    support@sabaland.in
                  </a>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Add more */}
      {others.length > 0 && (
        <section className="w-full bg-white py-14 lg:py-16">
          <div className="mx-auto max-w-store px-6 lg:px-12">
            <div className="space-y-2 border-b border-gray-100 pb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                More from Sabland
              </span>
              <h2 className="font-serif text-3xl text-charcoal-900 sm:text-4xl">
                Add more to your order
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
