import { useState } from 'react';
import { Settings, Undo2 } from 'lucide-react';

interface RefinementBarProps {
  onRefine: (prompt: string) => void;
  onOpenOptions?: () => void;
  isRefining?: boolean;
  quickChips?: string[];
  showUndo?: boolean;
  onUndo?: () => void;
}

const DEFAULT_CHIPS = ['Shorter', 'Bolder', 'Simpler', 'More casual'];

const RefinementBar = ({
  onRefine,
  onOpenOptions,
  isRefining = false,
  quickChips = DEFAULT_CHIPS,
  showUndo = false,
  onUndo,
}: RefinementBarProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isRefining) {
      onRefine(inputValue.trim());
      setInputValue('');
    }
  };

  const handleChipClick = (chip: string) => {
    if (!isRefining) {
      onRefine(chip);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border z-40">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Quick Edit Chips */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Undo button */}
          {showUndo && onUndo && (
            <button
              onClick={onUndo}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 animate-in fade-in"
              style={{
                backgroundColor: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: 'rgba(239,68,68,0.6)',
              }}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}

          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              disabled={isRefining}
              className={`flex-shrink-0 px-4 py-2 bg-card border border-border rounded-full text-sm transition-colors ${
                isRefining ? 'opacity-40 pointer-events-none' : 'hover:bg-accent/10'
              }`}
            >
              {chip}
            </button>
          ))}
          {onOpenOptions && (
            <button
              onClick={onOpenOptions}
              disabled={isRefining}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm transition-colors ${
                isRefining ? 'opacity-40 pointer-events-none' : 'hover:bg-accent/10'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>More</span>
            </button>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tell me what to change..."
            disabled={isRefining}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-24 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isRefining}
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-primary to-accent rounded-lg text-sm font-medium transition-opacity text-primary-foreground ${
              isRefining ? 'opacity-40 pointer-events-none' : 'hover:opacity-90 disabled:opacity-50'
            }`}
          >
            {isRefining ? 'Refining...' : 'Refine'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RefinementBar;
