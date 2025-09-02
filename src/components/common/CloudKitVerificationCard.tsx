import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme.context';
import { nativeCloudKitService } from '../../services/native-cloudkit.service';

/**
 * CloudKit verification card component
 * Displays real-time status and allows verification testing
 */
export function CloudKitVerificationCard() {
  const { theme } = useTheme();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  /**
   * Verify CloudKit integration
   */
  const verifyCloudKit = useCallback(async () => {
    setIsVerifying(true);
    try {
      // First initialize CloudKit
      await nativeCloudKitService.initializeCloudKit();
      
      // Get detailed status
      const status = await nativeCloudKitService.getDetailedStatus();
      setVerificationResult(status);
      setLastChecked(new Date().toLocaleTimeString());
      
      // Show result in alert
      if (status.verification.isWorking) {
        Alert.alert(
          '✅ CloudKit Verified!',
          'Your app is successfully using Apple\'s CloudKit for true iCloud integration.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ CloudKit Not Working',
          `Issue: ${status.verification.error || 'Unknown error'}\n\nCheck the details below.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Verification failed:', error);
      
      // Show detailed error message with troubleshooting tips
      let errorMessage = 'Unknown error occurred';
      let troubleshooting = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide specific troubleshooting based on error type
        if (error.message.includes('CloudKit native module not available')) {
          troubleshooting = '\n\n💡 Solution: Use a development build instead of Expo Go';
        } else if (error.message.includes('CloudKit is only available on iOS')) {
          troubleshooting = '\n\n💡 Solution: This feature only works on iOS devices';
        } else if (error.message.includes('Development build required')) {
          troubleshooting = '\n\n💡 Solution: Build and install the development version of the app';
        }
      }
      
      Alert.alert(
        '❌ CloudKit Verification Failed',
        `${errorMessage}${troubleshooting}`,
        [
          { text: 'OK' },
          { 
            text: 'View Details', 
            onPress: () => {
              Alert.alert(
                'Technical Details',
                `Error: ${errorMessage}\n\nThis usually means:\n• You're using Expo Go (not supported)\n• Development build not installed\n• CloudKit not properly configured\n• iOS device required`,
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    } finally {
      setIsVerifying(false);
    }
  }, []);

  /**
   * Get status icon and color
   */
  const getStatusIcon = () => {
    if (!verificationResult) return { icon: 'help-circle', color: theme.colors.secondary };
    
    if (verificationResult.verification.isWorking) {
      return { icon: 'checkmark-circle', color: '#4CAF50' };
    }
    
    return { icon: 'close-circle', color: '#F44336' };
  };

  /**
   * Get status text
   */
  const getStatusText = () => {
    if (!verificationResult) return 'Not Verified';
    
    if (verificationResult.verification.isWorking) {
      return 'CloudKit Working ✅';
    }
    
    return 'CloudKit Failed ❌';
  };

  const statusIcon = getStatusIcon();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Ionicons name="cloud" size={24} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          CloudKit Verification
        </Text>
      </View>

      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Verify that your app is truly using Apple's CloudKit for iCloud integration
      </Text>

      <TouchableOpacity
        style={[styles.verifyButton, { backgroundColor: theme.colors.primary }]}
        onPress={verifyCloudKit}
        disabled={isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.verifyButtonText}>Verify CloudKit Integration</Text>
          </>
        )}
      </TouchableOpacity>

      {verificationResult && (
        <View style={styles.resultContainer}>
          <View style={styles.statusRow}>
            <Ionicons name={statusIcon.icon} size={20} color={statusIcon.color} />
            <Text style={[styles.statusText, { color: theme.colors.text }]}>
              {getStatusText()}
            </Text>
          </View>

          {lastChecked && (
            <Text style={[styles.lastChecked, { color: theme.colors.textSecondary }]}>
              Last checked: {lastChecked}
            </Text>
          )}

          <View style={styles.detailsContainer}>
            <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>
              Verification Details:
            </Text>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Account Status:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {verificationResult.accountStatus.accountStatus}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Container Access:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {verificationResult.verification.details.containerAccess ? '✅' : '❌'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Record Creation:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {verificationResult.verification.details.recordCreation ? '✅' : '❌'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Container ID:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {verificationResult.containerId}
              </Text>
            </View>
          </View>

          {!verificationResult.verification.isWorking && (
            <View style={styles.troubleshootingContainer}>
              <Text style={[styles.troubleshootingTitle, { color: theme.colors.text }]}>
                Troubleshooting:
              </Text>
              <Text style={[styles.troubleshootingText, { color: theme.colors.textSecondary }]}>
                • Ensure you're using a development build (not Expo Go){'\n'}
                • Check that iCloud is enabled on your device{'\n'}
                • Verify your Apple Developer account has CloudKit enabled{'\n'}
                • Check the CloudKit Dashboard for container status
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  lastChecked: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  troubleshootingContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  troubleshootingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
