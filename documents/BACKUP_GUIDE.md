# iCloud Backup & Restore Guide

## Overview

The Notes Tracker app now includes comprehensive iCloud backup and restore functionality, allowing you to safely backup your data and restore it when needed. This feature is available exclusively on iOS devices.

## Features

### 🔄 Create Backups
- **Automatic Backup Creation**: Creates timestamped backups with metadata
- **Data Validation**: Ensures backup integrity before storage
- **Metadata Tracking**: Includes version, creation date, and data summary
- **Safe Storage**: Backups are stored in the app's documents directory

### 📱 Restore Data
- **File Picker Integration**: Select backup files from Files app or iCloud Drive
- **Data Validation**: Verifies backup integrity before restoration
- **Safe Restoration**: Creates backup of current data before overwriting
- **User Confirmation**: Requires explicit confirmation before restore

### 📤 Share Backups
- **Multiple Sharing Options**: Share via AirDrop, Messages, Mail, or other apps
- **iCloud Drive Support**: Upload backups directly to iCloud Drive
- **File Format**: Standard JSON format for cross-platform compatibility

### 🗂️ Backup Management
- **Backup List**: View all available backups with creation dates
- **Backup Details**: See notes count, categories count, and version info
- **Delete Backups**: Remove old backups to free up storage
- **Auto Cleanup**: Keeps only the 5 most recent backups

## How to Use

### Creating a Backup

1. Open the **Settings** screen in the app
2. Scroll down to the **iCloud Backup** section
3. Tap **Create Backup**
4. Wait for the backup to complete
5. You'll see a success message when done

### Restoring from a Backup

1. Open the **Settings** screen in the app
2. Scroll down to the **iCloud Backup** section
3. Tap **Restore from File**
4. Select a backup file from your device or iCloud Drive
5. Confirm the restoration when prompted
6. Wait for the restore to complete

### Sharing a Backup

1. Open the **Settings** screen in the app
2. Scroll down to the **iCloud Backup** section
3. Find the backup you want to share
4. Tap the **Share** button (📤)
5. Choose your preferred sharing method

### Managing Backups

1. Open the **Settings** screen in the app
2. Scroll down to the **iCloud Backup** section
3. View your available backups in the list
4. Use the action buttons to:
   - **Restore** (🔄): Restore from this backup
   - **Share** (📤): Share this backup
   - **Delete** (🗑️): Remove this backup

## Technical Details

### Backup File Format
Backups are stored as JSON files with the following structure:
```json
{
  "metadata": {
    "version": "1.0.0",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "deviceInfo": {
      "platform": "ios",
      "version": "17.0"
    },
    "dataSummary": {
      "notesCount": 25,
      "categoriesCount": 5,
      "hasSettings": true
    }
  },
  "notes": [...],
  "categories": [...],
  "settings": {...}
}
```

### Storage Location
- **Backup Directory**: `Documents/backups/`
- **File Naming**: `notes-tracker-backup-YYYY-MM-DDTHH-MM-SS-sssZ.json`
- **iCloud Sync**: Backups automatically sync to iCloud Drive

### Data Safety
- **Validation**: All backup data is validated before use
- **Integrity Checks**: Ensures data structure and relationships are valid
- **Safe Restoration**: Current data is backed up before any restore operation
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Troubleshooting

### Backup Creation Fails
- Ensure you have sufficient storage space
- Check that iCloud Drive is enabled
- Verify the app has necessary permissions

### Restore Fails
- Ensure the backup file is valid and not corrupted
- Check that the backup version is compatible
- Verify you have sufficient storage for restoration

### Sharing Issues
- Ensure the backup file exists and is accessible
- Check that sharing is available on your device
- Verify you have the necessary sharing permissions

## Best Practices

### Regular Backups
- Create backups before major app updates
- Backup after adding important notes
- Maintain multiple backup versions

### Backup Storage
- Store backups in iCloud Drive for cloud access
- Keep local copies for offline access
- Regularly clean up old backups

### Data Recovery
- Test restore functionality with non-critical data first
- Keep backups in multiple locations
- Document your backup strategy

## Privacy & Security

- **Local Storage**: Backups are stored locally on your device
- **iCloud Sync**: Optional iCloud Drive synchronization
- **Data Encryption**: Uses device-level encryption
- **No Cloud Processing**: Backup data is not processed by external servers

## Support

If you encounter issues with backup or restore functionality:

1. Check the troubleshooting section above
2. Ensure you're using the latest app version
3. Contact support with specific error messages
4. Include device and iOS version information

---

**Note**: This feature is designed for iOS devices only. Android users can use the standard export/import functionality available in the app.
