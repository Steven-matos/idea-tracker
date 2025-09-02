import { Alert } from 'react-native';

/**
 * Global error handler utility
 * Provides consistent error handling and user feedback across the app
 * Follows SOLID principles with single responsibility for error management
 */

export interface ErrorContext {
  operation: string;
  component?: string;
  screen?: string;
  additionalInfo?: string;
}

/**
 * Handle CloudKit-specific errors with user-friendly messages
 */
export function handleCloudKitError(error: any, context: ErrorContext): void {
  let title = '❌ CloudKit Error';
  let message = 'An unexpected error occurred';
  let troubleshooting = '';
  
  if (error instanceof Error) {
    message = error.message;
    
    // Provide specific solutions based on error type
    if (error.message.includes('CloudKit native module not available')) {
      troubleshooting = '\n\n💡 Solution: Use a development build instead of Expo Go';
    } else if (error.message.includes('CloudKit is only available on iOS')) {
      troubleshooting = '\n\n💡 Solution: This feature only works on iOS devices';
    } else if (error.message.includes('Development build required')) {
      troubleshooting = '\n\n💡 Solution: Build and install the development version of the app';
    } else if (error.message.includes('CloudKit not initialized')) {
      troubleshooting = '\n\n💡 Solution: Try verifying CloudKit integration first';
    } else if (error.message.includes('Network error')) {
      troubleshooting = '\n\n💡 Solution: Check your internet connection and iCloud status';
    }
  }
  
  // Log error for debugging
  console.error(`CloudKit Error in ${context.operation}:`, {
    error: error instanceof Error ? error.message : error,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  // Show user-friendly error popup
  Alert.alert(
    title,
    `${message}${troubleshooting}\n\nOperation: ${context.operation}`,
    [
      { text: 'OK' },
      {
        text: 'Troubleshoot',
        onPress: () => {
          Alert.alert(
            'Troubleshooting Steps',
            '1. Ensure you\'re using a development build (not Expo Go)\n2. Check iCloud is enabled on device\n3. Verify internet connection\n4. Try CloudKit verification in Settings\n5. Restart the app if issues persist',
            [{ text: 'OK' }]
          );
        }
      }
    ]
  );
}

/**
 * Handle storage-related errors with user-friendly messages
 */
export function handleStorageError(error: any, context: ErrorContext): void {
  let title = '❌ Storage Error';
  let message = 'An unexpected storage error occurred';
  let troubleshooting = '';
  
  if (error instanceof Error) {
    message = error.message;
    
    if (error.message.includes('AsyncStorage')) {
      troubleshooting = '\n\n💡 Solution: Please restart the app';
    } else if (error.message.includes('JSON')) {
      troubleshooting = '\n\n💡 Solution: Data corruption detected - contact support';
    } else if (error.message.includes('permission')) {
      troubleshooting = '\n\n💡 Solution: Check app storage permissions';
    } else if (error.message.includes('quota')) {
      troubleshooting = '\n\n💡 Solution: Free up device storage space';
    }
  }
  
  // Log error for debugging
  console.error(`Storage Error in ${context.operation}:`, {
    error: error instanceof Error ? error.message : error,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  // Show user-friendly error popup
  Alert.alert(
    title,
    `${message}${troubleshooting}\n\nOperation: ${context.operation}`,
    [
      { text: 'OK' },
      {
        text: 'Troubleshoot',
        onPress: () => {
          Alert.alert(
            'Storage Troubleshooting',
            '1. Restart the app\n2. Check device storage space\n3. Verify app permissions\n4. Clear app data if needed\n5. Contact support if issues persist',
            [{ text: 'OK' }]
          );
        }
      }
    ]
  );
}

/**
 * Handle general app errors with user-friendly messages
 */
export function handleGeneralError(error: any, context: ErrorContext): void {
  let title = '❌ App Error';
  let message = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    message = error.message;
  }
  
  // Log error for debugging
  console.error(`General Error in ${context.operation}:`, {
    error: error instanceof Error ? error.message : error,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  // Show user-friendly error popup
  Alert.alert(
    title,
    `${message}\n\nOperation: ${context.operation}\n\nIf this error persists, please restart the app or contact support.`,
    [
      { text: 'OK' },
      {
        text: 'Contact Support',
        onPress: () => {
          Alert.alert(
            'Contact Support',
            'For support or feedback, please email us at support@notestracker.app',
            [{ text: 'OK' }]
          );
        }
      }
    ]
  );
}

/**
 * Generic error handler that determines the appropriate error handling method
 */
export function handleError(error: any, context: ErrorContext): void {
  if (error instanceof Error) {
    if (error.message.includes('CloudKit') || error.message.includes('iCloud')) {
      handleCloudKitError(error, context);
    } else if (error.message.includes('storage') || error.message.includes('AsyncStorage')) {
      handleStorageError(error, context);
    } else {
      handleGeneralError(error, context);
    }
  } else {
    handleGeneralError(error, context);
  }
}

/**
 * Create error context for consistent error reporting
 */
export function createErrorContext(operation: string, component?: string, screen?: string, additionalInfo?: string): ErrorContext {
  return {
    operation,
    component,
    screen,
    additionalInfo,
  };
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}
