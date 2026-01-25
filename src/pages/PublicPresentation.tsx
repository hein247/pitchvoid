import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SlideContent {
  title: string;
  description: string;
  bullets: string[];
}

interface Slide {
  id: string;
  component_type: string;
  content: SlideContent;
  animation: {
    type: string;
    speed: string;
  };
  layout_type: string;
  order_index: number;
  image_url?: string;
}

const PublicPresentation = () => {
  const { id } = useParams<{ id: string }>();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('Presentation');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  useEffect(() => {
    const fetchPresentation = async () => {
      if (!id) {
        setError('Invalid presentation link');
        setLoading(false);
        return;
      }

      try {
        // Fetch project by public_id
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id, title, is_published')
          .eq('public_id', id)
          .eq('is_published', true)
          .maybeSingle();

        if (projectError) throw projectError;
        if (!project) {
          setError('Presentation not found or not published');
          setLoading(false);
          return;
        }

        setProjectTitle(project.title);

        // Fetch slides
        const { data: slidesData, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .eq('project_id', project.id)
          .order('order_index', { ascending: true });

        if (slidesError) throw slidesError;

        const formattedSlides: Slide[] = (slidesData || []).map((s: any) => ({
          id: s.id,
          component_type: s.component_type || 'HoverCard',
          content: (s.content as SlideContent) || { title: '', description: '', bullets: [] },
          animation: (s.animation_settings as { type: string; speed: string }) || { type: 'fadeIn', speed: 'medium' },
          layout_type: s.layout_type || 'centered',
          order_index: s.order_index,
          image_url: s.image_url,
        }));

        setSlides(formattedSlides);
      } catch (err) {
        console.error('Error fetching presentation:', err);
        setError('Failed to load presentation');
      } finally {
        setLoading(false);
      }
    };

    fetchPresentation();
  }, [id]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlideIndex(index);
    }
  }, [slides.length]);

  const goToPrevious = useCallback(() => {
    goToSlide(currentSlideIndex - 1);
  }, [currentSlideIndex, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(currentSlideIndex + 1);
  }, [currentSlideIndex, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevious();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  const currentSlide = slides[currentSlideIndex];

  // Image component for slides
  const SlideImage = ({ slide }: { slide: Slide }) => {
    if (!slide.image_url) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative w-full max-w-2xl rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      >
        <img
          src={slide.image_url}
          alt={`Visual for ${slide.content.title}`}
          className="w-full h-auto object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
      </motion.div>
    );
  };

  // Layout-specific rendering
  const renderSlideContent = (slide: Slide) => {
    const layout = slide.layout_type || 'centered';

    if (layout === 'side-by-side') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-center">
          <div className="flex flex-col justify-center">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-light tracking-wide text-foreground mb-6 leading-tight">
              {slide.content.title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-sans leading-relaxed mb-6">
              {slide.content.description}
            </p>
            {slide.image_url && (
              <div className="mt-4">
                <SlideImage slide={slide} />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            {slide.content.bullets.length > 0 && (
              <ul className="space-y-4">
                {slide.content.bullets.map((bullet, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="flex items-start gap-4 text-lg md:text-xl"
                  >
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent mt-2 flex-shrink-0" />
                    <span className="text-foreground/90 font-sans">{bullet}</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {/* Title takes full width on first row */}
          <div className="col-span-2 lg:col-span-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg p-8 flex items-center">
            <h1 className="font-display text-4xl md:text-5xl font-light tracking-wide text-foreground">
              {slide.content.title}
            </h1>
          </div>
          {/* Image */}
          {slide.image_url && (
            <div className="col-span-2 lg:col-span-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden">
              <img
                src={slide.image_url}
                alt={`Visual for ${slide.content.title}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {/* Description */}
          <div className={`${slide.image_url ? '' : 'col-span-2 lg:col-span-1'} bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 flex items-center`}>
            <p className="text-lg text-muted-foreground font-sans">
              {slide.content.description}
            </p>
          </div>
          {/* Bullets as grid items */}
          {slide.content.bullets.slice(0, slide.image_url ? 3 : 4).map((bullet, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-6 flex items-center"
            >
              <span className="text-foreground font-sans">{bullet}</span>
            </motion.div>
          ))}
        </div>
      );
    }

    // Default: Centered layout
    return (
      <div className="flex flex-col items-center justify-center text-center h-full max-w-4xl mx-auto px-4">
        {slide.image_url && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <SlideImage slide={slide} />
          </motion.div>
        )}
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light tracking-wide text-foreground mb-8 leading-tight">
          {slide.content.title}
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-sans mb-12 leading-relaxed max-w-2xl">
          {slide.content.description}
        </p>
        {slide.content.bullets.length > 0 && (
          <ul className="space-y-4 text-left">
            {slide.content.bullets.map((bullet, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-start gap-4 text-lg md:text-xl"
              >
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent mt-2 flex-shrink-0" />
                <span className="text-foreground/90 font-sans">{bullet}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🔒</div>
        <h1 className="font-display text-2xl text-foreground">{error}</h1>
        <p className="text-muted-foreground font-sans">This presentation may have been unpublished or deleted.</p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">📭</div>
        <h1 className="font-display text-2xl text-foreground">No slides yet</h1>
        <p className="text-muted-foreground font-sans">This presentation doesn't have any slides.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header with Logo Glow - hidden in fullscreen */}
      {!isFullscreen && (
        <header className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(5,1,13,0.9)] backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                <div className="relative w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-[0_0_25px_hsl(var(--primary)/0.5)]">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="font-display text-lg font-medium tracking-wide">PitchVoid</span>
            </div>
            <span className="text-sm text-muted-foreground font-sans tracking-wide truncate max-w-[200px] md:max-w-none">
              {projectTitle}
            </span>
          </div>
        </header>
      )}

      {/* Slide Content */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 p-8 md:p-16"
          >
            {renderSlideContent(currentSlide)}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Footer - Floating glassmorphism style in fullscreen */}
      <footer className={`
        ${isFullscreen 
          ? 'fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full px-6 py-3 bg-[rgba(5,1,13,0.8)] border border-[rgba(255,255,255,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          : 'border-t border-[rgba(255,255,255,0.08)] bg-[rgba(5,1,13,0.9)] py-4 px-6'
        }
        backdrop-blur-xl z-50
      `}>
        <div className={`${isFullscreen ? '' : 'max-w-7xl mx-auto'} flex items-center ${isFullscreen ? 'gap-6' : 'justify-between'}`}>
          {/* Slide Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-300
                  ${index === currentSlideIndex
                    ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)] scale-125'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }
                `}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Slide Counter */}
          <span className="text-sm text-muted-foreground font-sans tracking-wide">
            {currentSlideIndex + 1} / {slides.length}
          </span>

          {/* Arrow Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              disabled={currentSlideIndex === 0}
              className="h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              disabled={currentSlideIndex === slides.length - 1}
              className="h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default PublicPresentation;