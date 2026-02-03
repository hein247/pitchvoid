import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  GripVertical,
  List,
  Sparkles,
  Type,
  Check,
  X,
  Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnePagerData, OnePagerSection } from './OnePager';

interface EditorAreaPanelProps {
  area: 'header' | 'sections' | 'contact';
  data: OnePagerData;
  onUpdate: (data: OnePagerData) => void;
}

const sectionTypes: { value: OnePagerSection['type']; label: string; icon: React.ReactNode }[] = [
  { value: 'key-points', label: 'Key Points', icon: <List className="w-4 h-4" /> },
  { value: 'value-prop', label: 'Value Prop', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'cta', label: 'Call to Action', icon: <Type className="w-4 h-4" /> },
];

const EditorAreaPanel = ({ area, data, onUpdate }: EditorAreaPanelProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setTempValue(value);
  };

  const saveEdit = () => {
    if (!editingField) return;

    const newData = { ...data };
    
    if (editingField === 'headline') {
      newData.headline = tempValue;
    } else if (editingField === 'subheadline') {
      newData.subheadline = tempValue;
    } else if (editingField.startsWith('section-')) {
      const [, indexStr, field] = editingField.split('-');
      const index = parseInt(indexStr);
      if (field === 'title') {
        newData.sections[index].title = tempValue;
      } else if (field === 'content') {
        newData.sections[index].content = tempValue;
      }
    } else if (editingField.startsWith('bullet-')) {
      const [, sectionStr, bulletStr] = editingField.split('-');
      const sectionIndex = parseInt(sectionStr);
      const bulletIndex = parseInt(bulletStr);
      if (newData.sections[sectionIndex].bullets) {
        newData.sections[sectionIndex].bullets![bulletIndex] = tempValue;
      }
    } else if (editingField.startsWith('contact-')) {
      const field = editingField.replace('contact-', '') as 'email' | 'phone' | 'website';
      if (!newData.contactInfo) newData.contactInfo = {};
      newData.contactInfo[field] = tempValue;
    }

    onUpdate(newData);
    setEditingField(null);
    setTempValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const addBullet = (sectionIndex: number) => {
    const newData = { ...data };
    if (!newData.sections[sectionIndex].bullets) {
      newData.sections[sectionIndex].bullets = [];
    }
    newData.sections[sectionIndex].bullets!.push('New bullet point');
    onUpdate(newData);
  };

  const removeBullet = (sectionIndex: number, bulletIndex: number) => {
    const newData = { ...data };
    newData.sections[sectionIndex].bullets?.splice(bulletIndex, 1);
    onUpdate(newData);
  };

  const addSection = () => {
    const newData = { ...data };
    newData.sections.push({
      type: 'key-points',
      title: 'New Section',
      content: 'Add your content here',
      bullets: ['Point 1', 'Point 2']
    });
    onUpdate(newData);
    setExpandedSection(newData.sections.length - 1);
  };

  const removeSection = (index: number) => {
    const newData = { ...data };
    newData.sections.splice(index, 1);
    onUpdate(newData);
    setExpandedSection(null);
  };

  const updateSectionType = (index: number, type: OnePagerSection['type']) => {
    const newData = { ...data };
    newData.sections[index].type = type;
    onUpdate(newData);
  };

  const EditableField = ({ 
    fieldKey, 
    value, 
    placeholder,
    multiline = false,
    className: fieldClassName 
  }: { 
    fieldKey: string; 
    value: string; 
    placeholder?: string;
    multiline?: boolean;
    className?: string;
  }) => {
    const isEditing = editingField === fieldKey;

    if (isEditing) {
      return (
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
              rows={3}
              className={cn(
                "flex-1 bg-card/80 border border-primary/50 rounded-lg px-3 py-2 text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none",
                fieldClassName
              )}
            />
          ) : (
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className={cn(
                "flex-1 bg-card/80 border border-primary/50 rounded-lg px-3 py-2 text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                fieldClassName
              )}
            />
          )}
          <button
            onClick={saveEdit}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={cancelEdit}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => startEdit(fieldKey, value)}
        className={cn(
          "group flex items-center gap-2 text-left w-full p-3 rounded-xl",
          "bg-accent/5 border border-border/50",
          "hover:bg-accent/10 transition-colors",
          fieldClassName
        )}
      >
        <span className="flex-1 truncate text-foreground">{value || <span className="text-muted-foreground">{placeholder}</span>}</span>
        <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </button>
    );
  };

  // Header Panel
  if (area === 'header') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider">Headline</label>
          <EditableField 
            fieldKey="headline" 
            value={data.headline} 
            placeholder="Enter headline..."
            className="text-lg font-display"
          />
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider">Subheadline</label>
          <EditableField 
            fieldKey="subheadline" 
            value={data.subheadline} 
            placeholder="Enter subheadline..."
            multiline
          />
        </div>
      </div>
    );
  }

  // Contact Panel
  if (area === 'contact') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider">Email</label>
          <EditableField 
            fieldKey="contact-email" 
            value={data.contactInfo?.email || ''} 
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider">Phone</label>
          <EditableField 
            fieldKey="contact-phone" 
            value={data.contactInfo?.phone || ''} 
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider">Website</label>
          <EditableField 
            fieldKey="contact-website" 
            value={data.contactInfo?.website || ''} 
            placeholder="https://example.com"
          />
        </div>
      </div>
    );
  }

  // Sections Panel
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {data.sections.length} section{data.sections.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={addSection}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Section
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {data.sections.map((section, index) => (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl bg-card/60 border border-border/50 overflow-hidden"
          >
            {/* Section Header */}
            <button
              onClick={() => setExpandedSection(expandedSection === index ? null : index)}
              className="w-full flex items-center gap-3 p-4 hover:bg-accent/5 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/50" />
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                section.type === 'cta' ? "bg-primary/20" : "bg-accent/20"
              )}>
                <span className="text-sm">
                  {section.type === 'key-points' && '✦'}
                  {section.type === 'value-prop' && '◆'}
                  {section.type === 'cta' && '→'}
                </span>
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground">{section.title}</span>
                <span className="text-xs text-muted-foreground ml-2 capitalize">{section.type.replace('-', ' ')}</span>
              </div>
              <motion.div
                animate={{ rotate: expandedSection === index ? 180 : 0 }}
                className="text-muted-foreground"
              >
                ▼
              </motion.div>
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {expandedSection === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-4 border-t border-border/30">
                    {/* Section Type */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Type</label>
                      <div className="flex gap-2 flex-wrap">
                        {sectionTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => updateSectionType(index, type.value)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                              section.type === type.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {type.icon}
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Title</label>
                      <EditableField 
                        fieldKey={`section-${index}-title`} 
                        value={section.title} 
                        placeholder="Section title..."
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Content</label>
                      <EditableField 
                        fieldKey={`section-${index}-content`} 
                        value={section.content} 
                        placeholder="Section content..."
                        multiline
                      />
                    </div>

                    {/* Bullets */}
                    {section.type !== 'cta' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-muted-foreground">Bullet Points</label>
                          <button
                            onClick={() => addBullet(index)}
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {section.bullets?.map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex items-center gap-2 group">
                              <span className="text-primary text-xs">•</span>
                              <div className="flex-1">
                                <EditableField 
                                  fieldKey={`bullet-${index}-${bulletIndex}`} 
                                  value={bullet} 
                                  placeholder="Bullet point..."
                                  className="text-sm"
                                />
                              </div>
                              <button
                                onClick={() => removeBullet(index, bulletIndex)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delete Section */}
                    <button
                      onClick={() => removeSection(index)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors w-full justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Section
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default EditorAreaPanel;
