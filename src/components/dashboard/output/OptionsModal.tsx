import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (options: PitchOptions) => void;
  initialOptions?: PitchOptions;
}

export interface PitchOptions {
  tone: string;
  length: string;
  style: string;
  structure: string;
}

const DEFAULT_OPTIONS: PitchOptions = {
  tone: 'Confident',
  length: 'Standard (6)',
  style: 'Minimal',
  structure: 'Story arc',
};

const OPTION_GROUPS = [
  { label: 'Tone', key: 'tone' as const, options: ['Confident', 'Humble', 'Balanced', 'Bold'] },
  { label: 'Length', key: 'length' as const, options: ['Quick (3)', 'Standard (6)', 'Detailed (10)'] },
  { label: 'Style', key: 'style' as const, options: ['Minimal', 'Visual', 'Data-heavy'] },
  { label: 'Structure', key: 'structure' as const, options: ['Story arc', 'Problem-Solution', 'Timeline'] },
];

const OptionsModal = ({ isOpen, onClose, onApply, initialOptions = DEFAULT_OPTIONS }: OptionsModalProps) => {
  const [options, setOptions] = useState<PitchOptions>(initialOptions);

  const handleApply = () => {
    onApply?.(options);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full md:max-w-md bg-card md:rounded-2xl rounded-t-2xl border border-border overflow-hidden"
          >
            {/* Drag Handle - Mobile */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-lg font-display">Pitch Options</h3>
              <button onClick={onClose} className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
              {OPTION_GROUPS.map((group) => (
                <div key={group.key}>
                  <label className="text-sm text-muted-foreground mb-2 block font-sans">
                    {group.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setOptions({ ...options, [group.key]: option })}
                        className={`px-4 py-2 rounded-lg text-sm transition-all font-sans ${
                          options[group.key] === option
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent/10'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <button
                onClick={handleApply}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent rounded-xl font-medium hover:opacity-90 transition-opacity text-primary-foreground"
              >
                Apply Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OptionsModal;
