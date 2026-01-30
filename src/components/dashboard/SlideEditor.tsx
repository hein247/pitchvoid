import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Layout, Palette, Sparkles, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export interface SlideContent {
  title: string;
  description: string;
  bullets: string[];
}

export interface Slide {
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
  visual_style?: string;
}

const LAYOUT_OPTIONS = [
  { value: 'centered', label: 'Centered', description: 'Title and content centered' },
  { value: 'side-by-side', label: 'Side-by-Side', description: 'Content in two columns' },
  { value: 'bento-grid', label: 'Bento Grid', description: 'Modern grid layout' },
  { value: 'hero-split', label: 'Hero Split', description: 'Large image with text overlay' },
  { value: 'stats-focus', label: 'Stats Focus', description: 'Highlight key metrics' },
  { value: 'quote-card', label: 'Quote Card', description: 'Testimonial or quote style' },
  { value: 'timeline', label: 'Timeline', description: 'Sequential steps or process' },
  { value: 'feature-grid', label: 'Feature Grid', description: '3-column feature cards' },
];

interface SlideEditorProps {
  slide: Slide;
  slideIndex: number;
  onUpdate: (slide: Slide) => void;
  onGenerateImage?: (slide: Slide) => void;
  isGeneratingImage?: boolean;
}

const SlideEditor = ({ slide, slideIndex, onUpdate, onGenerateImage, isGeneratingImage }: SlideEditorProps) => {
  const handleVisualStyleChange = (value: string) => {
    onUpdate({
      ...slide,
      visual_style: value,
    });
  };

  const handleTitleChange = (value: string) => {
    onUpdate({
      ...slide,
      content: {
        ...slide.content,
        title: value,
      },
    });
  };

  const handleLayoutChange = (value: string) => {
    onUpdate({
      ...slide,
      layout_type: value,
    });
  };

  const handleDescriptionChange = (value: string) => {
    onUpdate({
      ...slide,
      content: {
        ...slide.content,
        description: value,
      },
    });
  };

  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...slide.content.bullets];
    newBullets[index] = value;
    onUpdate({
      ...slide,
      content: {
        ...slide.content,
        bullets: newBullets,
      },
    });
  };

  const addBullet = () => {
    onUpdate({
      ...slide,
      content: {
        ...slide.content,
        bullets: [...slide.content.bullets, ''],
      },
    });
  };

  const removeBullet = (index: number) => {
    const newBullets = slide.content.bullets.filter((_, i) => i !== index);
    onUpdate({
      ...slide,
      content: {
        ...slide.content,
        bullets: newBullets,
      },
    });
  };

  return (
    <div className="space-y-6 font-sans bg-white/[0.03] backdrop-blur-[10px] border border-border p-6 rounded-lg">
      {/* Slide Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
            {slideIndex + 1}
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground uppercase tracking-[0.15em]">
              {slide.component_type}
            </span>
            <span className="text-xs text-muted-foreground/60">Slide {slideIndex + 1}</span>
          </div>
        </div>
      </div>

      {/* Layout Selector */}
      <div className="space-y-2">
        <Label className="text-sm uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
          <Layout className="w-4 h-4" />
          Layout Template
        </Label>
        <Select
          value={slide.layout_type || 'centered'}
          onValueChange={handleLayoutChange}
        >
          <SelectTrigger className="bg-white/[0.03] border-border focus:border-primary focus:ring-primary/30 z-50">
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(270_60%_8%)] border-border z-50">
            {LAYOUT_OPTIONS.map((layout) => (
              <SelectItem 
                key={layout.value} 
                value={layout.value}
                className="focus:bg-primary/20 focus:text-foreground"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{layout.label}</span>
                  <span className="text-xs text-muted-foreground">{layout.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
          Title
        </Label>
        <Input
          id="title"
          value={slide.content.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Enter slide title..."
          className="bg-white/[0.03] border-border focus:border-primary focus:ring-primary/30 focus:shadow-[0_0_15px_hsl(var(--primary)/0.2)] text-lg font-display transition-all duration-300"
          maxLength={100}
        />
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
          Body Text
        </Label>
        <Textarea
          id="description"
          value={slide.content.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Enter slide body text..."
          className="bg-white/[0.03] border-border focus:border-primary focus:ring-primary/30 focus:shadow-[0_0_15px_hsl(var(--primary)/0.2)] min-h-[100px] resize-none font-sans transition-all duration-300"
          maxLength={500}
        />
      </div>

      {/* Bullet Points */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
            Bullet Points
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addBullet}
            className="text-primary hover:text-primary/80 hover:bg-primary/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Point
          </Button>
        </div>

        <div className="space-y-2">
          {slide.content.bullets.map((bullet, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2 group"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
              <div className="flex-1 flex items-center gap-2">
                <span className="text-primary text-lg">•</span>
                <Input
                  value={bullet}
                  onChange={(e) => handleBulletChange(index, e.target.value)}
                  placeholder={`Bullet point ${index + 1}...`}
                  className="bg-white/[0.03] border-border focus:border-primary focus:ring-primary/30 focus:shadow-[0_0_10px_hsl(var(--primary)/0.15)] font-sans transition-all duration-300"
                  maxLength={200}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeBullet(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </motion.div>
          ))}

          {slide.content.bullets.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-4 text-center">
              No bullet points yet. Click "Add Point" to get started.
            </p>
          )}
        </div>
      </div>

      {/* Visual Style for AI Image Generation */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <Label className="text-sm uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Visual Style
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onGenerateImage?.(slide)}
            disabled={isGeneratingImage}
            className="text-primary hover:text-primary/80 hover:bg-primary/10 gap-2"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {slide.image_url ? 'Regenerate with AI' : 'Generate Image'}
              </>
            )}
          </Button>
        </div>
        <Input
          value={slide.visual_style || ''}
          onChange={(e) => handleVisualStyleChange(e.target.value)}
          placeholder="E.g., 'Minimalist blue', 'Vibrant startup colors', 'Professional corporate grey'..."
          className="bg-white/[0.03] border-border focus:border-primary focus:ring-primary/30 focus:shadow-[0_0_10px_hsl(var(--primary)/0.15)] font-sans transition-all duration-300"
        />
        <p className="text-xs text-muted-foreground">
          Describe your desired color palette or theme for the AI-generated slide image.
        </p>
      </div>

      {/* Animation Settings */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
              Animation
            </Label>
            <span className="text-sm text-foreground">{slide.animation.type}</span>
          </div>
          <div className="flex-1">
            <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
              Speed
            </Label>
            <span className="text-sm text-foreground">{slide.animation.speed}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideEditor;