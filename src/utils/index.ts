/**
 * Utility functions for the Notes Tracker application
 */

import * as Audio from 'expo-audio';

/**
 * Generate a unique ID using timestamp and random number
 * @returns Unique string ID
 */
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
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
 * @param seconds - Duration in seconds
 * @returns Formatted time string (mm:ss)
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Validate if a string is not empty after trimming
 * @param value - String to validate
 * @returns True if valid, false otherwise
 */
export const isValidString = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Get a lighter version of a color (for iOS-style backgrounds)
 * @param color - Hex color string
 * @param opacity - Opacity value (0-1)
 * @returns RGBA color string
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
 * Get contrast color (black or white) for a given background color
 * @param backgroundColor - Hex color string
 * @returns '#000000' or '#FFFFFF'
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

/**
 * Debounce function to limit the rate of function execution
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
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

/**
 * Filter array of objects by search text
 * @param items - Array of objects to search
 * @param searchText - Text to search for
 * @param searchFields - Fields to search in each object
 * @returns Filtered array
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

/**
 * Configure audio mode for recording
 * Sets up audio session for microphone recording
 */
export const configureAudioForRecording = async (): Promise<void> => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
  });
};

/**
 * Configure audio mode for speaker playback
 * Sets up audio session to play through device speakers
 */
export const configureAudioForSpeakerPlayback = async (): Promise<void> => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
  });
};
