import type { Metadata } from "next";
import StoreShell from "@/components/store/StoreShell";
import CartView from "@/components/store/cart/CartView";

export const metadata: Metadata = {
  title: "Your Cart | Sabland Yemeny Honey",
  description: "Review the items in your Sabland cart.",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <StoreShell>
      <main className="w-full bg-white">
        <CartView />
      </main>
    </StoreShell>
  );
}
