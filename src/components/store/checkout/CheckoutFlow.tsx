"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { getProduct, shortName } from "@/data/products";
import { formatINR } from "@/lib/format";
import {
  EMPTY_DRAFT,
  clearDraft,
  loadDraft,
  saveDraft,
  validateAddress,
  validateMobile,
  type Address,
  type CheckoutRow,
  type Draft,
  type Totals,
} from "@/lib/checkout";
import { packLabel, variantOf } from "../ProductCard";
import StepContact from "./StepContact";
import StepAddress from "./StepAddress";
import StepReview from "./StepReview";

const STEPS = [
  { n: 1, title: "Mobile verification" },
  { n: 2, title: "Delivery address" },
  { n: 3, title: "Order review" },
] as const;

function SummaryBody({ rows, totals }: { rows: CheckoutRow[]; totals: Totals }) {
  return (
    <div>
      <ul className="divide-y divide-gray-100">
        {rows.map((r) => (
          <li key={r.slug} className="flex items-start gap-3 py-3 first:pt-0">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
              <Image src={r.image} alt={r.name} fill sizes="56px" className="object-contain p-1" />
              <span className="absolute -right-0 -top-0 flex h-5 min-w-[20px] items-center justify-center rounded-bl bg-charcoal-900 px-1 text-[10px] font-bold text-white">
                {r.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug text-charcoal-900">{r.name}</p>
              <p className="text-xs text-charcoal-500">
                {r.pack}
                {r.variant ? ` · ${r.variant}` : ""} · {formatINR(r.unitPrice)} each
              </p>
            </div>
            <span className="text-sm font-semibold text-charcoal-900">
              {formatINR(r.lineTotal, 2)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-3 space-y-2.5 border-t border-gray-100 pt-4 text-sm">
        <div className="flex justify-between text-charcoal-600">
          <dt>Subtotal ({totals.itemCount} {totals.itemCount === 1 ? "item" : "items"})</dt>
          <dd className="font-medium text-charcoal-900">{formatINR(totals.subtotal, 2)}</dd>
        </div>
        <div className="flex justify-between text-charcoal-600">
          <dt>Shipping across India</dt>
          <dd className="text-xs font-bold uppercase tracking-wide text-honey-700">Free (₹0.00)</dd>
        </div>
        {totals.savings > 0 && (
          <div className="flex justify-between text-emerald-700">
            <dt>You save</dt>
            <dd className="font-semibold">{formatINR(totals.savings, 2)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-4">
        <div>
          <span className="text-base font-bold text-charcoal-900">Total</span>
          <span className="block text-[11px] uppercase tracking-wider text-charcoal-500">
            Pay on delivery
          </span>
        </div>
        <span className="font-serif text-2xl font-bold text-charcoal-900">
          {formatINR(totals.total, 2)}
        </span>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-charcoal-600">
        <span className="material-symbols-outlined mt-0.5 text-[16px] text-honey-600">payments</span>
        <span>Payment method: Cash on Delivery only.</span>
      </p>
    </div>
  );
}


export default function CheckoutFlow() {
  const { lines } = useCart();


  // Cart + saved details live in the browser: wait for the page to load first.
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  useEffect(() => {
    setDraft(loadDraft());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) saveDraft(draft);
  }, [draft, loaded]);

  // Move focus to the step panel when the step changes (not on first load)
  const panelRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  // Items and totals come from the existing cart + product data. Checkout never changes the cart.
  const rows: CheckoutRow[] = lines.flatMap((line) => {
    const p = getProduct(line.slug);
    return p
      ? [
          {
            slug: p.slug,
            name: shortName(p),
            image: p.images[0],
            pack: packLabel(p.grams),
            variant: variantOf(p.name),
            quantity: line.quantity,
            unitPrice: p.price,
            mrp: p.mrp,
            lineTotal: p.price * line.quantity,
          },
        ]
      : [];
  });
  const subtotal = rows.reduce((s, r) => s + r.lineTotal, 0);
  const totals: Totals = {
    itemCount: rows.reduce((s, r) => s + r.quantity, 0),
    subtotal,
    savings: rows.reduce((s, r) => s + (r.mrp - r.unitPrice) * r.quantity, 0),
    total: subtotal,
  };

  // Steps 2 and 3 need a verified phone (or the development-only preview), plus valid details.
  const mobileOk = validateMobile(draft.mobile) === null;
const addressOk = Object.keys(validateAddress(draft.address)).length === 0;
const step = draft.step;

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    panelRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView({ block: "start" });
  }, [step]);

  const goTo = (next: 1 | 2 | 3) => setDraft((d) => ({ ...d, step: next }));
  const setAddress = (address: Address) => setDraft((d) => ({ ...d, address }));
  const resetAll = () => {
  clearDraft();
  setDraft(EMPTY_DRAFT);
};

  if (!loaded) {
    return (
      <section className="mx-auto max-w-store px-6 py-16 lg:px-12">
        <p className="text-sm text-charcoal-500">Loading checkout…</p>
        <div className="min-h-[50vh]" />
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section className="w-full py-16 lg:py-24">
        <div className="mx-auto flex max-w-xl flex-col items-center px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-honey-100 bg-honey-50 text-honey-600">
            <span className="material-symbols-outlined text-[36px]">local_mall</span>
          </div>
          <h1 className="mt-6 font-serif text-3xl text-charcoal-900 sm:text-4xl">
            Your cart is empty
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal-600">
            Add a product to your cart before checking out.
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

  return (
    <div className="mx-auto max-w-store px-6 py-10 lg:px-12 lg:py-14">
      {/* Title */}
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wider text-charcoal-500"
      >
        <Link href="/" className="transition-colors hover:text-honey-600">Home</Link>
        <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
        <Link href="/cart" className="transition-colors hover:text-honey-600">Cart</Link>
        <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
        <span className="font-semibold text-charcoal-900">Checkout</span>
      </nav>
      <h1 className="font-serif text-4xl tracking-tight text-charcoal-900 sm:text-5xl">Checkout</h1>
      <p className="mt-2 text-[15px] text-charcoal-600">
        Cash on Delivery only. Your cart stays unchanged while you check out.
      </p>

      {/* Mobile order summary (collapsible) */}
      <details className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-charcoal-900">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-honey-600">shopping_bag</span>
            Order summary ({totals.itemCount})
          </span>
          <span className="font-serif text-lg">{formatINR(totals.total, 2)}</span>
        </summary>
        <div className="border-t border-gray-100 p-4">
          <SummaryBody rows={rows} totals={totals} />
        </div>
      </details>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
  <section className="lg:col-span-7">

          {/* Stepper */}
          <ol className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Checkout steps">
            {STEPS.map((s, i) => {
              const done = s.n < step;
              const current = s.n === step;
              return (
                <li key={s.n} className="flex flex-1 items-center last:flex-none">
                  <button
                    type="button"
                    disabled={!done}
                    onClick={() => goTo(s.n)}
                    aria-current={current ? "step" : undefined}
                    className="group flex items-center gap-2 text-left disabled:cursor-default"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-honey-600 text-white"
                          : current
                          ? "bg-charcoal-900 text-white"
                          : "bg-gray-100 text-charcoal-500"
                      }`}
                    >
                      {done ? (
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      ) : (
                        s.n
                      )}
                    </span>
                    <span className="hidden sm:block">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-honey-600">
                        Step {s.n}
                      </span>
                      <span
                        className={`block text-[13px] font-semibold ${
                          current || done ? "text-charcoal-900" : "text-charcoal-500"
                        }`}
                      >
                        {s.title}
                      </span>
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <span
                      className={`mx-2 h-0.5 flex-1 sm:mx-3 ${done ? "bg-honey-500" : "bg-gray-200"}`}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {/* Active step */}
<div ref={panelRef} tabIndex={-1} className="outline-none">
  {step === 1 && (
    <StepContact
      initialMobile={draft.mobile}
      onContinue={(mobile: string) => {
        setDraft((current) => ({
          ...current,
          mobile,
          address: {
            ...current.address,
            mobile,
          },
        }));
        goTo(2);
      }}
    />
  )}

  {step === 2 && (
    <StepAddress
      address={draft.address}
      onChange={setAddress}
      onBack={() => goTo(1)}
      onContinue={() => goTo(3)}
    />
  )}
            {step === 3 && (
              <StepReview
                rows={rows}
                totals={totals}
                address={draft.address}
                onEdit={() => goTo(2)}
                onClearDetails={resetAll}
              />
            )}
          </div>

          </section>

        {/* Desktop order summary */}
        <aside className="hidden lg:col-span-5 lg:block">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md lg:sticky lg:top-32">
            <div className="flex items-center justify-between pb-4">
              <h2 className="font-serif text-2xl text-charcoal-900">Order summary</h2>
              <Link
                href="/cart"
                className="text-[11px] font-bold uppercase tracking-wider text-honey-700 hover:underline"
              >
                Edit cart
              </Link>
            </div>
            <SummaryBody rows={rows} totals={totals} />
          </div>
                </aside>
      </div>
    </div>
  );
}