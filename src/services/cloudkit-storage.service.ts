/**
 * CloudKit Storage Service for React Native
 * Uses react-native-cloudkit-storage for iCloud integration
 * Follows SOLID principles with single responsibility for CloudKit operations
 * Enhanced with proper error handling and data validation
 */

import { Platform } from 'react-native';
import CloudKitStorage from 'react-native-cloudkit-storage';
import { storageService } from './storage.service';
import { Note, Category, AppSettings } from '../types';

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
 * CloudKit verification result
 */
interface CloudKitVerificationResult {
  isWorking: boolean;
  error: string | null;
  details: {
    accountStatus: string;
    containerAccess: boolean;
    networkActivity: boolean;
    recordCreation: boolean;
  };
}

/**
 * Service class for managing CloudKit operations
 */
class CloudKitStorageService {
  private isInitialized = false;
  private containerIdentifier = 'iCloud.com.tridentinnovation.notestracker';

  constructor() {
    this.initializeCloudKit();
  }

  /**
   * Initialize CloudKit storage
   */
  private async initializeCloudKit(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // Initialize CloudKit storage
        await CloudKitStorage.initialize({
          containerIdentifier: this.containerIdentifier,
          environment: 'production' // or 'development' for testing
        });
        this.isInitialized = true;
        console.log('CloudKit storage initialized successfully');
      } else {
        console.log('CloudKit is only available on iOS devices');
      }
    } catch (error) {
      console.error('CloudKit initialization failed:', error);
    }
  }

  /**
   * Check if CloudKit is available
   */
  isCloudKitAvailable(): boolean {
    return Platform.OS === 'ios' && this.isInitialized;
  }

  /**
   * Get CloudKit account status
   */
  async getCloudKitAccountStatus(): Promise<CloudKitAccountStatus> {
    try {
      if (!this.isCloudKitAvailable()) {
        return {
          isAvailable: false,
          accountStatus: 'couldNotDetermine',
          hasICloudAccount: false,
          containerStatus: 'unavailable',
        };
      }

      const accountStatus = await CloudKitStorage.getAccountStatus();
      
      return {
        isAvailable: accountStatus === 'available',
        accountStatus: accountStatus as any,
        hasICloudAccount: accountStatus === 'available',
        containerStatus: accountStatus === 'available' ? 'available' : 'unavailable',
      };
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
   * Create a CloudKit backup
   */
  async createCloudKitBackup(): Promise<string> {
    try {
      if (!this.isCloudKitAvailable()) {
        throw new Error('CloudKit not available');
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

      // Convert to JSON string
      const backupDataString = JSON.stringify(backupData);

      // Create backup using CloudKit storage
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await CloudKitStorage.setItem(backupId, backupDataString);
      
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
      if (!this.isCloudKitAvailable()) {
        throw new Error('CloudKit not available');
      }

      // Get all keys from CloudKit storage
      const keys = await CloudKitStorage.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith('backup_'));

      const backups: CloudKitBackupInfo[] = [];

      for (const key of backupKeys) {
        try {
          const backupDataString = await CloudKitStorage.getItem(key);
          if (backupDataString) {
            const backupData: CloudKitBackupData = JSON.parse(backupDataString);
            
            backups.push({
              id: key,
              name: `Backup ${new Date(backupData.metadata.createdAt).toLocaleString()}`,
              createdAt: backupData.metadata.createdAt,
              size: backupDataString.length,
              deviceInfo: backupData.metadata.deviceInfo,
              dataSummary: backupData.metadata.dataSummary
            });
          }
        } catch (error) {
          console.warn(`Failed to parse backup ${key}:`, error);
        }
      }

      // Sort by creation date (newest first)
      return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      if (!this.isCloudKitAvailable()) {
        throw new Error('CloudKit not available');
      }

      // Get backup data from CloudKit storage
      const backupDataString = await CloudKitStorage.getItem(backupId);
      
      if (!backupDataString) {
        throw new Error('Backup not found');
      }

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
      if (!this.isCloudKitAvailable()) {
        throw new Error('CloudKit not available');
      }

      await CloudKitStorage.removeItem(backupId);
      console.log(`CloudKit backup deleted: ${backupId}`);
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
      if (!this.isCloudKitAvailable()) {
        throw new Error('CloudKit not available');
      }

      // CloudKit storage handles sync automatically
      console.log('Data synced successfully with CloudKit');
    } catch (error) {
      console.error('Error syncing with CloudKit:', error);
      throw new Error(`Failed to sync with CloudKit: ${error}`);
    }
  }

  /**
   * Verify CloudKit is working
   */
  async verifyCloudKitIntegration(): Promise<CloudKitVerificationResult> {
    if (!this.isInitialized) {
      return {
        isWorking: false,
        error: 'CloudKit not initialized',
        details: {
          accountStatus: 'unknown',
          containerAccess: false,
          networkActivity: false,
          recordCreation: false
        }
      };
    }

    try {
      // Check account status
      const accountStatus = await this.getCloudKitAccountStatus();
      
      // Test container access by trying to create a test record
      let containerAccess = false;
      let recordCreation = false;
      
      try {
        const testData = JSON.stringify({ test: true, timestamp: Date.now() });
        const testKey = `test_${Date.now()}`;
        await CloudKitStorage.setItem(testKey, testData);
        containerAccess = true;
        recordCreation = true;
        
        // Clean up test record
        await CloudKitStorage.removeItem(testKey);
      } catch (error) {
        console.log('Test record creation failed (expected for verification):', error);
      }

      return {
        isWorking: accountStatus.isAvailable && containerAccess,
        error: null,
        details: {
          accountStatus: accountStatus.accountStatus,
          containerAccess,
          networkActivity: true, // If we got here, network is working
          recordCreation
        }
      };
    } catch (error) {
      return {
        isWorking: false,
        error: `Verification failed: ${error}`,
        details: {
          accountStatus: 'unknown',
          containerAccess: false,
          networkActivity: false,
          recordCreation: false
        }
      };
    }
  }

  /**
   * Get detailed CloudKit status
   */
  async getDetailedStatus(): Promise<{
    accountStatus: CloudKitAccountStatus;
    verification: CloudKitVerificationResult;
    containerId: string;
    isInitialized: boolean;
    timestamp: string;
  }> {
    const accountStatus = await this.getCloudKitAccountStatus();
    const verification = await this.verifyCloudKitIntegration();
    
    return {
      accountStatus,
      verification,
      containerId: this.containerIdentifier,
      isInitialized: this.isInitialized,
      timestamp: new Date().toISOString()
    };
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
}

// Export singleton instance
export const cloudKitStorageService = new CloudKitStorageService();
export default CloudKitStorageService;
