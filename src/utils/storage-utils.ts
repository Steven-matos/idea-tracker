import { Note, Category } from '../types';

// Try to import expo-file-system, but provide fallback if not available
let FileSystem: any = null;
try {
  FileSystem = require('expo-file-system');
} catch (error) {
  console.warn('expo-file-system not available, using fallback storage calculations');
}

/**
 * Storage statistics interface
 * Implements SOLID principles with single responsibility for storage calculations
 */
export interface StorageStats {
  /** Total number of notes */
  totalNotes: number;
  /** Number of text notes */
  textNotes: number;
  /** Number of voice notes */
  voiceNotes: number;
  /** Total storage size in bytes */
  totalSizeBytes: number;
  /** Total storage size in human readable format */
  totalSizeFormatted: string;
  /** Storage breakdown by type */
  breakdown: {
    text: { count: number; sizeBytes: number; sizeFormatted: string };
    voice: { count: number; sizeBytes: number; sizeFormatted: string };
    metadata: { count: number; sizeBytes: number; sizeFormatted: string };
  };
  /** Device storage information */
  deviceStorage?: {
    freeSpace: string;
    totalSpace: string;
    usagePercentage: number;
  };
}

/**
 * Get device storage information
 * Implements KISS principle with straightforward storage queries
 * 
 * @returns Device storage information or null if unavailable
 */
export async function getDeviceStorageInfo(): Promise<{
  freeSpace: string;
  totalSpace: string;
  usagePercentage: number;
} | null> {
  try {
    // Check if FileSystem is available
    if (!FileSystem) {
      return null;
    }

    // Get app's document directory info
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) return null;

    const dirInfo = await FileSystem.getInfoAsync(documentDir);
    if (!dirInfo.exists) return null;

    // For demo purposes, we'll estimate based on common device storage
    // In a real app, you might use expo-device or other native modules
    const estimatedTotalSpace = 64 * 1024 * 1024 * 1024; // 64GB estimate
    const estimatedFreeSpace = Math.max(estimatedTotalSpace - (dirInfo.size || 0), 0);
    
    return {
      freeSpace: formatBytes(estimatedFreeSpace),
      totalSpace: formatBytes(estimatedTotalSpace),
      usagePercentage: Math.min(((estimatedTotalSpace - estimatedFreeSpace) / estimatedTotalSpace) * 100, 100)
    };
  } catch (error) {
    console.warn('Could not get device storage info:', error);
    return null;
  }
}

/**
 * Calculate storage usage statistics for notes and categories
 * Follows DRY principle by centralizing storage calculation logic
 * Implements KISS principle with straightforward calculations
 * 
 * @param notes - Array of notes to analyze
 * @param categories - Array of categories to analyze
 * @returns Storage statistics object
 */
export async function calculateStorageStats(notes: Note[], categories: Category[]): Promise<StorageStats> {
  // Initialize counters
  let textNotes = 0;
  let voiceNotes = 0;
  let textSizeBytes = 0;
  let voiceSizeBytes = 0;
  
  // Calculate note statistics
  notes.forEach(note => {
    if (note.type === 'text') {
      textNotes++;
      // Estimate text size: 1 character ≈ 2 bytes for Unicode
      textSizeBytes += note.content.length * 2;
      if (note.label) {
        textSizeBytes += note.label.length * 2;
      }
    } else if (note.type === 'voice') {
      voiceNotes++;
      // Estimate voice file size: assume 1MB per minute at medium quality
      const durationMinutes = (note.audioDuration || 0) / 60;
      voiceSizeBytes += Math.ceil(durationMinutes * 1024 * 1024);
    }
  });
  
  // Calculate metadata size (JSON overhead, timestamps, IDs, etc.)
  const metadataSizeBytes = (notes.length + categories.length) * 200; // Rough estimate
  
  const totalSizeBytes = textSizeBytes + voiceSizeBytes + metadataSizeBytes;
  
  // Get device storage info
  const deviceStorage = await getDeviceStorageInfo();
  
  return {
    totalNotes: notes.length,
    textNotes,
    voiceNotes,
    totalSizeBytes,
    totalSizeFormatted: formatBytes(totalSizeBytes),
    breakdown: {
      text: {
        count: textNotes,
        sizeBytes: textSizeBytes,
        sizeFormatted: formatBytes(textSizeBytes)
      },
      voice: {
        count: voiceNotes,
        sizeBytes: voiceSizeBytes,
        sizeFormatted: formatBytes(voiceSizeBytes)
      },
      metadata: {
        count: notes.length + categories.length,
        sizeBytes: metadataSizeBytes,
        sizeFormatted: formatBytes(metadataSizeBytes)
      }
    },
    deviceStorage: deviceStorage || undefined
  };
}

/**
 * Format bytes into human readable format
 * Implements KISS principle with simple size formatting
 * 
 * @param bytes - Number of bytes to format
 * @returns Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get storage usage percentage relative to a maximum
 * Useful for showing storage progress bars
 * 
 * @param usedBytes - Currently used storage in bytes
 * @param maxBytes - Maximum available storage in bytes
 * @returns Percentage as a number between 0 and 100
 */
export function getStorageUsagePercentage(usedBytes: number, maxBytes: number = 100 * 1024 * 1024): number {
  return Math.min((usedBytes / maxBytes) * 100, 100);
}
