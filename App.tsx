import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { storageService } from './src/services/StorageService';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

/**
 * App content component that uses theme context
 * Separated to access theme after ThemeProvider is mounted
 */
const AppContent: React.FC = () => {
  const { theme } = useTheme();
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {initError || 'Loading...'}
        </Text>
        <StatusBar style={theme.statusBarStyle} />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style={theme.statusBarStyle} />
    </>
  );
};

/**
 * Main App component
 * Initializes storage and renders the navigation with theme support
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
