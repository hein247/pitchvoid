import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Json } from '@/integrations/supabase/types';
import { 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Layers,
  Eye,
  Edit3,
  Share2,
  Link,
  Check,
  ExternalLink,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LayoutSwitcher from './LayoutSwitcher';
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
    layout_type: 'centered',
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
    layout_type: 'side-by-side',
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
    layout_type: 'bento-grid',
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
    layout_type: 'side-by-side',
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
    layout_type: 'centered',
    order_index: 4,
  },
];

const LiveSlideEditor = ({ projectId, initialSlides, onClose }: LiveSlideEditorProps) => {
  const { toast } = useToast();
  const [slides, setSlides] = useState<Slide[]>(initialSlides || defaultSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [generatingImageSlideId, setGeneratingImageSlideId] = useState<string | null>(null);

  const currentSlide = slides[currentSlideIndex];

  // Check if project is already published
  useEffect(() => {
    const checkPublishStatus = async () => {
      if (!projectId) return;
      
      const { data } = await supabase
        .from('projects')
        .select('is_published, public_id')
        .eq('id', projectId)
        .maybeSingle();
      
      if (data) {
        setIsPublished(data.is_published || false);
        if (data.public_id) {
          setPublicUrl(`${window.location.origin}/p/${data.public_id}`);
        }
      }
    };
    
    checkPublishStatus();
  }, [projectId]);

  const handleSlideUpdate = (updatedSlide: Slide) => {
    setSlides((prev) =>
      prev.map((slide) => (slide.id === updatedSlide.id ? updatedSlide : slide))
    );
    setHasUnsavedChanges(true);
  };

  const handleGenerateImage = async (slide: Slide) => {
    setGeneratingImageSlideId(slide.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-pitch-images', {
        body: {
          slideTitle: slide.content.title,
          slideDescription: slide.content.description,
          visualStyle: slide.visual_style,
          slideIndex: slides.findIndex(s => s.id === slide.id),
        },
      });

      if (error) {
        console.error('Error generating image:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        // Update the slide with the new image URL
        const updatedSlide = {
          ...slide,
          image_url: data.imageUrl,
        };
        handleSlideUpdate(updatedSlide);
        sonnerToast.success('Image generated!', {
          description: 'Your slide image has been created.',
        });
      }
    } catch (error) {
      console.error('Image generation error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate image';
      sonnerToast.error('Generation failed', {
        description: message,
      });
    } finally {
      setGeneratingImageSlideId(null);
    }
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
        layout_type: slide.layout_type || 'centered',
        order_index: index,
        image_url: slide.image_url || null,
        visual_style: slide.visual_style || null,
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

  const handlePublish = async () => {
    if (!projectId) {
      toast({
        title: 'No project selected',
        description: 'Please create or select a project first.',
        variant: 'destructive',
      });
      return;
    }

    // First save any unsaved changes
    if (hasUnsavedChanges) {
      await handleSaveProgress();
    }

    setIsPublishing(true);

    try {
      // Check if we already have a public_id, reuse it if so
      let publicId: string;
      
      if (publicUrl) {
        publicId = publicUrl.split('/p/')[1];
      } else {
        // Fetch existing public_id if any
        const { data: existingProject } = await supabase
          .from('projects')
          .select('public_id')
          .eq('id', projectId)
          .maybeSingle();
        
        publicId = existingProject?.public_id || `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      }

      const { error } = await supabase
        .from('projects')
        .update({
          is_published: true,
          public_id: publicId,
        })
        .eq('id', projectId);

      if (error) throw error;

      const newUrl = `${window.location.origin}/p/${publicId}`;
      setPublicUrl(newUrl);
      setIsPublished(true);

      // Copy to clipboard
      await navigator.clipboard.writeText(newUrl);
      
      sonnerToast.success('Published & copied!', {
        description: 'Your presentation link has been copied to clipboard.',
      });
    } catch (error) {
      console.error('Error publishing:', error);
      toast({
        title: 'Publish failed',
        description: 'Could not publish your presentation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_published: false })
        .eq('id', projectId);

      if (error) throw error;

      setIsPublished(false);
      sonnerToast.success('Unpublished', {
        description: 'Your presentation is now private.',
      });
    } catch (error) {
      console.error('Error unpublishing:', error);
      toast({
        title: 'Unpublish failed',
        description: 'Could not unpublish your presentation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewPublished = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      sonnerToast.success('Link copied!');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-black/30 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl tracking-wide">Live Slide Editor</h2>
          </div>
          
          {/* Slide Navigation */}
          <div className="flex items-center gap-2 ml-4 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.08]">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousSlide}
              disabled={currentSlideIndex === 0}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center font-sans tracking-wide">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs text-gold uppercase tracking-[0.15em] font-sans px-3 py-1 bg-gold/10 rounded-full border border-gold/30">
              Unsaved changes
            </span>
          )}
          {isPublished && publicUrl ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Link className="w-4 h-4" />
                Copy Link
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10"
                  >
                    <Check className="w-4 h-4 text-primary" />
                    Published
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
                  <DropdownMenuItem onClick={handleViewPublished} className="cursor-pointer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Published
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    <Link className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleUnpublish} className="cursor-pointer text-destructive focus:text-destructive">
                    <EyeOff className="w-4 h-4 mr-2" />
                    Unpublish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={handlePublish}
              disabled={isPublishing}
              className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Publish
                </>
              )}
            </Button>
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

      {/* Slide Thumbnails Carousel */}
      <div className="flex gap-3 p-4 border-b border-white/[0.06] overflow-x-auto bg-black/20 scrollbar-hide">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlideIndex(index)}
            className={`
              flex-shrink-0 w-28 h-20 p-3 rounded-lg border-2 transition-all duration-300 font-sans
              flex flex-col justify-between
              ${index === currentSlideIndex
                ? 'border-primary bg-primary/10 shadow-[0_0_25px_hsl(var(--primary)/0.4)] scale-105'
                : 'border-white/[0.08] bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.04]'
              }
            `}
          >
            <span className={`text-[9px] font-medium ${index === currentSlideIndex ? 'text-primary' : 'text-muted-foreground'}`}>
              {index + 1}
            </span>
            <span className="text-[10px] text-foreground/80 truncate text-left leading-tight">
              {slide.content.title || `Slide ${index + 1}`}
            </span>
          </button>
        ))}
      </div>

      {/* Split View: Editor & Preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-0">
        {/* Left: Editor Panel */}
        <div className="border-r border-[rgba(255,255,255,0.06)] overflow-y-auto bg-[rgba(0,0,0,0.15)]">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                <Edit3 className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans font-medium">
                Edit Content
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <SlideEditor
                  slide={currentSlide}
                  slideIndex={currentSlideIndex}
                  onUpdate={handleSlideUpdate}
                  onGenerateImage={handleGenerateImage}
                  isGeneratingImage={generatingImageSlideId === currentSlide.id}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Live Preview Panel */}
        <div className="bg-[rgba(5,1,13,0.6)] backdrop-blur-sm overflow-y-auto">
          <div className="p-6 h-full flex flex-col">
            {/* Layout Switcher Bar - Always visible */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-accent/10 rounded flex items-center justify-center">
                  <Eye className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans font-medium">
                  Preview
                </span>
              </div>
              <LayoutSwitcher
                currentLayout={currentSlide.layout_type || 'centered'}
                onLayoutChange={(layout) => {
                  handleSlideUpdate({
                    ...currentSlide,
                    layout_type: layout,
                  });
                }}
              />
            </div>
            <div className="flex-1 min-h-0">
              <AnimatePresence mode="wait">
                <SlidePreview
                  key={`${currentSlide.id}-${JSON.stringify(currentSlide.content)}-${currentSlide.image_url}`}
                  slide={currentSlide}
                  slideIndex={currentSlideIndex}
                  isGeneratingImage={generatingImageSlideId === currentSlide.id}
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