import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for LoadingScreen component
 */
interface LoadingScreenProps {
  message?: string;
  variant?: 'primary' | 'secondary' | 'surface';
}

/**
 * LoadingScreen component with modern professional styling
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
   * Get gradient colors based on variant
   */
  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'primary':
        return [theme.colors.primary, theme.colors.primaryDark];
      case 'secondary':
        return [theme.colors.secondary, theme.colors.secondaryDark];
      case 'surface':
        return [theme.colors.surface, theme.colors.surfaceVariant];
      default:
        return [theme.colors.primary, theme.colors.primaryDark];
    }
  };

  /**
   * Get text color based on variant
   */
  const getTextColor = (): string => {
    return variant === 'surface' ? theme.colors.text : '#FFFFFF';
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
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
    </LinearGradient>
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
