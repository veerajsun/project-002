
import type { Metadata } from "next";
import "material-symbols/outlined.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sabland Yemeny Honey",
  description: "Sabland Yemeny Honey Khalta - official store.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
