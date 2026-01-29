import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Smile, 
  BarChart3, 
  Users, 
  Scissors, 
  Expand, 
  Image, 
  BookOpen,
  Layers,
  Merge,
  Play,
  HelpCircle,
  Undo2,
  Check,
  Sparkles,
  TrendingUp,
  Target,
  Rocket,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface Slide {
  id: number;
  title: string;
  content: string;
  speakerNotes: string;
}

interface RefinementSuggestion {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: 'contextual' | 'tone' | 'length' | 'style' | 'structure' | 'special';
  description?: string;
}

interface RefinementVersion {
  id: string;
  timestamp: Date;
  label: string;
  slides: Slide[];
}

interface RefinementPanelProps {
  slides: Slide[];
  projectTitle?: string;
  onApplyRefinements: (selectedIds: string[]) => void;
  onUndo?: () => void;
  isApplying?: boolean;
  className?: string;
}

const categories = [
  { id: 'contextual', label: 'Suggested', icon: Sparkles },
  { id: 'tone', label: 'Tone', icon: Smile },
  { id: 'length', label: 'Length', icon: Scissors },
  { id: 'style', label: 'Style', icon: Image },
  { id: 'structure', label: 'Structure', icon: Layers },
  { id: 'special', label: 'Special', icon: Rocket },
] as const;

// Generate context-aware suggestions based on slides and project
const generateContextualSuggestions = (slides: Slide[], projectTitle?: string): RefinementSuggestion[] => {
  const suggestions: RefinementSuggestion[] = [];
  const title = projectTitle?.toLowerCase() || '';
  const allContent = slides.map(s => s.content.toLowerCase()).join(' ');
  
  // Check for Google/tech company mentions
  if (title.includes('google') || allContent.includes('google')) {
    suggestions.push({
      id: 'google-ai',
      label: 'Emphasize Search/AI-native experience',
      icon: <Target className="w-4 h-4" />,
      category: 'contextual',
      description: 'Highlight AI and search expertise'
    });
  }
  
  // Check for scaling/growth mentions
  if (allContent.includes('scale') || allContent.includes('0→1') || allContent.includes('growth')) {
    suggestions.push({
      id: 'scaling-wins',
      label: 'Highlight 0→1 scaling wins',
      icon: <TrendingUp className="w-4 h-4" />,
      category: 'contextual',
      description: 'Emphasize startup/scaling experience'
    });
  }
  
  // Check for metrics
  const hasMetrics = /\d+%|\$\d+|\d+[KMB]/.test(allContent);
  if (!hasMetrics || allContent.includes('dau') || allContent.includes('churn')) {
    suggestions.push({
      id: 'add-metrics',
      label: 'Add more quantifiable impact (DAU/churn)',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'contextual',
      description: 'Include specific numbers and KPIs'
    });
  }
  
  // Length suggestion based on slide count
  if (slides.length > 5) {
    suggestions.push({
      id: 'shorten-4',
      label: `Shorten to 4 slides (30-second read)`,
      icon: <Scissors className="w-4 h-4" />,
      category: 'contextual',
      description: 'Make it more concise'
    });
  }
  
  // Visionary tone for big companies
  if (title.includes('google') || title.includes('meta') || title.includes('apple')) {
    suggestions.push({
      id: 'visionary-tone',
      label: 'Make tone more visionary (big-tech ambition)',
      icon: <Rocket className="w-4 h-4" />,
      category: 'contextual',
      description: 'Match company culture'
    });
  }
  
  // Leadership focus
  if (title.includes('senior') || title.includes('lead') || title.includes('manager')) {
    suggestions.push({
      id: 'leadership-focus',
      label: 'Focus on cross-functional leadership',
      icon: <Users className="w-4 h-4" />,
      category: 'contextual',
      description: 'Highlight team management'
    });
  }
  
  return suggestions.slice(0, 6); // Max 6 contextual suggestions
};

// Static suggestions by category
const staticSuggestions: RefinementSuggestion[] = [
  // Tone
  { id: 'more-confident', label: 'More confident', icon: <Zap className="w-4 h-4" />, category: 'tone' },
  { id: 'humbler', label: 'Humbler', icon: <Smile className="w-4 h-4" />, category: 'tone' },
  { id: 'data-driven', label: 'Data-driven', icon: <BarChart3 className="w-4 h-4" />, category: 'tone' },
  { id: 'storytelling', label: 'More storytelling', icon: <BookOpen className="w-4 h-4" />, category: 'tone' },
  
  // Length
  { id: 'make-shorter', label: 'Make it shorter', icon: <Scissors className="w-4 h-4" />, category: 'length' },
  { id: 'expand-slide-3', label: 'Expand slide 3', icon: <Expand className="w-4 h-4" />, category: 'length' },
  { id: '30-sec-read', label: '30-second read', icon: <Zap className="w-4 h-4" />, category: 'length' },
  { id: '2-min-read', label: '2-minute read', icon: <Expand className="w-4 h-4" />, category: 'length' },
  
  // Style
  { id: 'add-visuals', label: 'Add visuals/icons', icon: <Image className="w-4 h-4" />, category: 'style' },
  { id: 'more-bullets', label: 'More bullet points', icon: <Layers className="w-4 h-4" />, category: 'style' },
  { id: 'minimalist', label: 'Minimalist style', icon: <Scissors className="w-4 h-4" />, category: 'style' },
  { id: 'add-quotes', label: 'Add testimonials/quotes', icon: <BookOpen className="w-4 h-4" />, category: 'style' },
  
  // Structure
  { id: 'reorder-slides', label: 'Reorder slides', icon: <Layers className="w-4 h-4" />, category: 'structure' },
  { id: 'merge-1-2', label: 'Merge slides 1 & 2', icon: <Merge className="w-4 h-4" />, category: 'structure' },
  { id: 'split-slide', label: 'Split longest slide', icon: <Expand className="w-4 h-4" />, category: 'structure' },
  { id: 'add-intro', label: 'Add hook intro', icon: <Sparkles className="w-4 h-4" />, category: 'structure' },
  
  // Special
  { id: 'practice-mode', label: 'Practice mode (teleprompter)', icon: <Play className="w-4 h-4" />, category: 'special' },
  { id: 'generate-qa', label: 'Generate Q&A slide', icon: <HelpCircle className="w-4 h-4" />, category: 'special' },
  { id: 'add-cta', label: 'Add strong CTA', icon: <Target className="w-4 h-4" />, category: 'special' },
  { id: 'competitor-diff', label: 'Add differentiators', icon: <TrendingUp className="w-4 h-4" />, category: 'special' },
];

const RefinementPanel = ({ 
  slides, 
  projectTitle, 
  onApplyRefinements, 
  onUndo,
  isApplying = false,
  className 
}: RefinementPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('contextual');
  const [selectedRefinements, setSelectedRefinements] = useState<Set<string>>(new Set());
  const [contextualSuggestions, setContextualSuggestions] = useState<RefinementSuggestion[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [lastApplied, setLastApplied] = useState<string[]>([]);

  // Generate contextual suggestions when slides/project changes
  useEffect(() => {
    const suggestions = generateContextualSuggestions(slides, projectTitle);
    setContextualSuggestions(suggestions);
  }, [slides, projectTitle]);

  const toggleRefinement = (id: string) => {
    setSelectedRefinements(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApply = () => {
    const selected = Array.from(selectedRefinements);
    setLastApplied(selected);
    onApplyRefinements(selected);
    setSelectedRefinements(new Set());
    setShowUndo(true);
    
    // Hide undo after 10 seconds
    setTimeout(() => setShowUndo(false), 10000);
  };

  const handleUndo = () => {
    onUndo?.();
    setShowUndo(false);
  };

  const getCurrentSuggestions = (): RefinementSuggestion[] => {
    if (selectedCategory === 'contextual') {
      return contextualSuggestions;
    }
    return staticSuggestions.filter(s => s.category === selectedCategory);
  };

  const allSuggestions = getCurrentSuggestions();
  const selectedCount = selectedRefinements.size;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Undo Banner */}
      <AnimatePresence>
        {showUndo && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/30"
          >
            <span className="text-sm text-muted-foreground">
              Applied {lastApplied.length} refinement{lastApplied.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Dropdowns */}
      <div className="space-y-2">
        {categories.map(cat => {
          const Icon = cat.icon;
          const catSuggestions = cat.id === 'contextual' 
            ? contextualSuggestions 
            : staticSuggestions.filter(s => s.category === cat.id);
          const selectedInCategory = catSuggestions.filter(s => selectedRefinements.has(s.id));
          
          if (catSuggestions.length === 0) return null;
          
          return (
            <DropdownMenu key={cat.id}>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    "bg-card/60 border border-border/50 hover:bg-card hover:border-primary/50",
                    selectedInCategory.length > 0 && "border-primary/50 bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-accent" />
                    <span>{cat.label}</span>
                    {selectedInCategory.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary">
                        {selectedInCategory.length} selected
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto bg-card border-border/50"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Select refinements
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {catSuggestions.map((suggestion) => {
                  const isSelected = selectedRefinements.has(suggestion.id);
                  
                  return (
                    <DropdownMenuItem
                      key={suggestion.id}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleRefinement(suggestion.id);
                      }}
                      className={cn(
                        "flex items-center gap-3 py-3 px-3 cursor-pointer",
                        isSelected && "bg-primary/10"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-accent/20 text-accent"
                      )}>
                        {isSelected ? <Check className="w-3 h-3" /> : suggestion.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-sm font-medium block",
                          isSelected && "text-primary"
                        )}>
                          {suggestion.label}
                        </span>
                        {suggestion.description && (
                          <span className="text-xs text-muted-foreground block">
                            {suggestion.description}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>

      {/* Selected Refinements Preview */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 pt-2"
          >
            {Array.from(selectedRefinements).map(id => {
              const suggestion = [...contextualSuggestions, ...staticSuggestions].find(s => s.id === id);
              if (!suggestion) return null;
              
              return (
                <button
                  key={id}
                  onClick={() => toggleRefinement(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
                >
                  {suggestion.icon}
                  <span>{suggestion.label}</span>
                  <span className="ml-1 text-primary/60">×</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply Button */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="sticky bottom-0 pt-4 bg-gradient-to-t from-background via-background to-transparent"
          >
            <button
              onClick={handleApply}
              disabled={isApplying}
              className={cn(
                "w-full py-4 rounded-2xl font-medium text-base",
                "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]",
                "text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.4)]",
                "hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] transition-all",
                "animate-gradient-x disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {isApplying ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Apply {selectedCount} Refinement{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RefinementPanel;
