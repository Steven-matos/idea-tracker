import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { storageService } from './src/services/storage.service';
import { ThemeProvider, useTheme } from './src/contexts/theme.context';

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
      console.log('App: Starting initialization...');
      await storageService.initializeStorage();
      console.log('App: Storage initialized successfully');
      setIsInitialized(true);
    } catch (error) {
      console.error('App: Failed to initialize app:', error);
      setInitError(`Failed to initialize app: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Initialize app on mount
  useEffect(() => {
    console.log('App: useEffect triggered');
    initializeApp();
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    console.log('App: Showing loading state, error:', initError);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>Initializing...</Text>
        {initError && (
          <Text style={{ fontSize: 14, color: 'red', textAlign: 'center', marginHorizontal: 20 }}>
            {initError}
          </Text>
        )}
      </View>
    );
  }

  console.log('App: Rendering main app');
  return (
    <>
      <RootNavigator />
      <StatusBar style={theme.statusBarStyle as any} />
    </>
  );
};

/**
 * Main App component
 * Initializes storage and renders the navigation with theme support
 */
export default function App() {
  console.log('App: Main App component rendering');
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Styles removed as we're now using LoadingScreen component
});
