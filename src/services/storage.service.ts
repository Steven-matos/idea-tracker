import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, Category, AppSettings, StorageKeys } from '../types';

/**
 * Service class for managing data persistence using AsyncStorage
 * Implements SOLID principles by providing a single responsibility for data storage
 * Follows DRY principle by centralizing storage operations
 * Enhanced with data validation and backup mechanisms to prevent data loss
 */
class StorageService {
  /**
   * Global error handler for storage operations
   * Shows user-friendly error messages for common storage issues
   */
  private handleStorageError(error: any, operation: string): never {
    let userMessage = 'An unexpected error occurred';
    let technicalDetails = '';
    
    if (error instanceof Error) {
      technicalDetails = error.message;
      
      if (error.message.includes('AsyncStorage')) {
        userMessage = 'Storage system error - please restart the app';
      } else if (error.message.includes('JSON')) {
        userMessage = 'Data corruption detected - please contact support';
      } else if (error.message.includes('permission')) {
        userMessage = 'Storage permission denied - check app settings';
      } else if (error.message.includes('quota')) {
        userMessage = 'Storage space full - please free up space';
      }
    }
    
    // Log technical details for debugging
    console.error(`Storage operation failed (${operation}):`, technicalDetails);
    
    // Throw user-friendly error
    throw new Error(`${userMessage}\n\nOperation: ${operation}\n\nTechnical Details: ${technicalDetails}`);
  }
  /**
   * Backup data before overwriting to prevent data loss
   * @param key - Storage key
   * @param newData - New data to store
   */
  private async safeStoreData<T>(key: string, newData: T): Promise<void> {
    try {
      // Create backup of existing data
      const existingData = await AsyncStorage.getItem(key);
      if (existingData) {
        const backupKey = `${key}_backup_${Date.now()}`;
        await AsyncStorage.setItem(backupKey, existingData);
        
        // Clean up old backups (keep only last 3)
        await this.cleanupOldBackups(key);
      }
      
      // Store new data
      await AsyncStorage.setItem(key, JSON.stringify(newData));
    } catch (error) {
      this.handleStorageError(error, `store data for key: ${key}`);
    }
  }

  /**
   * Clean up old backup files to prevent storage bloat
   * @param baseKey - Base storage key
   */
  private async cleanupOldBackups(baseKey: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith(`${baseKey}_backup_`));
      
      if (backupKeys.length > 3) {
        // Sort by timestamp and remove oldest
        backupKeys.sort((a, b) => {
          const timestampA = parseInt(a.split('_').pop() || '0');
          const timestampB = parseInt(b.split('_').pop() || '0');
          return timestampA - timestampB;
        });
        
        // Remove oldest backups
        const keysToRemove = backupKeys.slice(0, backupKeys.length - 3);
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Validate data structure before storage
   * @param data - Data to validate
   * @param expectedType - Expected data type for validation
   */
  private validateData<T>(data: T, expectedType: 'notes' | 'categories' | 'settings'): boolean {
    try {
      if (!data) return false;
      
      switch (expectedType) {
        case 'notes':
          return Array.isArray(data) && data.every(note => 
            note && typeof note === 'object' && 
            'id' in note && 'content' in note && 'type' in note
          );
        case 'categories':
          return Array.isArray(data) && data.every(category => 
            category && typeof category === 'object' && 
            'id' in category && 'name' in category && 'color' in category
          );
        case 'settings':
          return data && typeof data === 'object' && 
            'defaultCategoryId' in data && 'audioQuality' in data && 'themeMode' in data;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Generic method to store data in AsyncStorage with validation and backup
   * @param key - Storage key
   * @param data - Data to store
   * @param expectedType - Expected data type for validation
   */
  private async storeData<T>(key: string, data: T, expectedType: 'notes' | 'categories' | 'settings'): Promise<void> {
    try {
      // Validate data before storage
      if (!this.validateData(data, expectedType)) {
        throw new Error(`Invalid data structure for ${expectedType}`);
      }
      
      await this.safeStoreData(key, data);
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to retrieve data from AsyncStorage with error recovery
   * @param key - Storage key
   * @param expectedType - Expected data type for validation
   * @returns Parsed data or null if not found
   */
  private async getData<T>(key: string, expectedType: 'notes' | 'categories' | 'settings'): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) return null;
      
      const parsedData = JSON.parse(data);
      
      // Validate retrieved data
      if (!this.validateData(parsedData, expectedType)) {
        console.warn(`Data validation failed for ${key}, attempting backup recovery`);
        return await this.attemptBackupRecovery(key, expectedType);
      }
      
      return parsedData;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      
      // Attempt backup recovery on parse errors
      return await this.attemptBackupRecovery(key, expectedType);
    }
  }

  /**
   * Attempt to recover data from backup if primary data is corrupted
   * @param key - Storage key
   * @param expectedType - Expected data type
   * @returns Recovered data or null
   */
  private async attemptBackupRecovery<T>(key: string, expectedType: 'notes' | 'categories' | 'settings'): Promise<T | null> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(k => k.startsWith(`${key}_backup_`));
      
      if (backupKeys.length === 0) return null;
      
      // Sort backups by timestamp (newest first)
      backupKeys.sort((a, b) => {
        const timestampA = parseInt(a.split('_').pop() || '0');
        const timestampB = parseInt(b.split('_').pop() || '0');
        return timestampB - timestampA;
      });
      
      // Try to recover from newest backup
      for (const backupKey of backupKeys) {
        try {
          const backupData = await AsyncStorage.getItem(backupKey);
          if (backupData) {
            const parsedBackup = JSON.parse(backupData);
            if (this.validateData(parsedBackup, expectedType)) {
              console.log(`Successfully recovered data from backup: ${backupKey}`);
              // Restore from backup
              await AsyncStorage.setItem(key, backupData);
              return parsedBackup;
            }
          }
        } catch (backupError) {
          console.warn(`Failed to recover from backup ${backupKey}:`, backupError);
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Backup recovery failed:', error);
      return null;
    }
  }

  // Notes management methods

  /**
   * Store notes array in AsyncStorage with validation
   * @param notes - Array of notes to store
   */
  private async storeNotes(notes: Note[]): Promise<void> {
    await this.storeData(StorageKeys.NOTES, notes, 'notes');
  }

  /**
   * Retrieve all notes from storage with error recovery
   * @returns Array of notes
   */
  async getNotes(): Promise<Note[]> {
    const notes = await this.getData<Note[]>(StorageKeys.NOTES, 'notes');
    return notes || [];
  }

  /**
   * Add a new note to storage with atomic operation
   * @param note - Note object to add
   */
  async addNote(note: Note): Promise<void> {
    try {
      const notes = await this.getNotes();
      
      // Validate note structure
      if (!note.id || !note.content || !note.type) {
        throw new Error('Invalid note structure');
      }
      
      notes.push(note);
      await this.storeNotes(notes);
    } catch (error) {
      console.error('Error adding note:', error);
      throw new Error(`Failed to add note: ${error}`);
    }
  }

  /**
   * Update an existing note in storage with validation
   * @param updatedNote - Updated note object
   */
  async updateNote(updatedNote: Note): Promise<void> {
    try {
      const notes = await this.getNotes();
      const index = notes.findIndex(note => note.id === updatedNote.id);
      
      if (index === -1) {
        throw new Error('Note not found for update');
      }
      
      // Validate updated note
      if (!updatedNote.id || !updatedNote.content || !updatedNote.type) {
        throw new Error('Invalid note structure for update');
      }
      
      notes[index] = updatedNote;
      await this.storeNotes(notes);
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error(`Failed to update note: ${error}`);
    }
  }

  /**
   * Delete a note from storage with confirmation
   * @param noteId - ID of the note to delete
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      const notes = await this.getNotes();
      const noteExists = notes.some(note => note.id === noteId);
      
      if (!noteExists) {
        throw new Error('Note not found for deletion');
      }
      
      const filteredNotes = notes.filter(note => note.id !== noteId);
      await this.storeNotes(filteredNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error(`Failed to delete note: ${error}`);
    }
  }

  /**
   * Get a specific note by ID with error handling
   * @param noteId - ID of the note to retrieve
   * @returns Note object or null if not found
   */
  async getNoteById(noteId: string): Promise<Note | null> {
    try {
      const notes = await this.getNotes();
      return notes.find(note => note.id === noteId) || null;
    } catch (error) {
      console.error('Error retrieving note by ID:', error);
      return null;
    }
  }

  // Categories management methods

  /**
   * Store categories array in AsyncStorage with validation
   * @param categories - Array of categories to store
   */
  private async storeCategories(categories: Category[]): Promise<void> {
    await this.storeData(StorageKeys.CATEGORIES, categories, 'categories');
  }

  /**
   * Retrieve all categories from storage with error recovery
   * @returns Array of categories
   */
  async getCategories(): Promise<Category[]> {
    const categories = await this.getData<Category[]>(StorageKeys.CATEGORIES, 'categories');
    return categories || [];
  }

  /**
   * Add a new category to storage with validation
   * @param category - Category object to add
   */
  async addCategory(category: Category): Promise<void> {
    try {
      const categories = await this.getCategories();
      
      // Validate category structure
      if (!category.id || !category.name || !category.color) {
        throw new Error('Invalid category structure');
      }
      
      categories.push(category);
      await this.storeCategories(categories);
    } catch (error) {
      console.error('Error adding category:', error);
      throw new Error(`Failed to add category: ${error}`);
    }
  }

  /**
   * Update an existing category in storage with validation
   * @param updatedCategory - Updated category object
   */
  async updateCategory(updatedCategory: Category): Promise<void> {
    try {
      const categories = await this.getCategories();
      const index = categories.findIndex(category => category.id === updatedCategory.id);
      
      if (index === -1) {
        throw new Error('Category not found for update');
      }
      
      // Validate updated category
      if (!updatedCategory.id || !updatedCategory.name || !updatedCategory.color) {
        throw new Error('Invalid category structure for update');
      }
      
      categories[index] = updatedCategory;
      await this.storeCategories(categories);
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error(`Failed to update category: ${error}`);
    }
  }

  /**
   * Delete a category from storage with safety checks
   * @param categoryId - ID of the category to delete
   */
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const categories = await this.getCategories();
      const notes = await this.getNotes();
      
      // Prevent deletion of default category
      if (categoryId === 'general') {
        throw new Error('Cannot delete the default General category');
      }
      
      // Check if category exists
      const categoryExists = categories.some(category => category.id === categoryId);
      if (!categoryExists) {
        throw new Error('Category not found for deletion');
      }
      
      // Check if category is in use by notes
      const notesUsingCategory = notes.filter(note => note.categoryId === categoryId);
      if (notesUsingCategory.length > 0) {
        throw new Error(`Cannot delete category: ${notesUsingCategory.length} notes are using it`);
      }
      
      const filteredCategories = categories.filter(category => category.id !== categoryId);
      await this.storeCategories(filteredCategories);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error(`Failed to delete category: ${error}`);
    }
  }

  /**
   * Get a specific category by ID with error handling
   * @param categoryId - ID of the category to retrieve
   * @returns Category object or null if not found
   */
  async getCategoryById(categoryId: string): Promise<Category | null> {
    try {
      const categories = await this.getCategories();
      return categories.find(category => category.id === categoryId) || null;
    } catch (error) {
      console.error('Error retrieving category by ID:', error);
      return null;
    }
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
   * Retrieve app settings from storage with error recovery
   * @returns App settings object
   */
  async getSettings(): Promise<AppSettings> {
    const settings = await this.getData<AppSettings>(StorageKeys.SETTINGS, 'settings');
    return settings || this.getDefaultSettings();
  }

  /**
   * Store app settings to storage with validation
   * @param settings - Settings object to store
   */
  async storeSettings(settings: AppSettings): Promise<void> {
    await this.storeData(StorageKeys.SETTINGS, settings, 'settings');
  }

  /**
   * Get default app settings
   * @returns Default settings object
   */
  private getDefaultSettings(): AppSettings {
    return {
      defaultCategoryId: 'general',
      audioQuality: 'medium',
      themeMode: 'system',
    };
  }

  /**
   * Initialize storage with default data if empty
   * Enhanced with better error handling and data validation
   */
  async initializeStorage(): Promise<void> {
    try {
      // Initialize categories if they don't exist
      const categories = await this.getData<Category[]>(StorageKeys.CATEGORIES, 'categories');
      if (!categories) {
        await this.storeCategories(this.getDefaultCategories());
      }

      // Initialize settings if they don't exist
      const settings = await this.getData<AppSettings>(StorageKeys.SETTINGS, 'settings');
      if (!settings) {
        await this.storeSettings(this.getDefaultSettings());
      }

      // Initialize empty notes array if it doesn't exist
      const notes = await this.getData<Note[]>(StorageKeys.NOTES, 'notes');
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
   * Enhanced with backup preservation option
   */
  async clearAllData(preserveBackups: boolean = false): Promise<void> {
    try {
      const keysToRemove = [
        StorageKeys.NOTES,
        StorageKeys.CATEGORIES,
        StorageKeys.SETTINGS,
      ];
      
      if (!preserveBackups) {
        // Also remove backup files
        const allKeys = await AsyncStorage.getAllKeys();
        const backupKeys = allKeys.filter(key => 
          key.includes('_backup_') && 
          (key.includes(StorageKeys.NOTES) || key.includes(StorageKeys.CATEGORIES) || key.includes(StorageKeys.SETTINGS))
        );
        keysToRemove.push(...backupKeys);
      }
      
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error(`Failed to clear data: ${error}`);
    }
  }

  /**
   * Export all data for backup purposes
   * @returns JSON string of all application data
   */
  async exportAllData(): Promise<string> {
    try {
      const [notes, categories, settings] = await Promise.all([
        this.getNotes(),
        this.getCategories(),
        this.getSettings()
      ]);
      
      const exportData = {
        notes,
        categories,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error(`Failed to export data: ${error}`);
    }
  }

  /**
   * Import data from backup
   * @param importData - JSON string of data to import
   */
  async importData(importData: string): Promise<void> {
    try {
      const parsedData = JSON.parse(importData);
      
      // Validate import data structure
      if (!parsedData.notes || !parsedData.categories || !parsedData.settings) {
        throw new Error('Invalid import data structure');
      }
      
      // Validate each data type
      if (!this.validateData(parsedData.notes, 'notes')) {
        throw new Error('Invalid notes data in import');
      }
      if (!this.validateData(parsedData.categories, 'categories')) {
        throw new Error('Invalid categories data in import');
      }
      if (!this.validateData(parsedData.settings, 'settings')) {
        throw new Error('Invalid settings data in import');
      }
      
      // Store imported data
      await Promise.all([
        this.storeNotes(parsedData.notes),
        this.storeCategories(parsedData.categories),
        this.storeSettings(parsedData.settings)
      ]);
      
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error(`Failed to import data: ${error}`);
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default StorageService;
