import type { Metadata } from "next";
import Link from "next/link";
import StoreShell from "@/components/store/StoreShell";
import TrackOrderForm from "@/components/store/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Order | Sabland Yemeny Honey",
  description: "Track your Sabland order.",
};

export default function TrackOrderPage() {
  return (
    <StoreShell>
      <main className="mx-auto max-w-store px-5 py-12 sm:px-6 lg:px-12 lg:py-16">
        <nav aria-label="Breadcrumb" className="text-xs text-charcoal-500">
          <Link href="/" className="hover:text-honey-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-charcoal-800">Track order</span>
        </nav>

        <div className="mx-auto mt-8 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-honey-100 bg-honey-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-honey-700">
            <span className="h-1.5 w-1.5 rounded-full bg-honey-600" />
            Live tracking coming soon
          </span>

          <h1 className="mt-4 font-serif text-4xl leading-tight text-charcoal-900 sm:text-5xl">
            Track your order
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-charcoal-600">
            Enter your order ID and the mobile number used for the order. Live
            tracking will be available after our backend is connected, so for
            now this form does not look up any order.
          </p>

          <div className="mt-8 rounded-2xl border border-hairline bg-white p-5 shadow-flyout sm:p-8">
            <TrackOrderForm />
          </div>

          <div className="mt-6 rounded-lg border border-hairline bg-surface-muted p-5 text-sm leading-6 text-charcoal-600">
            <p className="font-semibold text-charcoal-900">
              Already placed an order?
            </p>
            <p className="mt-1">
              Once your order ships, tracking details are sent to you by email
              or SMS. For any help, email{" "}
              <a
                href="mailto:support@sabaland.in"
                className="font-semibold text-honey-700 hover:underline"
              >
                support@sabaland.in
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </StoreShell>
  );
}
