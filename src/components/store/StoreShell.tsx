import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

// Wraps every PUBLIC storefront page with the header and footer.
// The admin area will NOT use this, so it stays separate from the storefront.
export default function StoreShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div>{children}</div>
      <Footer />
    </>
  );
}
