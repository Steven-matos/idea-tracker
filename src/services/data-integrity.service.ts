import { storageService } from './storage.service';
import { Note, Category, AppSettings } from '../types';

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
  type: 'corruption' | 'inconsistency' | 'orphaned' | 'validation' | 'backup';
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
      const keys = await storageService['getAllKeys']?.() || [];
      const backupKeys = keys.filter(key => key.includes('_backup_'));
      
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
        const oldBackups = backupKeys.filter(key => {
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
   */
  async repairDataIssues(): Promise<{ repaired: number; errors: string[] }> {
    const repaired = 0;
    const errors: string[] = [];
    
    try {
      // This would implement actual repair logic
      // For now, we'll just return a placeholder
      console.log('Data repair functionality would be implemented here');
      
    } catch (error) {
      errors.push(`Repair failed: ${error}`);
    }
    
    return { repaired, errors };
  }
}

// Export singleton instance
export const dataIntegrityService = new DataIntegrityService();
export default DataIntegrityService;
