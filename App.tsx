import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { storageService } from './src/services/StorageService';

/**
 * Main App component
 * Initializes storage and renders the navigation
 */
export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  /**
   * Initialize app storage on startup
   */
  const initializeApp = async () => {
    try {
      await storageService.initializeStorage();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setInitError('Failed to initialize app. Please restart the application.');
    }
  };

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {initError || 'Loading...'}
          </Text>
          <StatusBar style="dark" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
