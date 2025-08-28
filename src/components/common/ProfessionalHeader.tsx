import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
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
 * ProfessionalHeader component with modern solid color styling
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
   * Get header background color based on variant and theme
   */
  const getHeaderColor = (): string => {
    if (variant === 'surface') {
      return theme.colors.surface;
    }
    
    if (variant === 'secondary') {
      return theme.isDark ? '#CA8A04' : '#FDE047'; // Dark yellow for dark mode, bright yellow for light mode
    }
    
    // Professional blue that works well in both light and dark modes
    return theme.isDark ? '#1E40AF' : '#3B82F6';
  };

  /**
   * Get text color based on variant
   */
  const getTextColor = (): string => {
    if (variant === 'surface') {
      return theme.colors.text;
    }
    
    if (variant === 'secondary') {
      return '#1F2937'; // Dark text for yellow background
    }
    
    return '#FFFFFF'; // White text for blue backgrounds
  };

  return (
    <View
      style={[
        styles.container, 
        { backgroundColor: getHeaderColor() },
        style
      ]}
    >
      <View style={styles.content}>
        {/* Left Icon */}
        {leftIcon && (
          <TouchableOpacity
            style={[
              styles.iconButton,
              { 
                backgroundColor: variant === 'secondary' 
                  ? 'rgba(31, 41, 55, 0.1)' // Dark overlay for yellow
                  : 'rgba(255, 255, 255, 0.1)' // Light overlay for blue
              }
            ]}
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
            style={[
              styles.iconButton,
              { 
                backgroundColor: variant === 'secondary' 
                  ? 'rgba(31, 41, 55, 0.1)' // Dark overlay for yellow
                  : 'rgba(255, 255, 255, 0.1)' // Light overlay for blue
              }
            ]}
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
    </View>
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
