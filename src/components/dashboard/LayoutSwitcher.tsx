import { motion } from 'framer-motion';
import { Layout, Grid3X3, Columns, LayoutGrid, Quote, BarChart3, Clock, Sparkles, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LayoutOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  { value: 'centered', label: 'Centered', icon: <Layout className="w-4 h-4" />, description: 'Title and content centered' },
  { value: 'side-by-side', label: 'Side-by-Side', icon: <Columns className="w-4 h-4" />, description: 'Content in two columns' },
  { value: 'bento-grid', label: 'Bento Grid', icon: <Grid3X3 className="w-4 h-4" />, description: 'Modern grid layout' },
  { value: 'hero-split', label: 'Hero Split', icon: <LayoutGrid className="w-4 h-4" />, description: 'Large image with text overlay' },
  { value: 'stats-focus', label: 'Stats Focus', icon: <BarChart3 className="w-4 h-4" />, description: 'Highlight key metrics' },
  { value: 'quote-card', label: 'Quote Card', icon: <Quote className="w-4 h-4" />, description: 'Testimonial or quote style' },
  { value: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" />, description: 'Sequential steps or process' },
  { value: 'feature-grid', label: 'Feature Grid', icon: <Sparkles className="w-4 h-4" />, description: '3-column feature cards' },
];

interface LayoutSwitcherProps {
  currentLayout: string;
  onLayoutChange: (layout: string) => void;
  className?: string;
}

const LayoutSwitcher = ({ currentLayout, onLayoutChange, className = '' }: LayoutSwitcherProps) => {
  const currentOption = LAYOUT_OPTIONS.find(opt => opt.value === currentLayout) || LAYOUT_OPTIONS[0];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Quick access buttons for most popular layouts */}
      <div className="hidden md:flex items-center gap-1 bg-background/80 backdrop-blur-xl border border-border rounded-lg p-1">
        {LAYOUT_OPTIONS.slice(0, 4).map((option) => (
          <motion.button
            key={option.value}
            onClick={() => onLayoutChange(option.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200
              ${currentLayout === option.value
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
              }
            `}
            title={option.description}
          >
            {option.icon}
            <span className="hidden lg:inline">{option.label}</span>
          </motion.button>
        ))}
        
        {/* Dropdown for more layouts */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`
                gap-1 px-3 py-2 h-auto text-xs font-medium
                ${LAYOUT_OPTIONS.slice(4).some(opt => opt.value === currentLayout)
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
                }
              `}
            >
              {LAYOUT_OPTIONS.slice(4).find(opt => opt.value === currentLayout)?.icon || 
                <span className="text-xs">More</span>
              }
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-popover border-border z-50">
            {LAYOUT_OPTIONS.slice(4).map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onLayoutChange(option.value)}
                className={`cursor-pointer ${currentLayout === option.value ? 'bg-primary/20' : ''}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className={currentLayout === option.value ? 'text-primary' : 'text-muted-foreground'}>
                    {option.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: Single dropdown */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 hover:border-primary bg-background/80 backdrop-blur-xl"
            >
              {currentOption.icon}
              <span>{currentOption.label}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56 bg-popover border-border z-50">
            {LAYOUT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onLayoutChange(option.value)}
                className={`cursor-pointer ${currentLayout === option.value ? 'bg-primary/20' : ''}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className={currentLayout === option.value ? 'text-primary' : 'text-muted-foreground'}>
                    {option.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default LayoutSwitcher;
