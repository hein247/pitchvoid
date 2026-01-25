import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Json } from '@/integrations/supabase/types';
import { 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Layers,
  Eye,
  Edit3
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ShimmerButton from '@/components/ui/ShimmerButton';
import SlideEditor, { Slide, SlideContent } from './SlideEditor';
import SlidePreview from './SlidePreview';

interface LiveSlideEditorProps {
  projectId?: string;
  initialSlides?: Slide[];
  onClose?: () => void;
}

// Default slides for new projects
const defaultSlides: Slide[] = [
  {
    id: 'slide-1',
    component_type: 'MovingBorder',
    content: {
      title: 'The Problem',
      description: 'Define the core challenge your solution addresses.',
      bullets: ['Pain point 1', 'Pain point 2', 'Pain point 3'],
    },
    animation: { type: 'fadeIn', speed: 'medium' },
    order_index: 0,
  },
  {
    id: 'slide-2',
    component_type: 'HoverCard',
    content: {
      title: 'Our Solution',
      description: 'How we uniquely solve this problem.',
      bullets: ['Key feature 1', 'Key feature 2', 'Key feature 3'],
    },
    animation: { type: 'slideUp', speed: 'medium' },
    order_index: 1,
  },
  {
    id: 'slide-3',
    component_type: 'GlowCard',
    content: {
      title: 'Market Opportunity',
      description: 'The size and potential of the market.',
      bullets: ['TAM: $X billion', 'SAM: $X million', 'Target growth: X%'],
    },
    animation: { type: 'scaleIn', speed: 'medium' },
    order_index: 2,
  },
  {
    id: 'slide-4',
    component_type: 'HoverCard',
    content: {
      title: 'Traction & Metrics',
      description: 'Key achievements and growth indicators.',
      bullets: ['Metric 1', 'Metric 2', 'Metric 3'],
    },
    animation: { type: 'slideRight', speed: 'medium' },
    order_index: 3,
  },
  {
    id: 'slide-5',
    component_type: 'MovingBorder',
    content: {
      title: 'The Ask',
      description: 'What you need to achieve your vision.',
      bullets: ['Investment amount', 'Use of funds', 'Timeline'],
    },
    animation: { type: 'fadeIn', speed: 'slow' },
    order_index: 4,
  },
];

const LiveSlideEditor = ({ projectId, initialSlides, onClose }: LiveSlideEditorProps) => {
  const { toast } = useToast();
  const [slides, setSlides] = useState<Slide[]>(initialSlides || defaultSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentSlide = slides[currentSlideIndex];

  const handleSlideUpdate = (updatedSlide: Slide) => {
    setSlides((prev) =>
      prev.map((slide) => (slide.id === updatedSlide.id ? updatedSlide : slide))
    );
    setHasUnsavedChanges(true);
  };

  const goToPreviousSlide = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextSlide = () => {
    setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
  };

  const handleSaveProgress = async () => {
    if (!projectId) {
      toast({
        title: 'No project selected',
        description: 'Please create or select a project first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Delete existing slides for this project
      const { error: deleteError } = await supabase
        .from('slides')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      // Insert updated slides
      const slidesToInsert = slides.map((slide, index) => ({
        project_id: projectId,
        component_type: slide.component_type,
        content: JSON.parse(JSON.stringify(slide.content)),
        animation_settings: JSON.parse(JSON.stringify(slide.animation)),
        order_index: index,
      }));

      const { error: insertError } = await supabase
        .from('slides')
        .insert(slidesToInsert);

      if (insertError) throw insertError;

      setHasUnsavedChanges(false);
      toast({
        title: 'Progress saved!',
        description: 'Your slides have been saved to the database.',
      });
    } catch (error) {
      console.error('Error saving slides:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save your progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[hsl(263,70%,58%)]" />
            <h2 className="font-display text-xl tracking-wide">Live Slide Editor</h2>
          </div>
          
          {/* Slide Navigation */}
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousSlide}
              disabled={currentSlideIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs text-[hsl(45,80%,60%)] uppercase tracking-wider">
              Unsaved changes
            </span>
          )}
          <ShimmerButton
            onClick={handleSaveProgress}
            className="h-10 px-6"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Progress
              </>
            )}
          </ShimmerButton>
        </div>
      </div>

      {/* Slide Thumbnails */}
      <div className="flex gap-2 p-4 border-b border-[rgba(255,255,255,0.05)] overflow-x-auto">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlideIndex(index)}
            className={`
              flex-shrink-0 w-24 h-16 p-2 rounded-md border transition-all duration-200
              ${index === currentSlideIndex
                ? 'border-[hsl(263,70%,58%)] bg-[rgba(139,92,246,0.1)] shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.2)]'
              }
            `}
          >
            <div className="text-[8px] text-muted-foreground truncate">
              {slide.content.title || `Slide ${index + 1}`}
            </div>
          </button>
        ))}
      </div>

      {/* Split View: Editor & Preview */}
      <div className="flex-1 grid grid-cols-2 gap-0 min-h-0">
        {/* Left: Editor Panel */}
        <div className="border-r border-[rgba(255,255,255,0.1)] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Edit3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Edit Content
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <SlideEditor
                  slide={currentSlide}
                  slideIndex={currentSlideIndex}
                  onUpdate={handleSlideUpdate}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Live Preview Panel */}
        <div className="bg-[rgba(0,0,0,0.3)] overflow-y-auto">
          <div className="p-6 h-full">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Live Preview
              </span>
            </div>
            <div className="h-[calc(100%-40px)]">
              <AnimatePresence mode="wait">
                <SlidePreview
                  key={currentSlide.id}
                  slide={currentSlide}
                  slideIndex={currentSlideIndex}
                />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSlideEditor;