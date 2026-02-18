import CaseStudyNav from "@/components/case-study/CaseStudyNav";
import CaseStudyHero from "@/components/case-study/CaseStudyHero";
import BackgroundSection from "@/components/case-study/BackgroundSection";
import ResearchSection from "@/components/case-study/ResearchSection";
import UserFlowSection from "@/components/case-study/UserFlowSection";
import WireframesSection from "@/components/case-study/WireframesSection";
import DesignSystemSection from "@/components/case-study/DesignSystemSection";
import FinalDesignsSection from "@/components/case-study/FinalDesignsSection";
import LiveProductSection from "@/components/case-study/LiveProductSection";
import ImpactSection from "@/components/case-study/ImpactSection";
import CaseStudyFooter from "@/components/case-study/CaseStudyFooter";

const CaseStudy = () => {
  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <CaseStudyNav />
      <CaseStudyHero />
      <BackgroundSection />
      <ResearchSection />
      <UserFlowSection />
      <WireframesSection />
      <DesignSystemSection />
      <FinalDesignsSection />
      <LiveProductSection />
      <ImpactSection />
      <CaseStudyFooter />
    </main>
  );
};

export default CaseStudy;
