import Link from "next/link";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/data/site";

export default function SupportSection() {
  return (
    <section id="support" className="w-full scroll-mt-32 bg-white py-16">
      <div className="mx-auto max-w-store space-y-5 px-6 text-center lg:px-12">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-honey-100 bg-honey-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-honey-700">
          <span className="material-symbols-outlined text-[16px]">support_agent</span>
          Online Support
        </div>
        <h2 className="mx-auto max-w-2xl font-serif text-3xl text-charcoal-900 sm:text-4xl">
          Need Help Choosing the Right Pack?
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-charcoal-600">
          Questions about our products, pack sizes or your order? Email us or
          call{" "}
          <a
            href={CONTACT_PHONE_HREF}
            className="font-semibold text-honey-700 hover:underline"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>{" "}
          and we will help.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <a
            href="mailto:support@sabaland.in"
            className="flex items-center gap-2 rounded-lg bg-honey-500 px-7 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-honey-600"
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            <span>Email Support: support@sabaland.in</span>
          </a>
          <Link
            href="/#catalog"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-7 py-3 text-xs font-bold uppercase tracking-wider text-charcoal-800 transition-all hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            <span>Browse All Products</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs tracking-wider text-charcoal-500">
          <span>100% Discreet Packaging</span>
          <span>•</span>
          <span>Free Shipping Across India</span>
          <span>•</span>
          <span>Cash on Delivery</span>
          <span>•</span>
          <span>Customer Care Support</span>
        </div>
      </div>
    </section>
  );
}
