"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatINR } from "@/lib/format";
import type { Address, CheckoutRow, Totals } from "@/lib/checkout";

// IMPORTANT: this screen NEVER creates, saves or confirms an order. There is no backend yet,
// so "Place order" only explains that. No order ID or confirmation is ever shown.

export default function StepReview({
  rows,
  totals,
  mode,
  mobile,
  address,
  onEdit,
  onClearDetails,
}: {
  rows: CheckoutRow[];
  totals: Totals;
  /** "preview" = phone NOT verified: Place order is disabled. "verified" needs a real service result. */
  mode: "preview" | "verified";
  mobile: string;
  address: Address;
  onEdit: (step: 1 | 2) => void;
  onClearDetails: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState(false);

  function placeOrder() {
    setAttempted(true);
    if (!confirmed) {
      setNotice(false);
      return;
    }
    // No network call, no storage write, no order ID: just an honest message.
    setNotice(true);
  }

  const lineAddress = [address.house, address.street, address.landmark]
    .map((x) => x.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="border-b border-gray-100 pb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-honey-600">
          Step 3 of 3
        </span>
        <h2 className="font-serif text-2xl text-charcoal-900 sm:text-3xl">
          Shipping &amp; order review
        </h2>
        <p className="mt-1 text-sm text-charcoal-600">
          Check everything below. Use Edit to correct your details.
        </p>
      </div>

      {/* Contact + address */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-charcoal-900">
              <span className="material-symbols-outlined text-[16px] text-honey-600">call</span>
              Contact
            </h3>
            <button
              type="button"
              onClick={() => onEdit(1)}
              className="text-[11px] font-bold uppercase tracking-wider text-honey-700 hover:underline"
            >
              Edit
            </button>
          </div>
          <p className="mt-2 text-sm font-semibold text-charcoal-900">+91 {mobile}</p>
          {mode === "verified" ? (
            <p className="mt-1 flex items-start gap-1.5 text-xs text-emerald-800">
              <span className="material-symbols-outlined icon-fill text-[16px] text-emerald-700">
                verified
              </span>
              Verified by our server.
            </p>
          ) : (
            <p className="mt-1 flex items-start gap-1.5 text-xs text-red-800">
              <span className="material-symbols-outlined icon-fill text-[16px] text-red-700">
                gpp_bad
              </span>
              Not verified (preview mode). Phone verification is not available yet.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-charcoal-900">
              <span className="material-symbols-outlined text-[16px] text-honey-600">pin_drop</span>
              Delivery address
            </h3>
            <button
              type="button"
              onClick={() => onEdit(2)}
              className="text-[11px] font-bold uppercase tracking-wider text-honey-700 hover:underline"
            >
              Edit
            </button>
          </div>
          <address className="mt-2 text-sm not-italic leading-relaxed text-charcoal-700">
            <span className="font-semibold text-charcoal-900">{address.fullName.trim()}</span>
            <br />
            {lineAddress}
            <br />
            {address.city.trim()}, {address.state} – {address.pin}
            <br />
            Mobile: +91 {address.mobile}
          </address>
        </section>
      </div>

      {/* Shipping method */}
      <section className="mt-6">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal-900">
          Shipping method
        </h3>
        <div className="mt-3 flex items-start justify-between gap-4 rounded-lg border-2 border-honey-500 bg-honey-50/40 p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined icon-fill mt-0.5 text-[22px] text-honey-600">
              local_shipping
            </span>
            <div>
              <p className="text-sm font-semibold text-charcoal-900">Standard delivery across India</p>
              <p className="mt-0.5 text-xs leading-relaxed text-charcoal-600">
                Confirmed orders are dispatched within 1–2 business days and usually
                delivered within 3–7 business days after dispatch.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-honey-700">
            Free
          </span>
        </div>
      </section>

      {/* Items */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal-900">
            Your items ({totals.itemCount})
          </h3>
          <Link
            href="/cart"
            className="text-[11px] font-bold uppercase tracking-wider text-honey-700 hover:underline"
          >
            Edit cart
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
          {rows.map((r) => (
            <li key={r.slug} className="flex items-center gap-3 p-3 sm:gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                <Image src={r.image} alt={r.name} fill sizes="64px" className="object-contain p-1" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-charcoal-900">{r.name}</p>
                <p className="text-xs text-charcoal-500">
                  Pack Size: {r.pack}
                  {r.variant ? ` · ${r.variant}` : ""}
                </p>
                <p className="text-xs text-charcoal-600">
                  {r.quantity} × {formatINR(r.unitPrice, 2)}
                </p>
              </div>
              <span className="text-sm font-bold text-charcoal-900">{formatINR(r.lineTotal, 2)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-charcoal-600">
            <dt>Subtotal</dt>
            <dd className="font-medium text-charcoal-900">{formatINR(totals.subtotal, 2)}</dd>
          </div>
          <div className="flex justify-between text-charcoal-600">
            <dt>Shipping</dt>
            <dd className="font-medium text-charcoal-900">Free (₹0.00)</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-gray-100 pt-3">
            <dt className="text-base font-bold text-charcoal-900">Total to pay on delivery</dt>
            <dd className="font-serif text-2xl font-bold text-charcoal-900">
              {formatINR(totals.total, 2)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Payment: Cash on Delivery is the ONLY method */}
      <section className="mt-6">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal-900">
          Payment method
        </h3>
        <div className="mt-3 flex items-start gap-3 rounded-lg border-2 border-honey-500 bg-honey-50/40 p-4">
          <span className="material-symbols-outlined icon-fill mt-0.5 text-[22px] text-honey-600">
            payments
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-charcoal-900">Cash on Delivery (COD)</p>
              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-honey-700">
                Only payment method
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-charcoal-600">
              Pay {formatINR(totals.total, 2)} in cash when your order arrives. No online
              payment is taken on this website.
            </p>
          </div>
        </div>
      </section>

      {/* Confirm + place order */}
      <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
        {mode === "preview" ? (
          <div className="space-y-3">
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-charcoal-900"
            >
              <p className="font-bold">
                Phone verification is not available yet. Checkout is in preview mode; no order
                can be placed.
              </p>
              <p className="mt-1.5 text-charcoal-700">
                Nothing was created, saved or sent, and there is no order ID.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => onEdit(2)}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 text-xs font-bold uppercase tracking-wider text-charcoal-800 transition-colors hover:bg-gray-50"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to address
              </button>
              <button
                type="button"
                disabled
                className="flex min-h-[48px] cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-200 px-6 text-xs font-bold uppercase tracking-wider text-charcoal-500"
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Place order unavailable (preview)
              </button>
            </div>
          </div>
        ) : (
        <>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-charcoal-700">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              setNotice(false);
            }}
            aria-describedby={attempted && !confirmed ? "co-confirm-error" : undefined}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-honey-600"
          />
          <span>I confirm that my order details above are correct.</span>
        </label>
        {attempted && !confirmed && (
          <p id="co-confirm-error" role="alert" className="text-sm text-red-700">
            Please tick the box to confirm your details.
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 text-xs font-bold uppercase tracking-wider text-charcoal-800 transition-colors hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to address
          </button>
          <button
            type="button"
            onClick={placeOrder}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-honey-500 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-honey-600"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            Place order · {formatINR(totals.total, 2)} (Cash on Delivery)
          </button>
        </div>

        </>
        )}

        <div role="status" aria-live="polite">
          {mode === "verified" && notice && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-charcoal-800">
              <p className="flex items-center gap-2 font-bold text-amber-900">
                <span className="material-symbols-outlined icon-fill text-[20px]">info</span>
                No order was created
              </p>
              <p className="mt-1.5">
                Order placement is not available yet because the store backend is not
                connected. Nothing was saved or sent, and there is no order ID. Your cart and
                details are still here. A real order will only be accepted after real mobile
                verification is connected.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-charcoal-500">
          <span>Your details are kept only in this browser tab and are not sent anywhere.</span>
          <button
            type="button"
            onClick={onClearDetails}
            className="font-semibold uppercase tracking-wider text-charcoal-500 hover:text-red-700"
          >
            Clear my details
          </button>
        </div>
      </div>
    </div>
  );
}
