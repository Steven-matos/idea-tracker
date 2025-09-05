/**
 * Native CloudKit Module for React Native
 * Provides true Apple iCloud integration with CloudKit
 * Follows SOLID principles with single responsibility for CloudKit operations
 */

import Foundation
import CloudKit
import React

@objc(CloudKitModule)
class CloudKitModule: RCTEventEmitter {
  
  // MARK: - Properties
  
  private var container: CKContainer?
  private var privateDatabase: CKDatabase?
  private var publicDatabase: CKDatabase?
  private var isInitialized = false
  
  // MARK: - React Native Bridge Setup
  
  override func supportedEvents() -> [String]! {
    return [
      "CloudKitSyncStarted",
      "CloudKitSyncCompleted", 
      "CloudKitSyncFailed",
      "CloudKitBackupCreated",
      "CloudKitBackupDeleted"
    ]
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  // MARK: - CloudKit Initialization
  
  /**
   * Initialize CloudKit with container identifier
   * @param containerId The iCloud container identifier
   * @param resolve Promise resolve callback
   * @param reject Promise reject callback
   */
  @objc
  func initializeCloudKit(_ containerId: String, 
                         resolver resolve: @escaping RCTPromiseResolveBlock, 
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      do {
        // Initialize CloudKit container
        self?.container = CKContainer(identifier: containerId)
        self?.privateDatabase = self?.container?.privateCloudDatabase
        self?.publicDatabase = self?.container?.publicCloudDatabase
        
        // Verify account status
        self?.container?.accountStatus { [weak self] (status, error) in
          if let error = error {
            reject("CLOUDKIT_ERROR", "Failed to check account status: \(error.localizedDescription)", error)
            return
          }
          
          switch status {
          case .available:
            self?.isInitialized = true
            self?.sendEvent(withName: "CloudKitSyncStarted", body: nil)
            resolve(true)
          case .noAccount:
            reject("NO_ACCOUNT", "No iCloud account found. Please sign in to iCloud.", nil)
          case .restricted:
            reject("RESTRICTED", "iCloud access is restricted for this device.", nil)
          case .couldNotDetermine:
            reject("UNKNOWN", "Could not determine iCloud account status.", nil)
          @unknown default:
            reject("UNKNOWN", "Unknown iCloud account status.", nil)
          }
        }
      } catch {
        reject("INIT_ERROR", "Failed to initialize CloudKit: \(error.localizedDescription)", error)
      }
    }
  }
  
  // MARK: - Account Status
  
  /**
   * Get CloudKit account status
   * @param resolve Promise resolve callback
   * @param reject Promise reject callback
   */
  @objc
  func getAccountStatus(_ resolve: @escaping RCTPromiseResolveBlock, 
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let container = container else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    container.accountStatus { (status, error) in
      if let error = error {
        reject("ACCOUNT_ERROR", "Failed to get account status: \(error.localizedDescription)", error)
        return
      }
      
      let accountStatus: [String: Any] = [
        "isAvailable": status == .available,
        "accountStatus": self.statusToString(status),
        "hasICloudAccount": status == .available,
        "containerStatus": "available"
      ]
      
      resolve(accountStatus)
    }
  }
  
  // MARK: - Backup Operations
  
  /**
   * Create a CloudKit backup
   * @param backupData JSON string containing backup data
   * @param resolve Promise resolve callback
   * @param reject Promise reject callback
   */
  @objc
  func createBackup(_ backupData: String, 
                   resolver resolve: @escaping RCTPromiseResolveBlock, 
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let privateDatabase = privateDatabase else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        // Create CloudKit record
        let recordID = CKRecord.ID(recordType: "Backup")
        let record = CKRecord(recordType: "Backup", recordID: recordID)
        
        // Set backup data
        record["backupData"] = backupData
        record["createdAt"] = Date()
        record["deviceInfo"] = self.getDeviceInfo()
        record["version"] = "1.0.0"
        
        // Save to CloudKit
        privateDatabase.save(record) { (savedRecord, error) in
          if let error = error {
            reject("BACKUP_ERROR", "Failed to create backup: \(error.localizedDescription)", error)
            return
          }
          
          guard let savedRecord = savedRecord else {
            reject("BACKUP_ERROR", "No record returned from CloudKit", nil)
            return
          }
          
          let backupId = savedRecord.recordID.recordName
          self.sendEvent(withName: "CloudKitBackupCreated", body: ["backupId": backupId])
          resolve(backupId)
        }
      } catch {
        reject("BACKUP_ERROR", "Failed to create backup: \(error.localizedDescription)", error)
      }
    }
  }
  
  /**
   * Get available CloudKit backups
   * @param resolve Promise resolve callback
   * @param reject Promise reject callback
   */
  @objc
  func getAvailableBackups(_ resolve: @escaping RCTPromiseResolveBlock, 
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let privateDatabase = privateDatabase else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    let query = CKQuery(recordType: "Backup", predicate: NSPredicate(value: true))
    query.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]
    
    privateDatabase.perform(query, inZoneWith: nil) { (records, error) in
      if let error = error {
        reject("QUERY_ERROR", "Failed to query backups: \(error.localizedDescription)", error)
        return
      }
      
      guard let records = records else {
        resolve([])
        return
      }
      
      let backups = records.compactMap { record -> [String: Any]? in
        guard let backupData = record["backupData"] as? String,
              let createdAt = record["createdAt"] as? Date else {
          return nil
        }
        
        // Parse backup data to get summary
        let dataSummary = self.parseBackupDataSummary(backupData)
        
        return [
          "id": record.recordID.recordName,
          "name": "Backup \(DateFormatter.localizedString(from: createdAt, dateStyle: .medium, timeStyle: .short))",
          "createdAt": ISO8601DateFormatter().string(from: createdAt),
          "size": backupData.count,
          "deviceInfo": record["deviceInfo"] as? [String: Any] ?? [:],
          "dataSummary": dataSummary
        ]
      }
      
      resolve(backups)
    }
  }
  
  /**
   * Restore from CloudKit backup
   * @param backupId The backup record ID
   * @param resolve Promise resolve callback
   * @param reject Promise reject callback
   */
  @objc
  func restoreFromBackup(_ backupId: String, 
                        resolver resolve: @escaping RCTPromiseResolveBlock, 
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let privateDatabase = privateDatabase else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    let recordID = CKRecord.ID(recordName: backupId)
    
    privateDatabase.fetch(withRecordID: recordID) { (record, error) in
      if let error = error {
        reject("RESTORE_ERROR", "Failed to fetch backup: \(error.localizedDescription)", error)
        return
      }
      
      guard let record = record,
            let backupData = record["backupData"] as? String else {
        reject("RESTORE_ERROR", "Backup data not found", nil)
        return
      }
      
      resolve(backupData)
    }
  }
  
  /**
   * Delete CloudKit backup
   * @param backupId The backup record ID
   * @param resolve Promise resolve callback
   * @param reject Promise reject callback
   */
  @objc
  func deleteBackup(_ backupId: String, 
                   resolver resolve: @escaping RCTPromiseResolveBlock, 
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let privateDatabase = privateDatabase else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    let recordID = CKRecord.ID(recordName: backupId)
    
    privateDatabase.delete(withRecordID: recordID) { (recordID, error) in
      if let error = error {
        reject("DELETE_ERROR", "Failed to delete backup: \(error.localizedDescription)", error)
        return
      }
      
      self.sendEvent(withName: "CloudKitBackupDeleted", body: ["backupId": backupId])
      resolve(true)
    }
  }
  
  /**
   * Sync with CloudKit
   * @param resolve Promise resolve callback
   * @param reject Promise reject callback
   */
  @objc
  func syncWithCloudKit(_ resolve: @escaping RCTPromiseResolveBlock, 
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let privateDatabase = privateDatabase else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    // For now, just resolve successfully
    // In a full implementation, this would handle conflict resolution
    self.sendEvent(withName: "CloudKitSyncCompleted", body: nil)
    resolve(true)
  }
  
  // MARK: - Helper Methods
  
  /**
   * Convert CloudKit account status to string
   * @param status CloudKit account status
   * @return String representation of status
   */
  private func statusToString(_ status: CKAccountStatus) -> String {
    switch status {
    case .available:
      return "available"
    case .noAccount:
      return "noAccount"
    case .restricted:
      return "restricted"
    case .couldNotDetermine:
      return "couldNotDetermine"
    @unknown default:
      return "unknown"
    }
  }
  
  /**
   * Get device information for backup metadata
   * @return Dictionary containing device info
   */
  private func getDeviceInfo() -> [String: Any] {
    return [
      "platform": "iOS",
      "version": UIDevice.current.systemVersion,
      "deviceId": UIDevice.current.identifierForVendor?.uuidString ?? "unknown",
      "model": UIDevice.current.model
    ]
  }
  
  /**
   * Parse backup data to extract summary information
   * @param backupData JSON string containing backup data
   * @return Dictionary containing data summary
   */
  private func parseBackupDataSummary(_ backupData: String) -> [String: Any] {
    do {
      if let data = backupData.data(using: .utf8),
         let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
         let metadata = json["metadata"] as? [String: Any],
         let dataSummary = metadata["dataSummary"] as? [String: Any] {
        return dataSummary
      }
    } catch {
      print("Failed to parse backup data summary: \(error)")
    }
    
    return [
      "notesCount": 0,
      "categoriesCount": 0,
      "hasSettings": false,
      "totalSize": backupData.count
    ]
  }
}
