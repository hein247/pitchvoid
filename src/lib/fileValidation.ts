/**
 * File upload validation utilities
 */

export const FILE_UPLOAD_CONFIG = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  maxSizeLabel: '10MB',
  maxFiles: 5,
  acceptedTypes: {
    'application/pdf': { ext: '.pdf', label: 'PDF' },
    'application/msword': { ext: '.doc', label: 'Word' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', label: 'Word' },
    'text/plain': { ext: '.txt', label: 'Text' },
    'image/png': { ext: '.png', label: 'PNG' },
    'image/jpeg': { ext: '.jpg', label: 'JPG' },
  } as Record<string, { ext: string; label: string }>,
  acceptString: '.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg',
  formatLabels: 'PDF, DOCX, TXT, PNG, JPG',
};

export interface FileValidationError {
  file: File;
  reason: 'type' | 'size';
  message: string;
}

export interface FileValidationResult {
  validFiles: File[];
  errors: FileValidationError[];
}

/**
 * Validates files against size and type constraints.
 * Returns valid files and descriptive error messages for rejected ones.
 */
export function validateFiles(
  files: File[],
  currentCount: number = 0
): FileValidationResult & { overLimit: boolean } {
  const validFiles: File[] = [];
  const errors: FileValidationError[] = [];
  const overLimit = currentCount + files.length > FILE_UPLOAD_CONFIG.maxFiles;

  for (const file of files) {
    // Check type
    if (!FILE_UPLOAD_CONFIG.acceptedTypes[file.type]) {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'unknown';
      errors.push({
        file,
        reason: 'type',
        message: `"${file.name}" is not a supported format (.${ext}). Accepted: ${FILE_UPLOAD_CONFIG.formatLabels}.`,
      });
      continue;
    }

    // Check size
    if (file.size > FILE_UPLOAD_CONFIG.maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      errors.push({
        file,
        reason: 'size',
        message: `"${file.name}" is ${sizeMB} MB — max file size is ${FILE_UPLOAD_CONFIG.maxSizeLabel}.`,
      });
      continue;
    }

    validFiles.push(file);
  }

  return { validFiles, errors, overLimit };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
