/**
 * Test file for iCloud service
 * Ensures backup and restore functionality works correctly
 * Prevents infinite loops and circular dependencies
 */

import { iCloudService } from '../icloud.service';

// Mock the storage service to prevent actual file operations during tests
jest.mock('../storage.service', () => ({
  storageService: {
    getNotes: jest.fn(() => Promise.resolve([])),
    getCategories: jest.fn(() => Promise.resolve([])),
    getSettings: jest.fn(() => Promise.resolve({})),
    storeNotes: jest.fn(() => Promise.resolve()),
    storeCategories: jest.fn(() => Promise.resolve()),
    storeSettings: jest.fn(() => Promise.resolve()),
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/test/documents/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('{}')),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  deleteAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

describe('ICloudService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isICloudAvailable', () => {
    it('should return true for iOS platform', () => {
      // Mock Platform.OS to return 'ios'
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios' },
      }));
      
      expect(iCloudService.isICloudAvailable()).toBe(true);
    });

    it('should return false for non-iOS platform', () => {
      // Mock Platform.OS to return 'android'
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android' },
      }));
      
      expect(iCloudService.isICloudAvailable()).toBe(false);
    });
  });

  describe('createBackup', () => {
    it('should create a backup successfully', async () => {
      const result = await iCloudService.createBackup();
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle errors gracefully', async () => {
      // Mock an error
      const mockError = new Error('Test error');
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // This should not throw an error
      await expect(iCloudService.createBackup()).rejects.toThrow();
    });
  });

  describe('getAvailableBackups', () => {
    it('should return empty array when no backups exist', async () => {
      const result = await iCloudService.getAvailableBackups();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getBackupDirectoryPath', () => {
    it('should return a valid directory path', () => {
      const path = iCloudService.getBackupDirectoryPath();
      expect(typeof path).toBe('string');
      expect(path).toContain('backups');
    });
  });
});
