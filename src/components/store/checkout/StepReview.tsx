
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { clearCart } from "@/lib/cart";
import type { Address, CheckoutRow, Totals } from "@/lib/checkout";

type Props = {
  rows: CheckoutRow[];
  totals: Totals;
  address: Address;
  onEdit: () => void;
  onClearDetails: () => void;
};

type OrderResponse = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentMethod: "COD";
  totalPaise: number;
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

  // Keep the same key if the request needs to be retried.
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : ""
  );

  async function placeOrder() {
    if (!confirmed || placing || order) return;

    if (!idempotencyKey.current) {
      setError("Secure order key could not be generated. Please refresh and try again.");
      return;
    }

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : typeof data?.message === "string"
              ? data.message
              : "Order could not be placed. Please try again."
        );
      }

      if (
        !data ||
        typeof data.orderNumber !== "string" ||
        data.paymentMethod !== "COD"
      ) {
        throw new Error("The server returned an invalid order response.");
      }

      setOrder(data as OrderResponse);

      // Empty the cart only after the server confirms order creation.
      clearCart();
      onClearDetails();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setPlacing(false);
    }
  }

  if (order) {
    return (
      <section className="rounded-2xl border border-green-200 bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
          ✓
        </div>

        <h2 className="text-2xl font-semibold text-gray-900">
          Order placed successfully!
        </h2>

        <p className="mt-2 text-gray-600">
          Your Cash on Delivery order has been received.
        </p>

        <div className="my-6 rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Your order number</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {order.orderNumber}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Payment method: Cash on Delivery
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"
        >
          Continue shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Review your order
        </h2>

        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-gray-700 underline"
        >
          Edit details
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">Delivery address</h3>
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          <p>{address.fullName}</p>
          <p>{address.mobile}</p>
          <p>
            {address.house}, {address.street}
          </p>
          {address.landmark && <p>{address.landmark}</p>}
          <p>
            {address.city}, {address.state} - {address.pin}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">Order items</h3>

        <div className="mt-4 space-y-4">
          {rows.map((row) => (
            <div
              key={row.slug}
              className="flex items-center gap-3"
            >
              {row.image ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={row.image}
                    alt={row.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{row.name}</p>
                <p className="text-sm text-gray-500">
                  Qty: {row.quantity}
                </p>
              </div>

              <p className="text-sm font-medium text-gray-900">
                {formatINR(row.lineTotal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">Payment summary</h3>

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>

          <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{formatINR(totals.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800">
    <span className="material-symbols-outlined">payments</span>
  </div>

  <div>
    <p className="font-semibold text-gray-900">
      Cash on Delivery
    </p>
    <p className="mt-1 text-sm text-gray-600">
      Pay in cash when your order arrives.
    </p>
  </div>
  <span className="ml-auto text-sm font-medium text-green-700">
    Selected
  </span>
</div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          disabled={placing}
          className="mt-1 h-4 w-4"
        />
        <span>
          I confirm that my delivery details and order items are correct.
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={placeOrder}
        disabled={!confirmed || placing || rows.length === 0}
        className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {placing ? "Placing order..." : "Place COD order"}
      </button>
    </section>
  );
}
