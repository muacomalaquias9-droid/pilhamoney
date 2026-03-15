import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesStrip from "@/components/landing/FeaturesStrip";
import CTASection from "@/components/landing/CTASection";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesStrip />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
