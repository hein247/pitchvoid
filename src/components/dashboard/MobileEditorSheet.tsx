import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Pencil, Type, List, Phone, ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnePagerData } from './OnePager';
import EditorAreaPanel from './EditorAreaPanel';

interface MobileEditorSheetProps {
  data: OnePagerData;
  onUpdate: (data: OnePagerData) => void;
}

type EditorArea = 'selector' | 'header' | 'sections' | 'contact';

const areaOptions = [
  {
    id: 'header' as const,
    icon: Type,
    label: 'Header',
    description: 'Headline & subtitle',
  },
  {
    id: 'sections' as const,
    icon: List,
    label: 'Sections',
    description: 'Content blocks',
  },
  {
    id: 'contact' as const,
    icon: Phone,
    label: 'Contact Info',
    description: 'Email, phone, website',
  },
];

const MobileEditorSheet = ({ data, onUpdate }: MobileEditorSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<EditorArea>('selector');

  const handleClose = () => {
    setIsOpen(false);
    // Reset to selector after closing
    setTimeout(() => setSelectedArea('selector'), 300);
  };

  const handleBack = () => {
    setSelectedArea('selector');
  };

  return (
    <>
      {/* Floating Edit Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-full",
                "bg-primary text-primary-foreground shadow-lg",
                "hover:bg-primary/90 transition-all",
                "active:scale-95"
              )}
            >
              <Pencil className="w-4 h-4" />
              <span className="text-sm font-medium">Edit</span>
            </button>
          </DrawerTrigger>
          
          <DrawerContent className="bg-card border-t border-border max-h-[85vh]">
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border/50">
              {selectedArea !== 'selector' ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm">Back</span>
                </button>
              ) : (
                <h3 className="text-foreground font-medium">Edit Content</h3>
              )}
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto p-4 max-h-[70vh]">
              {selectedArea === 'selector' ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    What would you like to edit?
                  </p>
                  
                  {areaOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedArea(option.id)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl",
                          "bg-accent/5 border border-border/50",
                          "hover:bg-accent/10 hover:border-primary/30 transition-all",
                          "active:scale-[0.98]"
                        )}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-foreground font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EditorAreaPanel
                  area={selectedArea}
                  data={data}
                  onUpdate={onUpdate}
                />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};

export default MobileEditorSheet;
