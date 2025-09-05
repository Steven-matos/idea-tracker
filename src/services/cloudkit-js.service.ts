/**
 * CloudKitJS Service for Web Support
 * Provides server-to-server CloudKit integration for web platforms
 * Follows SOLID principles with single responsibility for web CloudKit operations
 */

import { CloudKitJs } from 'cloudkit-js';
import { Note, Category, AppSettings } from '../types';

/**
 * CloudKitJS configuration interface
 */
interface CloudKitJSConfig {
  containerName: string;
  keyId: string;
  privateKeyPath: string;
  environment: 'development' | 'production';
}

/**
 * CloudKitJS backup data structure
 */
interface CloudKitJSBackupData {
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
 * CloudKitJS backup information
 */
interface CloudKitJSBackupInfo {
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
 * CloudKitJS service class for web platform CloudKit operations
 */
class CloudKitJSService {
  private cloudKit: CloudKitJs | null = null;
  private isInitialized = false;
  private config: CloudKitJSConfig | null = null;

  /**
   * Initialize CloudKitJS with configuration
   * @param config CloudKitJS configuration object
   */
  async initializeCloudKitJS(config: CloudKitJSConfig): Promise<boolean> {
    try {
      this.config = config;
      
      // Initialize CloudKitJS
      this.cloudKit = new CloudKitJs({
        containerName: config.containerName,
        keyId: config.keyId,
        privateKeyPath: config.privateKeyPath,
        environment: config.environment
      });

      // Test connection
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('CloudKitJS initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize CloudKitJS:', error);
      return false;
    }
  }

  /**
   * Test CloudKitJS connection
   * @private
   */
  private async testConnection(): Promise<void> {
    if (!this.cloudKit) {
      throw new Error('CloudKitJS not initialized');
    }

    // Test by querying for existing records
    try {
      await this.cloudKit.queryRecords({
        recordType: 'Backup',
        predicate: 'TRUEPREDICATE',
        limit: 1
      });
    } catch (error) {
      // If no records exist, that's okay - just means we can connect
      if (!error.message?.includes('No records found')) {
        throw error;
      }
    }
  }

  /**
   * Check if CloudKitJS is available and initialized
   * @returns boolean indicating availability
   */
  isCloudKitJSAvailable(): boolean {
    return this.isInitialized && this.cloudKit !== null;
  }

  /**
   * Create a CloudKit backup using CloudKitJS
   * @param backupData Backup data to store
   * @returns Promise<string> Backup record ID
   */
  async createCloudKitJSBackup(backupData: CloudKitJSBackupData): Promise<string> {
    if (!this.isCloudKitJSAvailable()) {
      throw new Error('CloudKitJS not available');
    }

    try {
      const backupDataString = JSON.stringify(backupData);
      const recordId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const record = {
        recordType: 'Backup',
        recordName: recordId,
        fields: {
          backupData: { value: backupDataString },
          createdAt: { value: new Date().toISOString() },
          deviceInfo: { value: JSON.stringify(backupData.metadata.deviceInfo) },
          version: { value: backupData.metadata.version }
        }
      };

      const response = await this.cloudKit!.createRecord(record);
      
      if (response.records && response.records.length > 0) {
        console.log(`CloudKitJS backup created successfully: ${recordId}`);
        return recordId;
      } else {
        throw new Error('No record returned from CloudKitJS');
      }
    } catch (error) {
      console.error('Error creating CloudKitJS backup:', error);
      throw new Error(`Failed to create CloudKitJS backup: ${error}`);
    }
  }

  /**
   * Get available CloudKitJS backups
   * @returns Promise<CloudKitJSBackupInfo[]> Array of backup information
   */
  async getAvailableCloudKitJSBackups(): Promise<CloudKitJSBackupInfo[]> {
    if (!this.isCloudKitJSAvailable()) {
      throw new Error('CloudKitJS not available');
    }

    try {
      const response = await this.cloudKit!.queryRecords({
        recordType: 'Backup',
        predicate: 'TRUEPREDICATE',
        sortBy: [{ fieldName: 'createdAt', ascending: false }]
      });

      if (!response.records) {
        return [];
      }

      return response.records.map(record => {
        const backupData = record.fields.backupData?.value;
        let dataSummary = {
          notesCount: 0,
          categoriesCount: 0,
          hasSettings: false
        };

        if (backupData) {
          try {
            const parsed = JSON.parse(backupData);
            dataSummary = parsed.metadata?.dataSummary || dataSummary;
          } catch (error) {
            console.warn('Failed to parse backup data for summary:', error);
          }
        }

        return {
          id: record.recordName,
          name: `Backup ${new Date(record.fields.createdAt?.value || Date.now()).toLocaleString()}`,
          createdAt: record.fields.createdAt?.value || new Date().toISOString(),
          size: backupData?.length || 0,
          deviceInfo: this.parseDeviceInfo(record.fields.deviceInfo?.value),
          dataSummary
        };
      });
    } catch (error) {
      console.error('Error getting CloudKitJS backups:', error);
      throw new Error(`Failed to get CloudKitJS backups: ${error}`);
    }
  }

  /**
   * Restore data from CloudKitJS backup
   * @param backupId Backup record ID to restore
   * @returns Promise<CloudKitJSBackupData> Restored backup data
   */
  async restoreFromCloudKitJSBackup(backupId: string): Promise<CloudKitJSBackupData> {
    if (!this.isCloudKitJSAvailable()) {
      throw new Error('CloudKitJS not available');
    }

    try {
      const response = await this.cloudKit!.fetchRecord({
        recordType: 'Backup',
        recordName: backupId
      });

      if (!response.records || response.records.length === 0) {
        throw new Error('Backup not found');
      }

      const record = response.records[0];
      const backupDataString = record.fields.backupData?.value;

      if (!backupDataString) {
        throw new Error('Backup data not found');
      }

      const backupData: CloudKitJSBackupData = JSON.parse(backupDataString);
      this.validateCloudKitJSBackupData(backupData);

      console.log(`CloudKitJS backup restored successfully: ${backupId}`);
      return backupData;
    } catch (error) {
      console.error('Error restoring CloudKitJS backup:', error);
      throw new Error(`Failed to restore CloudKitJS backup: ${error}`);
    }
  }

  /**
   * Delete CloudKitJS backup
   * @param backupId Backup record ID to delete
   * @returns Promise<boolean> Success status
   */
  async deleteCloudKitJSBackup(backupId: string): Promise<boolean> {
    if (!this.isCloudKitJSAvailable()) {
      throw new Error('CloudKitJS not available');
    }

    try {
      await this.cloudKit!.deleteRecord({
        recordType: 'Backup',
        recordName: backupId
      });

      console.log(`CloudKitJS backup deleted successfully: ${backupId}`);
      return true;
    } catch (error) {
      console.error('Error deleting CloudKitJS backup:', error);
      throw new Error(`Failed to delete CloudKitJS backup: ${error}`);
    }
  }

  /**
   * Sync with CloudKit using CloudKitJS
   * @returns Promise<boolean> Success status
   */
  async syncWithCloudKitJS(): Promise<boolean> {
    if (!this.isCloudKitJSAvailable()) {
      throw new Error('CloudKitJS not available');
    }

    try {
      // For now, just return success
      // In a full implementation, this would handle conflict resolution
      console.log('CloudKitJS sync completed');
      return true;
    } catch (error) {
      console.error('Error syncing with CloudKitJS:', error);
      throw new Error(`Failed to sync with CloudKitJS: ${error}`);
    }
  }

  /**
   * Parse device info from CloudKitJS record
   * @param deviceInfoString JSON string containing device info
   * @returns Parsed device info object
   * @private
   */
  private parseDeviceInfo(deviceInfoString?: string): any {
    if (!deviceInfoString) {
      return {
        platform: 'web',
        version: 'unknown',
        deviceId: 'web_client'
      };
    }

    try {
      return JSON.parse(deviceInfoString);
    } catch (error) {
      console.warn('Failed to parse device info:', error);
      return {
        platform: 'web',
        version: 'unknown',
        deviceId: 'web_client'
      };
    }
  }

  /**
   * Validate CloudKitJS backup data structure
   * @param backupData Backup data to validate
   * @private
   */
  private validateCloudKitJSBackupData(backupData: CloudKitJSBackupData): void {
    if (!backupData.metadata || !backupData.notes || !backupData.categories || !backupData.settings) {
      throw new Error('Invalid CloudKitJS backup data structure');
    }

    // Validate required fields
    if (!backupData.metadata.version || !backupData.metadata.createdAt) {
      throw new Error('Missing required metadata fields');
    }

    // Validate data types
    if (!Array.isArray(backupData.notes) || !Array.isArray(backupData.categories)) {
      throw new Error('Invalid data structure: notes and categories must be arrays');
    }
  }

  /**
   * Get CloudKitJS service status
   * @returns Object containing service status information
   */
  getCloudKitJSStatus(): {
    isInitialized: boolean;
    isAvailable: boolean;
    config: CloudKitJSConfig | null;
  } {
    return {
      isInitialized: this.isInitialized,
      isAvailable: this.isCloudKitJSAvailable(),
      config: this.config
    };
  }
}

// Export singleton instance
export const cloudKitJSService = new CloudKitJSService();
export default CloudKitJSService;
