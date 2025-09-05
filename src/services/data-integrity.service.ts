import { storageService } from './storage.service';
import { nativeCloudKitService } from './native-cloudkit.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service for monitoring and maintaining data integrity
 * Implements SOLID principles with single responsibility for data health monitoring
 * Follows DRY principle by centralizing integrity checks
 * Implements KISS principle with straightforward validation logic
 */

export interface DataIntegrityReport {
  /** Overall health status */
  isHealthy: boolean;
  /** Timestamp of the check */
  timestamp: string;
  /** Issues found during the check */
  issues: DataIntegrityIssue[];
  /** Summary of the check */
  summary: string;
  /** Recommendations for fixing issues */
  recommendations: string[];
}

export interface DataIntegrityIssue {
  /** Type of issue found */
  type: 'corruption' | 'inconsistency' | 'orphaned' | 'validation' | 'backup' | 'cloudkit' | 'sync';
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Description of the issue */
  description: string;
  /** Affected data */
  affectedData?: any;
  /** Suggested fix */
  suggestedFix?: string;
}

/**
 * Data integrity monitoring service
 */
class DataIntegrityService {
  /**
   * Perform comprehensive data integrity check
   * @returns Detailed report of data health
   */
  async performIntegrityCheck(): Promise<DataIntegrityReport> {
    const issues: DataIntegrityIssue[] = [];
    const recommendations: string[] = [];
    
    try {
      // Check notes integrity
      const noteIssues = await this.checkNotesIntegrity();
      issues.push(...noteIssues);
      
      // Check categories integrity
      const categoryIssues = await this.checkCategoriesIntegrity();
      issues.push(...categoryIssues);
      
      // Check settings integrity
      const settingsIssues = await this.checkSettingsIntegrity();
      issues.push(...settingsIssues);
      
      // Check for orphaned data
      const orphanedIssues = await this.checkForOrphanedData();
      issues.push(...orphanedIssues);
      
      // Check backup health
      const backupIssues = await this.checkBackupHealth();
      issues.push(...backupIssues);
      
      // Check CloudKit integration health
      const cloudKitIssues = await this.checkCloudKitHealth();
      issues.push(...cloudKitIssues);
      
      // Check sync status
      const syncIssues = await this.checkSyncStatus();
      issues.push(...syncIssues);
      
      // Generate recommendations
      recommendations.push(...this.generateRecommendations(issues));
      
      // Determine overall health
      const criticalIssues = issues.filter(issue => issue.severity === 'critical');
      const highIssues = issues.filter(issue => issue.severity === 'high');
      const isHealthy = criticalIssues.length === 0 && highIssues.length === 0;
      
      return {
        isHealthy,
        timestamp: new Date().toISOString(),
        issues,
        summary: this.generateSummary(issues),
        recommendations
      };
      
    } catch (error) {
      console.error('Error during integrity check:', error);
      
      return {
        isHealthy: false,
        timestamp: new Date().toISOString(),
        issues: [{
          type: 'corruption',
          severity: 'critical',
          description: `Integrity check failed: ${error}`,
          suggestedFix: 'Restart the application and check device storage'
        }],
        summary: 'Data integrity check failed due to system error',
        recommendations: ['Restart the application', 'Check device storage space', 'Contact support if issue persists']
      };
    }
  }

  /**
   * Check notes data integrity
   */
  private async checkNotesIntegrity(): Promise<DataIntegrityIssue[]> {
    const issues: DataIntegrityIssue[] = [];
    
    try {
      const notes = await storageService.getNotes();
      
      // Check for invalid note structures
      notes.forEach((note, index) => {
        if (!note.id || !note.content || !note.type) {
          issues.push({
            type: 'validation',
            severity: 'high',
            description: `Note at index ${index} has invalid structure`,
            affectedData: note,
            suggestedFix: 'Note will be automatically repaired or removed'
          });
        }
        
        // Check for missing required fields
        if (!note.createdAt || !note.updatedAt) {
          issues.push({
            type: 'validation',
            severity: 'medium',
            description: `Note ${note.id} missing timestamp fields`,
            affectedData: note,
            suggestedFix: 'Timestamps will be automatically added'
          });
        }
        
        // Check for invalid category references
        if (note.categoryId && note.categoryId !== 'general') {
          // This will be checked in orphaned data check
        }
      });
      
      // Check for duplicate IDs
      const noteIds = notes.map(note => note.id);
      const duplicateIds = noteIds.filter((id, index) => noteIds.indexOf(id) !== index);
      
      if (duplicateIds.length > 0) {
        issues.push({
          type: 'corruption',
          severity: 'high',
          description: `Found ${duplicateIds.length} duplicate note IDs`,
          affectedData: duplicateIds,
          suggestedFix: 'Duplicate notes will be automatically resolved'
        });
      }
      
    } catch (error) {
      issues.push({
        type: 'corruption',
        severity: 'critical',
        description: `Failed to retrieve notes: ${error}`,
        suggestedFix: 'Check storage permissions and device storage'
      });
    }
    
    return issues;
  }

  /**
   * Check categories data integrity
   */
  private async checkCategoriesIntegrity(): Promise<DataIntegrityIssue[]> {
    const issues: DataIntegrityIssue[] = [];
    
    try {
      const categories = await storageService.getCategories();
      
      // Check for invalid category structures
      categories.forEach((category, index) => {
        if (!category.id || !category.name || !category.color) {
          issues.push({
            type: 'validation',
            severity: 'high',
            description: `Category at index ${index} has invalid structure`,
            affectedData: category,
            suggestedFix: 'Category will be automatically repaired or removed'
          });
        }
        
        // Check for missing timestamp
        if (!category.createdAt) {
          issues.push({
            type: 'validation',
            severity: 'medium',
            description: `Category ${category.id} missing creation timestamp`,
            affectedData: category,
            suggestedFix: 'Timestamp will be automatically added'
          });
        }
      });
      
      // Check for duplicate IDs
      const categoryIds = categories.map(category => category.id);
      const duplicateIds = categoryIds.filter((id, index) => categoryIds.indexOf(id) !== index);
      
      if (duplicateIds.length > 0) {
        issues.push({
          type: 'corruption',
          severity: 'high',
          description: `Found ${duplicateIds.length} duplicate category IDs`,
          affectedData: duplicateIds,
          suggestedFix: 'Duplicate categories will be automatically resolved'
        });
      }
      
      // Ensure default category exists
      const generalCategory = categories.find(cat => cat.id === 'general');
      if (!generalCategory) {
        issues.push({
          type: 'corruption',
          severity: 'critical',
          description: 'Default General category is missing',
          suggestedFix: 'Default category will be automatically recreated'
        });
      }
      
    } catch (error) {
      issues.push({
        type: 'corruption',
        severity: 'critical',
        description: `Failed to retrieve categories: ${error}`,
        suggestedFix: 'Check storage permissions and device storage'
      });
    }
    
    return issues;
  }

  /**
   * Check settings data integrity
   */
  private async checkSettingsIntegrity(): Promise<DataIntegrityIssue[]> {
    const issues: DataIntegrityIssue[] = [];
    
    try {
      const settings = await storageService.getSettings();
      
      // Check for invalid settings structure
      if (!settings.defaultCategoryId || !settings.audioQuality || !settings.themeMode) {
        issues.push({
          type: 'validation',
          severity: 'medium',
          description: 'Settings have invalid structure',
          affectedData: settings,
          suggestedFix: 'Settings will be reset to defaults'
        });
      }
      
      // Validate audio quality value
      const validAudioQualities = ['low', 'medium', 'high'];
      if (!validAudioQualities.includes(settings.audioQuality)) {
        issues.push({
          type: 'validation',
          severity: 'low',
          description: `Invalid audio quality setting: ${settings.audioQuality}`,
          affectedData: settings.audioQuality,
          suggestedFix: 'Audio quality will be reset to medium'
        });
      }
      
      // Validate theme mode value
      const validThemeModes = ['light', 'dark', 'system'];
      if (!validThemeModes.includes(settings.themeMode)) {
        issues.push({
          type: 'validation',
          severity: 'low',
          description: `Invalid theme mode setting: ${settings.themeMode}`,
          affectedData: settings.themeMode,
          suggestedFix: 'Theme mode will be reset to system'
        });
      }
      
    } catch (error) {
      issues.push({
        type: 'corruption',
        severity: 'medium',
        description: `Failed to retrieve settings: ${error}`,
        suggestedFix: 'Settings will be reset to defaults'
      });
    }
    
    return issues;
  }

  /**
   * Check for orphaned data references
   */
  private async checkForOrphanedData(): Promise<DataIntegrityIssue[]> {
    const issues: DataIntegrityIssue[] = [];
    
    try {
      const [notes, categories] = await Promise.all([
        storageService.getNotes(),
        storageService.getCategories()
      ]);
      
      const categoryIds = categories.map(cat => cat.id);
      
      // Check for notes with invalid category references
      const orphanedNotes = notes.filter(note => 
        note.categoryId && !categoryIds.includes(note.categoryId)
      );
      
      if (orphanedNotes.length > 0) {
        issues.push({
          type: 'orphaned',
          severity: 'medium',
          description: `${orphanedNotes.length} notes reference non-existent categories`,
          affectedData: orphanedNotes.map(note => ({ id: note.id, categoryId: note.categoryId })),
          suggestedFix: 'Notes will be automatically moved to General category'
        });
      }
      
    } catch (error) {
      issues.push({
        type: 'corruption',
        severity: 'medium',
        description: `Failed to check for orphaned data: ${error}`,
        suggestedFix: 'Check storage permissions and device storage'
      });
    }
    
    return issues;
  }

  /**
   * Check backup health and availability
   */
  private async checkBackupHealth(): Promise<DataIntegrityIssue[]> {
    const issues: DataIntegrityIssue[] = [];
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter((key: string) => key.includes('_backup_'));
      
      if (backupKeys.length === 0) {
        issues.push({
          type: 'backup',
          severity: 'low',
          description: 'No backup files found',
          suggestedFix: 'Backups will be created automatically on next data change'
        });
      } else {
        // Check backup freshness (backups older than 7 days)
        const now = Date.now();
        const oldBackups = backupKeys.filter((key: string) => {
          const timestamp = parseInt(key.split('_').pop() || '0');
          return (now - timestamp) > (7 * 24 * 60 * 60 * 1000); // 7 days
        });
        
        if (oldBackups.length > 0) {
          issues.push({
            type: 'backup',
            severity: 'low',
            description: `${oldBackups.length} backup files are older than 7 days`,
            suggestedFix: 'Old backups will be automatically cleaned up'
          });
        }
      }
      
    } catch (error) {
      issues.push({
        type: 'backup',
        severity: 'medium',
        description: `Failed to check backup health: ${error}`,
        suggestedFix: 'Check storage permissions and device storage'
      });
    }
    
    return issues;
  }

  /**
   * Check CloudKit integration health
   */
  private async checkCloudKitHealth(): Promise<DataIntegrityIssue[]> {
    const issues: DataIntegrityIssue[] = [];
    
    try {
      // Check if CloudKit is available
      if (!nativeCloudKitService.isNativeCloudKitAvailable()) {
        issues.push({
          type: 'cloudkit',
          severity: 'low',
          description: 'CloudKit native module not available',
          suggestedFix: 'CloudKit features will be disabled - app will work with local storage only'
        });
        return issues;
      }
      
      // Check CloudKit account status
      const accountStatus = await nativeCloudKitService.getCloudKitAccountStatus();
      
      if (!accountStatus.isAvailable) {
        issues.push({
          type: 'cloudkit',
          severity: 'medium',
          description: `CloudKit account not available: ${accountStatus.accountStatus}`,
          suggestedFix: 'Sign in to iCloud to enable cloud sync features'
        });
      }
      
      // Check CloudKit backup availability
      const cloudKitBackups = await nativeCloudKitService.getAvailableCloudKitBackups();
      
      if (cloudKitBackups.length === 0) {
        issues.push({
          type: 'cloudkit',
          severity: 'low',
          description: 'No CloudKit backups found',
          suggestedFix: 'Create a CloudKit backup to enable cloud data protection'
        });
      } else {
        // Check backup freshness
        const now = Date.now();
        const recentBackups = cloudKitBackups.filter(backup => {
          const createdAt = typeof backup.createdAt === 'number' ? backup.createdAt * 1000 : new Date(backup.createdAt).getTime();
          return (now - createdAt) < (7 * 24 * 60 * 60 * 1000); // 7 days
        });
        
        if (recentBackups.length === 0) {
          issues.push({
            type: 'cloudkit',
            severity: 'medium',
            description: 'CloudKit backups are older than 7 days',
            suggestedFix: 'Create a new CloudKit backup to ensure data protection'
          });
        }
      }
      
    } catch (error) {
      issues.push({
        type: 'cloudkit',
        severity: 'high',
        description: `CloudKit health check failed: ${error}`,
        suggestedFix: 'Check iCloud connectivity and account status'
      });
    }
    
    return issues;
  }

  /**
   * Check sync status between local and CloudKit
   */
  private async checkSyncStatus(): Promise<DataIntegrityIssue[]> {
    const issues: DataIntegrityIssue[] = [];
    
    try {
      if (!nativeCloudKitService.isNativeCloudKitAvailable()) {
        return issues; // Skip sync checks if CloudKit not available
      }
      
      // Check if sync is working properly
      const accountStatus = await nativeCloudKitService.getCloudKitAccountStatus();
      
      if (accountStatus.isAvailable) {
        // Attempt to sync and check for conflicts
        try {
          await nativeCloudKitService.syncWithCloudKit();
          // Sync completed successfully
        } catch (syncError) {
          issues.push({
            type: 'sync',
            severity: 'high',
            description: `Sync error: ${syncError}`,
            suggestedFix: 'Restart the app and check iCloud connectivity'
          });
        }
      }
      
    } catch (error) {
      issues.push({
        type: 'sync',
        severity: 'medium',
        description: `Sync status check failed: ${error}`,
        suggestedFix: 'Check iCloud connectivity and account status'
      });
    }
    
    return issues;
  }

  /**
   * Generate recommendations based on found issues
   */
  private generateRecommendations(issues: DataIntegrityIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(issue => issue.severity === 'critical')) {
      recommendations.push('Critical issues detected - immediate action required');
      recommendations.push('Consider restoring from backup if available');
    }
    
    if (issues.some(issue => issue.type === 'corruption')) {
      recommendations.push('Data corruption detected - run repair operations');
    }
    
    if (issues.some(issue => issue.type === 'orphaned')) {
      recommendations.push('Orphaned data found - run cleanup operations');
    }
    
    if (issues.some(issue => issue.type === 'backup')) {
      recommendations.push('Backup issues detected - ensure regular backups');
    }
    
    if (issues.some(issue => issue.type === 'cloudkit')) {
      recommendations.push('CloudKit issues detected - check iCloud account and connectivity');
    }
    
    if (issues.some(issue => issue.type === 'sync')) {
      recommendations.push('Sync issues detected - ensure stable internet connection');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('No immediate action required');
      recommendations.push('Continue regular app usage');
    }
    
    return recommendations;
  }

  /**
   * Generate summary of integrity check
   */
  private generateSummary(issues: DataIntegrityIssue[]): string {
    const totalIssues = issues.length;
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
    const highIssues = issues.filter(issue => issue.severity === 'high').length;
    const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
    const lowIssues = issues.filter(issue => issue.severity === 'low').length;
    
    if (totalIssues === 0) {
      return 'All data integrity checks passed successfully';
    }
    
    let summary = `Found ${totalIssues} data integrity issue(s): `;
    const parts: string[] = [];
    
    if (criticalIssues > 0) parts.push(`${criticalIssues} critical`);
    if (highIssues > 0) parts.push(`${highIssues} high`);
    if (mediumIssues > 0) parts.push(`${mediumIssues} medium`);
    if (lowIssues > 0) parts.push(`${lowIssues} low`);
    
    summary += parts.join(', ');
    summary += ' severity';
    
    return summary;
  }

  /**
   * Attempt to repair common data integrity issues
   * @returns Object with count of repaired issues and any errors
   */
  async repairDataIssues(): Promise<{ repaired: number; errors: string[] }> {
    let repaired = 0;
    const errors: string[] = [];
    
    try {
      console.log('Starting data repair process...');
      
      // Repair notes issues
      const notesRepaired = await this.repairNotesIssues();
      repaired += notesRepaired;
      
      // Repair categories issues
      const categoriesRepaired = await this.repairCategoriesIssues();
      repaired += categoriesRepaired;
      
      // Repair settings issues
      const settingsRepaired = await this.repairSettingsIssues();
      repaired += settingsRepaired;
      
      // Repair orphaned data
      const orphanedRepaired = await this.repairOrphanedData();
      repaired += orphanedRepaired;
      
      // Clean up old backups
      const backupCleaned = await this.cleanupOldBackups();
      repaired += backupCleaned;
      
      console.log(`Data repair completed: ${repaired} issues repaired`);
      
    } catch (error) {
      errors.push(`Repair process failed: ${error}`);
      console.error('Data repair failed:', error);
    }
    
    return { repaired, errors };
  }

  /**
   * Repair notes data issues
   */
  private async repairNotesIssues(): Promise<number> {
    let repaired = 0;
    
    try {
      const notes = await storageService.getNotes();
      const validNotes = [];
      
      for (const note of notes) {
        let needsRepair = false;
        const repairedNote = { ...note };
        
        // Fix missing timestamps
        if (!repairedNote.createdAt) {
          repairedNote.createdAt = new Date().toISOString();
          needsRepair = true;
        }
        
        if (!repairedNote.updatedAt) {
          repairedNote.updatedAt = new Date().toISOString();
          needsRepair = true;
        }
        
        // Fix missing required fields
        if (!repairedNote.type) {
          repairedNote.type = 'text';
          needsRepair = true;
        }
        
        // Fix invalid category references
        if (repairedNote.categoryId && repairedNote.categoryId !== 'general') {
          const categories = await storageService.getCategories();
          const categoryExists = categories.some(cat => cat.id === repairedNote.categoryId);
          
          if (!categoryExists) {
            repairedNote.categoryId = 'general';
            needsRepair = true;
          }
        }
        
        if (needsRepair) {
          repaired++;
        }
        
        validNotes.push(repairedNote);
      }
      
      // Remove duplicates by ID
      const uniqueNotes = validNotes.filter((note, index, self) => 
        index === self.findIndex(n => n.id === note.id)
      );
      
      if (uniqueNotes.length !== notes.length) {
        await (storageService as any).storeNotes(uniqueNotes);
        repaired += (notes.length - uniqueNotes.length);
      }
      
    } catch (error) {
      console.error('Failed to repair notes:', error);
    }
    
    return repaired;
  }

  /**
   * Repair categories data issues
   */
  private async repairCategoriesIssues(): Promise<number> {
    let repaired = 0;
    
    try {
      const categories = await storageService.getCategories();
      const validCategories = [];
      
      // Ensure default category exists
      const hasGeneralCategory = categories.some(cat => cat.id === 'general');
      
      if (!hasGeneralCategory) {
        validCategories.push({
          id: 'general',
          name: 'General',
          color: '#007AFF',
          createdAt: new Date().toISOString()
        });
        repaired++;
      }
      
      for (const category of categories) {
        let needsRepair = false;
        const repairedCategory = { ...category };
        
        // Fix missing timestamps
        if (!repairedCategory.createdAt) {
          repairedCategory.createdAt = new Date().toISOString();
          needsRepair = true;
        }
        
        // Fix missing required fields
        if (!repairedCategory.color) {
          repairedCategory.color = '#007AFF';
          needsRepair = true;
        }
        
        if (needsRepair) {
          repaired++;
        }
        
        validCategories.push(repairedCategory);
      }
      
      // Remove duplicates by ID
      const uniqueCategories = validCategories.filter((category, index, self) => 
        index === self.findIndex(c => c.id === category.id)
      );
      
      if (uniqueCategories.length !== categories.length) {
        await (storageService as any).storeCategories(uniqueCategories);
        repaired += (categories.length - uniqueCategories.length);
      }
      
    } catch (error) {
      console.error('Failed to repair categories:', error);
    }
    
    return repaired;
  }

  /**
   * Repair settings data issues
   */
  private async repairSettingsIssues(): Promise<number> {
    let repaired = 0;
    
    try {
      const settings = await storageService.getSettings();
      const repairedSettings = { ...settings };
      
      // Fix invalid audio quality
      const validAudioQualities = ['low', 'medium', 'high'];
      if (!validAudioQualities.includes(repairedSettings.audioQuality)) {
        repairedSettings.audioQuality = 'medium';
        repaired++;
      }
      
      // Fix invalid theme mode
      const validThemeModes = ['light', 'dark', 'system'];
      if (!validThemeModes.includes(repairedSettings.themeMode)) {
        repairedSettings.themeMode = 'system';
        repaired++;
      }
      
      // Fix missing default category
      if (!repairedSettings.defaultCategoryId) {
        repairedSettings.defaultCategoryId = 'general';
        repaired++;
      }
      
      if (repaired > 0) {
        await (storageService as any).storeSettings(repairedSettings);
      }
      
    } catch (error) {
      console.error('Failed to repair settings:', error);
    }
    
    return repaired;
  }

  /**
   * Repair orphaned data references
   */
  private async repairOrphanedData(): Promise<number> {
    let repaired = 0;
    
    try {
      const [notes, categories] = await Promise.all([
        storageService.getNotes(),
        storageService.getCategories()
      ]);
      
      const categoryIds = categories.map(cat => cat.id);
      const notesToRepair: any[] = [];
      
      for (const note of notes) {
        if (note.categoryId && !categoryIds.includes(note.categoryId)) {
          notesToRepair.push({
            ...note,
            categoryId: 'general'
          });
          repaired++;
        }
      }
      
      if (notesToRepair.length > 0) {
        const updatedNotes = notes.map(note => {
          const repairedNote = notesToRepair.find(r => r.id === note.id);
          return repairedNote || note;
        });
        
        await (storageService as any).storeNotes(updatedNotes);
      }
      
    } catch (error) {
      console.error('Failed to repair orphaned data:', error);
    }
    
    return repaired;
  }

  /**
   * Clean up old backup files
   */
  private async cleanupOldBackups(): Promise<number> {
    let cleaned = 0;
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter((key: string) => key.includes('_backup_'));
      
      if (backupKeys.length > 10) { // Keep only 10 most recent backups
        // Sort by timestamp (newest first)
        backupKeys.sort((a, b) => {
          const timestampA = parseInt(a.split('_').pop() || '0');
          const timestampB = parseInt(b.split('_').pop() || '0');
          return timestampB - timestampA;
        });
        
        // Remove oldest backups
        const keysToRemove = backupKeys.slice(10);
        await AsyncStorage.multiRemove(keysToRemove);
        cleaned = keysToRemove.length;
      }
      
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
    
    return cleaned;
  }
}

// Export singleton instance
export const dataIntegrityService = new DataIntegrityService();
export default DataIntegrityService;
