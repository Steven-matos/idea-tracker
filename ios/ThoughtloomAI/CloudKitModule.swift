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
  
  @objc
  func initializeCloudKit(_ containerId: String, 
                         resolver resolve: @escaping RCTPromiseResolveBlock, 
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      guard let self = self else {
        reject("INIT_ERROR", "Module deallocated", nil)
        return
      }
      
      do {
        // Initialize CloudKit container
        self.container = CKContainer(identifier: containerId)
        self.privateDatabase = self.container?.privateCloudDatabase
        self.publicDatabase = self.container?.publicCloudDatabase
        
        // Check account status
        self.container?.accountStatus { (status, error) in
          if let error = error {
            reject("ACCOUNT_ERROR", error.localizedDescription, error)
            return
          }
          
          switch status {
          case .available:
            self.isInitialized = true
            resolve(true)
          case .noAccount:
            reject("NO_ACCOUNT", "No iCloud account signed in", nil)
          case .restricted:
            reject("RESTRICTED", "iCloud access restricted", nil)
          case .couldNotDetermine:
            reject("UNKNOWN", "Could not determine iCloud account status", nil)
          @unknown default:
            reject("UNKNOWN", "Unknown iCloud account status", nil)
          }
        }
      } catch {
        reject("INIT_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  // MARK: - CloudKit Operations
  
  @objc
  func createBackup(_ backupData: String,
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let privateDB = privateDatabase else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    let record = CKRecord(recordType: "Backup")
    record["data"] = backupData as CKRecordValue
    record["createdAt"] = Date() as CKRecordValue
    record["deviceInfo"] = UIDevice.current.name as CKRecordValue
    
    privateDB.save(record) { (savedRecord, error) in
      if let error = error {
        reject("SAVE_ERROR", error.localizedDescription, error)
        return
      }
      
      let backupId = savedRecord?.recordID.recordName ?? "unknown"
      self.sendEvent(withName: "CloudKitBackupCreated", body: backupId)
      resolve(backupId)
    }
  }
  
  @objc
  func getAvailableBackups(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let privateDB = privateDatabase else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    let query = CKQuery(recordType: "Backup", predicate: NSPredicate(value: true))
    privateDB.perform(query, inZoneWith: nil) { (records, error) in
      if let error = error {
        reject("QUERY_ERROR", error.localizedDescription, error)
        return
      }
      
      let backups = records?.map { record in
        return [
          "id": record.recordID.recordName,
          "createdAt": (record["createdAt"] as? Date)?.timeIntervalSince1970 ?? 0,
          "deviceInfo": record["deviceInfo"] as? String ?? "Unknown",
          "size": (record["data"] as? String)?.count ?? 0
        ]
      } ?? []
      
      resolve(backups)
    }
  }
  
  @objc
  func restoreFromBackup(_ backupId: String,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let privateDB = privateDatabase else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    let recordID = CKRecord.ID(recordName: backupId)
    privateDB.fetch(withRecordID: recordID) { (record, error) in
      if let error = error {
        reject("FETCH_ERROR", error.localizedDescription, error)
        return
      }
      
      guard let data = record?["data"] as? String else {
        reject("NO_DATA", "Backup data not found", nil)
        return
      }
      
      resolve(data)
    }
  }
  
  @objc
  func deleteBackup(_ backupId: String,
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let privateDB = privateDatabase else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    let recordID = CKRecord.ID(recordName: backupId)
    privateDB.delete(withRecordID: recordID) { (deletedRecordID, error) in
      if let error = error {
        reject("DELETE_ERROR", error.localizedDescription, error)
        return
      }
      
      self.sendEvent(withName: "CloudKitBackupDeleted", body: backupId)
      resolve(true)
    }
  }
  
  @objc
  func getAccountStatus(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let container = container else {
      reject("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    container.accountStatus { (status, error) in
      if let error = error {
        reject("ACCOUNT_ERROR", error.localizedDescription, error)
        return
      }
      
      let statusString: String
      let isAvailable: Bool
      
      switch status {
      case .available:
        statusString = "available"
        isAvailable = true
      case .noAccount:
        statusString = "noAccount"
        isAvailable = false
      case .restricted:
        statusString = "restricted"
        isAvailable = false
      case .couldNotDetermine:
        statusString = "couldNotDetermine"
        isAvailable = false
      @unknown default:
        statusString = "unknown"
        isAvailable = false
      }
      
      resolve([
        "isAvailable": isAvailable,
        "accountStatus": statusString,
        "hasICloudAccount": isAvailable,
        "containerStatus": isAvailable ? "available" : "unavailable"
      ])
    }
  }
  
  @objc
  func syncWithCloudKit(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    sendEvent(withName: "CloudKitSyncStarted", body: nil)
    
    // Simulate sync operation
    DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + 1.0) {
      self.sendEvent(withName: "CloudKitSyncCompleted", body: nil)
      resolve(true)
    }
  }
}
