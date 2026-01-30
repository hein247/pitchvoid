import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface OutputSlide {
  number: number;
  title: string;
  content: string;
  speakerNotes?: string;
  image_url?: string;
}

interface OutputSlidesViewProps {
  slides: OutputSlide[];
  currentSlide: number;
  setCurrentSlide: (n: number) => void;
}

const OutputSlidesView = ({ slides, currentSlide, setCurrentSlide }: OutputSlidesViewProps) => {
  const slide = slides[currentSlide];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentSlide(Math.max(0, currentSlide - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length, setCurrentSlide]);

  if (!slide) return null;

  return (
    <div className="space-y-6">
      {/* Main Slide */}
      <div className="relative">
        {/* Navigation Arrows - Desktop */}
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 items-center justify-center rounded-full bg-card border border-border hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 items-center justify-center rounded-full bg-card border border-border hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.number}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-card to-background border border-border rounded-2xl p-8 md:p-12 min-h-[400px] flex flex-col justify-center"
          >
            {slide.image_url && (
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <img
                  src={slide.image_url}
                  alt=""
                  className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/60" />
              </div>
            )}
            <div className="text-center max-w-2xl mx-auto relative z-10">
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full mb-6">
                Slide {slide.number} of {slides.length}
              </span>
              
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {slide.title}
              </h2>
              
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-sans">
                {slide.content}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot Navigation */}
      <div className="flex items-center justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-primary w-8'
                : 'bg-muted-foreground/30 w-2.5 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>

      {/* Speaker Notes */}
      {slide.speakerNotes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 border border-border/50 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-primary text-sm font-medium shrink-0">Speaker notes</span>
            <p className="text-muted-foreground text-sm leading-relaxed">{slide.speakerNotes}</p>
          </div>
        </motion.div>
      )}

      {/* Slide Thumbnails - Desktop */}
      <div className="hidden md:grid grid-cols-6 gap-3">
        {slides.map((s, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`p-3 rounded-xl border transition-all ${
              index === currentSlide
                ? 'bg-primary/10 border-primary'
                : 'bg-card/50 border-border/50 hover:border-primary/40'
            }`}
          >
            <div className="text-xs text-muted-foreground mb-1">Slide {s.number}</div>
            <div className="text-sm font-medium truncate">{s.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OutputSlidesView;
