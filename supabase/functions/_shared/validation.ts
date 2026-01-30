/**
 * Input validation helpers for edge functions
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Maximum lengths for various input types
const MAX_LENGTHS = {
  userInput: 5000,
  scenario: 5000,
  targetAudience: 500,
  documentContext: 10000,
  visualStyle: 500,
  slideTitle: 200,
  slideDescription: 1000,
  tone: 100,
  length: 20,
};

const MAX_ARRAY_SIZES = {
  imageDescriptions: 10,
};

/**
 * Validates and sanitizes a string input
 */
export function validateString(
  value: unknown,
  fieldName: string,
  maxLength: number,
  required = false
): ValidationResult {
  if (value === undefined || value === null || value === "") {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  }

  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }

  return { valid: true };
}

/**
 * Validates an array of strings
 */
export function validateStringArray(
  value: unknown,
  fieldName: string,
  maxArraySize: number,
  maxStringLength: number
): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: true };
  }

  if (!Array.isArray(value)) {
    return { valid: false, error: `${fieldName} must be an array` };
  }

  if (value.length > maxArraySize) {
    return { valid: false, error: `${fieldName} must have at most ${maxArraySize} items` };
  }

  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== "string") {
      return { valid: false, error: `${fieldName}[${i}] must be a string` };
    }
    if (value[i].length > maxStringLength) {
      return { valid: false, error: `${fieldName}[${i}] must be less than ${maxStringLength} characters` };
    }
  }

  return { valid: true };
}

/**
 * Validates parse-pitch-input request body
 */
export function validateParsePitchInput(body: Record<string, unknown>): ValidationResult {
  const userInputResult = validateString(body.userInput, "userInput", MAX_LENGTHS.userInput, true);
  if (!userInputResult.valid) return userInputResult;

  return { valid: true };
}

/**
 * Validates generate-pitch request body
 */
export function validateGeneratePitchInput(body: Record<string, unknown>): ValidationResult {
  const scenarioResult = validateString(body.scenario, "scenario", MAX_LENGTHS.scenario, true);
  if (!scenarioResult.valid) return scenarioResult;

  const audienceResult = validateString(body.targetAudience, "targetAudience", MAX_LENGTHS.targetAudience);
  if (!audienceResult.valid) return audienceResult;

  const contextResult = validateString(body.documentContext, "documentContext", MAX_LENGTHS.documentContext);
  if (!contextResult.valid) return contextResult;

  const styleResult = validateString(body.visualStyle, "visualStyle", MAX_LENGTHS.visualStyle);
  if (!styleResult.valid) return styleResult;

  const imagesResult = validateStringArray(
    body.imageDescriptions,
    "imageDescriptions",
    MAX_ARRAY_SIZES.imageDescriptions,
    MAX_LENGTHS.slideDescription
  );
  if (!imagesResult.valid) return imagesResult;

  return { valid: true };
}

/**
 * Validates generate-one-pager request body
 */
export function validateGenerateOnePagerInput(body: Record<string, unknown>): ValidationResult {
  // Same validation as generate-pitch
  return validateGeneratePitchInput(body);
}

/**
 * Validates generate-script request body
 */
export function validateGenerateScriptInput(body: Record<string, unknown>): ValidationResult {
  const scenarioResult = validateString(body.scenario, "scenario", MAX_LENGTHS.scenario, true);
  if (!scenarioResult.valid) return scenarioResult;

  const audienceResult = validateString(body.targetAudience, "targetAudience", MAX_LENGTHS.targetAudience);
  if (!audienceResult.valid) return audienceResult;

  const contextResult = validateString(body.documentContext, "documentContext", MAX_LENGTHS.documentContext);
  if (!contextResult.valid) return contextResult;

  const toneResult = validateString(body.tone, "tone", MAX_LENGTHS.tone);
  if (!toneResult.valid) return toneResult;

  const lengthResult = validateString(body.length, "length", MAX_LENGTHS.length);
  if (!lengthResult.valid) return lengthResult;

  const imagesResult = validateStringArray(
    body.imageDescriptions,
    "imageDescriptions",
    MAX_ARRAY_SIZES.imageDescriptions,
    MAX_LENGTHS.slideDescription
  );
  if (!imagesResult.valid) return imagesResult;

  return { valid: true };
}

/**
 * Validates generate-pitch-images request body
 */
export function validateGeneratePitchImagesInput(body: Record<string, unknown>): ValidationResult {
  const titleResult = validateString(body.slideTitle, "slideTitle", MAX_LENGTHS.slideTitle, true);
  if (!titleResult.valid) return titleResult;

  const descResult = validateString(body.slideDescription, "slideDescription", MAX_LENGTHS.slideDescription, true);
  if (!descResult.valid) return descResult;

  const styleResult = validateString(body.visualStyle, "visualStyle", MAX_LENGTHS.visualStyle);
  if (!styleResult.valid) return styleResult;

  if (typeof body.slideIndex !== "number" || body.slideIndex < 0 || body.slideIndex > 20) {
    return { valid: false, error: "slideIndex must be a number between 0 and 20" };
  }

  return { valid: true };
}

// Patterns commonly used in prompt injection attacks
const INJECTION_PATTERNS = [
  // Meta-instruction patterns
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)/gi,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)/gi,
  // Role hijacking
  /\b(system|assistant|user|human|ai)\s*:/gi,
  /you\s+are\s+(now|actually)\s+/gi,
  /act\s+as\s+(if\s+you\s+were|a|an)\s+/gi,
  /pretend\s+(to\s+be|you\s+are)\s+/gi,
  // Prompt extraction
  /reveal\s+(your|the)\s+(system\s+)?prompt/gi,
  /show\s+(me\s+)?(your|the)\s+(system\s+)?prompt/gi,
  /what\s+(is|are)\s+your\s+(instructions?|prompts?|guidelines?)/gi,
  /repeat\s+(your\s+)?(system\s+)?instructions?/gi,
  // Context escape attempts
  /<\/(system|context|user|assistant|instruction)>/gi,
  /<(system|context|user|assistant|instruction)[^>]*>/gi,
  /\[\/?(INST|SYS)\]/gi,
  // Output manipulation
  /output\s+only\s*:/gi,
  /respond\s+with\s+only\s*:/gi,
];

/**
 * Sanitizes a string for use in AI prompts with enhanced protection
 * against prompt injection attacks
 */
export function sanitizeForPrompt(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  // Remove code blocks that could contain injection attempts
  sanitized = sanitized.replace(/```[\s\S]*?```/g, "[code removed]");
  sanitized = sanitized.replace(/`[^`]+`/g, "[code removed]");

  // Remove XML/HTML-like tags that could escape context
  sanitized = sanitized.replace(/<[^>]{1,50}>/g, "");

  // Replace double brackets (potential template injection)
  sanitized = sanitized.replace(/\[\[/g, "[");
  sanitized = sanitized.replace(/\]\]/g, "]");
  sanitized = sanitized.replace(/\{\{/g, "{");
  sanitized = sanitized.replace(/\}\}/g, "}");

  // Neutralize injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[redacted]");
  }

  // Remove excessive newlines that might be used to hide injection
  sanitized = sanitized.replace(/\n{4,}/g, "\n\n\n");

  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized.trim();
}

/**
 * Logs suspicious input patterns for monitoring (without blocking)
 */
export function detectSuspiciousInput(input: string, context: string): boolean {
  if (!input) return false;

  const suspiciousPatterns = [
    /ignore.*instructions?/i,
    /system\s*:/i,
    /<\/?(system|context|instruction)/i,
    /reveal.*prompt/i,
    /pretend.*you.*are/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      console.warn(`Suspicious input detected in ${context}:`, input.substring(0, 100));
      return true;
    }
  }

  return false;
}
