// Template system barrel export
import { TemplateConfig, TemplateId } from './types';

export * from './types';

// Default templates registry
export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  'one-pager': {
    id: 'one-pager',
    name: 'One-Pager',
    description: 'Executive summary document with key points and CTA',
    icon: 'FileText',
    isPro: false,
    defaultLength: 'standard',
  },
  'script': {
    id: 'script',
    name: 'Script',
    description: 'Teleprompter-ready speech with timed sections and cues',
    icon: 'ScrollText',
    isPro: true,
    defaultLength: 'standard',
  },
};

// Get all available templates
export const getTemplates = (): TemplateConfig[] => Object.values(TEMPLATES);

// Get a specific template by ID
export const getTemplate = (id: TemplateId): TemplateConfig | undefined => TEMPLATES[id];

// Get free templates only
export const getFreeTemplates = (): TemplateConfig[] => 
  Object.values(TEMPLATES).filter(t => !t.isPro);

// Get pro templates only
export const getProTemplates = (): TemplateConfig[] => 
  Object.values(TEMPLATES).filter(t => t.isPro);
