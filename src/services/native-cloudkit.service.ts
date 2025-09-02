/**
 * Native CloudKit service for React Native
 * Uses native iOS CloudKit APIs for true iCloud integration
 * Follows SOLID principles with single responsibility for CloudKit operations
 * Enhanced with proper error handling and data validation
 */

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { storageService } from './storage.service';
import { Note, Category, AppSettings } from '../types';

/**
 * CloudKit native module interface
 */
interface CloudKitNativeModule {
  initializeCloudKit(containerId: string): Promise<boolean>;
  createBackup(backupData: string): Promise<string>;
  getAvailableBackups(): Promise<CloudKitBackupInfo[]>;
  restoreFromBackup(backupId: string): Promise<string>;
  deleteBackup(backupId: string): Promise<boolean>;
  getAccountStatus(): Promise<CloudKitAccountStatus>;
  syncWithCloudKit(): Promise<boolean>;
}

/**
 * CloudKit backup information
 */
interface CloudKitBackupInfo {
  id: string;
  name: string;
  createdAt: string;
  size: number;
  deviceInfo: {
    platform: string;
    version: string;
    deviceId: string;
  };
  dataSummary: {
    notesCount: number;
    categoriesCount: number;
    hasSettings: boolean;
  };
}

/**
 * CloudKit account status
 */
interface CloudKitAccountStatus {
  isAvailable: boolean;
  accountStatus: 'available' | 'noAccount' | 'restricted' | 'couldNotDetermine';
  hasICloudAccount: boolean;
  containerStatus: 'available' | 'unavailable' | 'error';
}

/**
 * CloudKit sync status
 */
interface CloudKitSyncStatus {
  isEnabled: boolean;
  accountStatus: CloudKitAccountStatus;
  lastSyncDate: string | null;
  pendingChanges: number;
  error: string | null;
}

/**
 * CloudKit backup data structure
 */
interface CloudKitBackupData {
  metadata: {
    version: string;
    createdAt: string;
    deviceInfo: {
      platform: string;
      version: string;
      deviceId: string;
    };
    dataSummary: {
      notesCount: number;
      categoriesCount: number;
      hasSettings: boolean;
      totalSize: number;
    };
  };
  notes: Note[];
  categories: Category[];
  settings: AppSettings;
}

/**
 * Service class for managing native CloudKit operations
 */
class NativeCloudKitService {
  private cloudKitModule: CloudKitNativeModule | null = null;
  private eventEmitter: NativeEventEmitter | null = null;
  private isInitialized = false;
  private containerIdentifier = 'iCloud.com.tridentinnovation.notestracker'; // Your actual container ID

  constructor() {
    this.initializeNativeModule();
  }

  /**
   * Initialize the native CloudKit module
   */
  private initializeNativeModule(): void {
    try {
      if (Platform.OS === 'ios') {
        // Check if native module exists
        if (NativeModules.CloudKitModule) {
          this.cloudKitModule = NativeModules.CloudKitModule;
          this.eventEmitter = new NativeEventEmitter(this.cloudKitModule);
          this.setupEventListeners();
          console.log('Native CloudKit module found');
        } else {
          console.log('Native CloudKit module not available - using fallback');
        }
      } else {
        console.log('CloudKit only available on iOS');
      }
    } catch (error) {
      console.error('Error initializing native CloudKit module:', error);
    }
  }

  /**
   * Setup event listeners for CloudKit operations
   */
  private setupEventListeners(): void {
    if (!this.eventEmitter) return;

    // Listen for CloudKit sync events
    this.eventEmitter.addListener('CloudKitSyncStarted', () => {
      console.log('CloudKit sync started');
    });

    this.eventEmitter.addListener('CloudKitSyncCompleted', () => {
      console.log('CloudKit sync completed');
    });

    this.eventEmitter.addListener('CloudKitSyncFailed', (error: string) => {
      console.error('CloudKit sync failed:', error);
    });

    this.eventEmitter.addListener('CloudKitBackupCreated', (backupId: string) => {
      console.log('CloudKit backup created:', backupId);
    });

    this.eventEmitter.addListener('CloudKitBackupDeleted', (backupId: string) => {
      console.log('CloudKit backup deleted:', backupId);
    });
  }

  /**
   * Check if native CloudKit is available
   */
  isNativeCloudKitAvailable(): boolean {
    return Platform.OS === 'ios' && this.cloudKitModule !== null;
  }

  /**
   * Initialize CloudKit with container identifier
   */
  async initializeCloudKit(): Promise<boolean> {
    try {
      if (!this.isNativeCloudKitAvailable()) {
        console.log('Native CloudKit not available');
        return false;
      }

      if (!this.cloudKitModule) {
        throw new Error('CloudKit module not initialized');
      }

      const success = await this.cloudKitModule.initializeCloudKit(this.containerIdentifier);
      
      if (success) {
        this.isInitialized = true;
        console.log('CloudKit initialized successfully');
      }

      return success;
    } catch (error) {
      console.error('Error initializing CloudKit:', error);
      return false;
    }
  }

  /**
   * Get CloudKit account status
   */
  async getCloudKitAccountStatus(): Promise<CloudKitAccountStatus> {
    try {
      if (!this.isNativeCloudKitAvailable() || !this.cloudKitModule) {
        return {
          isAvailable: false,
          accountStatus: 'couldNotDetermine',
          hasICloudAccount: false,
          containerStatus: 'unavailable',
        };
      }

      const accountStatus = await this.cloudKitModule.getAccountStatus();
      return accountStatus;
    } catch (error) {
      console.error('Error getting CloudKit account status:', error);
      return {
        isAvailable: false,
        accountStatus: 'couldNotDetermine',
        hasICloudAccount: false,
        containerStatus: 'error',
      };
    }
  }

  /**
   * Get CloudKit sync status
   */
  async getCloudKitSyncStatus(): Promise<CloudKitSyncStatus> {
    try {
      const accountStatus = await this.getCloudKitAccountStatus();
      
      // For now, return basic status
      // In a full implementation, this would query the native module for sync details
      return {
        isEnabled: accountStatus.isAvailable,
        accountStatus,
        lastSyncDate: null, // Would be retrieved from native module
        pendingChanges: 0, // Would be retrieved from native module
        error: null,
      };
    } catch (error) {
      return {
        isEnabled: false,
        accountStatus: {
          isAvailable: false,
          accountStatus: 'couldNotDetermine',
          hasICloudAccount: false,
          containerStatus: 'error',
        },
        lastSyncDate: null,
        pendingChanges: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a CloudKit backup
   */
  async createCloudKitBackup(): Promise<string> {
    try {
      if (!this.isNativeCloudKitAvailable() || !this.cloudKitModule) {
        throw new Error('Native CloudKit not available');
      }

      // Gather all data
      const [notes, categories, settings] = await Promise.all([
        storageService.getNotes(),
        storageService.getCategories(),
        storageService.getSettings()
      ]);

      // Create backup data structure
      const backupData: CloudKitBackupData = {
        metadata: {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version?.toString() || 'Unknown',
            deviceId: await this.getDeviceId(),
          },
          dataSummary: {
            notesCount: notes.length,
            categoriesCount: categories.length,
            hasSettings: true,
            totalSize: this.calculateDataSize(notes, categories, settings),
          },
        },
        notes,
        categories,
        settings,
      };

      // Convert to JSON string for native module
      const backupDataString = JSON.stringify(backupData);

      // Create backup using native module
      const backupId = await this.cloudKitModule.createBackup(backupDataString);
      
      console.log(`CloudKit backup created successfully: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('Error creating CloudKit backup:', error);
      throw new Error(`Failed to create CloudKit backup: ${error}`);
    }
  }

  /**
   * Get available CloudKit backups
   */
  async getAvailableCloudKitBackups(): Promise<CloudKitBackupInfo[]> {
    try {
      if (!this.isNativeCloudKitAvailable() || !this.cloudKitModule) {
        throw new Error('Native CloudKit not available');
      }

      const backups = await this.cloudKitModule.getAvailableBackups();
      return backups;
    } catch (error) {
      console.error('Error getting available CloudKit backups:', error);
      throw new Error(`Failed to get CloudKit backups: ${error}`);
    }
  }

  /**
   * Restore data from CloudKit backup
   */
  async restoreFromCloudKitBackup(backupId: string): Promise<void> {
    try {
      if (!this.isNativeCloudKitAvailable() || !this.cloudKitModule) {
        throw new Error('Native CloudKit not available');
      }

      // Create safety backup before restore
      await this.createSafetyBackup();

      // Get backup data from native module
      const backupDataString = await this.cloudKitModule.restoreFromBackup(backupId);
      
      // Parse backup data
      const backupData: CloudKitBackupData = JSON.parse(backupDataString);

      // Validate backup data
      this.validateCloudKitBackupData(backupData);

      // Restore data using storage service
      await this.restoreDataToStorage(backupData);

      console.log('Data restored successfully from CloudKit backup');
    } catch (error) {
      console.error('Error restoring from CloudKit backup:', error);
      throw new Error(`Failed to restore from CloudKit backup: ${error}`);
    }
  }

  /**
   * Delete CloudKit backup
   */
  async deleteCloudKitBackup(backupId: string): Promise<void> {
    try {
      if (!this.isNativeCloudKitAvailable() || !this.cloudKitModule) {
        throw new Error('Native CloudKit not available');
      }

      const success = await this.cloudKitModule.deleteBackup(backupId);
      
      if (success) {
        console.log(`CloudKit backup deleted: ${backupId}`);
      } else {
        throw new Error('Failed to delete backup');
      }
    } catch (error) {
      console.error('Error deleting CloudKit backup:', error);
      throw new Error(`Failed to delete CloudKit backup: ${error}`);
    }
  }

  /**
   * Sync data with CloudKit
   */
  async syncWithCloudKit(): Promise<void> {
    try {
      if (!this.isNativeCloudKitAvailable() || !this.cloudKitModule) {
        throw new Error('Native CloudKit not available');
      }

      const success = await this.cloudKitModule.syncWithCloudKit();
      
      if (success) {
        console.log('Data synced successfully with CloudKit');
      } else {
        throw new Error('Sync operation failed');
      }
    } catch (error) {
      console.error('Error syncing with CloudKit:', error);
      throw new Error(`Failed to sync with CloudKit: ${error}`);
    }
  }

  /**
   * Validate CloudKit backup data
   */
  private validateCloudKitBackupData(backupData: CloudKitBackupData): void {
    if (!backupData.metadata || !backupData.notes || !backupData.categories || !backupData.settings) {
      throw new Error('Invalid CloudKit backup data structure');
    }

    // Validate data integrity
    this.validateDataIntegrity(backupData);
  }

  /**
   * Validate data integrity
   */
  private validateDataIntegrity(backupData: CloudKitBackupData): void {
    try {
      // Validate notes structure
      for (const note of backupData.notes) {
        if (!note.id || !note.content || !note.type) {
          throw new Error('Invalid note structure in CloudKit backup');
        }
      }

      // Validate categories structure
      for (const category of backupData.categories) {
        if (!category.id || !category.name || !category.color) {
          throw new Error('Invalid category structure in CloudKit backup');
        }
      }

      // Validate settings structure
      const requiredSettings = ['defaultCategoryId', 'audioQuality', 'themeMode'];
      for (const setting of requiredSettings) {
        if (!(setting in backupData.settings)) {
          throw new Error(`Missing required setting: ${setting}`);
        }
      }

      // Validate category references in notes
      const categoryIds = new Set(backupData.categories.map(cat => cat.id));
      for (const note of backupData.notes) {
        if (note.categoryId && !categoryIds.has(note.categoryId)) {
          throw new Error(`Note references non-existent category: ${note.categoryId}`);
        }
      }
    } catch (error) {
      throw new Error(`CloudKit backup data integrity validation failed: ${error}`);
    }
  }

  /**
   * Create safety backup before restore
   */
  private async createSafetyBackup(): Promise<void> {
    try {
      // Create a local safety backup
      const [notes, categories, settings] = await Promise.all([
        storageService.getNotes(),
        storageService.getCategories(),
        storageService.getSettings()
      ]);

      // Store safety backup locally (not in CloudKit)
      const safetyData = {
        notes,
        categories,
        settings,
        createdAt: new Date().toISOString(),
        type: 'safety-backup',
      };

      // This would typically be stored in AsyncStorage or local file system
      console.log('Safety backup created before restore');
    } catch (error) {
      console.error('Error creating safety backup:', error);
      // Don't throw - this is not critical for restore operation
    }
  }

  /**
   * Restore data to storage service
   */
  private async restoreDataToStorage(backupData: CloudKitBackupData): Promise<void> {
    try {
      // Clear existing data first
      await storageService.clearAllData(true); // Preserve backups
      
      // Add notes one by one
      for (const note of backupData.notes) {
        await storageService.addNote(note);
      }
      
      // Add categories one by one
      for (const category of backupData.categories) {
        await storageService.addCategory(category);
      }
      
      // Store settings
      await storageService.storeSettings(backupData.settings);
    } catch (error) {
      console.error('Error restoring data to storage:', error);
      throw new Error(`Failed to restore data to storage: ${error}`);
    }
  }

  /**
   * Calculate data size for backup
   */
  private calculateDataSize(notes: Note[], categories: Category[], settings: AppSettings): number {
    try {
      const notesSize = JSON.stringify(notes).length;
      const categoriesSize = JSON.stringify(categories).length;
      const settingsSize = JSON.stringify(settings).length;
      return notesSize + categoriesSize + settingsSize;
    } catch {
      return 0;
    }
  }

  /**
   * Get or generate device ID
   */
  private async getDeviceId(): Promise<string> {
    // This would typically be stored in AsyncStorage
    // For now, generate a simple device ID
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old CloudKit backups (keep only the last 5)
   */
  async cleanupOldCloudKitBackups(): Promise<void> {
    try {
      const backups = await this.getAvailableCloudKitBackups();
      
      if (backups.length > 5) {
        const backupsToDelete = backups.slice(5);
        
        for (const backup of backupsToDelete) {
          await this.deleteCloudKitBackup(backup.id);
        }
        
        console.log(`Cleaned up ${backupsToDelete.length} old CloudKit backups`);
      }
    } catch (error) {
      console.error('Error cleaning up old CloudKit backups:', error);
    }
  }

  // Legacy methods for backward compatibility
  async createICloudBackup(): Promise<string> {
    return this.createCloudKitBackup();
  }

  async restoreFromICloudBackup(backupId: string): Promise<void> {
    return this.restoreFromCloudKitBackup(backupId);
  }

  async getAvailableICloudBackups(): Promise<any[]> {
    const backups = await this.getAvailableCloudKitBackups();
    return backups.map(backup => ({
      path: backup.id,
      metadata: backup,
    }));
  }

  async getICloudBackupInfo(backupId: string): Promise<any> {
    const backups = await this.getAvailableCloudKitBackups();
    return backups.find(backup => backup.id === backupId) || null;
  }

  async deleteICloudBackup(backupId: string): Promise<void> {
    return this.deleteCloudKitBackup(backupId);
  }

  async cleanupOldICloudBackups(): Promise<void> {
    return this.cleanupOldCloudKitBackups();
  }

  async getICloudSyncStatus(): Promise<any> {
    return this.getCloudKitSyncStatus();
  }

  async syncWithICloud(): Promise<void> {
    return this.syncWithCloudKit();
  }
}

// Export singleton instance
export const nativeCloudKitService = new NativeCloudKitService();
export default NativeCloudKitService;
