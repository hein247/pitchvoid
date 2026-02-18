import CaseStudyHero from "@/components/case-study/CaseStudyHero";
import EarlyConceptSection from "@/components/case-study/EarlyConceptSection";
import UserFlowSection from "@/components/case-study/UserFlowSection";
import WireframesSection from "@/components/case-study/WireframesSection";
import DesignDecisionsSection from "@/components/case-study/DesignDecisionsSection";
import ComponentsSection from "@/components/case-study/ComponentsSection";
import CaseStudyFooter from "@/components/case-study/CaseStudyFooter";

const CaseStudy = () => {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <CaseStudyHero />
      <EarlyConceptSection />
      <UserFlowSection />
      <WireframesSection />
      <DesignDecisionsSection />
      <ComponentsSection />
      <CaseStudyFooter />
    </main>
  );
};

export default CaseStudy;
