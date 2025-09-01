/**
 * Utility functions for the Notes Tracker application
 * Implements SOLID principles with focused, single-responsibility utilities
 * Follows DRY principle by centralizing common functionality
 */

import * as Audio from 'expo-audio';

// Export storage utilities
export * from './storage-utils';

// Export data safety utilities
export * from './data-safety';

// ID Generation
// =============================================================================

/**
 * Generate a unique ID using timestamp and random number
 * Provides collision-resistant IDs for notes and categories
 * 
 * @returns Unique string ID
 * @example
 * ```typescript
 * const noteId = generateId(); // "1703123456789_abc123def"
 * ```
 */
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Date and Time Formatting
// =============================================================================

/**
 * Format a date string to a readable, human-friendly format
 * Provides relative dates for recent items and absolute dates for older ones
 * 
 * @param dateString - ISO date string to format
 * @returns Human-readable date string
 * @example
 * ```typescript
 * formatDate('2024-01-15T10:30:00Z') // "Today" | "Yesterday" | "2 days ago" | "Jan 15"
 * ```
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
};

/**
 * Format duration in seconds to readable time string
 * Converts numeric seconds to human-readable MM:SS format
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted time string in MM:SS format
 * @example
 * ```typescript
 * formatDuration(125) // "2:05"
 * formatDuration(45)  // "0:45"
 * ```
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// String Processing
// =============================================================================

/**
 * Truncate text to specified length with ellipsis
 * Safely shortens long text while preserving readability
 * 
 * @param text - Text string to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 * @example
 * ```typescript
 * truncateText("This is a very long text", 10) // "This is a ..."
 * truncateText("Short", 10) // "Short"
 * ```
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};

// Validation
// =============================================================================

/**
 * Validate if a string is not empty after trimming whitespace
 * Provides consistent string validation across the application
 * 
 * @param value - String value to validate
 * @returns True if string is valid (non-empty after trim), false otherwise
 * @example
 * ```typescript
 * isValidString("  hello  ") // true
 * isValidString("   ")       // false
 * isValidString("")          // false
 * ```
 */
export const isValidString = (value: string): boolean => {
  return value.trim().length > 0;
};

// Color Utilities
// =============================================================================

/**
 * Get a lighter version of a color with specified opacity
 * Converts hex colors to RGBA for background overlays and subtle accents
 * 
 * @param color - Hex color string (with or without #)
 * @param opacity - Opacity value between 0 and 1 (default: 0.1)
 * @returns RGBA color string
 * @example
 * ```typescript
 * getLightColor("#FF0000", 0.2) // "rgba(255, 0, 0, 0.2)"
 * getLightColor("3B82F6")       // "rgba(59, 130, 246, 0.1)"
 * ```
 */
export const getLightColor = (color: string, opacity: number = 0.1): string => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Get optimal contrast color (black or white) for a given background color
 * Uses luminance calculation to determine the best text color for accessibility
 * 
 * @param backgroundColor - Hex color string (with or without #)
 * @returns '#000000' for light backgrounds, '#FFFFFF' for dark backgrounds
 * @example
 * ```typescript
 * getContrastColor("#FFFFFF") // "#000000"
 * getContrastColor("#000000") // "#FFFFFF"
 * getContrastColor("#3B82F6") // "#FFFFFF"
 * ```
 */
export const getContrastColor = (backgroundColor: string): string => {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Performance Utilities
// =============================================================================

/**
 * Debounce function to limit the rate of function execution
 * Prevents excessive function calls during rapid user interactions
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds before execution
 * @returns Debounced function that delays execution
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 * 
 * // Will only execute once after user stops typing for 300ms
 * debouncedSearch("hello");
 * ```
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Search and Filtering
// =============================================================================

/**
 * Filter array of objects by search text across specified fields
 * Provides flexible, case-insensitive search functionality
 * 
 * @param items - Array of objects to search through
 * @param searchText - Text to search for (case-insensitive)
 * @param searchFields - Object fields to search within
 * @returns Filtered array containing only matching items
 * @example
 * ```typescript
 * const notes = [
 *   { title: "Meeting Notes", content: "Discuss project" },
 *   { title: "Shopping List", content: "Buy groceries" }
 * ];
 * 
 * filterBySearchText(notes, "meeting", ["title", "content"])
 * // Returns: [{ title: "Meeting Notes", content: "Discuss project" }]
 * ```
 */
export const filterBySearchText = <T extends Record<string, any>>(
  items: T[],
  searchText: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchText.trim()) {
    return items;
  }

  const lowerSearchText = searchText.toLowerCase();
  
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      return typeof value === 'string' && 
             value.toLowerCase().includes(lowerSearchText);
    })
  );
};

// Audio Configuration
// =============================================================================

/**
 * Configure audio mode for recording
 * Sets up audio session for optimal microphone recording on both platforms
 * 
 * @throws Error if audio configuration fails
 * @example
 * ```typescript
 * try {
 *   await configureAudioForRecording();
 *   // Proceed with recording setup
 * } catch (error) {
 *   console.error('Failed to configure audio:', error);
 * }
 * ```
 */
export const configureAudioForRecording = async (): Promise<void> => {
  await Audio.setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });
};

/**
 * Configure audio mode for speaker playback
 * Sets up audio session to play audio through device speakers (not earpiece)
 * 
 * @throws Error if audio configuration fails
 * @example
 * ```typescript
 * try {
 *   await configureAudioForSpeakerPlayback();
 *   // Proceed with audio playback
 * } catch (error) {
 *   console.error('Failed to configure audio for playback:', error);
 * }
 * ```
 */
export const configureAudioForSpeakerPlayback = async (): Promise<void> => {
  await Audio.setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
  });
};

/**
 * Get iOS recording options based on audio quality setting
 * Maps app audio quality settings to expo-audio RecordingOptions for optimal iOS recording
 * Implements SOLID principles with single responsibility for iOS audio configuration
 * 
 * @param audioQuality - Audio quality setting from app settings ('low' | 'medium' | 'high')
 * @returns Recording options object for expo-audio on iOS
 * @example
 * ```typescript
 * const options = getIOSRecordingOptions('high');
 * const recorder = useAudioRecorder(options);
 * ```
 */
export const getIOSRecordingOptions = (audioQuality: 'low' | 'medium' | 'high'): Audio.RecordingOptions => {
  // Configure quality-specific settings following expo-audio API structure
  switch (audioQuality) {
    case 'low':
      return {
        isMeteringEnabled: true,
        extension: '.m4a',
        sampleRate: 22050, // Lower sample rate for smaller files
        numberOfChannels: 1, // Mono for smaller file size
        bitRate: 64000, // 64 kbps - compatible with iOS AAC limitations
        android: {
          extension: '.3gp',
          outputFormat: '3gp',
          audioEncoder: 'amr_nb',
        },
        ios: {
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.AudioQuality.LOW,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

    case 'high':
      return {
        isMeteringEnabled: true,
        extension: '.m4a',
        sampleRate: 44100, // CD quality sample rate
        numberOfChannels: 2, // Stereo for better quality
        bitRate: 128000, // 128 kbps - higher quality
        android: {
          outputFormat: 'mpeg4',
          audioEncoder: 'aac',
        },
        ios: {
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.AudioQuality.MAX,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

    case 'medium':
    default:
      return {
        isMeteringEnabled: true,
        extension: '.m4a',
        sampleRate: 44100, // Standard sample rate
        numberOfChannels: 1, // Mono for balanced file size
        bitRate: 96000, // 96 kbps - balanced quality and size
        android: {
          outputFormat: 'mpeg4',
          audioEncoder: 'aac',
        },
        ios: {
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.AudioQuality.MEDIUM,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };
  }
};
