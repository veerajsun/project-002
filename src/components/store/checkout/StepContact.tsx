
"use client";

import { useState } from "react";
import { validateMobile } from "@/lib/checkout";

const inputBase =
  "block w-full rounded border bg-white px-4 py-3 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/70 focus:outline-none focus:ring-2 focus:ring-honey-600/30";

export default function StepContact({
  initialMobile,
  onContinue,
}: {
  initialMobile: string;
  onContinue: (mobile: string) => void;
}) {
  const [mobile, setMobile] = useState(initialMobile);
  const [mobileError, setMobileError] = useState<string | null>(null);

  function handleContinue() {
    const err = validateMobile(mobile);
    setMobileError(err);

    if (!err) {
      onContinue(mobile);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      <div>
        <label
          htmlFor="co-mobile"
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-charcoal-900"
        >
          Mobile number <span className="text-red-700">*</span>
        </label>

        <div className="mt-2 flex">
          <span className="flex items-center rounded-l border border-r-0 border-gray-200 bg-gray-50 px-3 text-[15px] text-charcoal-600">
            +91
          </span>

          <input
            id="co-mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
              setMobileError(null);
            }}
            placeholder="10-digit mobile number"
            aria-invalid={mobileError ? true : undefined}
            aria-describedby={mobileError ? "co-mobile-error" : undefined}
            className={`${inputBase} rounded-l-none ${
              mobileError ? "border-red-600" : "border-gray-200"
            }`}
          />
        </div>

        <div className="mt-1.5 min-h-[1.25rem]">
          {mobileError && (
            <p id="co-mobile-error" className="text-sm text-red-700">
              {mobileError}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={handleContinue}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-honey-500 px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-honey-600 sm:w-auto"
        >
          Continue to delivery address
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
}
