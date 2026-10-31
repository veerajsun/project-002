"use client";

import { useState, type FormEvent } from "react";
import {
  INDIAN_STATES,
  validateAddress,
  type Address,
  type AddressErrors,
} from "@/lib/checkout";

type Key = keyof Address;
const ORDER: Key[] = ["fullName", "mobile", "house", "street", "landmark", "city", "state", "pin"];

const inputBase =
  "block w-full rounded border bg-white px-4 py-3 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/70 focus:outline-none focus:ring-2 focus:ring-honey-600/30";

function Field({
  id,
  label,
  required,
  error,
  hint,
  className = "",
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-[0.1em] text-charcoal-900"
      >
        {label}
        {required ? <span className="text-red-700"> *</span> : <span className="font-normal normal-case text-charcoal-500"> (optional)</span>}
      </label>
      <div className="mt-2">{children}</div>
      {/* Fixed-height slot: an error appearing on blur must not move the buttons below */}
      <div className="mt-1.5 min-h-[1.25rem]">
        {error ? (
          <p id={`${id}-error`} className="text-sm text-red-700">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-charcoal-500">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function StepAddress({
  address,
  onChange,
  onBack,
  onContinue,
}: {
  address: Address;
  onChange: (a: Address) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [errors, setErrors] = useState<AddressErrors>({});
  const [attempted, setAttempted] = useState(false);

  function update(key: Key, value: string) {
    let v = value;
    if (key === "mobile") v = value.replace(/\D/g, "").slice(0, 10);
    if (key === "pin") v = value.replace(/\D/g, "").slice(0, 6);
    onChange({ ...address, [key]: v });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function blur(key: Key) {
    const msg = validateAddress(address)[key];
    setErrors((e) => ({ ...e, [key]: msg }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateAddress(address);
    setAttempted(true);
    setErrors(found);
    const first = ORDER.find((k) => found[k]);
    if (first) {
      document.getElementById(`co-${first}`)?.focus();
      return;
    }
    onContinue();
  }

  const cls = (key: Key) => `${inputBase} ${errors[key] ? "border-red-600" : "border-gray-200"}`;
  const aria = (key: Key) => ({
    "aria-invalid": errors[key] ? (true as const) : undefined,
    "aria-describedby": errors[key] ? `co-${key}-error` : undefined,
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="border-b border-gray-100 pb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-honey-600">
          Step 2 of 3
        </span>
        <h2 className="font-serif text-2xl text-charcoal-900 sm:text-3xl">Delivery address</h2>
        <p className="mt-1 text-sm text-charcoal-600">
          Enter the address where your order should be delivered. You can review and edit it
          again before placing the order.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="co-fullName" label="Full name" required error={errors.fullName}>
          <input
            id="co-fullName"
            type="text"
            autoComplete="name"
            value={address.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            onBlur={() => blur("fullName")}
            placeholder="Recipient's full name"
            className={cls("fullName")}
            {...aria("fullName")}
          />
        </Field>

        <Field
          id="co-mobile"
          label="Mobile number"
          required
          error={errors.mobile}
          hint="Prefilled from step 1. You can change it."
        >
          <div className="flex">
            <span className="flex items-center rounded-l border border-r-0 border-gray-200 bg-gray-50 px-3 text-[15px] text-charcoal-600">
              +91
            </span>
            <input
              id="co-mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={address.mobile}
              onChange={(e) => update("mobile", e.target.value)}
              onBlur={() => blur("mobile")}
              placeholder="10-digit mobile number"
              className={`${cls("mobile")} rounded-l-none`}
              {...aria("mobile")}
            />
          </div>
        </Field>

        <Field id="co-house" label="House / flat / building" required error={errors.house} className="sm:col-span-2">
          <input
            id="co-house"
            type="text"
            autoComplete="address-line1"
            value={address.house}
            onChange={(e) => update("house", e.target.value)}
            onBlur={() => blur("house")}
            placeholder="Flat, house number, building name"
            className={cls("house")}
            {...aria("house")}
          />
        </Field>

        <Field id="co-street" label="Street / area / locality" required error={errors.street} className="sm:col-span-2">
          <input
            id="co-street"
            type="text"
            autoComplete="address-line2"
            value={address.street}
            onChange={(e) => update("street", e.target.value)}
            onBlur={() => blur("street")}
            placeholder="Street, area or locality"
            className={cls("street")}
            {...aria("street")}
          />
        </Field>

        <Field id="co-landmark" label="Landmark" error={errors.landmark} className="sm:col-span-2">
          <input
            id="co-landmark"
            type="text"
            value={address.landmark}
            onChange={(e) => update("landmark", e.target.value)}
            onBlur={() => blur("landmark")}
            placeholder="Nearby landmark, e.g. near a temple or school"
            className={cls("landmark")}
            {...aria("landmark")}
          />
        </Field>

        <Field id="co-city" label="City / town" required error={errors.city}>
          <input
            id="co-city"
            type="text"
            autoComplete="address-level2"
            value={address.city}
            onChange={(e) => update("city", e.target.value)}
            onBlur={() => blur("city")}
            placeholder="City or town"
            className={cls("city")}
            {...aria("city")}
          />
        </Field>

        <Field id="co-state" label="State" required error={errors.state}>
          <select
            id="co-state"
            autoComplete="address-level1"
            value={address.state}
            onChange={(e) => update("state", e.target.value)}
            onBlur={() => blur("state")}
            className={cls("state")}
            {...aria("state")}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field id="co-pin" label="PIN code" required error={errors.pin} hint="6-digit Indian PIN code">
          <input
            id="co-pin"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={address.pin}
            onChange={(e) => update("pin", e.target.value)}
            onBlur={() => blur("pin")}
            placeholder="e.g. 560001"
            className={cls("pin")}
            {...aria("pin")}
          />
        </Field>
      </div>

      {attempted && Object.values(errors).some(Boolean) && (
        <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Please fix the highlighted fields to continue.
        </p>
      )}

      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 text-xs font-bold uppercase tracking-wider text-charcoal-800 transition-colors hover:bg-gray-50"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <button
          type="submit"
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-honey-500 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-honey-600"
        >
          Continue to order review
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </form>
  );
}
