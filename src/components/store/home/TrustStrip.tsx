const ITEMS = [
  { icon: "eco", title: "100% Natural Honey", text: "Pure, natural and unadulterated" },
  { icon: "landscape", title: "Yemeni Honey", text: "From the mountains of Yemen" },
  { icon: "local_shipping", title: "Free Shipping", text: "All over India" },
  { icon: "payments", title: "Cash on Delivery", text: "Pay when it arrives" },
];

export default function TrustStrip() {
  return (
    <section className="w-full border-b border-gray-200/80 bg-gray-50 py-8">
      <div className="mx-auto max-w-store px-6 lg:px-12">
        <div className="grid grid-cols-2 items-center gap-6 text-center md:grid-cols-4">
          {ITEMS.map((i) => (
            <div key={i.title} className="flex flex-col items-center gap-1.5">
              <span className="material-symbols-outlined text-[30px] text-honey-600">
                {i.icon}
              </span>
              <span className="text-sm font-bold text-charcoal-900">{i.title}</span>
              <span className="text-xs text-charcoal-500">{i.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
