import Link from "next/link";

// Content comes from https://sabaland.in/policies/shipping-policy
// (processing time, delivery time, tracking, address). Payment line = COD only.
const ITEMS = [
  {
    icon: "local_shipping",
    title: "Free shipping",
    text: "Free shipping across India.",
  },
  {
    icon: "inventory_2",
    title: "Order processing",
    text: "Confirmed orders are processed and dispatched within 1–2 business days. Orders placed on weekends or public holidays are processed on the next working day.",
  },
  {
    icon: "schedule",
    title: "Delivery time",
    text: "Most orders are delivered within 3–7 business days after dispatch. Timing can vary with courier operations, weather or other unforeseen circumstances.",
  },
  {
    icon: "track_changes",
    title: "Order tracking",
    text: "Once your order ships, tracking details are sent to you by email or SMS.",
    link: true,
  },
  {
    icon: "payments",
    title: "Cash on Delivery",
    text: "Pay in cash when your order arrives. This store does not take online payments.",
  },
  {
    icon: "pin_drop",
    title: "Delivery address",
    text: "Please enter a correct and complete address. Delivery issues caused by incorrect address details are not the responsibility of Sabland.",
  },
];

export default function DeliverySection() {
  return (
    <section
      id="delivery"
      className="w-full scroll-mt-32 border-b border-gray-200/80 bg-gray-50 py-16"
    >
      <div className="mx-auto max-w-store px-6 lg:px-12">
        <div className="space-y-2 pb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
            Delivery
          </span>
          <h2 className="font-serif text-3xl text-charcoal-900 sm:text-4xl">
            Delivery Information
          </h2>
          <p className="max-w-2xl text-sm text-charcoal-600">
            Orders are shipped through trusted third-party courier partners.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-honey-100 bg-honey-50 text-honey-600">
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              </div>
              <h3 className="mt-3 font-serif text-lg font-bold text-charcoal-900">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-charcoal-600">
                {item.text}
              </p>
              {item.link && (
                <Link
                  href="/track-order"
                  className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-honey-700 hover:underline"
                >
                  Track your order
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-charcoal-600">
          Questions about delivery? Email{" "}
          <a
            href="mailto:support@sabaland.in"
            className="font-semibold text-honey-700 hover:underline"
          >
            support@sabaland.in
          </a>
          .
        </p>
      </div>
    </section>
  );
}
