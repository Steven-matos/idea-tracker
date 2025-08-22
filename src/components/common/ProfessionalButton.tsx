import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for ProfessionalButton component
 */
interface ProfessionalButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

/**
 * ProfessionalButton component with modern gradient styling
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
   * Get button colors based on variant
   */
  const getButtonColors = (): string[] => {
    if (disabled) {
      return [theme.colors.textSecondary, theme.colors.border];
    }

    switch (variant) {
      case 'primary':
        return [theme.colors.primary, theme.colors.primaryDark];
      case 'secondary':
        return [theme.colors.secondary, theme.colors.secondaryDark];
      case 'outline':
        return [theme.colors.surface, theme.colors.surface];
      case 'ghost':
        return ['transparent', 'transparent'];
      default:
        return [theme.colors.primary, theme.colors.primaryDark];
    }
  };

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

  const isGradientVariant = variant === 'primary' || variant === 'secondary';

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {isGradientVariant ? (
        <LinearGradient
          colors={getButtonColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
        />
      ) : null}
      
      <LinearGradient
        colors={getButtonColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: 12, opacity: isGradientVariant ? 0 : 1 }
        ]}
      />
      
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
