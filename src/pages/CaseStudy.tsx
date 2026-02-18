import { motion } from "framer-motion";
import CaseStudyHero from "@/components/case-study/CaseStudyHero";
import EarlyConceptSection from "@/components/case-study/EarlyConceptSection";
import UserFlowSection from "@/components/case-study/UserFlowSection";
import WireframesSection from "@/components/case-study/WireframesSection";
import DesignDecisionsSection from "@/components/case-study/DesignDecisionsSection";
import ComponentsSection from "@/components/case-study/ComponentsSection";
import CaseStudyFooter from "@/components/case-study/CaseStudyFooter";

const CaseStudy = () => {
  return (
    <main
      className="min-h-screen"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        background: "#FFFFFF",
        color: "#1E293B",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`}</style>
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
