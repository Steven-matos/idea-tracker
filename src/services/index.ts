/**
 * Services index file
 * Centralized export for all application services
 * Implements SOLID principles by organizing services into focused modules
 */

// Export all services
export { storageService, default as StorageService } from './storage.service';
export { dataIntegrityService, default as DataIntegrityService } from './data-integrity.service';
export { iCloudService, default as ICloudService } from './icloud.service';
export { nativeCloudKitService, default as NativeCloudKitService } from './native-cloudkit.service';

// Re-export for convenience
export { storageService as storage } from './storage.service';
