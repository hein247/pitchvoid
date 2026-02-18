import { ExternalLink } from "lucide-react";

const CaseStudyFooter = () => (
  <footer className="py-16 px-6 text-center" style={{ background: "#FFFFFF", borderTop: "1px solid #F1F5F9" }}>
    <p className="text-sm mb-2" style={{ color: "#64748B" }}>
      This is a UX case study for PitchVoid — an AI pitch generator.
    </p>
    <a
      href="https://pitchvoid.lovable.app"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
      style={{ color: "#2DD4BF" }}
    >
      View the live product <ExternalLink className="w-3.5 h-3.5" />
    </a>
    <p className="text-xs mt-6" style={{ color: "#CBD5E1" }}>
      © 2025
    </p>
  </footer>
);

export default CaseStudyFooter;
