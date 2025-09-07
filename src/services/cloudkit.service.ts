/**
 * CloudKit service using react-native-cloudkit-storage
 * Provides iCloud synchronization for notes and categories
 * Follows SOLID principles with single responsibility for CloudKit operations
 * Enhanced with proper error handling and data validation
 */

import CloudKitStorage from 'react-native-cloudkit-storage';
import { Platform } from 'react-native';
import { storageService } from './storage.service';
import { Note, Category, AppSettings } from '../types';

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
 * Service class for managing CloudKit operations using react-native-cloudkit-storage
 */
class CloudKitService {
  private isInitialized = false;
  private containerIdentifier = 'iCloud.com.tridentinnovation.notestracker';
  private lastSyncDate: string | null = null;

  constructor() {
    // Don't initialize CloudKit in constructor to prevent startup crashes
    // CloudKit will be initialized lazily when first needed
  }

  /**
   * Initialize CloudKit with container identifier
   * This method properly configures CloudKit for production use
   * Note: react-native-cloudkit-storage uses the container identifier from entitlements
   */
  async initializeCloudKit(): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        console.log('CloudKit is only available on iOS devices');
        return false;
      }

      // Register for push updates (this initializes the library)
      // The container identifier is automatically read from entitlements
      CloudKitStorage.registerForPushUpdates();

      this.isInitialized = true;
      console.log(`CloudKit initialized successfully with container: ${this.containerIdentifier}`);
      return true;
    } catch (error) {
      console.error('Error initializing CloudKit:', error);
      return false;
    }
  }

  /**
   * Check if CloudKit is available and initialized
   * This method is safe to call without initialization
   */
  isCloudKitAvailable(): boolean {
    return Platform.OS === 'ios' && this.isInitialized;
  }

  /**
   * Ensure CloudKit is initialized before use
   * This method safely initializes CloudKit if not already done
   */
  private async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      return await this.initializeCloudKit();
    } catch (error) {
      console.error('Failed to initialize CloudKit:', error);
      return false;
    }
  }

  /**
   * Get CloudKit account status with detailed diagnostics
   * This method provides comprehensive status information for troubleshooting
   */
  async getCloudKitAccountStatus(): Promise<CloudKitAccountStatus> {
    try {
      console.log('🔍 Checking CloudKit account status...');
      
      // Ensure CloudKit is initialized before checking status
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        console.log('❌ CloudKit initialization failed');
        return {
          isAvailable: false,
          accountStatus: 'couldNotDetermine',
          hasICloudAccount: false,
          containerStatus: 'unavailable',
        };
      }

      console.log('✅ CloudKit initialized, testing container access...');

      // Test container access by trying to read a test key
      try {
        const testValue = await CloudKitStorage.getItem('__cloudkit_test__');
        console.log('✅ CloudKit container read access confirmed');
        return {
          isAvailable: true,
          accountStatus: 'available',
          hasICloudAccount: true,
          containerStatus: 'available',
        };
      } catch (readError) {
        console.log('⚠️ CloudKit read failed, testing write access...', readError);
        
        // If we can't read, try to write to test access
        try {
          await CloudKitStorage.setItem('__cloudkit_test__', 'test');
          console.log('✅ CloudKit container write access confirmed');
          return {
            isAvailable: true,
            accountStatus: 'available',
            hasICloudAccount: true,
            containerStatus: 'available',
          };
        } catch (writeError) {
          console.log('❌ CloudKit write failed:', writeError);
          
          // Determine specific error type
          const errorMessage = writeError instanceof Error ? writeError.message : String(writeError);
          
          if (errorMessage.includes('account') || errorMessage.includes('noAccount')) {
            return {
              isAvailable: false,
              accountStatus: 'noAccount',
              hasICloudAccount: false,
              containerStatus: 'unavailable',
            };
          } else if (errorMessage.includes('restricted')) {
            return {
              isAvailable: false,
              accountStatus: 'restricted',
              hasICloudAccount: false,
              containerStatus: 'unavailable',
            };
          } else {
            return {
              isAvailable: false,
              accountStatus: 'couldNotDetermine',
              hasICloudAccount: false,
              containerStatus: 'error',
            };
          }
        }
      }
    } catch (error) {
      console.error('❌ Error getting CloudKit account status:', error);
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
      
      return {
        isEnabled: accountStatus.isAvailable,
        accountStatus,
        lastSyncDate: this.lastSyncDate,
        pendingChanges: 0, // CloudKit handles this automatically
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
   * Sync notes with CloudKit
   */
  async syncNotes(): Promise<void> {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        throw new Error('CloudKit not available');
      }

      // Get local notes
      const localNotes = await storageService.getNotes();
      
      // Store notes in CloudKit
      await CloudKitStorage.setItem('notes', JSON.stringify(localNotes));
      
      // Update last sync date
      this.lastSyncDate = new Date().toISOString();
      
      console.log(`Synced ${localNotes.length} notes with CloudKit`);
    } catch (error) {
      console.error('Error syncing notes with CloudKit:', error);
      throw new Error(`Failed to sync notes: ${error}`);
    }
  }

  /**
   * Sync categories with CloudKit
   */
  async syncCategories(): Promise<void> {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        throw new Error('CloudKit not available');
      }

      // Get local categories
      const localCategories = await storageService.getCategories();
      
      // Store categories in CloudKit
      await CloudKitStorage.setItem('categories', JSON.stringify(localCategories));
      
      console.log(`Synced ${localCategories.length} categories with CloudKit`);
    } catch (error) {
      console.error('Error syncing categories with CloudKit:', error);
      throw new Error(`Failed to sync categories: ${error}`);
    }
  }

  /**
   * Sync settings with CloudKit
   */
  async syncSettings(): Promise<void> {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        throw new Error('CloudKit not available');
      }

      // Get local settings
      const localSettings = await storageService.getSettings();
      
      // Store settings in CloudKit
      await CloudKitStorage.setItem('settings', JSON.stringify(localSettings));
      
      console.log('Synced settings with CloudKit');
    } catch (error) {
      console.error('Error syncing settings with CloudKit:', error);
      throw new Error(`Failed to sync settings: ${error}`);
    }
  }

  /**
   * Sync all data with CloudKit
   */
  async syncAllData(): Promise<void> {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        throw new Error('CloudKit not available');
      }

      await Promise.all([
        this.syncNotes(),
        this.syncCategories(),
        this.syncSettings(),
      ]);

      console.log('All data synced successfully with CloudKit');
    } catch (error) {
      console.error('Error syncing all data with CloudKit:', error);
      throw new Error(`Failed to sync all data: ${error}`);
    }
  }

  /**
   * Restore data from CloudKit
   */
  async restoreFromCloudKit(): Promise<void> {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        throw new Error('CloudKit not available');
      }

      // Get data from CloudKit
      const [notesData, categoriesData, settingsData] = await Promise.all([
        CloudKitStorage.getItem('notes'),
        CloudKitStorage.getItem('categories'),
        CloudKitStorage.getItem('settings'),
      ]);

      // Parse and restore data
      if (notesData) {
        const notes: Note[] = JSON.parse(notesData);
        await this.restoreNotes(notes);
      }

      if (categoriesData) {
        const categories: Category[] = JSON.parse(categoriesData);
        await this.restoreCategories(categories);
      }

      if (settingsData) {
        const settings: AppSettings = JSON.parse(settingsData);
        await storageService.storeSettings(settings);
      }

      console.log('Data restored successfully from CloudKit');
    } catch (error) {
      console.error('Error restoring data from CloudKit:', error);
      throw new Error(`Failed to restore data: ${error}`);
    }
  }

  /**
   * Create a CloudKit backup
   */
  async createCloudKitBackup(): Promise<string> {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) {
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
          version: '1.0.3',
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

      // Store backup in CloudKit
      const backupId = `backup_${Date.now()}`;
      await CloudKitStorage.setItem(`backup_${backupId}`, JSON.stringify(backupData));
      
      // Update backup list
      const backupListData = await CloudKitStorage.getItem('backup_list');
      const backupList: string[] = backupListData ? JSON.parse(backupListData) : [];
      backupList.push(backupId);
      await CloudKitStorage.setItem('backup_list', JSON.stringify(backupList));
      
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
  async getAvailableCloudKitBackups(): Promise<string[]> {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        throw new Error('CloudKit not available');
      }

      // Since getAllKeys is not available, we'll use a different approach
      // Store backup list in a known key
      const backupListData = await CloudKitStorage.getItem('backup_list');
      
      if (!backupListData) {
        return [];
      }
      
      const backupList: string[] = JSON.parse(backupListData);
      return backupList;
    } catch (error) {
      console.error('Error getting available CloudKit backups:', error);
      throw new Error(`Failed to get CloudKit backups: ${error}`);
    }
  }

  /**
   * Restore from CloudKit backup
   */
  async restoreFromCloudKitBackup(backupId: string): Promise<void> {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        throw new Error('CloudKit not available');
      }

      // Get backup data from CloudKit
      const backupDataString = await CloudKitStorage.getItem(`backup_${backupId}`);
      
      if (!backupDataString) {
        throw new Error('Backup not found');
      }

      // Parse backup data
      const backupData: CloudKitBackupData = JSON.parse(backupDataString);

      // Validate backup data
      this.validateCloudKitBackupData(backupData);

      // Restore data
      await this.restoreNotes(backupData.notes);
      await this.restoreCategories(backupData.categories);
      await storageService.storeSettings(backupData.settings);

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
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        throw new Error('CloudKit not available');
      }

      // Remove from backup list
      const backupListData = await CloudKitStorage.getItem('backup_list');
      if (backupListData) {
        const backupList: string[] = JSON.parse(backupListData);
        const updatedList = backupList.filter(id => id !== backupId);
        await CloudKitStorage.setItem('backup_list', JSON.stringify(updatedList));
      }
      
      // Remove the actual backup data
      await CloudKitStorage.setItem(`backup_${backupId}`, '');
      
      console.log(`CloudKit backup deleted: ${backupId}`);
    } catch (error) {
      console.error('Error deleting CloudKit backup:', error);
      throw new Error(`Failed to delete CloudKit backup: ${error}`);
    }
  }

  /**
   * Verify CloudKit is working with enhanced error reporting
   * This method provides detailed diagnostics for CloudKit integration issues
   */
  async verifyCloudKitIntegration(): Promise<CloudKitVerificationResult> {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        return {
          isWorking: false,
          error: 'CloudKit initialization failed - check container identifier and entitlements',
          details: {
            accountStatus: 'unknown',
            containerAccess: false,
            networkActivity: false,
            recordCreation: false
          }
        };
      }

      const accountStatus = await this.getCloudKitAccountStatus();
      
      // Test container access by trying to set and get a test value
      let containerAccess = false;
      let recordCreation = false;
      let verificationError: string | null = null;
      
      try {
        const testKey = '__cloudkit_test__';
        const testValue = `test_${Date.now()}`;
        
        console.log('Testing CloudKit container access...');
        await CloudKitStorage.setItem(testKey, testValue);
        const retrievedValue = await CloudKitStorage.getItem(testKey);
        
        containerAccess = retrievedValue === testValue;
        recordCreation = containerAccess;
        
        if (containerAccess) {
          console.log('CloudKit container access verified successfully');
        } else {
          verificationError = 'Container access test failed - data mismatch';
        }
        
        // Clean up test data
        await CloudKitStorage.setItem(testKey, '');
      } catch (error) {
        verificationError = `Container access test failed: ${error}`;
        console.error('CloudKit verification error:', error);
      }

      const isWorking = accountStatus.isAvailable && containerAccess;
      const finalError = isWorking ? null : (verificationError || 'Account not available or container access failed');

      return {
        isWorking,
        error: finalError,
        details: {
          accountStatus: accountStatus.accountStatus,
          containerAccess,
          networkActivity: true,
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
   * Restore notes to storage
   */
  private async restoreNotes(notes: Note[]): Promise<void> {
    // Clear existing notes
    const existingNotes = await storageService.getNotes();
    for (const note of existingNotes) {
      await storageService.deleteNote(note.id);
    }
    
    // Add restored notes
    for (const note of notes) {
      await storageService.addNote(note);
    }
  }

  /**
   * Restore categories to storage
   */
  private async restoreCategories(categories: Category[]): Promise<void> {
    // Clear existing categories
    const existingCategories = await storageService.getCategories();
    for (const category of existingCategories) {
      await storageService.deleteCategory(category.id);
    }
    
    // Add restored categories
    for (const category of categories) {
      await storageService.addCategory(category);
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
   * Comprehensive CloudKit diagnostics for troubleshooting
   * This method provides detailed information about CloudKit setup and status
   */
  async runCloudKitDiagnostics(): Promise<{
    platform: string;
    containerIdentifier: string;
    initializationStatus: boolean;
    accountStatus: CloudKitAccountStatus;
    verificationResult: CloudKitVerificationResult;
    recommendations: string[];
  }> {
    console.log('🔧 Running comprehensive CloudKit diagnostics...');
    
    const recommendations: string[] = [];
    
    // Platform check
    if (Platform.OS !== 'ios') {
      recommendations.push('CloudKit is only available on iOS devices');
    }
    
    // Container identifier check
    console.log(`📦 Container Identifier: ${this.containerIdentifier}`);
    
    // Initialization check
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      recommendations.push('CloudKit initialization failed - check entitlements and container configuration');
    }
    
    // Account status check
    const accountStatus = await this.getCloudKitAccountStatus();
    if (!accountStatus.isAvailable) {
      switch (accountStatus.accountStatus) {
        case 'noAccount':
          recommendations.push('No iCloud account found - sign in to iCloud in Settings');
          break;
        case 'restricted':
          recommendations.push('iCloud account is restricted - check iCloud settings and permissions');
          break;
        case 'couldNotDetermine':
          recommendations.push('Cannot determine iCloud account status - deploy CloudKit schema to production');
          break;
      }
    }
    
    // Verification check
    const verificationResult = await this.verifyCloudKitIntegration();
    if (!verificationResult.isWorking) {
      recommendations.push(`CloudKit verification failed: ${verificationResult.error}`);
    }
    
    // Schema deployment recommendation
    if (accountStatus.accountStatus === 'couldNotDetermine') {
      recommendations.push('CRITICAL: Deploy CloudKit schema to production environment in CloudKit Dashboard');
    }
    
    const diagnostics = {
      platform: Platform.OS,
      containerIdentifier: this.containerIdentifier,
      initializationStatus: initialized,
      accountStatus,
      verificationResult,
      recommendations
    };
    
    console.log('📊 CloudKit Diagnostics Complete:', diagnostics);
    return diagnostics;
  }
}

// Export singleton instance
export const cloudKitService = new CloudKitService();
export default CloudKitService;
