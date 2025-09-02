/**
 * Component for managing backup and restore operations
 * Implements SOLID principles with single responsibility for backup UI
 * Follows DRY principle by reusing established UI patterns
 * Enhanced with proper loading states and error handling
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme.context';
import { useBackupManager } from '../../hooks/useBackupManager';

/**
 * Props for BackupManagerCard component
 */
interface BackupManagerCardProps {
  /** Callback when data is restored */
  onDataRestored?: () => void;
}

/**
 * Component for managing backup and restore operations
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const BackupManagerCard: React.FC<BackupManagerCardProps> = ({ 
  onDataRestored 
}) => {
  const { theme } = useTheme();
  const {
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
  } = useBackupManager();

  /**
   * Handle restore from backup with confirmation
   */
  const handleRestore = (backupPath: string) => {
    Alert.alert(
      'Restore Data',
      'This will replace all current data with the backup. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              await restoreFromBackup(backupPath);
              onDataRestored?.();
            } catch (error) {
              console.error('Restore failed:', error);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle restore from iCloud backup selection
   */
  const handleICloudRestore = () => {
    if (backups.length === 0) {
      Alert.alert(
        'No iCloud Backups Available',
        'Create a backup first, or check if iCloud is properly configured.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Show backup selection dialog
    const backupOptions = backups.map((backup, index) => ({
      text: backup.metadata ? 
        `${formatBackupDate(backup.metadata.createdAt)} (${backup.metadata.dataSummary.notesCount} notes)` :
        `Backup ${index + 1}`,
      onPress: () => handleRestore(backup.path)
    }));

    Alert.alert(
      'Select iCloud Backup to Restore',
      'Choose the backup you want to restore from:',
      [
        { text: 'Cancel', style: 'cancel' },
        ...backupOptions
      ]
    );
  };

  /**
   * Format backup date for display
   */
  const formatBackupDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Unknown date';
    }
  };

  /**
   * Get backup summary text
   */
  const getBackupSummary = (backup: any): string => {
    if (!backup.metadata) return 'Invalid backup';
    
    const { dataSummary } = backup.metadata;
    const isSafetyBackup = backup.path.includes('safety-backup-');
    const backupType = isSafetyBackup ? 'Safety Backup' : 'iCloud Backup';
    
    return `${backupType}: ${dataSummary.notesCount} notes, ${dataSummary.categoriesCount} categories`;
  };

  /**
   * Check if backup is a safety backup
   */
  const isSafetyBackup = (backup: any): boolean => {
    return backup.path.includes('safety-backup-');
  };

  // Show error alert if there's an error
  React.useEffect(() => {
    if (error) {
      Alert.alert('Backup Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  // Load backups on mount
  React.useEffect(() => {
    if (isBackupAvailable) {
      // Use setTimeout to avoid calling during render
      const timer = setTimeout(() => {
        refreshBackups();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isBackupAvailable]);

  if (!isBackupAvailable) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.border }]}>
            <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>iCloud Backup</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Only available on iOS devices
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.border }]}>
          <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>iCloud Backup</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            True iCloud integration with CloudKit
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            // Use setTimeout to avoid calling during render
            setTimeout(() => {
              refreshBackups();
            }, 0);
          }}
          disabled={backupState.refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Create Backup Button */}
              <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={createBackup}
          disabled={backupState.creating}
        >
          {backupState.creating ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.createButtonText}>Create iCloud Backup</Text>
            </>
          )}
        </TouchableOpacity>

            {/* Restore from iCloud Button */}
      <TouchableOpacity
        style={[styles.restoreButton, { borderColor: theme.colors.primary }]}
        onPress={handleICloudRestore}
        disabled={backupState.restoring}
      >
        {backupState.restoring ? (
          <ActivityIndicator color={theme.colors.primary} size="small" />
        ) : (
          <>
            <Ionicons name="cloud-download" size={20} color={theme.colors.primary} />
            <Text style={[styles.restoreButtonText, { color: theme.colors.primary }]}>
              Restore from iCloud
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Restore from External File Button */}
      <TouchableOpacity
        style={[styles.externalRestoreButton, { borderColor: theme.colors.secondary }]}
        onPress={pickAndRestoreBackup}
        disabled={backupState.restoring}
      >
        {backupState.restoring ? (
          <ActivityIndicator color={theme.colors.secondary} size="small" />
        ) : (
          <>
            <Ionicons name="folder-open" size={20} color={theme.colors.secondary} />
            <Text style={[styles.externalRestoreButtonText, { color: theme.colors.secondary }]}>
              Restore from External File
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Backups List */}
      {backups.length > 0 && (
        <View style={styles.backupsSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          Available iCloud Backups ({backups.length})
        </Text>
          
          {backups.map((backup, index) => (
            <View 
              key={backup.path} 
              style={[
                styles.backupItem, 
                { 
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: index === backups.length - 1 ? 0 : 1
                }
              ]}
            >
              <View style={styles.backupInfo}>
                <Text style={[styles.backupDate, { color: theme.colors.text }]}>
                  {backup.metadata ? formatBackupDate(backup.metadata.createdAt) : 'Unknown date'}
                  {isSafetyBackup(backup) && (
                    <Text style={[styles.safetyBadge, { color: theme.colors.warning }]}>
                      {' '}🛡️ Safety
                    </Text>
                  )}
                </Text>
                <Text style={[styles.backupSummary, { color: theme.colors.textSecondary }]}>
                  {getBackupSummary(backup)}
                </Text>
                {backup.metadata && (
                  <Text style={[styles.backupVersion, { color: theme.colors.textSecondary }]}>
                    Version {backup.metadata.version}
                  </Text>
                )}
              </View>
              
              <View style={styles.backupActions}>
                {!isSafetyBackup(backup) && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleRestore(backup.path)}
                    disabled={backupState.restoring}
                  >
                    <Ionicons name="refresh" size={16} color="white" />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                  onPress={() => shareBackup(backup.path)}
                  disabled={backupState.sharing}
                >
                  <Ionicons name="share" size={16} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => deleteBackup(backup.path)}
                  disabled={backupState.deleting}
                >
                  <Ionicons name="trash" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* No Backups State */}
      {backups.length === 0 && !backupState.refreshing && (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
            No iCloud backups available
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
            Create your first iCloud backup to get started
          </Text>
        </View>
      )}

      {/* Loading State */}
      {backupState.refreshing && (
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading backups...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  refreshButton: {
    padding: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 12,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  externalRestoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 16,
  },
  externalRestoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backupsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backupInfo: {
    flex: 1,
  },
  backupDate: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  backupSummary: {
    fontSize: 14,
    marginBottom: 2,
  },
  backupVersion: {
    fontSize: 12,
  },
  safetyBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  backupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
});
