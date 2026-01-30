import { useState } from 'react';
import { Settings } from 'lucide-react';

interface RefinementBarProps {
  onRefine: (prompt: string) => void;
  onOpenOptions?: () => void;
  isRefining?: boolean;
  quickChips?: string[];
}

const DEFAULT_CHIPS = ['Shorter', 'Bolder', 'More data', 'Softer tone', 'Add metrics'];

const RefinementBar = ({
  onRefine,
  onOpenOptions,
  isRefining = false,
  quickChips = DEFAULT_CHIPS,
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
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              disabled={isRefining}
              className="flex-shrink-0 px-4 py-2 bg-card hover:bg-accent/10 border border-border rounded-full text-sm transition-colors disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
          {onOpenOptions && (
            <button
              onClick={onOpenOptions}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-card hover:bg-accent/10 border border-border rounded-full text-sm transition-colors"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-primary to-accent rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-primary-foreground"
          >
            {isRefining ? 'Refining...' : 'Refine'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RefinementBar;
