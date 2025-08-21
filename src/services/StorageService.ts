import AsyncStorage from '@react-native-async-storage/async-storage';
import { Idea, Category, AppSettings, StorageKeys } from '../types';

/**
 * Service class for managing local data storage using AsyncStorage
 * Provides methods for CRUD operations on ideas, categories, and settings
 */
class StorageService {
  /**
   * Generic method to store data in AsyncStorage
   * @param key - Storage key
   * @param data - Data to store
   */
  private async storeData<T>(key: string, data: T): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      throw new Error(`Failed to store data: ${error}`);
    }
  }

  /**
   * Generic method to retrieve data from AsyncStorage
   * @param key - Storage key
   * @returns Retrieved data or null if not found
   */
  private async getData<T>(key: string): Promise<T | null> {
    try {
      const jsonData = await AsyncStorage.getItem(key);
      return jsonData ? JSON.parse(jsonData) : null;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      throw new Error(`Failed to retrieve data: ${error}`);
    }
  }

  // Ideas management methods

  /**
   * Retrieve all ideas from storage
   * @returns Array of ideas
   */
  async getIdeas(): Promise<Idea[]> {
    const ideas = await this.getData<Idea[]>(StorageKeys.IDEAS);
    return ideas || [];
  }

  /**
   * Store all ideas to storage
   * @param ideas - Array of ideas to store
   */
  async storeIdeas(ideas: Idea[]): Promise<void> {
    await this.storeData(StorageKeys.IDEAS, ideas);
  }

  /**
   * Add a new idea to storage
   * @param idea - Idea to add
   */
  async addIdea(idea: Idea): Promise<void> {
    const ideas = await this.getIdeas();
    ideas.push(idea);
    await this.storeIdeas(ideas);
  }

  /**
   * Update an existing idea in storage
   * @param updatedIdea - Updated idea object
   */
  async updateIdea(updatedIdea: Idea): Promise<void> {
    const ideas = await this.getIdeas();
    const index = ideas.findIndex(idea => idea.id === updatedIdea.id);
    
    if (index === -1) {
      throw new Error(`Idea with id ${updatedIdea.id} not found`);
    }
    
    ideas[index] = updatedIdea;
    await this.storeIdeas(ideas);
  }

  /**
   * Delete an idea from storage
   * @param ideaId - ID of the idea to delete
   */
  async deleteIdea(ideaId: string): Promise<void> {
    const ideas = await this.getIdeas();
    const filteredIdeas = ideas.filter(idea => idea.id !== ideaId);
    
    if (filteredIdeas.length === ideas.length) {
      throw new Error(`Idea with id ${ideaId} not found`);
    }
    
    await this.storeIdeas(filteredIdeas);
  }

  /**
   * Get a specific idea by ID
   * @param ideaId - ID of the idea to retrieve
   * @returns Idea object or null if not found
   */
  async getIdeaById(ideaId: string): Promise<Idea | null> {
    const ideas = await this.getIdeas();
    return ideas.find(idea => idea.id === ideaId) || null;
  }

  // Categories management methods

  /**
   * Retrieve all categories from storage
   * @returns Array of categories
   */
  async getCategories(): Promise<Category[]> {
    const categories = await this.getData<Category[]>(StorageKeys.CATEGORIES);
    return categories || this.getDefaultCategories();
  }

  /**
   * Store all categories to storage
   * @param categories - Array of categories to store
   */
  async storeCategories(categories: Category[]): Promise<void> {
    await this.storeData(StorageKeys.CATEGORIES, categories);
  }

  /**
   * Add a new category to storage
   * @param category - Category to add
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
    const index = categories.findIndex(cat => cat.id === updatedCategory.id);
    
    if (index === -1) {
      throw new Error(`Category with id ${updatedCategory.id} not found`);
    }
    
    categories[index] = updatedCategory;
    await this.storeCategories(categories);
  }

  /**
   * Delete a category from storage
   * @param categoryId - ID of the category to delete
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const categories = await this.getCategories();
    const filteredCategories = categories.filter(cat => cat.id !== categoryId);
    
    if (filteredCategories.length === categories.length) {
      throw new Error(`Category with id ${categoryId} not found`);
    }
    
    await this.storeCategories(filteredCategories);
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

      // Initialize empty ideas array if it doesn't exist
      const ideas = await this.getData<Idea[]>(StorageKeys.IDEAS);
      if (!ideas) {
        await this.storeIdeas([]);
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw new Error(`Failed to initialize storage: ${error}`);
    }
  }

  /**
   * Clear all data from storage (for testing or reset purposes)
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        StorageKeys.IDEAS,
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
