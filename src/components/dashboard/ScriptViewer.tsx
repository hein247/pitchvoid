import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Quote, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ScriptSection {
  name: string;
  duration: string;
  content: string;
  cue: string;
}

export interface ScriptData {
  title: string;
  total_duration: string;
  sections: ScriptSection[];
  key_phrases: string[];
}

interface ScriptViewerProps {
  data: ScriptData;
  onUpdate?: (data: ScriptData) => void;
}

const ScriptViewer = ({ data, onUpdate }: ScriptViewerProps) => {
  const [activeSection, setActiveSection] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = data.sections.map(s => `[${s.name}]\n${s.content}${s.cue ? `\n\n(${s.cue})` : ''}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Document Preview - matches One-Pager style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 md:p-12 text-center border-b-2 border-border">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 font-display">
            {data.title}
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            {data.total_duration} • {data.sections.length} sections
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 overflow-x-auto p-4 border-b border-border bg-muted/30 scrollbar-thin">
          {data.sections.map((section, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === i
                  ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>

        {/* Active Section Content */}
        <div className="p-8 md:p-12">
          {/* Duration badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent">{data.sections[activeSection].duration}</span>
          </div>

          {/* Main content */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <p className="text-xl md:text-2xl text-foreground leading-relaxed font-light">
              {data.sections[activeSection].content}
            </p>
          </motion.div>

          {/* Stage direction / Cue */}
          {data.sections[activeSection].cue && (
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
              <p className="text-xs uppercase tracking-wider text-accent mb-2 font-medium">Stage Direction</p>
              <p className="text-sm text-muted-foreground italic">
                {data.sections[activeSection].cue}
              </p>
            </div>
          )}
        </div>

        {/* Key Phrases */}
        {data.key_phrases && data.key_phrases.length > 0 && (
          <div className="p-6 md:p-8 border-t border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-4">
              <Quote className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Key Phrases to Emphasize</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.key_phrases.map((phrase, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground"
                >
                  "{phrase}"
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-card">
          <button
            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-accent/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            {activeSection + 1} / {data.sections.length}
          </span>
          <button
            onClick={() => setActiveSection(Math.min(data.sections.length - 1, activeSection + 1))}
            disabled={activeSection === data.sections.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-accent/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Actions - matches One-Pager style */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 bg-card hover:bg-accent/10 border border-border rounded-xl transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied!' : 'Copy text'}</span>
        </button>
      </div>
    </div>
  );
};

export default ScriptViewer;
