/**
 * Core data types for the Notes Tracker application
 */

/**
 * Represents the type of note content
 */
export type NoteType = 'text' | 'voice';

/**
 * Represents a category for organizing notes
 */
export interface Category {
  /** Unique identifier for the category */
  id: string;
  /** Display name of the category */
  name: string;
  /** Color code for the category (hex format) */
  color: string;
  /** Timestamp when the category was created */
  createdAt: string;
}

/**
 * Represents a note in the application
 */
export interface Note {
  /** Unique identifier for the note */
  id: string;
  /** Custom label/title for the note */
  label: string;
  /** Type of note content (text or voice) */
  type: NoteType;
  /** Text content of the note (for text type) or title for voice notes */
  content: string;
  /** File path for voice recordings (only for voice type) */
  audioPath?: string;
  /** Duration of voice recording in seconds (only for voice type) */
  audioDuration?: number;
  /** Category ID this note belongs to */
  categoryId: string;
  /** Timestamp when the note was created */
  createdAt: string;
  /** Timestamp when the note was last updated */
  updatedAt: string;
  /** Whether the note is marked as favorite */
  isFavorite: boolean;
}

/**
 * Filter options for notes list
 */
export interface NoteFilters {
  /** Filter by category ID */
  categoryId?: string;
  /** Filter by note type */
  type?: NoteType;
  /** Show only favorites */
  favoritesOnly?: boolean;
  /** Search text to filter by content */
  searchText?: string;
}

/**
 * Storage keys for AsyncStorage
 */
export enum StorageKeys {
  NOTES = '@notes',
  CATEGORIES = '@categories',
  SETTINGS = '@settings'
}

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Application settings
 */
export interface AppSettings {
  /** Default category ID for new notes */
  defaultCategoryId: string;
  /** Audio recording quality setting */
  audioQuality: 'low' | 'medium' | 'high';
  /** Theme mode preference */
  themeMode: ThemeMode;
}

/**
 * Navigation types for React Navigation
 */
export type RootStackParamList = {
  Home: undefined;
  CreateNote: { categoryId?: string };
  EditNote: { noteId: string };
  ViewNote: { noteId: string };
  CreateCategory: undefined;
  Categories: undefined;
  Settings: undefined;
};

export type BottomTabParamList = {
  AI: undefined;
  Notes: undefined;
  CreateNote: undefined;
  Categories: undefined;
  Settings: undefined;
};
