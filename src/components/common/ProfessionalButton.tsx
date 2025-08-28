import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator 
} from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for ProfessionalButton component
 */
interface ProfessionalButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

/**
 * ProfessionalButton component with modern solid color styling
 * Implements SOLID principles with single responsibility for button interactions
 * Follows DRY principle by centralizing button styling logic
 * Uses KISS principle with simple, focused component design
 */
const ProfessionalButton: React.FC<ProfessionalButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon
}) => {
  const { theme } = useTheme();



  /**
   * Get button styles based on variant and size
   */
  const getButtonStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Add solid background colors for variants
    if (!disabled) {
      switch (variant) {
        case 'primary':
          baseStyles.backgroundColor = '#2563EB'; // Professional blue
          break;
        case 'secondary':
          baseStyles.backgroundColor = theme.isDark ? '#CA8A04' : '#FDE047'; // Dark yellow for dark mode, bright yellow for light mode
          break;
        case 'destructive':
          baseStyles.backgroundColor = theme.colors.error;
          break;
        case 'success':
          baseStyles.backgroundColor = theme.colors.success;
          break;
        case 'outline':
          baseStyles.backgroundColor = 'transparent';
          break;
        case 'ghost':
          baseStyles.backgroundColor = 'transparent';
          break;
      }
    } else {
      baseStyles.backgroundColor = theme.colors.border;
    }

    // Size variations
    switch (size) {
      case 'small':
        baseStyles.paddingHorizontal = 16;
        baseStyles.paddingVertical = 8;
        baseStyles.minHeight = 36;
        break;
      case 'large':
        baseStyles.paddingHorizontal = 32;
        baseStyles.paddingVertical = 16;
        baseStyles.minHeight = 56;
        break;
      default: // medium
        baseStyles.paddingHorizontal = 24;
        baseStyles.paddingVertical = 12;
        baseStyles.minHeight = 48;
    }

    // Variant-specific styles
    if (variant === 'outline') {
      baseStyles.borderWidth = 2;
      baseStyles.borderColor = theme.colors.primary;
    }

    if (variant === 'ghost') {
      baseStyles.backgroundColor = 'transparent';
    }

    return baseStyles;
  };

  /**
   * Get text styles based on variant and size
   */
  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size variations
    switch (size) {
      case 'small':
        baseStyles.fontSize = 14;
        break;
      case 'large':
        baseStyles.fontSize = 18;
        break;
      default: // medium
        baseStyles.fontSize = 16;
    }

    // Variant-specific text colors
    if (disabled) {
      baseStyles.color = theme.colors.textSecondary;
    } else if (variant === 'outline') {
      baseStyles.color = theme.colors.primary;
    } else if (variant === 'ghost') {
      baseStyles.color = theme.colors.primary;
    } else {
      baseStyles.color = '#FFFFFF';
    }

    return baseStyles;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#FFFFFF'} 
          size="small" 
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default ProfessionalButton;
