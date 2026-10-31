import Image from "next/image";
import { getProduct, shortName } from "@/data/products";

// Text condensed from https://sabaland.in/pages/khaltahoney-about-us
// The sourcing / purity statements are the brand's own claims.
const CARDS = [
  {
    icon: "hive",
    title: "Sourced from Yemeni beekeepers",
    text: "Sourced directly from trusted Yemeni beekeepers, from the mountains and valleys of Yemen.",
  },
  {
    icon: "eco",
    title: "Pure and natural",
    text: "Sabland delivers 100% pure, natural and unadulterated honey.",
  },
  {
    icon: "local_shipping",
    title: "Pan-India delivery",
    text: "Delivered right to your doorstep across India, with free shipping.",
  },
  {
    icon: "mail",
    title: "Customer support",
    text: "Questions about your order or our products? Email support@sabaland.in.",
  },
];

const CHECKS = ["Free shipping across India", "Cash on Delivery", "Discreet packaging"];

export default function StorySection() {
  const product = getProduct("khalta-250g-direct");

  return (
    <section
      id="story"
      className="w-full scroll-mt-32 border-y border-gray-200/80 bg-gray-50 py-16"
    >
      <div className="mx-auto max-w-store px-6 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Image card */}
          <div className="relative lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50">
                <Image
                  src="/images/products/khalta-250g-direct-2.jpg"
                  alt={product ? shortName(product) : "Sabland Khalta honey"}
                  fill
                  sizes="(min-width:1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="bg-white p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-honey-600">
                  Sabland Khalta Honey
                </span>
                <p className="mt-0.5 text-xs font-medium text-charcoal-700">
                  {product ? shortName(product) : "Yemeni Khalta honey"}
                </p>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-6 lg:col-span-7">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-honey-600">
                <span className="material-symbols-outlined text-[18px]">landscape</span>
                <span>Our Honey Heritage</span>
              </div>
              <h2 className="font-serif text-3xl text-charcoal-900 sm:text-4xl">
                Why Yemeni Honey?
              </h2>
              <p className="text-sm text-charcoal-600">
                Yemen has kept bees for thousands of years. Its geography, its
                diverse flora and its traditional harvesting methods give
                Yemeni honey a character of its own. Sabland brings it from
                the mountains and valleys of Yemen to your home.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {CARDS.map((c) => (
                <div
                  key={c.title}
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-honey-100 bg-honey-50 text-honey-600">
                    <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-charcoal-900">{c.title}</div>
                    <div className="text-xs leading-relaxed text-charcoal-600">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-xs font-semibold text-charcoal-700">
              {CHECKS.map((c) => (
                <div key={c} className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-honey-600">
                    check_circle
                  </span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
