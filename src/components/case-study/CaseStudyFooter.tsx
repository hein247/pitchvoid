import { ExternalLink } from "lucide-react";

const CaseStudyFooter = () => (
  <footer className="py-16 px-6 text-center bg-background border-t border-border">
    <p className="text-sm mb-2 text-muted-foreground">
      This is a UX case study for PitchVoid, an AI pitch generator.
    </p>
    <a
      href="https://pitchvoid.lovable.app"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity text-primary"
    >
      View the live product <ExternalLink className="w-3.5 h-3.5" />
    </a>
    <p className="text-xs mt-6 text-muted-foreground/40">© 2025</p>
  </footer>
);

export default CaseStudyFooter;
