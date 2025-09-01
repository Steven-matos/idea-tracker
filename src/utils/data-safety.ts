import { Note, Category, AppSettings } from '../types';

/**
 * Data safety utilities for preventing data loss and corruption
 * Implements SOLID principles with focused, single-responsibility functions
 * Follows DRY principle by centralizing data safety operations
 * Implements KISS principle with straightforward validation logic
 */

/**
 * Sanitize and validate note data before storage
 * @param note - Note object to validate
 * @returns Sanitized note object
 */
export function sanitizeNote(note: Partial<Note>): Note {
  const now = new Date().toISOString();
  
  // Ensure required fields exist
  if (!note.id) {
    throw new Error('Note ID is required');
  }
  
  if (!note.content) {
    throw new Error('Note content is required');
  }
  
  if (!note.type) {
    throw new Error('Note type is required');
  }
  
  // Sanitize content (remove potentially harmful characters)
  const sanitizedContent = sanitizeString(note.content);
  
  // Ensure content is not empty after sanitization
  if (!sanitizedContent.trim()) {
    throw new Error('Note content cannot be empty after sanitization');
  }
  
  // Generate label if missing
  let label = note.label;
  if (!label || label.trim() === '') {
    if (note.type === 'text') {
      label = sanitizedContent.length > 50 
        ? sanitizedContent.substring(0, 50) + '...' 
        : sanitizedContent;
    } else {
      label = `Voice Note (${note.audioDuration ? formatDuration(note.audioDuration) : 'Unknown'})`;
    }
  }
  
  // Ensure category ID exists
  const categoryId = note.categoryId || 'general';
  
  return {
    id: note.id,
    label: sanitizeString(label),
    type: note.type,
    content: sanitizedContent,
    audioPath: note.audioPath,
    audioDuration: note.audioDuration,
    categoryId,
    createdAt: note.createdAt || now,
    updatedAt: now,
    isFavorite: note.isFavorite || false,
  };
}

/**
 * Sanitize and validate category data before storage
 * @param category - Category object to validate
 * @returns Sanitized category object
 */
export function sanitizeCategory(category: Partial<Category>): Category {
  const now = new Date().toISOString();
  
  // Ensure required fields exist
  if (!category.id) {
    throw new Error('Category ID is required');
  }
  
  if (!category.name) {
    throw new Error('Category name is required');
  }
  
  if (!category.color) {
    throw new Error('Category color is required');
  }
  
  // Sanitize name
  const sanitizedName = sanitizeString(category.name);
  if (!sanitizedName.trim()) {
    throw new Error('Category name cannot be empty after sanitization');
  }
  
  // Validate color format
  if (!isValidHexColor(category.color)) {
    throw new Error('Invalid color format. Use hex color (e.g., #FF0000)');
  }
  
  return {
    id: category.id,
    name: sanitizedName,
    color: category.color,
    createdAt: category.createdAt || now,
  };
}

/**
 * Sanitize and validate app settings before storage
 * @param settings - Settings object to validate
 * @returns Sanitized settings object
 */
export function sanitizeSettings(settings: Partial<AppSettings>): AppSettings {
  // Validate audio quality
  const validAudioQualities = ['low', 'medium', 'high'] as const;
  const audioQuality = validAudioQualities.includes(settings.audioQuality as any) 
    ? settings.audioQuality 
    : 'medium';
  
  // Validate theme mode
  const validThemeModes = ['light', 'dark', 'system'] as const;
  const themeMode = validThemeModes.includes(settings.themeMode as any) 
    ? settings.themeMode 
    : 'system';
  
  // Ensure default category ID exists
  const defaultCategoryId = settings.defaultCategoryId || 'general';
  
  return {
    defaultCategoryId,
    audioQuality: audioQuality as 'low' | 'medium' | 'high',
    themeMode: themeMode as 'light' | 'dark' | 'system',
  };
}

/**
 * Sanitize string input to prevent injection attacks and ensure consistency
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    // Remove null bytes and control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Limit length to prevent abuse
    .substring(0, 10000);
}

/**
 * Validate hex color format
 * @param color - Color string to validate
 * @returns True if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

/**
 * Format duration in seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted time string
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Validate note structure for data integrity
 * @param note - Note object to validate
 * @returns Validation result with details
 */
export function validateNoteStructure(note: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if note is an object
  if (!note || typeof note !== 'object') {
    errors.push('Note must be an object');
    return { isValid: false, errors, warnings };
  }
  
  // Check required fields
  if (!note.id || typeof note.id !== 'string') {
    errors.push('Note must have a valid string ID');
  }
  
  if (!note.content || typeof note.content !== 'string') {
    errors.push('Note must have content');
  }
  
  if (!note.type || !['text', 'voice'].includes(note.type)) {
    errors.push('Note must have a valid type (text or voice)');
  }
  
  if (!note.categoryId || typeof note.categoryId !== 'string') {
    errors.push('Note must have a valid category ID');
  }
  
  // Check optional fields
  if (note.audioPath && typeof note.audioPath !== 'string') {
    warnings.push('Audio path should be a string');
  }
  
  if (note.audioDuration && (typeof note.audioDuration !== 'number' || note.audioDuration < 0)) {
    warnings.push('Audio duration should be a positive number');
  }
  
  if (note.isFavorite && typeof note.isFavorite !== 'boolean') {
    warnings.push('isFavorite should be a boolean');
  }
  
  // Check timestamps
  if (note.createdAt && !isValidISODate(note.createdAt)) {
    warnings.push('Created timestamp should be a valid ISO date string');
  }
  
  if (note.updatedAt && !isValidISODate(note.updatedAt)) {
    warnings.push('Updated timestamp should be a valid ISO date string');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate category structure for data integrity
 * @param category - Category object to validate
 * @returns Validation result with details
 */
export function validateCategoryStructure(category: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if category is an object
  if (!category || typeof category !== 'object') {
    errors.push('Category must be an object');
    return { isValid: false, errors, warnings };
  }
  
  // Check required fields
  if (!category.id || typeof category.id !== 'string') {
    errors.push('Category must have a valid string ID');
  }
  
  if (!category.name || typeof category.name !== 'string') {
    errors.push('Category must have a name');
  }
  
  if (!category.color || typeof category.color !== 'string') {
    errors.push('Category must have a color');
  } else if (!isValidHexColor(category.color)) {
    errors.push('Category must have a valid hex color');
  }
  
  // Check optional fields
  if (category.createdAt && !isValidISODate(category.createdAt)) {
    warnings.push('Created timestamp should be a valid ISO date string');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate ISO date string format
 * @param dateString - Date string to validate
 * @returns True if valid ISO date
 */
export function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date.toISOString() === dateString;
  } catch {
    return false;
  }
}

/**
 * Create a deep copy of data to prevent mutation issues
 * @param data - Data to copy
 * @returns Deep copy of the data
 */
export function deepCopy<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.warn('Deep copy failed, returning original data:', error);
    return data;
  }
}

/**
 * Check if two objects are deeply equal
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns True if objects are deeply equal
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  try {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  } catch (error) {
    console.warn('Deep equality check failed:', error);
    return false;
  }
}

/**
 * Generate a safe backup key with timestamp
 * @param baseKey - Base storage key
 * @returns Safe backup key
 */
export function generateBackupKey(baseKey: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseKey}_backup_${timestamp}_${randomSuffix}`;
}

/**
 * Extract timestamp from backup key
 * @param backupKey - Backup key to parse
 * @returns Timestamp or null if invalid
 */
export function extractBackupTimestamp(backupKey: string): number | null {
  try {
    const parts = backupKey.split('_backup_');
    if (parts.length !== 2) return null;
    
    const timestampPart = parts[1].split('_')[0];
    const timestamp = parseInt(timestampPart);
    
    return isNaN(timestamp) ? null : timestamp;
  } catch {
    return null;
  }
}

/**
 * Validate backup key format
 * @param key - Key to validate
 * @returns True if valid backup key format
 */
export function isValidBackupKey(key: string): boolean {
  return /^.+_backup_\d+_[a-z0-9]+$/.test(key);
}
