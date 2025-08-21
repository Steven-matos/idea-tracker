/**
 * Core data types for the Idea Tracker application
 */

/**
 * Represents the type of idea content
 */
export type IdeaType = 'text' | 'voice';

/**
 * Represents a category for organizing ideas
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
 * Represents an idea in the application
 */
export interface Idea {
  /** Unique identifier for the idea */
  id: string;
  /** Type of idea content (text or voice) */
  type: IdeaType;
  /** Text content of the idea (for text type) or title for voice ideas */
  content: string;
  /** File path for voice recordings (only for voice type) */
  audioPath?: string;
  /** Duration of voice recording in seconds (only for voice type) */
  audioDuration?: number;
  /** Category ID this idea belongs to */
  categoryId: string;
  /** Timestamp when the idea was created */
  createdAt: string;
  /** Timestamp when the idea was last updated */
  updatedAt: string;
  /** Whether the idea is marked as favorite */
  isFavorite: boolean;
}

/**
 * Filter options for ideas list
 */
export interface IdeaFilters {
  /** Filter by category ID */
  categoryId?: string;
  /** Filter by idea type */
  type?: IdeaType;
  /** Show only favorites */
  favoritesOnly?: boolean;
  /** Search text to filter by content */
  searchText?: string;
}

/**
 * Storage keys for AsyncStorage
 */
export enum StorageKeys {
  IDEAS = '@ideas',
  CATEGORIES = '@categories',
  SETTINGS = '@settings'
}

/**
 * Application settings
 */
export interface AppSettings {
  /** Default category ID for new ideas */
  defaultCategoryId: string;
  /** Audio recording quality setting */
  audioQuality: 'low' | 'medium' | 'high';
  /** Whether to show tutorial on app start */
  showTutorial: boolean;
}

/**
 * Navigation types for React Navigation
 */
export type RootStackParamList = {
  Home: undefined;
  CreateIdea: { categoryId?: string };
  EditIdea: { ideaId: string };
  Categories: undefined;
  Settings: undefined;
};

export type BottomTabParamList = {
  Ideas: undefined;
  Categories: undefined;
  Settings: undefined;
};
