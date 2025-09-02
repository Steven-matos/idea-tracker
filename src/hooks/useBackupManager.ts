/**
 * Custom hook for managing backup and restore operations
 * Implements SOLID principles with single responsibility for backup management
 * Follows DRY principle by centralizing backup operation logic
 * Enhanced with proper error handling and user feedback
 */

import { useState, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { iCloudService } from '../services/icloud.service';
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
  /** Share a backup file */
  shareBackup: (backupPath: string) => Promise<void>;
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

  // Async operations using the established pattern
  const createBackupOp = useAsyncOperation(
    async () => await iCloudService.createBackup(),
    null,
    { maxRetries: 2, userErrorMessage: 'Failed to create backup' }
  );

  const restoreBackupOp = useAsyncOperation(
    async (backupPath: string) => await iCloudService.restoreFromBackup(backupPath),
    null,
    { maxRetries: 1, userErrorMessage: 'Failed to restore from backup' }
  );

  const shareBackupOp = useAsyncOperation(
    async (backupPath: string) => await iCloudService.shareBackup(backupPath),
    null,
    { maxRetries: 1, userErrorMessage: 'Failed to share backup' }
  );

  const deleteBackupOp = useAsyncOperation(
    async (backupPath: string) => await iCloudService.deleteBackup(backupPath),
    null,
    { maxRetries: 2, userErrorMessage: 'Failed to delete backup' }
  );

  const refreshBackupsOp = useAsyncOperation(
    async () => await iCloudService.getAvailableBackups(),
    [],
    { maxRetries: 2, userErrorMessage: 'Failed to refresh backups' }
  );

  // Create a stable reference for refreshBackups to avoid circular dependencies
  const refreshBackupsRef = useRef<() => Promise<void>>();

  /**
   * Check if backup operations are available
   */
  const isBackupAvailable = Platform.OS === 'ios';

  /**
   * Create a new backup
   */
  const createBackup = useCallback(async (): Promise<void> => {
    if (!isBackupAvailable) {
      setError('Backup is only available on iOS devices');
      return;
    }

    try {
      const backupPath = await createBackupOp.execute();
      if (backupPath) {
        await refreshBackupsRef.current?.();
        Alert.alert(
          'Backup Created',
          'Your data has been backed up successfully.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setError('Failed to create backup');
      console.error('Backup creation error:', error);
    }
  }, [isBackupAvailable, createBackupOp]);

  /**
   * Restore from a backup file
   */
  const restoreFromBackup = useCallback(async (backupPath: string): Promise<void> => {
    if (!isBackupAvailable) {
      setError('Restore is only available on iOS devices');
      return;
    }

    try {
      await restoreBackupOp.execute(backupPath);
      Alert.alert(
        'Restore Complete',
        'Your data has been restored successfully. The app will refresh.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      setError('Failed to restore from backup');
      console.error('Restore error:', error);
    }
  }, [isBackupAvailable, restoreBackupOp]);

  /**
   * Share a backup file
   */
  const shareBackup = useCallback(async (backupPath: string): Promise<void> => {
    if (!isBackupAvailable) {
      setError('Sharing is only available on iOS devices');
      return;
    }

    try {
      await shareBackupOp.execute(backupPath);
    } catch (error) {
      setError('Failed to share backup');
      console.error('Share error:', error);
    }
  }, [isBackupAvailable, shareBackupOp]);

  /**
   * Delete a backup file
   */
  const deleteBackup = useCallback(async (backupPath: string): Promise<void> => {
    if (!isBackupAvailable) {
      setError('Backup management is only available on iOS devices');
      return;
    }

    Alert.alert(
      'Delete Backup',
      'Are you sure you want to delete this backup? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBackupOp.execute(backupPath);
              await refreshBackupsRef.current?.();
              Alert.alert('Success', 'Backup deleted successfully.');
            } catch (error) {
              setError('Failed to delete backup');
              console.error('Delete error:', error);
            }
          },
        },
      ]
    );
  }, [isBackupAvailable, deleteBackupOp]);

  /**
   * Pick a backup file and restore from it
   */
  const pickAndRestoreBackup = useCallback(async (): Promise<void> => {
    if (!isBackupAvailable) {
      setError('Restore is only available on iOS devices');
      return;
    }

    try {
      const backupPath = await iCloudService.pickBackupFile();
      if (backupPath) {
        await restoreFromBackup(backupPath);
      }
    } catch (error) {
      setError('Failed to pick backup file');
      console.error('File pick error:', error);
    }
  }, [isBackupAvailable]);

  /**
   * Refresh the list of available backups
   */
  const refreshBackups = useCallback(async (): Promise<void> => {
    if (!isBackupAvailable) return;

    try {
      const backupPaths = await refreshBackupsOp.execute();
      if (backupPaths) {
        const backupInfos: BackupInfo[] = [];
        
        for (const path of backupPaths) {
          const metadata = await iCloudService.getBackupInfo(path);
          backupInfos.push({ path, metadata });
        }
        
        setBackups(backupInfos);
      }
    } catch (error) {
      console.error('Failed to refresh backups:', error);
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
    sharing: shareBackupOp.state.loading,
    deleting: deleteBackupOp.state.loading,
    refreshing: refreshBackupsOp.state.loading,
  };

  return {
    backups,
    isBackupAvailable,
    createBackup,
    restoreFromBackup,
    shareBackup,
    deleteBackup,
    pickAndRestoreBackup,
    refreshBackups,
    backupState,
    error,
    clearError,
  };
};
