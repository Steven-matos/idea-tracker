/**
 * Services index file
 * Centralized export for all application services
 * Implements SOLID principles by organizing services into focused modules
 */

export { storageService, default as StorageService } from './storage.service';
export { dataIntegrityService, default as DataIntegrityService } from './data-integrity.service';
export { cloudKitService, default as CloudKitService } from './cloudkit.service';
export { storageService as storage } from './storage.service';
