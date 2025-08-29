import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/theme.context';

/**
 * Props for LoadingScreen component
 */
interface LoadingScreenProps {
  message?: string;
  variant?: 'primary' | 'secondary' | 'surface';
}

/**
 * LoadingScreen component with modern solid color styling
 * Implements SOLID principles with single responsibility for loading display
 * Follows DRY principle by centralizing loading UI logic
 * Uses KISS principle with simple, focused component design
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  variant = 'primary' 
}) => {
  const { theme } = useTheme();

  /**
   * Get solid colors based on variant
   */
  const getLoadingColor = (): string => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.isDark ? '#CA8A04' : '#FDE047'; // Dark yellow for dark mode, bright yellow for light mode
      case 'surface':
        return theme.colors.surface;
      default:
        return theme.colors.primary;
    }
  };

  /**
   * Get text color based on variant
   */
  const getTextColor = (): string => {
    return variant === 'surface' ? theme.colors.text : '#FFFFFF';
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getLoadingColor() }
      ]}
    >
      <View style={styles.content}>
        <ActivityIndicator 
          size="large" 
          color={getTextColor()} 
          style={styles.spinner}
        />
        <Text style={[styles.message, { color: getTextColor() }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: 24,
  },
  message: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoadingScreen;
