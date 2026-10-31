"use client";

import { useState, type FormEvent } from "react";
import { validateMobile, validateOtpFormat } from "@/lib/checkout";
import {
  PHONE_VERIFICATION_UNAVAILABLE_MESSAGE,
  sendOtp,
  verifyOtp,
} from "@/lib/otp";

type Notice = { tone: "error" | "info"; text: string } | null;

const inputBase =
  "block w-full rounded border bg-white px-4 py-3 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/70 focus:outline-none focus:ring-2 focus:ring-honey-600/30";

const outlineBtn =
  "flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-charcoal-900 px-6 text-xs font-bold uppercase tracking-wider text-charcoal-900 transition-colors hover:bg-charcoal-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-charcoal-900";

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const tone =
    notice.tone === "error"
      ? "border-red-200 bg-red-50 text-red-900"
      : "border-gray-200 bg-gray-50 text-charcoal-700";
  return <p className={`rounded-lg border p-3 text-sm ${tone}`}>{notice.text}</p>;
}

export default function StepContact({
  initialMobile,
  previewAllowed,
  onVerified,
  onEnterPreview,
}: {
  initialMobile: string;
  previewAllowed: boolean;
  /** Called ONLY when the verification service returns a successful result. */
  onVerified: (mobile: string) => void;
  /** Design preview only. Never marks the number as verified. */
  onEnterPreview: (mobile: string) => void;
}) {
  const [mobile, setMobile] = useState(initialMobile);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendNotice, setSendNotice] = useState<Notice>(null);
  const [verifyNotice, setVerifyNotice] = useState<Notice>(null);

  function changeMobile(value: string) {
    setMobile(value.replace(/\D/g, "").slice(0, 10));
    setMobileError(null);
    setSendNotice(null);
    setVerifyNotice(null);
  }

  async function handleSend() {
    setSendNotice(null);
    setVerifyNotice(null);
    const err = validateMobile(mobile);
    setMobileError(err);
    if (err) return;
    setSending(true);
    try {
      const result = await sendOtp(mobile);
      setSendNotice(
        result.ok
          ? { tone: "info", text: "Code requested. Enter the 6-digit code you receive." }
          : { tone: "error", text: result.message }
      );
    } catch {
      setSendNotice({ tone: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setVerifyNotice(null);
    const mErr = validateMobile(mobile);
    setMobileError(mErr);
    if (mErr) return;
    const oErr = validateOtpFormat(otp);
    setOtpError(oErr);
    if (oErr) return;
    setVerifying(true);
    try {
      const result = await verifyOtp(mobile, otp);
      if (result.ok) {
        onVerified(mobile);
        return;
      }
      setVerifyNotice({ tone: "error", text: result.message });
    } catch {
      setVerifyNotice({ tone: "error", text: "Something went wrong. Please try again." });
    } finally {
      setVerifying(false);
    }
  }

  function handlePreview() {
    const err = validateMobile(mobile);
    setMobileError(err);
    if (!err) onEnterPreview(mobile);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-honey-600">
            Step 1 of 3
          </span>
          <h2 className="font-serif text-2xl text-charcoal-900 sm:text-3xl">Mobile verification</h2>
        </div>
        <span className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-800">
          Verification unavailable
        </span>
      </div>

      {/* The required message */}
      <div
        role="alert"
        className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-charcoal-900"
      >
        <span className="material-symbols-outlined icon-fill mt-0.5 text-[20px] text-red-700">
          block
        </span>
        <div>
          <p className="font-bold">{PHONE_VERIFICATION_UNAVAILABLE_MESSAGE}</p>
          <p className="mt-1.5 text-charcoal-700">
            No SMS can be sent and no code can be checked until a real SMS verification
            service is connected. Typing a code will not verify your number, and you cannot
            continue to the next steps from here.
          </p>
        </div>
      </div>

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
              onChange={(e) => changeMobile(e.target.value)}
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

        <button type="button" onClick={handleSend} disabled={sending} className={outlineBtn}>
          <span className="material-symbols-outlined text-[18px]">sms</span>
          {sending ? "Requesting…" : "Send OTP"}
        </button>

        <div role="status" aria-live="polite">
          <NoticeBox notice={sendNotice} />
        </div>
      </div>

      <form onSubmit={handleVerify} noValidate className="mt-6 space-y-4 border-t border-gray-100 pt-6">
        <div>
          <label
            htmlFor="co-otp"
            className="text-[11px] font-semibold uppercase tracking-[0.1em] text-charcoal-900"
          >
            6-digit OTP
          </label>
          <input
            id="co-otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
              setOtpError(null);
              setVerifyNotice(null);
            }}
            placeholder="······"
            aria-invalid={otpError ? true : undefined}
            aria-describedby={otpError ? "co-otp-error" : undefined}
            className={`${inputBase} mt-2 max-w-[14rem] text-center text-xl tracking-[0.5em] ${
              otpError ? "border-red-600" : "border-gray-200"
            }`}
          />
          <div className="mt-1.5 min-h-[1.25rem]">
            {otpError && (
              <p id="co-otp-error" className="text-sm text-red-700">
                {otpError}
              </p>
            )}
          </div>
        </div>

        <button type="submit" disabled={verifying} className={outlineBtn}>
          <span className="material-symbols-outlined text-[18px]">pin</span>
          {verifying ? "Checking…" : "Verify OTP"}
        </button>

        <div role="status" aria-live="polite">
          <NoticeBox notice={verifyNotice} />
        </div>
      </form>

      {/* Continue is locked: it can only unlock through onVerified(), i.e. a real service result */}
      <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
        <p className="flex items-center gap-2 text-sm text-charcoal-700">
          <span className="material-symbols-outlined text-[20px] text-red-700">gpp_bad</span>
          Verification status: <strong>Not verified</strong>
        </p>
        <button
          type="button"
          disabled
          className="flex min-h-[48px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-200 px-6 text-xs font-bold uppercase tracking-wider text-charcoal-500 sm:w-auto"
        >
          <span className="material-symbols-outlined text-[18px]">lock</span>
          Continue to delivery address
        </button>
        <p className="text-xs text-charcoal-500">
          Locked: this button needs a successful phone verification from our server.
        </p>
      </div>

      {/* Clearly separate design preview (development only) */}
      {previewAllowed && (
        <div className="mt-6 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-900">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Design preview (development only)
          </p>
          <p className="mt-2 text-sm leading-relaxed text-charcoal-800">
            This only lets you look at the screens for Steps 2 and 3. Your number is{" "}
            <strong>NOT verified</strong>, and <strong>no order can be placed</strong> in
            preview mode.
          </p>
          <button
            type="button"
            onClick={handlePreview}
            className="mt-3 flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-amber-700 bg-white px-5 text-xs font-bold uppercase tracking-wider text-amber-900 transition-colors hover:bg-amber-100"
          >
            Preview Steps 2 and 3 (no order)
          </button>
        </div>
      )}
    </div>
  );
}
