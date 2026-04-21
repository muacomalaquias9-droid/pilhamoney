import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/landing/HeroSection";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background" style={{ fontFamily: "Arial, sans-serif" }}>
      <Navbar />
      <HeroSection />
      <Footer />
    </div>
  );
};

export default Index;
