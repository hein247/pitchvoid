import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Pencil, Type, List, ChevronLeft, X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnePagerData } from './OnePager';
import EditorAreaPanel from './EditorAreaPanel';

interface MobileEditorSheetProps {
  data: OnePagerData;
  onUpdate: (data: OnePagerData) => void;
  onRefine: (prompt: string) => void;
  isRefining?: boolean;
}

type EditorArea = 'selector' | 'header' | 'sections';

const QUICK_CHIPS = ['Shorter', 'Bolder', 'Simpler'];

const areaOptions = [
  { id: 'header' as const, icon: Type, label: 'Header', description: 'Title & context line' },
  { id: 'sections' as const, icon: List, label: 'Sections', description: 'Talking points' },
];

const MobileEditorSheet = ({ data, onUpdate, onRefine, isRefining = false }: MobileEditorSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<EditorArea>('selector');
  const [refineValue, setRefineValue] = useState('');

  const handleClose = () => { setIsOpen(false); setTimeout(() => setSelectedArea('selector'), 300); };
  const handleBack = () => setSelectedArea('selector');

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refineValue.trim() && !isRefining) { onRefine(refineValue.trim()); setRefineValue(''); handleClose(); }
  };

  const handleChipClick = (chip: string) => { if (!isRefining) { onRefine(chip); handleClose(); } };

  return (
    <div className="fixed bottom-6 right-4 z-40">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <button className={cn("flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95")}>
            <Pencil className="w-4 h-4" />
            <span className="text-sm font-medium">Edit</span>
          </button>
        </DrawerTrigger>
        
        <DrawerContent className="bg-card border-t border-border max-h-[85vh]">
          <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
          
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border/50">
            {selectedArea !== 'selector' ? (
              <button onClick={handleBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
              </button>
            ) : (
              <h3 className="text-foreground font-medium">Edit Content</h3>
            )}
            <button onClick={handleClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto p-4 max-h-[70vh]">
            {selectedArea === 'selector' ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <form onSubmit={handleRefineSubmit} className="relative">
                    <input type="text" value={refineValue} onChange={e => setRefineValue(e.target.value)} placeholder="Refine — tone, length, details..." disabled={isRefining} className="w-full bg-accent/5 border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50" />
                    <button type="submit" disabled={!refineValue.trim() || isRefining} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50">
                      {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {QUICK_CHIPS.map(chip => (
                      <button key={chip} onClick={() => handleChipClick(chip)} disabled={isRefining} className="flex-shrink-0 px-3 py-1.5 bg-accent/5 hover:bg-accent/10 border border-border rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or edit manually</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                <div className="space-y-3">
                  {areaOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <button key={option.id} onClick={() => setSelectedArea(option.id)} className={cn("w-full flex items-center gap-4 p-4 rounded-2xl bg-accent/5 border border-border/50 hover:bg-accent/10 hover:border-primary/30 transition-all active:scale-[0.98]")}>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
                        <div className="text-left"><p className="text-foreground font-medium">{option.label}</p><p className="text-sm text-muted-foreground">{option.description}</p></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <EditorAreaPanel area={selectedArea} data={data} onUpdate={onUpdate} />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MobileEditorSheet;
