import { ArrowLeft, ArrowRight } from "lucide-react";

const CaseStudyFooter = () => {
  return (
    <footer className="py-16 px-6" style={{ borderTop: "1px solid #E2E8F0" }}>
      <div className="max-w-[900px] mx-auto flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "#94A3B8" }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Previous Project
        </a>
        <a href="#" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "#64748B" }}>
          Back to Work
        </a>
        <a href="#" className="flex items-center gap-2 text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "#94A3B8" }}>
          Next Project
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </footer>
  );
};

export default CaseStudyFooter;
