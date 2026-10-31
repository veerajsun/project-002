// Thin amber strip shown above the hero (Stitch white-theme variant).
// (The large "Important Fraud Alert" advisory section was removed.)
export function FraudStrip() {
  return (
    <section className="w-full border-b border-amber-200/60 bg-amber-50/80 px-4 py-2.5">
      <div className="mx-auto flex max-w-store flex-col items-center justify-between gap-3 text-charcoal-800 md:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-amber-700">
            gpp_maybe
          </span>
          {/* <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Fraud Alert:
            </span>
            <span className="text-xs text-charcoal-700">
              Ads running in our name on Facebook and Instagram are fake.
              Sabland does not run ads there.
            </span>
          </div> */}
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded border border-amber-200 bg-white px-3 py-1 text-xs font-semibold tracking-wider">
          <span className="text-charcoal-500">Official Portal:</span>
          <span className="font-bold text-honey-600 underline decoration-honey-500 underline-offset-2">
            www.sabaland.in
          </span>
        </div>
      </div>
    </section>
  );
}
