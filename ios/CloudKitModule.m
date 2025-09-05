/**
 * CloudKit Module Bridge for React Native
 * Exposes Swift CloudKit functionality to JavaScript
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CloudKitModule, RCTEventEmitter)

// CloudKit initialization
RCT_EXTERN_METHOD(initializeCloudKit:(NSString *)containerId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Account status
RCT_EXTERN_METHOD(getAccountStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Backup operations
RCT_EXTERN_METHOD(createBackup:(NSString *)backupData
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAvailableBackups:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(restoreFromBackup:(NSString *)backupId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteBackup:(NSString *)backupId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Sync operations
RCT_EXTERN_METHOD(syncWithCloudKit:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
