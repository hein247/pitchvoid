import { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Quote } from 'lucide-react';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);

  const formatTime = (s: number) => 
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleReset = () => {
    setTimer(0);
    setActiveSection(0);
    setIsPlaying(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-accent/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-display text-foreground">
              {data.title}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4" />
              {data.total_duration} • {data.sections.length} sections
            </p>
          </div>
          
          {/* Playback controls */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono text-foreground">
              {formatTime(timer)}
            </span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full magenta-gradient flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg border border-accent/20 hover:bg-accent/10 transition-colors"
            >
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {data.sections.map((section, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all ${
                activeSection === i
                  ? 'magenta-gradient text-white'
                  : 'border border-accent/20 text-muted-foreground hover:text-foreground hover:border-accent/40'
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Section Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          {/* Duration badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent">{data.sections[activeSection].duration}</span>
          </div>

          {/* Main content - teleprompter style */}
          <div className="mb-6">
            <p className="text-xl sm:text-2xl lg:text-3xl text-foreground leading-relaxed font-light">
              {data.sections[activeSection].content}
            </p>
          </div>

          {/* Stage direction / Cue */}
          {data.sections[activeSection].cue && (
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
              <p className="text-xs uppercase tracking-wider text-accent mb-2">Stage Direction</p>
              <p className="text-sm text-muted-foreground italic">
                {data.sections[activeSection].cue}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Key Phrases Footer */}
      {data.key_phrases && data.key_phrases.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-accent/10 bg-accent/5">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Key Phrases to Emphasize</span>
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
      <div className="p-4 border-t border-accent/10 flex items-center justify-between">
        <button
          onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
          disabled={activeSection === 0}
          className="px-4 py-2 rounded-lg border border-accent/20 text-sm disabled:opacity-30 hover:bg-accent/10 transition-colors"
        >
          ← Previous
        </button>
        <span className="text-sm text-muted-foreground">
          {activeSection + 1} / {data.sections.length}
        </span>
        <button
          onClick={() => setActiveSection(Math.min(data.sections.length - 1, activeSection + 1))}
          disabled={activeSection === data.sections.length - 1}
          className="px-4 py-2 rounded-lg border border-accent/20 text-sm disabled:opacity-30 hover:bg-accent/10 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default ScriptViewer;
