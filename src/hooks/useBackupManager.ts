/**
 * Custom hook for managing backup and restore operations
 * Implements SOLID principles with single responsibility for backup management
 * Follows DRY principle by centralizing backup operation logic
 * Enhanced with proper error handling and user feedback
 */

import { useState, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { nativeCloudKitService } from '../services/native-cloudkit.service';
import { useAsyncOperation } from './useAsyncOperation';

/**
 * Interface for backup information
 */
interface BackupInfo {
  path: string;
  metadata: {
    version: string;
    createdAt: string;
    deviceInfo: {
      platform: string;
      version: string;
    };
    dataSummary: {
      notesCount: number;
      categoriesCount: number;
      hasSettings: boolean;
    };
  } | null;
}

/**
 * Return type for useBackupManager hook
 */
interface UseBackupManagerReturn {
  /** List of available backups */
  backups: BackupInfo[];
  /** Whether backup operations are available */
  isBackupAvailable: boolean;
  /** Create a new backup */
  createBackup: () => Promise<void>;
  /** Restore from a backup file */
  restoreFromBackup: (backupPath: string) => Promise<void>;
  /** Share functionality removed - CloudKit only */
  /** Delete a backup file */
  deleteBackup: (backupPath: string) => Promise<void>;
  /** Pick a backup file for restore */
  pickAndRestoreBackup: () => Promise<void>;
  /** Refresh the list of available backups */
  refreshBackups: () => Promise<void>;
  /** State of backup operations */
  backupState: {
    creating: boolean;
    restoring: boolean;
    sharing: boolean;
    deleting: boolean;
    refreshing: boolean;
  };
  /** Error message if any operation failed */
  error: string | null;
  /** Clear error message */
  clearError: () => void;
}

/**
 * Custom hook for managing backup and restore operations
 * 
 * @returns Object with backup management functions and state
 * 
 * @example
 * ```typescript
 * const { 
 *   backups, 
 *   createBackup, 
 *   restoreFromBackup,
 *   isBackupAvailable 
 * } = useBackupManager();
 * 
 * // Create a backup
 * await createBackup();
 * 
 * // Restore from backup
 * await restoreFromBackup(backups[0].path);
 * ```
 */
export const useBackupManager = (): UseBackupManagerReturn => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pure CloudKit operations - no fallbacks
  const createBackupOp = useAsyncOperation(
    async () => await nativeCloudKitService.createCloudKitBackup(),
    null,
    { maxRetries: 2, userErrorMessage: 'Failed to create CloudKit backup' }
  );

  const restoreBackupOp = useAsyncOperation(
    async (backupId: string) => await nativeCloudKitService.restoreFromCloudKitBackup(backupId),
    null,
    { maxRetries: 1, userErrorMessage: 'Failed to restore from CloudKit backup' }
  );

  const deleteBackupOp = useAsyncOperation(
    async (backupId: string) => await nativeCloudKitService.deleteCloudKitBackup(backupId),
    null,
    { maxRetries: 2, userErrorMessage: 'Failed to delete CloudKit backup' }
  );

  const refreshBackupsOp = useAsyncOperation(
    async () => await nativeCloudKitService.getAvailableCloudKitBackups(),
    [],
    { maxRetries: 2, userErrorMessage: 'Failed to refresh CloudKit backups' }
  );

  // Create a stable reference for refreshBackups to avoid circular dependencies
  const refreshBackupsRef = useRef<() => Promise<void>>(() => Promise.resolve());

  /**
   * Check if backup operations are available
   */
  const isBackupAvailable = Platform.OS === 'ios';

  /**
   * Create a new backup
   */
  const createBackup = useCallback(async (): Promise<void> => {
    if (!isBackupAvailable) {
      const errorMsg = 'CloudKit backup is only available on iOS devices';
      setError(errorMsg);
      Alert.alert(
        '❌ Backup Not Available',
        errorMsg,
        [
          { text: 'OK' },
          {
            text: 'Why?',
            onPress: () => {
              Alert.alert(
                'Why iOS Only?',
                'CloudKit is Apple\'s iCloud service that only works on iOS devices. This ensures true iCloud integration.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
      return;
    }

    try {
      const backupId = await createBackupOp.execute();
      if (backupId) {
        await refreshBackupsRef.current?.();
        Alert.alert(
          '✅ iCloud Backup Created',
          'Your data has been backed up to iCloud successfully!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      const errorMsg = 'Failed to create CloudKit backup';
      setError(errorMsg);
      
      // Show detailed error popup
      let detailedError = 'Unknown error occurred';
      let troubleshooting = '';
      
      if (error instanceof Error) {
        detailedError = error.message;
        
        if (error.message.includes('CloudKit not initialized')) {
          troubleshooting = '\n\n💡 Solution: Try verifying CloudKit integration first';
        } else if (error.message.includes('Native CloudKit not available')) {
          troubleshooting = '\n\n💡 Solution: Use development build instead of Expo Go';
        } else if (error.message.includes('Network error')) {
          troubleshooting = '\n\n💡 Solution: Check your internet connection and iCloud status';
        }
      }
      
      Alert.alert(
        '❌ Backup Creation Failed',
        `${detailedError}${troubleshooting}`,
        [
          { text: 'OK' },
          {
            text: 'Troubleshoot',
            onPress: () => {
              Alert.alert(
                'Troubleshooting Steps',
                '1. Ensure you\'re using a development build\n2. Check iCloud is enabled on device\n3. Verify internet connection\n4. Try CloudKit verification in Settings',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
      
      console.error('Backup creation error:', error);
    }
  }, [isBackupAvailable, createBackupOp]);

  /**
   * Restore from a CloudKit backup
   */
  const restoreFromBackup = useCallback(async (backupId: string): Promise<void> => {
    if (!isBackupAvailable) {
      const errorMsg = 'CloudKit restore is only available on iOS devices';
      setError(errorMsg);
      Alert.alert(
        '❌ Restore Not Available',
        errorMsg,
        [
          { text: 'OK' },
          {
            text: 'Why?',
            onPress: () => {
              Alert.alert(
                'Why iOS Only?',
                'CloudKit restore requires native iOS CloudKit APIs that are only available on iOS devices.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
      return;
    }

    try {
      await restoreBackupOp.execute(backupId);
      Alert.alert(
        '✅ Restore Successful',
        'Your data has been restored from iCloud backup successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errorMsg = 'Failed to restore from CloudKit backup';
      setError(errorMsg);
      
      // Show detailed error popup
      let detailedError = 'Unknown error occurred';
      let troubleshooting = '';
      
      if (error instanceof Error) {
        detailedError = error.message;
        
        if (error.message.includes('CloudKit not initialized')) {
          troubleshooting = '\n\n💡 Solution: Try verifying CloudKit integration first';
        } else if (error.message.includes('Native CloudKit not available')) {
          troubleshooting = '\n\n💡 Solution: Use development build instead of Expo Go';
        } else if (error.message.includes('Backup not found')) {
          troubleshooting = '\n\n💡 Solution: The backup may have been deleted or is no longer available';
        } else if (error.message.includes('Network error')) {
          troubleshooting = '\n\n💡 Solution: Check your internet connection and iCloud status';
        }
      }
      
      Alert.alert(
        '❌ Restore Failed',
        `${detailedError}${troubleshooting}`,
        [
          { text: 'OK' },
          {
            text: 'Troubleshoot',
            onPress: () => {
              Alert.alert(
                'Troubleshooting Steps',
                '1. Ensure you\'re using a development build\n2. Check iCloud is enabled on device\n3. Verify internet connection\n4. Try CloudKit verification in Settings\n5. Check if backup still exists',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
      
      console.error('Restore error:', error);
    }
  }, [isBackupAvailable, restoreBackupOp]);

  // Share functionality removed - CloudKit only

  /**
   * Delete a CloudKit backup
   */
  const deleteBackup = useCallback(async (backupId: string): Promise<void> => {
    if (!isBackupAvailable) {
      const errorMsg = 'CloudKit backup management is only available on iOS devices';
      setError(errorMsg);
      Alert.alert(
        '❌ Delete Not Available',
        errorMsg,
        [
          { text: 'OK' },
          {
            text: 'Why?',
            onPress: () => {
              Alert.alert(
                'Why iOS Only?',
                'CloudKit backup deletion requires native iOS CloudKit APIs that are only available on iOS devices.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
      return;
    }

    Alert.alert(
      '🗑️ Delete iCloud Backup',
      'Are you sure you want to delete this iCloud backup? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBackupOp.execute(backupId);
              await refreshBackupsRef.current?.();
              Alert.alert(
                '✅ Backup Deleted',
                'The iCloud backup has been deleted successfully.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              const errorMsg = 'Failed to delete CloudKit backup';
              setError(errorMsg);
              
              // Show detailed error popup
              let detailedError = 'Unknown error occurred';
              let troubleshooting = '';
              
              if (error instanceof Error) {
                detailedError = error.message;
                
                if (error.message.includes('CloudKit not initialized')) {
                  troubleshooting = '\n\n💡 Solution: Try verifying CloudKit integration first';
                } else if (error.message.includes('Native CloudKit not available')) {
                  troubleshooting = '\n\n💡 Solution: Use development build instead of Expo Go';
                } else if (error.message.includes('Backup not found')) {
                  troubleshooting = '\n\n💡 Solution: The backup may have already been deleted';
                } else if (error.message.includes('Network error')) {
                  troubleshooting = '\n\n💡 Solution: Check your internet connection and iCloud status';
                }
              }
              
              Alert.alert(
                '❌ Delete Failed',
                `${detailedError}${troubleshooting}`,
                [
                  { text: 'OK' },
                  {
                    text: 'Troubleshoot',
                    onPress: () => {
                      Alert.alert(
                        'Troubleshooting Steps',
                        '1. Ensure you\'re using a development build\n2. Check iCloud is enabled on device\n3. Verify internet connection\n4. Try CloudKit verification in Settings',
                        [{ text: 'OK' }]
                      );
                    }
                  }
                ]
              );
              
              console.error('Delete error:', error);
            }
          },
        },
      ]
    );
  }, [isBackupAvailable, deleteBackupOp]);

  /**
   * Pick a CloudKit backup and restore from it
   */
  const pickAndRestoreBackup = useCallback(async (): Promise<void> => {
    if (!isBackupAvailable) {
      setError('CloudKit restore is only available on iOS devices');
      return;
    }

    try {
      // For CloudKit, we show available backups in the UI
      // User selects from the list instead of file picker
      setError('Please select a backup from the list above to restore');
    } catch (error) {
      setError('Failed to access CloudKit backups');
      console.error('CloudKit access error:', error);
    }
  }, [isBackupAvailable]);

  /**
   * Refresh the list of available CloudKit backups
   */
  const refreshBackups = useCallback(async (): Promise<void> => {
    if (!isBackupAvailable) return;

    try {
      const cloudKitBackups = await refreshBackupsOp.execute();
      if (cloudKitBackups) {
        const backupInfos: BackupInfo[] = cloudKitBackups.map(backup => ({
          path: backup.id,
          metadata: {
            version: '1.0.3',
            createdAt: new Date(typeof backup.createdAt === 'number' ? backup.createdAt * 1000 : backup.createdAt).toISOString(),
            deviceInfo: {
              platform: backup.deviceInfo?.platform || 'iOS',
              version: backup.deviceInfo?.version || 'Unknown',
            },
            dataSummary: {
              notesCount: backup.dataSummary?.notesCount || 0,
              categoriesCount: backup.dataSummary?.categoriesCount || 0,
              hasSettings: true,
            },
          },
        }));
        
        setBackups(backupInfos);
      }
    } catch (error) {
      console.error('Failed to refresh CloudKit backups:', error);
    }
  }, [isBackupAvailable]);

  // Store the function reference to avoid circular dependencies
  refreshBackupsRef.current = refreshBackups;

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Combine states from all operations
  const backupState = {
    creating: createBackupOp.state.loading,
    restoring: restoreBackupOp.state.loading,
    sharing: false, // Sharing functionality removed - CloudKit only
    deleting: deleteBackupOp.state.loading,
    refreshing: refreshBackupsOp.state.loading,
  };

  return {
    backups,
    isBackupAvailable,
    createBackup,
    restoreFromBackup,
    deleteBackup,
    pickAndRestoreBackup,
    refreshBackups,
    backupState,
    error,
    clearError,
  };
};
