import type { Metadata } from "next";
import StoreShell from "@/components/store/StoreShell";
import CheckoutFlow from "@/components/store/checkout/CheckoutFlow";

export const metadata: Metadata = {
  title: "Checkout | Sabland Yemeny Honey",
  description: "Cash on Delivery checkout.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <StoreShell>
      <main className="w-full bg-gray-50">
        <CheckoutFlow />
      </main>
    </StoreShell>
  );
}
