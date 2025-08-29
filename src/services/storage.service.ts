import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, Category, AppSettings, StorageKeys } from '../types';

/**
 * Service class for managing data persistence using AsyncStorage
 * Implements SOLID principles by providing a single responsibility for data storage
 * Follows DRY principle by centralizing storage operations
 */
class StorageService {
  /**
   * Generic method to store data in AsyncStorage
   * @param key - Storage key
   * @param data - Data to store
   */
  private async storeData<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to retrieve data from AsyncStorage
   * @param key - Storage key
   * @returns Parsed data or null if not found
   */
  private async getData<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      throw error;
    }
  }

  // Notes management methods

  /**
   * Store notes array in AsyncStorage
   * @param notes - Array of notes to store
   */
  private async storeNotes(notes: Note[]): Promise<void> {
    await this.storeData(StorageKeys.NOTES, notes);
  }

  /**
   * Retrieve all notes from storage
   * @returns Array of notes
   */
  async getNotes(): Promise<Note[]> {
    const notes = await this.getData<Note[]>(StorageKeys.NOTES);
    return notes || [];
  }

  /**
   * Add a new note to storage
   * @param note - Note object to add
   */
  async addNote(note: Note): Promise<void> {
    const notes = await this.getNotes();
    notes.push(note);
    await this.storeNotes(notes);
  }

  /**
   * Update an existing note in storage
   * @param updatedNote - Updated note object
   */
  async updateNote(updatedNote: Note): Promise<void> {
    const notes = await this.getNotes();
    const index = notes.findIndex(note => note.id === updatedNote.id);
    
    if (index !== -1) {
      notes[index] = updatedNote;
      await this.storeNotes(notes);
    }
  }

  /**
   * Delete a note from storage
   * @param noteId - ID of the note to delete
   */
  async deleteNote(noteId: string): Promise<void> {
    const notes = await this.getNotes();
    const filteredNotes = notes.filter(note => note.id !== noteId);
    await this.storeNotes(filteredNotes);
  }

  /**
   * Get a specific note by ID
   * @param noteId - ID of the note to retrieve
   * @returns Note object or null if not found
   */
  async getNoteById(noteId: string): Promise<Note | null> {
    const notes = await this.getNotes();
    return notes.find(note => note.id === noteId) || null;
  }

  // Categories management methods

  /**
   * Store categories array in AsyncStorage
   * @param categories - Array of categories to store
   */
  private async storeCategories(categories: Category[]): Promise<void> {
    await this.storeData(StorageKeys.CATEGORIES, categories);
  }

  /**
   * Retrieve all categories from storage
   * @returns Array of categories
   */
  async getCategories(): Promise<Category[]> {
    const categories = await this.getData<Category[]>(StorageKeys.CATEGORIES);
    return categories || [];
  }

  /**
   * Add a new category to storage
   * @param category - Category object to add
   */
  async addCategory(category: Category): Promise<void> {
    const categories = await this.getCategories();
    categories.push(category);
    await this.storeCategories(categories);
  }

  /**
   * Update an existing category in storage
   * @param updatedCategory - Updated category object
   */
  async updateCategory(updatedCategory: Category): Promise<void> {
    const categories = await this.getCategories();
    const index = categories.findIndex(category => category.id === updatedCategory.id);
    
    if (index !== -1) {
      categories[index] = updatedCategory;
      await this.storeCategories(categories);
    }
  }

  /**
   * Delete a category from storage
   * @param categoryId - ID of the category to delete
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const categories = await this.getCategories();
    const filteredCategories = categories.filter(category => category.id !== categoryId);
    await this.storeCategories(filteredCategories);
  }

  /**
   * Get a specific category by ID
   * @param categoryId - ID of the category to retrieve
   * @returns Category object or null if not found
   */
  async getCategoryById(categoryId: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find(category => category.id === categoryId) || null;
  }

  /**
   * Get default categories for initial setup
   * Only includes the General category that cannot be deleted
   * @returns Array of default categories
   */
  private getDefaultCategories(): Category[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'general',
        name: 'General',
        color: '#6B7280',
        createdAt: now,
      },
    ];
  }

  // Settings management methods

  /**
   * Retrieve app settings from storage
   * @returns App settings object
   */
  async getSettings(): Promise<AppSettings> {
    const settings = await this.getData<AppSettings>(StorageKeys.SETTINGS);
    return settings || this.getDefaultSettings();
  }

  /**
   * Store app settings to storage
   * @param settings - Settings object to store
   */
  async storeSettings(settings: AppSettings): Promise<void> {
    await this.storeData(StorageKeys.SETTINGS, settings);
  }

  /**
   * Get default app settings
   * @returns Default settings object
   */
  private getDefaultSettings(): AppSettings {
    return {
      defaultCategoryId: 'general',
      audioQuality: 'medium',
      showTutorial: true,
      themeMode: 'system',
    };
  }

  /**
   * Initialize storage with default data if empty
   */
  async initializeStorage(): Promise<void> {
    try {
      // Initialize categories if they don't exist
      const categories = await this.getData<Category[]>(StorageKeys.CATEGORIES);
      if (!categories) {
        await this.storeCategories(this.getDefaultCategories());
      }

      // Initialize settings if they don't exist
      const settings = await this.getData<AppSettings>(StorageKeys.SETTINGS);
      if (!settings) {
        await this.storeSettings(this.getDefaultSettings());
      }

      // Initialize empty notes array if it doesn't exist
      const notes = await this.getData<Note[]>(StorageKeys.NOTES);
      if (!notes) {
        await this.storeNotes([]);
      } else {
        // Migrate existing notes to include labels if they don't have them
        await this.migrateNotesToIncludeLabels(notes);
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw new Error(`Failed to initialize storage: ${error}`);
    }
  }

  /**
   * Migrate existing notes to include labels
   * @param notes - Array of existing notes
   */
  private async migrateNotesToIncludeLabels(notes: Note[]): Promise<void> {
    let hasChanges = false;
    
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      if (note && !note.label) {
        // Generate a label from content or use a default
        let label = '';
        if (note.type === 'text') {
          label = note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content;
        } else {
          label = `Voice Note (${note.audioDuration ? Math.floor(note.audioDuration / 60) + ':' + (note.audioDuration % 60).toFixed(0).padStart(2, '0') : 'Unknown'})`;
        }
        
        notes[i] = {
          ...note,
          label: label || 'Untitled Note'
        };
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await this.storeNotes(notes);
    }
  }

  /**
   * Clear all data from storage (for testing or reset purposes)
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        StorageKeys.NOTES,
        StorageKeys.CATEGORIES,
        StorageKeys.SETTINGS,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error(`Failed to clear data: ${error}`);
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default StorageService;
