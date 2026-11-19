
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { clearCart } from "@/lib/cart";

type CheckoutRow = {
  slug: string;
  name: string;
  image: string;
  pack: string;
  variant: string | null;
  quantity: number;
  unitPrice: number;
  mrp: number;
  lineTotal: number;
};

type Totals = {
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
};

type Address = {
  fullName: string;
  mobile: string;
  house: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pin: string;
};

type OrderResponse = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentMethod: "COD";
  totalPaise: number;
};

type Props = {
  rows: CheckoutRow[];
  totals: Totals;
  address: Address;
  onEdit: () => void;
  onClearDetails: () => void;
};

export default function StepReview({
  rows,
  totals,
  address,
  onEdit,
  onClearDetails,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);

  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  async function placeOrder() {
    if (!confirmed || placing) return;

    setPlacing(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          items: rows.map((row) => ({
            slug: row.slug,
            quantity: row.quantity,
          })),
        address: {
              fullName: address.fullName,
              mobile: address.mobile,
              house: address.house,
              street: address.street,
              landmark: address.landmark,
              city: address.city,
              state: address.state,
              pin: address.pin,
           },
        }),
      });

      const responseText = await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          response.status >= 500
            ? "Server mein temporary problem hai. Aapka order confirm nahi ho saka. Please thodi der baad try karein."
            : "Server se valid response nahi mila. Please dobara try karein."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Order place nahi ho saka. Please dobara try karein."
        );
      }

      const orderInfo = (data?.order ?? data) as OrderResponse;

      if (
        !orderInfo ||
        typeof orderInfo.orderNumber !== "string" ||
        orderInfo.paymentMethod !== "COD"
      ) {
        throw new Error("Server se order confirmation valid nahi mila.");
      }

      // Server ne order confirm kar diya.
      // Cart ko success screen dikhne se pehle clear nahi karna hai.
      setOrder(orderInfo);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kuch problem aa gayi. Please dobara try karein."
      );
    } finally {
      setPlacing(false);
    }
  }

  if (order) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
            ✓
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            Order successfully placed!
          </h2>

          <p className="mt-3 text-gray-600">
            Thank you for shopping with Sabland. Aapka order humein mil gaya
            hai.
          </p>

          <div className="mt-7 rounded-xl bg-gray-50 p-5 text-left">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-500">Order number</span>
              <strong className="text-gray-900">{order.orderNumber}</strong>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-sm text-gray-500">Payment method</span>
              <strong className="text-gray-900">Cash on Delivery</strong>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-sm text-gray-500">Order status</span>
              <strong className="text-gray-900">{order.status}</strong>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-sm text-gray-500">Total amount</span>
              <strong className="text-gray-900">
                {formatINR(order.totalPaise / 100)}
              </strong>
            </div>
          </div>

          <p className="mt-5 text-sm text-gray-500">
            Payment delivery ke time cash mein karna hai.
          </p>

          <Link
            href="/"
            onClick={() => {
              clearCart();
              onClearDetails();
            }}
            className="mt-7 inline-flex rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            Continue shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Order items
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              {rows.map((row) => (
                <div
                  key={row.slug}
                  className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={row.image}
                      alt={row.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900">{row.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {row.pack} · {row.variant}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Quantity: {row.quantity}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-gray-900">
                      {formatINR(row.lineTotal)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatINR(row.unitPrice)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Delivery address
              </h2>

              <button
                type="button"
                onClick={onEdit}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>

          <div className="mt-4 space-y-1 text-sm text-gray-600">
  <p className="font-semibold text-gray-900">{address.fullName}</p>
  <p>{address.mobile}</p>
  <p>{address.house}</p>
  <p>{address.street}</p>
  {address.landmark && <p>{address.landmark}</p>}
  <p>
    {address.city}, {address.state} - {address.pin}
  </p>
</div>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Price details
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3 text-gray-600">
              <span>Subtotal</span>
              <span>{formatINR(totals.subtotal)}</span>
            </div>

            <div className="flex justify-between gap-3 text-gray-600">
              <span>Discount</span>
             <span className="text-green-700">
  -{formatINR(totals.discount ?? 0)}
</span>
            </div>

            <div className="flex justify-between gap-3 text-gray-600">
              <span>Delivery</span>
              <span>
             {(totals.shipping ?? 0) === 0
  ? "FREE"
  : formatINR(totals.shipping ?? 0)}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between gap-3 text-base font-bold text-gray-900">
                <span>Total amount</span>
                <span>{formatINR(totals.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">
              Cash on Delivery
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Aap delivery receive karte waqt cash payment kar sakte hain.
            </p>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4 accent-black"
            />
            <span>
              Main apne order details aur delivery address confirm karta/karti
              hoon.
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={placeOrder}
            disabled={!confirmed || placing || rows.length === 0}
            className="mt-5 w-full rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {placing ? "Placing order..." : "Place order"}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            Secure order placement · Cash on Delivery
          </p>
        </aside>
      </div>
    </section>
  );
}
