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

  // Component styling based on type
  const getComponentStyle = () => {
    switch (slide.component_type) {
      case 'MovingBorder':
        return 'relative before:absolute before:inset-[-2px] before:bg-gradient-to-r before:from-[hsl(263,70%,58%)] before:via-[hsl(217,91%,60%)] before:to-[hsl(263,70%,58%)] before:rounded-lg before:animate-[spin_3s_linear_infinite] before:-z-10 after:absolute after:inset-0 after:bg-[hsl(0,0%,3%)] after:rounded-lg after:-z-[5]';
      case 'HoverCard':
        return 'hover:shadow-[0_0_50px_rgba(139,92,246,0.3)] hover:border-[rgba(139,92,246,0.5)] transition-all duration-500';
      case 'GlowCard':
        return 'shadow-[0_0_30px_rgba(139,92,246,0.2)] border-[rgba(139,92,246,0.3)]';
      case 'FloatingCard':
        return 'animate-[float_3s_ease-in-out_infinite]';
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
          bg-[rgba(255,255,255,0.03)] backdrop-blur-[10px]
          border border-[rgba(255,255,255,0.1)]
          flex flex-col
          ${getComponentStyle()}
        `}
      >
        {/* Slide Number Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[hsl(263,70%,58%)] to-[hsl(217,91%,60%)] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <span className="text-white font-bold">{slideIndex + 1}</span>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {slide.component_type}
          </span>
        </div>

        {/* Title */}
        <motion.h2
          key={slide.content.title}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl md:text-4xl font-light mb-4 tracking-wide text-foreground leading-tight"
        >
          {slide.content.title || (
            <span className="text-muted-foreground/50 italic">Enter a title...</span>
          )}
        </motion.h2>

        {/* Description */}
        <motion.p
          key={slide.content.description}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-lg mb-6 leading-relaxed"
        >
          {slide.content.description || (
            <span className="text-muted-foreground/30 italic">Add a description...</span>
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
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[hsl(263,70%,58%)] to-[hsl(217,91%,60%)] mt-2 flex-shrink-0" />
                <span className="text-foreground/90">
                  {bullet || (
                    <span className="text-muted-foreground/30 italic">Empty bullet...</span>
                  )}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}

        {/* Animation indicator */}
        <div className="mt-auto pt-6 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[hsl(263,70%,58%)] animate-pulse" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {slide.animation.type} • {slide.animation.speed}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SlidePreview;