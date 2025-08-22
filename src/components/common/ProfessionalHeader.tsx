import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for ProfessionalHeader component
 */
interface ProfessionalHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  variant?: 'primary' | 'secondary' | 'surface';
  style?: ViewStyle;
}

/**
 * ProfessionalHeader component with modern gradient styling
 * Implements SOLID principles with single responsibility for header display
 * Follows DRY principle by centralizing header styling logic
 * Uses KISS principle with simple, focused component design
 */
const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  variant = 'primary',
  style
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
      style={[styles.container, style]}
    >
      <View style={styles.content}>
        {/* Left Icon */}
        {leftIcon && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onLeftPress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={leftIcon} 
              size={24} 
              color={getTextColor()} 
            />
          </TouchableOpacity>
        )}

        {/* Title and Subtitle */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: getTextColor() }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: getTextColor() }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Icon */}
        {rightIcon && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={rightIcon} 
              size={24} 
              color={getTextColor()} 
            />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 60, // Account for status bar
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default ProfessionalHeader;
