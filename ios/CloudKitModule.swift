import Foundation
import CloudKit
import React

@objc(CloudKitModule)
class CloudKitModule: NSObject {
  
  private var container: CKContainer?
  private var privateDatabase: CKDatabase?
  
  @objc
  func initializeCloudKit(_ containerId: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    container = CKContainer(identifier: containerId)
    privateDatabase = container?.privateCloudDatabase
    
    if privateDatabase != nil {
      resolver(true)
    } else {
      rejecter("INIT_ERROR", "Failed to initialize CloudKit", nil)
    }
  }
  
  @objc
  func createBackup(_ backupData: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let database = privateDatabase else {
      rejecter("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    // Parse backup data
    guard let data = backupData.data(using: .utf8),
          let backupDict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      rejecter("INVALID_DATA", "Invalid backup data format", nil)
      return
    }
    
    // Create CloudKit records
    let backupRecord = CKRecord(recordType: "Backup")
    backupRecord.setValue(backupData, forKey: "backupData")
    backupRecord.setValue(Date(), forKey: "createdAt")
    
    database.save(backupRecord) { record, error in
      if let error = error {
        rejecter("SAVE_ERROR", "Failed to save backup", error)
      } else {
        resolver(record?.recordID.recordName ?? "")
      }
    }
  }
  
  @objc
  func getAvailableBackups(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let database = privateDatabase else {
      rejecter("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    let query = CKQuery(recordType: "Backup", predicate: NSPredicate(value: true))
    query.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]
    
    database.perform(query, inZoneWith: nil) { records, error in
      if let error = error {
        rejecter("QUERY_ERROR", "Failed to query backups", error)
      } else {
        let backups = records?.map { record in
          [
            "id": record.recordID.recordName,
            "name": "Backup \(record.recordID.recordName)",
            "createdAt": record["createdAt"] as? Date?.timeIntervalSince1970 ?? 0,
            "size": record["backupData"] as? String?.count ?? 0
          ]
        } ?? []
        resolver(backups)
      }
    }
  }
  
  @objc
  func restoreFromBackup(_ backupId: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let database = privateDatabase else {
      rejecter("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    let recordID = CKRecord.ID(recordName: backupId)
    database.fetch(withRecordID: recordID) { record, error in
      if let error = error {
        rejecter("FETCH_ERROR", "Failed to fetch backup", error)
      } else if let record = record {
        let backupData = record["backupData"] as? String ?? ""
        resolver(backupData)
      } else {
        rejecter("NOT_FOUND", "Backup not found", nil)
      }
    }
  }
  
  @objc
  func deleteBackup(_ backupId: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let database = privateDatabase else {
      rejecter("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    let recordID = CKRecord.ID(recordName: backupId)
    database.delete(withRecordID: recordID) { _, error in
      if let error = error {
        rejecter("DELETE_ERROR", "Failed to delete backup", error)
      } else {
        resolver(true)
      }
    }
  }
  
  @objc
  func getAccountStatus(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let container = container else {
      rejecter("NOT_INITIALIZED", "CloudKit not initialized", nil)
      return
    }
    
    container.accountStatus { status, error in
      if let error = error {
        rejecter("STATUS_ERROR", "Failed to get account status", error)
      } else {
        let statusDict: [String: Any] = [
          "isAvailable": status == .available,
          "accountStatus": self.mapAccountStatus(status),
          "hasICloudAccount": status == .available,
          "containerStatus": "available"
        ]
        resolver(statusDict)
      }
    }
  }
  
  @objc
  func syncWithCloudKit(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    // Implement sync logic here
    resolver(true)
  }
  
  private func mapAccountStatus(_ status: CKAccountStatus) -> String {
    switch status {
    case .available: return "available"
    case .noAccount: return "noAccount"
    case .restricted: return "restricted"
    case .couldNotDetermine: return "couldNotDetermine"
    @unknown default: return "couldNotDetermine"
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
