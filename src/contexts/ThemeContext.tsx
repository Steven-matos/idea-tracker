import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, StatusBarStyle } from 'react-native';
import { ThemeMode } from '../types';
import { storageService } from '../services/StorageService';

/**
 * Theme colors for light and dark modes
 */
interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

/**
 * Complete theme configuration
 */
interface Theme {
  colors: ThemeColors;
  statusBarStyle: StatusBarStyle;
  isDark: boolean;
}

/**
 * Theme context value interface
 */
interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

/**
 * Light theme colors following iOS design guidelines
 */
const lightColors: ThemeColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  primary: '#007AFF',
  secondary: '#5856D6',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  shadow: '#000000',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  info: '#5AC8FA',
};

/**
 * Dark theme colors following iOS design guidelines
 */
const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1C1C1E',
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  shadow: '#000000',
  error: '#FF453A',
  success: '#30D158',
  warning: '#FF9F0A',
  info: '#64D2FF',
};

/**
 * Create light theme configuration
 */
const lightTheme: Theme = {
  colors: lightColors,
  statusBarStyle: 'dark-content',
  isDark: false,
};

/**
 * Create dark theme configuration
 */
const darkTheme: Theme = {
  colors: darkColors,
  statusBarStyle: 'light-content',
  isDark: true,
};

/**
 * Theme context for managing app-wide theming
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Props for ThemeProvider component
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme provider component that manages theme state and provides theme context
 * Implements SOLID principles by separating theme concerns into a dedicated provider
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * Determine the active theme based on theme mode and system preference
   * Follows DRY principle by centralizing theme determination logic
   */
  const getActiveTheme = (): Theme => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const activeTheme = getActiveTheme();

  /**
   * Update theme mode and persist to storage
   * Implements KISS principle with simple, focused functionality
   */
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      const settings = await storageService.getSettings();
      const updatedSettings = { ...settings, themeMode: mode };
      await storageService.storeSettings(updatedSettings);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  /**
   * Load theme mode from storage on component mount
   */
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const settings = await storageService.getSettings();
        setThemeModeState(settings.themeMode);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading theme mode:', error);
        setIsLoaded(true);
      }
    };

    loadThemeMode();
  }, []);

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  const contextValue: ThemeContextValue = {
    theme: activeTheme,
    themeMode,
    setThemeMode,
    isDark: activeTheme.isDark,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access theme context
 * Provides type-safe access to theme values and functions
 * 
 * @returns Theme context value
 * @throws Error if used outside of ThemeProvider
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Export theme configurations for direct access if needed
 */
export { lightTheme, darkTheme };
export type { Theme, ThemeColors, ThemeMode };
