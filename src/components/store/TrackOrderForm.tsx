"use client";

import { useState, type FormEvent } from "react";

type Errors = { orderId?: string; mobile?: string };

// FRONTEND PLACEHOLDER: nothing is sent, saved or looked up.
// Live tracking will be connected when the backend is built.
export default function TrackOrderForm() {
  const [orderId, setOrderId] = useState("");
  const [mobile, setMobile] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [showNotice, setShowNotice] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const next: Errors = {};
    if (!orderId.trim()) {
      next.orderId = "Please enter your order ID.";
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      next.mobile = "Enter a valid 10-digit Indian mobile number.";
    }

    setErrors(next);
    setShowNotice(Object.keys(next).length === 0);
  }

  const inputBase =
    "block w-full rounded border bg-white px-4 py-3 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/70 focus:outline-none focus:ring-2 focus:ring-honey-600/30";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Order ID */}
      <div>
        <label
          htmlFor="order-id"
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-charcoal-900"
        >
          Order ID
        </label>
        <input
          id="order-id"
          name="orderId"
          type="text"
          autoComplete="off"
          value={orderId}
          onChange={(e) => {
            setOrderId(e.target.value);
            setShowNotice(false);
          }}
          placeholder="Enter your order ID"
          aria-invalid={errors.orderId ? true : undefined}
          aria-describedby={errors.orderId ? "order-id-error" : undefined}
          className={`${inputBase} mt-2 ${
            errors.orderId ? "border-red-600" : "border-hairline"
          }`}
        />
        {errors.orderId && (
          <p id="order-id-error" className="mt-1.5 text-sm text-red-700">
            {errors.orderId}
          </p>
        )}
      </div>

      {/* Mobile number */}
      <div>
        <label
          htmlFor="mobile"
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-charcoal-900"
        >
          Mobile number
        </label>
        <div className="mt-2 flex">
          <span className="flex items-center rounded-l border border-r-0 border-hairline bg-surface-muted px-3 text-[15px] text-charcoal-600">
            +91
          </span>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value.replace(/\D/g, ""));
              setShowNotice(false);
            }}
            placeholder="10-digit mobile number"
            aria-invalid={errors.mobile ? true : undefined}
            aria-describedby={errors.mobile ? "mobile-error" : undefined}
            className={`${inputBase} rounded-l-none ${
              errors.mobile ? "border-red-600" : "border-hairline"
            }`}
          />
        </div>
        {errors.mobile && (
          <p id="mobile-error" className="mt-1.5 text-sm text-red-700">
            {errors.mobile}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="flex min-h-[48px] w-full items-center justify-center rounded bg-charcoal-900 px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-charcoal-800"
      >
        Track Order
      </button>

      {/* Shown only after a valid submit. This is NOT a tracking result. */}
      <div aria-live="polite">
        {showNotice && (
          <div className="rounded-lg border border-honey-100 bg-honey-50 p-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-honey-700">
              <span className="material-symbols-outlined icon-fill text-[20px]">
                info
              </span>
              Live tracking is not available yet
            </p>
            <p className="mt-2 text-sm leading-6 text-charcoal-700">
              Order tracking will work once our backend is connected. Nothing
              you entered was sent or saved, and no tracking status is shown
              here.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
