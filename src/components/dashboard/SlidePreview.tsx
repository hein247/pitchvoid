import { motion } from 'framer-motion';
import { Slide } from './SlideEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';

interface SlidePreviewProps {
  slide: Slide;
  slideIndex: number;
  isGeneratingImage?: boolean;
}

const SlidePreview = ({ slide, slideIndex, isGeneratingImage }: SlidePreviewProps) => {
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

  // Image placeholder/skeleton component
  const ImageSection = () => {
    if (isGeneratingImage) {
      return (
        <div className="relative w-full h-32 rounded-lg overflow-hidden">
          <Skeleton className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
              <span className="text-xs text-muted-foreground">Generating image...</span>
            </div>
          </div>
        </div>
      );
    }

    if (slide.image_url) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full h-32 rounded-lg overflow-hidden"
        >
          <img
            src={slide.image_url}
            alt={`Visual for ${slide.content.title}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </motion.div>
      );
    }

    return (
      <div className="w-full h-24 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
          <ImageIcon className="w-6 h-6" />
          <span className="text-xs">No image yet</span>
        </div>
      </div>
    );
  };

  // Layout-specific rendering
  const renderContent = () => {
    const layout = slide.layout_type || 'centered';

    if (layout === 'side-by-side') {
      return (
        <div className="grid grid-cols-2 gap-6 h-full">
          <div className="flex flex-col justify-center">
            <motion.h2
              key={slide.content.title}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="font-display text-2xl md:text-3xl font-light mb-3 tracking-wide text-foreground leading-tight"
            >
              {slide.content.title || <span className="text-muted-foreground/50">Enter a title...</span>}
            </motion.h2>
            <motion.p
              key={slide.content.description}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-sm mb-4 leading-relaxed font-sans"
            >
              {slide.content.description || <span className="text-muted-foreground/30">Add body text...</span>}
            </motion.p>
            <ImageSection />
          </div>
          <div className="flex flex-col justify-center">
            {slide.content.bullets.length > 0 && (
              <ul className="space-y-2">
                {slide.content.bullets.map((bullet, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent mt-1.5 flex-shrink-0" />
                    <span className="text-foreground/90 font-sans">{bullet || <span className="text-muted-foreground/30">Empty...</span>}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }

    if (layout === 'bento-grid') {
      return (
        <div className="grid grid-cols-2 gap-3 h-full auto-rows-min">
          {/* Title */}
          <div className="col-span-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-md p-4">
            <motion.h2
              key={slide.content.title}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="font-display text-xl font-light tracking-wide text-foreground"
            >
              {slide.content.title || <span className="text-muted-foreground/50">Enter a title...</span>}
            </motion.h2>
          </div>
          {/* Image */}
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-md p-2">
            <ImageSection />
          </div>
          {/* Description */}
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-md p-3 flex items-center">
            <motion.p className="text-xs text-muted-foreground font-sans">
              {slide.content.description || <span className="text-muted-foreground/30">Add body text...</span>}
            </motion.p>
          </div>
          {/* Bullets as grid items */}
          {slide.content.bullets.slice(0, 2).map((bullet, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-md p-3 flex items-center"
            >
              <span className="text-xs text-foreground font-sans">{bullet || 'Empty...'}</span>
            </motion.div>
          ))}
        </div>
      );
    }

    // Default: Centered layout
    return (
      <>
        {/* Slide Number Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
            <span className="text-primary-foreground font-bold font-sans">{slideIndex + 1}</span>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
            {slide.component_type}
          </span>
        </div>

        {/* Image Section */}
        <div className="mb-4">
          <ImageSection />
        </div>

        {/* Title */}
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

        {/* Description */}
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
              {slide.animation.type} • {slide.animation.speed} • {slide.layout_type || 'centered'}
            </span>
          </div>
        </div>
      </>
    );
  };

  return (
    <motion.div
      key={`${slide.id}-${JSON.stringify(slide.content)}-${slide.layout_type}-${slide.image_url}`}
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
        {renderContent()}
      </div>
    </motion.div>
  );
};

export default SlidePreview;
