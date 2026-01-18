import Navigation from "@/components/portfolio/Navigation";
import HeroSection from "@/components/portfolio/HeroSection";
import ChallengeSection from "@/components/portfolio/ChallengeSection";
import ChannelVariationsSection from "@/components/portfolio/ChannelVariationsSection";
import StyleExplorationsSection from "@/components/portfolio/StyleExplorationsSection";
import ProcessSection from "@/components/portfolio/ProcessSection";
import FooterSection from "@/components/portfolio/FooterSection";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <ChallengeSection />
      <ChannelVariationsSection />
      <StyleExplorationsSection />
      <ProcessSection />
      <FooterSection />
    </main>
  );
};

export default Index;
