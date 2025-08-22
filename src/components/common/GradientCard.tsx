import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for GradientCard component
 */
interface GradientCardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'surface' | 'accent';
  elevated?: boolean;
}

/**
 * GradientCard component for creating modern, professional card surfaces
 * Implements SOLID principles with single responsibility for gradient styling
 * Follows DRY principle by centralizing gradient logic
 * Uses KISS principle with simple, focused component design
 */
const GradientCard: React.FC<GradientCardProps> = ({ 
  children, 
  style, 
  variant = 'surface',
  elevated = false 
}) => {
  const { theme } = useTheme();

  /**
   * Get gradient colors based on variant and theme
   */
  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'primary':
        return [theme.colors.primary, theme.colors.primaryDark];
      case 'secondary':
        return [theme.colors.secondary, theme.colors.secondaryDark];
      case 'accent':
        return [theme.colors.accent, theme.colors.accentLight];
      case 'surface':
      default:
        return elevated 
          ? [theme.colors.surfaceElevated, theme.colors.surfaceVariant]
          : [theme.colors.surface, theme.colors.surfaceVariant];
    }
  };

  /**
   * Get card styles based on variant and elevation
   */
  const getCardStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginVertical: 8,
      marginHorizontal: 16,
    };

    if (elevated) {
      baseStyles.shadowColor = theme.colors.shadow;
      baseStyles.shadowOffset = { width: 0, height: 8 };
      baseStyles.shadowOpacity = 0.12;
      baseStyles.shadowRadius = 16;
      baseStyles.elevation = 8;
    }

    return baseStyles;
  };

  return (
    <View style={[getCardStyles(), style]}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
  },
});

export default GradientCard;
