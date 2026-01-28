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

const OnePager = ({ data, projectTitle }: OnePagerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
    >
      {/* Hero Section */}
      <div className="p-8 sm:p-12 bg-gradient-to-br from-primary/20 via-accent/10 to-background border-b border-border">
        <div className="text-center space-y-4">
          {projectTitle && (
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
              {projectTitle}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display text-foreground leading-tight">
            {data.headline}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {data.subheadline}
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="p-6 sm:p-10 space-y-8">
        {data.sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className={`${
              section.type === 'cta' 
                ? 'text-center p-6 sm:p-8 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20' 
                : ''
            }`}
          >
            {section.type !== 'hero' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {section.type === 'key-points' && '✦'}
                      {section.type === 'value-prop' && '◆'}
                      {section.type === 'cta' && '→'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display text-foreground">
                    {section.title}
                  </h2>
                </div>
                
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {section.content}
                </p>

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="space-y-2 ml-11">
                    {section.bullets.map((bullet, bulletIndex) => (
                      <li 
                        key={bulletIndex}
                        className="flex items-start gap-2 text-foreground/80"
                      >
                        <span className="text-primary mt-1.5">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Contact Footer */}
      {data.contactInfo && (
        <div className="px-6 sm:px-10 py-6 bg-muted/30 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground">
            {data.contactInfo.email && (
              <a href={`mailto:${data.contactInfo.email}`} className="hover:text-primary transition-colors">
                ✉️ {data.contactInfo.email}
              </a>
            )}
            {data.contactInfo.phone && (
              <span>📞 {data.contactInfo.phone}</span>
            )}
            {data.contactInfo.website && (
              <a href={data.contactInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                🌐 {data.contactInfo.website}
              </a>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default OnePager;

// Export types for use elsewhere
export type { OnePagerData, OnePagerSection };
