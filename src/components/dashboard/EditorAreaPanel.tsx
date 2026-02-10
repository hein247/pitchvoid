import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, Check, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnePagerData } from './OnePager';

interface EditorAreaPanelProps {
  area: 'header' | 'sections';
  data: OnePagerData;
  onUpdate: (data: OnePagerData) => void;
}

const EditorAreaPanel = ({ area, data, onUpdate }: EditorAreaPanelProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const startEdit = (field: string, value: string) => { setEditingField(field); setTempValue(value); };
  const cancelEdit = () => { setEditingField(null); setTempValue(''); };

  const saveEdit = () => {
    if (!editingField) return;
    const newData = { ...data, sections: data.sections.map(s => ({ ...s, points: [...s.points] })) };

    if (editingField === 'title') newData.title = tempValue;
    else if (editingField === 'context_line') newData.context_line = tempValue;
    else if (editingField.startsWith('section-')) {
      const [, indexStr] = editingField.split('-');
      newData.sections[parseInt(indexStr)].title = tempValue;
    } else if (editingField.startsWith('point-')) {
      const [, sectionStr, pointStr] = editingField.split('-');
      newData.sections[parseInt(sectionStr)].points[parseInt(pointStr)] = tempValue;
    }

    onUpdate(newData);
    setEditingField(null);
    setTempValue('');
  };

  const addPoint = (sectionIndex: number) => {
    const newData = { ...data, sections: data.sections.map((s, i) => i === sectionIndex ? { ...s, points: [...s.points, 'New point'] } : s) };
    onUpdate(newData);
  };

  const removePoint = (sectionIndex: number, pointIndex: number) => {
    const newData = { ...data, sections: data.sections.map((s, i) => i === sectionIndex ? { ...s, points: s.points.filter((_, j) => j !== pointIndex) } : s) };
    onUpdate(newData);
  };

  const addSection = () => {
    const newData = { ...data, sections: [...data.sections, { title: 'New Section', points: ['New point'] }] };
    onUpdate(newData);
    setExpandedSection(newData.sections.length - 1);
  };

  const removeSection = (index: number) => {
    const newData = { ...data, sections: data.sections.filter((_, i) => i !== index) };
    onUpdate(newData);
    setExpandedSection(null);
  };

  const EditableField = ({ fieldKey, value, placeholder, multiline = false, className: fc }: { fieldKey: string; value: string; placeholder?: string; multiline?: boolean; className?: string }) => {
    const isEditing = editingField === fieldKey;
    if (isEditing) {
      return (
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea value={tempValue} onChange={e => setTempValue(e.target.value)} placeholder={placeholder} autoFocus rows={3} className={cn("flex-1 bg-card/80 border border-primary/50 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none", fc)} />
          ) : (
            <input type="text" value={tempValue} onChange={e => setTempValue(e.target.value)} placeholder={placeholder} autoFocus onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className={cn("flex-1 bg-card/80 border border-primary/50 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50", fc)} />
          )}
          <button onClick={saveEdit} className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"><Check className="w-4 h-4" /></button>
          <button onClick={cancelEdit} className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      );
    }
    return (
      <button onClick={() => startEdit(fieldKey, value)} className={cn("group flex items-center gap-2 text-left w-full p-3 rounded-xl bg-accent/5 border border-border/50 hover:bg-accent/10 transition-colors", fc)}>
        <span className="flex-1 truncate text-foreground">{value || <span className="text-muted-foreground">{placeholder}</span>}</span>
        <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </button>
    );
  };

  if (area === 'header') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider">Title</label>
          <EditableField fieldKey="title" value={data.title} placeholder="Project title..." className="text-lg font-display" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider">Context Line</label>
          <EditableField fieldKey="context_line" value={data.context_line} placeholder="What for who..." />
        </div>
      </div>
    );
  }

  // Sections Panel
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{data.sections.length} section{data.sections.length !== 1 ? 's' : ''}</p>
        <button onClick={addSection} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Section
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {data.sections.map((section, index) => (
          <motion.div key={index} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-2xl bg-card/60 border border-border/50 overflow-hidden">
            <button onClick={() => setExpandedSection(expandedSection === index ? null : index)} className="w-full flex items-center gap-3 p-4 hover:bg-accent/5 transition-colors">
              <GripVertical className="w-4 h-4 text-muted-foreground/50" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">{section.title}</span>
              <span className="text-xs text-muted-foreground">{section.points.length}pt</span>
              <motion.div animate={{ rotate: expandedSection === index ? 180 : 0 }} className="text-muted-foreground">▼</motion.div>
            </button>

            <AnimatePresence>
              {expandedSection === index && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 pt-0 space-y-4 border-t border-border/30">
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Title</label>
                      <EditableField fieldKey={`section-${index}-title`} value={section.title} placeholder="Section title..." />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-muted-foreground">Points</label>
                        <button onClick={() => addPoint(index)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                      </div>
                      <div className="space-y-2">
                        {section.points.map((point, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-2 group">
                            <div className="w-[3px] h-5 rounded-full bg-primary/30 flex-shrink-0" />
                            <div className="flex-1">
                              <EditableField fieldKey={`point-${index}-${pIdx}`} value={point} placeholder="Point text..." className="text-sm" />
                            </div>
                            <button onClick={() => removePoint(index, pIdx)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => removeSection(index)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors w-full justify-center">
                      <Trash2 className="w-3.5 h-3.5" /> Remove Section
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
