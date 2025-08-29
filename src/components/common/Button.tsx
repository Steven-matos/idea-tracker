import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator 
} from 'react-native';

import { useTheme } from '../../contexts/theme.context';
import { ButtonStyles, Colors, TextStyles, mergeStyles } from '../../styles';

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
  customColor?: string;
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
  icon,
  customColor
}) => {
  const { theme } = useTheme();



  /**
   * Get button styles based on variant and size
   * Uses shared style constants for consistency
   */
  const getButtonStyles = (): ViewStyle => {
    const baseStyles = { ...ButtonStyles.base };
    const sizeStyles = ButtonStyles.sizes[size];

    // Add variant-specific styles
    let variantStyles: ViewStyle = {};
    
    if (!disabled) {
      switch (variant) {
        case 'primary':
          variantStyles = ButtonStyles.variants.primary;
          break;
        case 'secondary':
          variantStyles = ButtonStyles.variants.secondary(theme.isDark);
          break;
        case 'destructive':
          variantStyles = ButtonStyles.variants.destructive;
          break;
        case 'success':
          variantStyles = ButtonStyles.variants.success;
          break;
        case 'outline':
          const outlineColor = customColor || theme.colors.primary;
          variantStyles = {
            ...ButtonStyles.variants.outline(outlineColor),
            borderColor: outlineColor,
          };
          break;
        case 'ghost':
          variantStyles = ButtonStyles.variants.ghost;
          break;
      }
    } else {
      variantStyles = { backgroundColor: theme.colors.border };
    }

    return { ...baseStyles, ...sizeStyles, ...variantStyles };
  };

  /**
   * Get text styles based on variant and size
   * Uses shared typography styles for consistency
   */
  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      fontWeight: TextStyles.bodyMedium.fontWeight,
      textAlign: 'center',
    };

    // Size-based font sizes
    const fontSizes = {
      small: 14,
      medium: 16,
      large: 18,
    };
    baseStyles.fontSize = fontSizes[size];

    // Variant-specific text colors
    if (disabled) {
      baseStyles.color = theme.colors.textSecondary;
    } else if (variant === 'outline' || variant === 'ghost') {
      baseStyles.color = customColor || theme.colors.primary;
    } else if (variant === 'secondary') {
      baseStyles.color = '#1F2937'; // Dark text for yellow background
    } else {
      baseStyles.color = Colors.WHITE;
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
          color={variant === 'outline' || variant === 'ghost' ? (customColor || theme.colors.primary) : Colors.WHITE} 
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
