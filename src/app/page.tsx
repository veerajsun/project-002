import StoreShell from "@/components/store/StoreShell";
import Hero from "@/components/store/home/Hero";
import TrustStrip from "@/components/store/home/TrustStrip";
import CatalogSection from "@/components/store/home/CatalogSection";
import StorySection from "@/components/store/home/StorySection";
import HowToUse from "@/components/store/home/HowToUse";
import DeliverySection from "@/components/store/home/DeliverySection";
import SupportSection from "@/components/store/home/SupportSection";

export default function HomePage() {
  return (
    <StoreShell>
      <main className="w-full bg-white">
        <Hero />
        <TrustStrip />
        <CatalogSection />
        <StorySection />
        <HowToUse />
        <DeliverySection />
        <SupportSection />
      </main>
    </StoreShell>
  );
}
