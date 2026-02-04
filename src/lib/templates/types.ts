// Output template type definitions

export type TemplateId = 'one-pager' | 'script';

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  isPro: boolean;
  defaultLength: 'quick' | 'standard' | 'detailed';
}

// One-Pager data structure
export interface OnePagerSection {
  title: string;
  content: string;
}

export interface OnePagerData {
  headline: string;
  subheadline: string;
  sections: OnePagerSection[];
  cta?: string;
  contact?: string;
}

// Script data structure
export interface ScriptSection {
  name: string;
  duration: string;
  content: string;
  cue: string;
}

export interface ScriptData {
  totalDuration: string;
  sections: ScriptSection[];
}

// Union type for all template data
export type TemplateData = OnePagerData | ScriptData;
