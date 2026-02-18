import CaseStudyHero from "@/components/case-study/CaseStudyHero";
import ProblemSection from "@/components/case-study/ProblemSection";
import ProposedFlowSection from "@/components/case-study/ProposedFlowSection";
import DesignDecisions from "@/components/case-study/DesignDecisions";
import InteractiveMockups from "@/components/case-study/InteractiveMockups";
import BeforeAfterSection from "@/components/case-study/BeforeAfterSection";
import CaseStudyFooter from "@/components/case-study/CaseStudyFooter";

const CaseStudy = () => {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <CaseStudyHero />
      <ProblemSection />
      <ProposedFlowSection />
      <DesignDecisions />
      <InteractiveMockups />
      <BeforeAfterSection />
      <CaseStudyFooter />
    </main>
  );
};

export default CaseStudy;
