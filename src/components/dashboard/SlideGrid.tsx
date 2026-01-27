import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  content: string;
  speakerNotes: string;
}

interface SlideGridProps {
  slides: Slide[];
  activeSlide: number;
  onSlideSelect: (index: number) => void;
}

const SlideGrid = ({ slides, activeSlide, onSlideSelect }: SlideGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_VISIBLE = 4;
  
  const visibleSlides = showAll ? slides : slides.slice(0, INITIAL_VISIBLE);
  const hasMore = slides.length > INITIAL_VISIBLE;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-sm font-medium text-foreground">
          Slide {activeSlide + 1}/{slides.length}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((activeSlide + 1) / slides.length) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Slides Grid - Single column on mobile, 2 columns on tablet+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {visibleSlides.map((slide, i) => {
            const actualIndex = slides.findIndex(s => s.id === slide.id);
            const isActive = activeSlide === actualIndex;
            
            return (
              <motion.div
                key={slide.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                onClick={() => onSlideSelect(actualIndex)}
                className={`
                  slide-card rounded-2xl overflow-hidden cursor-pointer group
                  transition-all duration-300
                  ${isActive 
                    ? 'ring-2 ring-primary shadow-[0_0_30px_hsl(var(--primary)/0.3)]' 
                    : 'hover:border-primary/40'
                  }
                `}
              >
                {/* Slide Visual with Number Badge */}
                <div className="slide-visual h-24 md:h-28 relative flex items-center justify-center">
                  {/* Large Slide Number */}
                  <div className={`
                    w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center
                    transition-all duration-300
                    ${isActive 
                      ? 'bg-gradient-to-br from-primary to-accent shadow-[0_0_20px_hsl(var(--primary)/0.5)]' 
                      : 'bg-accent/20 group-hover:bg-accent/30'
                    }
                  `}>
                    <span className={`
                      text-xl md:text-2xl font-bold font-display
                      ${isActive ? 'text-primary-foreground' : 'text-foreground/70'}
                    `}>
                      {actualIndex + 1}
                    </span>
                  </div>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-medium uppercase tracking-wider"
                    >
                      Active
                    </motion.div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4 md:p-5 space-y-2">
                  <h4 className={`
                    font-display font-medium text-base md:text-lg leading-tight
                    transition-colors duration-200
                    ${isActive ? 'text-primary' : 'text-foreground group-hover:text-primary/80'}
                  `}>
                    {slide.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {slide.content}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More / Show Less Toggle */}
      {hasMore && (
        <motion.button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-3 rounded-xl border border-accent/20 hover:border-accent/40 hover:bg-accent/5 
            flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground
            transition-all duration-200"
          whileTap={{ scale: 0.98 }}
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {slides.length - INITIAL_VISIBLE} more slides
            </>
          )}
        </motion.button>
      )}
    </div>
  );
};

export default SlideGrid;
