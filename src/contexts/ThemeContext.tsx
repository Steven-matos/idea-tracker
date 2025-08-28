import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, StatusBarStyle } from 'react-native';
import { ThemeMode } from '../types';
import { storageService } from '../services/StorageService';

/**
 * Theme colors for light and dark modes
 * Extended with professional business color variants
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
  // Additional professional color variants
  primaryLight: string;
  primaryDark: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  accentLight: string;
  surfaceVariant: string;
  surfaceElevated: string;
  gradientStart: string;
  gradientEnd: string;
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
 * Light theme colors following modern business design guidelines
 * Professional, inviting palette with muted neutral colors
 */
const lightColors: ThemeColors = {
  background: '#F8F9FA', // Soft, warm off-white
  surface: '#FFFFFF', // Pure white for cards
  primary: '#6B7280', // Sophisticated gray
  secondary: '#9CA3AF', // Muted slate
  text: '#1F2937', // Deep charcoal for readability
  textSecondary: '#6B7280', // Muted gray for secondary text
  border: '#E5E7EB', // Subtle gray border
  shadow: '#1F2937', // Dark shadow for depth
  error: '#EF4444', // Professional red
  success: '#10B981', // Business green
  warning: '#F59E0B', // Warm amber
  info: '#6B7280', // Neutral info color
  // Additional professional color variants
  primaryLight: '#D1D5DB', // Light gray for primary
  primaryDark: '#374151', // Dark slate for primary
  secondaryLight: '#FEF3C7', // Light yellow for secondary
  secondaryDark: '#F59E0B', // Dark yellow for secondary
  accent: '#8B5CF6', // Subtle purple for accents
  accentLight: '#E9D5FF', // Light purple for accents
  surfaceVariant: '#F9FAFB', // Subtle variant for surfaces
  surfaceElevated: '#FFFFFF', // Pure white for elevated surfaces
  gradientStart: '#F8F9FA', // Start of gradient
  gradientEnd: '#FFFFFF', // End of gradient
};

/**
 * Dark theme colors following modern business design guidelines
 * Professional dark mode with muted neutral accents
 */
const darkColors: ThemeColors = {
  background: '#111827', // Deep charcoal background
  surface: '#1F2937', // Elevated charcoal surface
  primary: '#9CA3AF', // Bright gray for dark mode
  secondary: '#D1D5DB', // Light gray for dark mode
  text: '#F9FAFB', // Light gray for readability
  textSecondary: '#9CA3AF', // Muted light gray
  border: '#374151', // Subtle dark border
  shadow: '#000000', // Pure black shadow
  error: '#F87171', // Bright red for dark mode
  success: '#34D399', // Bright green for dark mode
  warning: '#FBBF24', // Bright amber for dark mode
  info: '#9CA3AF', // Neutral info for dark mode
  // Additional professional color variants
  primaryLight: '#4B5563', // Dark gray for primary
  primaryDark: '#1F2937', // Dark charcoal for primary
  secondaryLight: '#92400E', // Dark amber for secondary in dark mode
  secondaryDark: '#CA8A04', // Dark yellow for secondary
  accent: '#A78BFA', // Bright purple for accents
  accentLight: '#C7D2FE', // Light purple for accents
  surfaceVariant: '#374151', // Dark variant for surfaces
  surfaceElevated: '#1F2937', // Elevated charcoal for elevated surfaces
  gradientStart: '#111827', // Start of gradient
  gradientEnd: '#1F2937', // End of gradient
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
