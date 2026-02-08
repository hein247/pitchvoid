import { motion } from 'framer-motion';
interface OnePagerSection {
  type: 'hero' | 'key-points' | 'value-prop' | 'cta';
  title: string;
  content: string;
  bullets?: string[];
}
interface OnePagerData {
  headline: string;
  subheadline: string;
  sections: OnePagerSection[];
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}
interface OnePagerProps {
  data: OnePagerData;
  projectTitle?: string;
}
const OnePager = ({
  data,
  projectTitle
}: OnePagerProps) => {
  // Separate sections by type for grid placement
  const keyPoints = data.sections.find(s => s.type === 'key-points');
  const valueProp = data.sections.find(s => s.type === 'value-prop');
  const cta = data.sections.find(s => s.type === 'cta');
  const mainSection = data.sections.find(s => s.type !== 'cta' && s.type !== 'hero') || keyPoints;
  const secondarySection = data.sections.find(s => s !== mainSection && s.type !== 'cta' && s.type !== 'hero') || valueProp;
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }} className="max-w-5xl mx-auto bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
      {/* GRID LAYOUT: 4-column system */}
      <div className="grid grid-cols-1 gap-0">

        {/* ── Header: Full width (4 columns) ── */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-primary/20 via-accent/10 to-background border-b border-border">
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display text-foreground leading-tight">
              {data.headline}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {data.subheadline}
            </p>
          </div>
        </div>

        {/* ── Main Note: 2 columns ── */}
        {mainSection && <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="p-6 sm:p-8 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              
              <h2 className="text-xl sm:text-2xl font-display text-foreground">
                {mainSection.title}
              </h2>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {mainSection.content}
            </p>
            {mainSection.bullets && mainSection.bullets.length > 0 && <ul className="space-y-2 ml-11">
                {mainSection.bullets.slice(0, 3).map((bullet, i) => <li key={i} className="flex items-start gap-2 text-foreground/80">
                    <span className="text-primary mt-1.5">•</span>
                    <span>{bullet}</span>
                  </li>)}
              </ul>}
          </motion.div>}

        {/* ── Priority Tag: 2 columns ── */}
        <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }} className="p-6 sm:p-8 border-b border-border flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <span className="text-accent text-lg">⚡</span>
            </div>
            <p className="text-foreground font-display text-base">High Impact</p>
          </div>
        </motion.div>

        {/* ── Action Checklist: 2 columns ── */}
        {secondarySection && <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }} className="p-6 sm:p-8 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              
              <h2 className="text-xl sm:text-2xl font-display text-foreground">
                {secondarySection.title}
              </h2>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {secondarySection.content}
            </p>
            {secondarySection.bullets && secondarySection.bullets.length > 0 && <ul className="space-y-3">
                {secondarySection.bullets.slice(0, 3).map((bullet, i) => <li key={i} className="flex items-start gap-3 text-foreground/80">
                    <div className="w-5 h-5 rounded border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span>{bullet}</span>
                  </li>)}
              </ul>}
          </motion.div>}

        {/* ── Success Metric / CTA: 2 columns ── */}
        <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4
      }} className="p-6 sm:p-8 flex flex-col justify-center">
          {cta ? <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">→</span>
                </div>
                <h2 className="text-xl font-display text-foreground">{cta.title}</h2>
              </div>
            </div> : <div className="p-5 rounded-xl bg-foreground/[0.03] border border-border text-center">
              <p className="text-xl font-display text-foreground">Ready to Launch</p>
            </div>}
        </motion.div>
      </div>

      {/* Contact Footer — full width */}
      {data.contactInfo && <div className="px-6 sm:px-10 py-5 bg-muted/30 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground">
            {data.contactInfo.email && <a href={`mailto:${data.contactInfo.email}`} className="hover:text-primary transition-colors">
                ✉️ {data.contactInfo.email}
              </a>}
            {data.contactInfo.phone && <span>📞 {data.contactInfo.phone}</span>}
            {data.contactInfo.website && <a href={data.contactInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                🌐 {data.contactInfo.website}
              </a>}
          </div>
        </div>}
    </motion.div>;
};
export default OnePager;

// Export types for use elsewhere
export type { OnePagerData, OnePagerSection };