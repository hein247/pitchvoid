import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
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
  order_index: number;
}

interface SlideEditorProps {
  slide: Slide;
  slideIndex: number;
  onUpdate: (slide: Slide) => void;
}

const SlideEditor = ({ slide, slideIndex, onUpdate }: SlideEditorProps) => {
  const handleTitleChange = (value: string) => {
    onUpdate({
      ...slide,
      content: {
        ...slide.content,
        title: value,
      },
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
    <div className="space-y-6">
      {/* Slide Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[hsl(263,70%,58%)] to-[hsl(217,91%,60%)] rounded-full flex items-center justify-center text-white text-sm font-bold">
            {slideIndex + 1}
          </div>
          <span className="text-sm text-muted-foreground uppercase tracking-wider">
            {slide.component_type}
          </span>
        </div>
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
          className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[rgba(139,92,246,0.5)] focus:ring-[rgba(139,92,246,0.3)] text-lg font-display"
          maxLength={100}
        />
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
          Description
        </Label>
        <Textarea
          id="description"
          value={slide.content.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Enter slide description..."
          className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[rgba(139,92,246,0.5)] focus:ring-[rgba(139,92,246,0.3)] min-h-[100px] resize-none"
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
            className="text-[hsl(263,70%,58%)] hover:text-[hsl(263,70%,68%)] hover:bg-[rgba(139,92,246,0.1)]"
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
                <span className="text-[hsl(263,70%,58%)] text-lg">•</span>
                <Input
                  value={bullet}
                  onChange={(e) => handleBulletChange(index, e.target.value)}
                  placeholder={`Bullet point ${index + 1}...`}
                  className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[rgba(139,92,246,0.5)] focus:ring-[rgba(139,92,246,0.3)]"
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

      {/* Animation Settings */}
      <div className="pt-4 border-t border-[rgba(255,255,255,0.1)]">
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