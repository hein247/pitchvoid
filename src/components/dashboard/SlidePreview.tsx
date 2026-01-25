import { motion } from 'framer-motion';
import { Slide } from './SlideEditor';
import GlassCard from '@/components/ui/GlassCard';

interface SlidePreviewProps {
  slide: Slide;
  slideIndex: number;
}

const SlidePreview = ({ slide, slideIndex }: SlidePreviewProps) => {
  // Animation variants based on slide settings
  const getAnimationVariants = () => {
    switch (slide.animation.type) {
      case 'fadeIn':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
      case 'slideUp':
        return {
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0 },
        };
      case 'scaleIn':
        return {
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1 },
        };
      case 'slideRight':
        return {
          hidden: { opacity: 0, x: -30 },
          visible: { opacity: 1, x: 0 },
        };
      default:
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        };
    }
  };

  const getAnimationDuration = () => {
    switch (slide.animation.speed) {
      case 'fast':
        return 0.3;
      case 'slow':
        return 0.8;
      default:
        return 0.5;
    }
  };

  const variants = getAnimationVariants();
  const duration = getAnimationDuration();

  // Component styling based on type - using brand colors (no background animations)
  const getComponentStyle = () => {
    switch (slide.component_type) {
      case 'MovingBorder':
        return 'border-primary/50';
      case 'HoverCard':
        return 'hover:shadow-[0_0_50px_hsl(var(--primary)/0.3)] hover:border-primary/50 transition-all duration-500';
      case 'GlowCard':
        return 'shadow-[0_0_30px_hsl(var(--primary)/0.2)] border-primary/30';
      case 'FloatingCard':
        return 'border-accent/50';
      default:
        return '';
    }
  };

  return (
    <motion.div
      key={`${slide.id}-${JSON.stringify(slide.content)}`}
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <div
        className={`
          h-full p-8 rounded-lg
          bg-card backdrop-blur-[10px]
          border border-border
          flex flex-col
          ${getComponentStyle()}
        `}
      >
        {/* Slide Number Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
            <span className="text-primary-foreground font-bold font-sans">{slideIndex + 1}</span>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
            {slide.component_type}
          </span>
        </div>

        {/* Title - Times New Roman Italic */}
        <motion.h2
          key={slide.content.title}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl md:text-4xl font-light mb-4 tracking-wide text-foreground leading-tight"
        >
          {slide.content.title || (
            <span className="text-muted-foreground/50">Enter a title...</span>
          )}
        </motion.h2>

        {/* Description - Be Vietnam Pro */}
        <motion.p
          key={slide.content.description}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-lg mb-6 leading-relaxed font-sans"
        >
          {slide.content.description || (
            <span className="text-muted-foreground/30">Add body text...</span>
          )}
        </motion.p>

        {/* Bullet Points */}
        {slide.content.bullets.length > 0 && (
          <motion.ul className="space-y-3 flex-1">
            {slide.content.bullets.map((bullet, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent mt-2 flex-shrink-0" />
                <span className="text-foreground/90 font-sans">
                  {bullet || (
                    <span className="text-muted-foreground/30">Empty bullet...</span>
                  )}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}

        {/* Animation indicator */}
        <div className="mt-auto pt-6 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-sans">
              {slide.animation.type} • {slide.animation.speed}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SlidePreview;