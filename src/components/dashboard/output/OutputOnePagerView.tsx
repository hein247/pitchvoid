import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Check } from 'lucide-react';

export interface OnePagerSection {
  title: string;
  content: string;
}

export interface OutputOnePagerData {
  headline: string;
  subheadline: string;
  sections: OnePagerSection[];
  cta?: string;
  contact?: string;
}

interface OutputOnePagerViewProps {
  data: OutputOnePagerData;
}

const OutputOnePagerView = ({ data }: OutputOnePagerViewProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${data.headline}\n${data.subheadline}\n\n${data.sections.map(s => `${s.title}\n${s.content}`).join('\n\n')}${data.cta ? `\n\n${data.cta}` : ''}${data.contact ? `\n\n${data.contact}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto mb-16">
      {/* Document Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card text-card-foreground rounded-2xl p-8 md:p-12 shadow-2xl border border-border"
      >
        {/* Header */}
        <div className="text-center mb-10 pb-8 border-b-2 border-border">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 font-display">
            {data.headline}
          </h1>
          <p className="text-lg text-muted-foreground font-sans">
            {data.subheadline}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {data.sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <h3 className="text-lg font-bold text-foreground mb-3 uppercase tracking-wide font-sans">
                {section.title}
              </h3>
              <p className="text-foreground/80 leading-relaxed font-sans">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        {(data.cta || data.contact) && (
          <div className="mt-10 pt-8 border-t-2 border-border">
            {data.cta && (
              <p className="text-lg font-medium text-foreground mb-4 font-sans">
                {data.cta}
              </p>
            )}
            {data.contact && (
              <p className="text-muted-foreground text-sm font-sans">
                {data.contact}
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 bg-card hover:bg-accent/10 border border-border rounded-xl transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied!' : 'Copy text'}</span>
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-card hover:bg-accent/10 border border-border rounded-xl transition-colors">
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>
      </div>
    </div>
  );
};

export default OutputOnePagerView;
