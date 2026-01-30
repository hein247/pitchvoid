import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Copy, Play, Check } from 'lucide-react';

export interface ScriptSection {
  name: string;
  duration: string;
  content: string;
  cue: string;
}

export interface OutputScriptData {
  totalDuration: string;
  sections: ScriptSection[];
}

interface OutputScriptViewProps {
  data: OutputScriptData;
  onStartTeleprompter?: () => void;
}

const OutputScriptView = ({ data, onStartTeleprompter }: OutputScriptViewProps) => {
  const [activeSection, setActiveSection] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = data.sections.map(s => `[${s.name} - ${s.duration}]\n${s.content}\n💡 ${s.cue}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Duration Badge */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">Total duration: {data.totalDuration}</span>
      </div>

      {/* Script Sections */}
      <div className="space-y-4">
        {data.sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setActiveSection(index)}
            className={`rounded-2xl border transition-all cursor-pointer ${
              index === activeSection
                ? 'bg-gradient-to-br from-card to-background border-primary/50'
                : 'bg-card/30 border-border/50 hover:border-border'
            }`}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === activeSection
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </span>
                <span className="font-semibold font-sans">{section.name}</span>
              </div>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {section.duration}
              </span>
            </div>

            {/* Section Content */}
            <div className="p-6">
              <p className="text-lg leading-relaxed text-foreground/90 mb-4 font-sans">
                {section.content}
              </p>
              
              {/* Stage Direction */}
              <div className="flex items-start gap-2 text-sm">
                <span className="text-primary shrink-0">💡</span>
                <span className="text-muted-foreground italic">{section.cue}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 mt-8">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 bg-card hover:bg-accent/10 border border-border rounded-xl transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied!' : 'Copy script'}</span>
        </button>
        <button
          onClick={onStartTeleprompter}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent rounded-xl font-medium hover:opacity-90 transition-opacity text-primary-foreground"
        >
          <Play className="w-4 h-4" />
          <span>Start teleprompter</span>
        </button>
      </div>
    </div>
  );
};

export default OutputScriptView;
