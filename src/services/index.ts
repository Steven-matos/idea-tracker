/**
 * Services index file
 * Centralized export for all application services
 * Implements SOLID principles by organizing services into focused modules
 */

// Storage Services
export { storageService, default as StorageService } from './storage.service';

// Re-export for convenience
export { storageService as storage } from './storage.service';
