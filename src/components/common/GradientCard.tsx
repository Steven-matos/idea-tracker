import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
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
 * Implements SOLID principles with single responsibility for card styling
 * Follows DRY principle by centralizing card logic
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
   * Get solid colors based on variant and theme
   */
  const getCardColor = (): string => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.isDark ? '#CA8A04' : '#FDE047'; // Dark yellow for dark mode, bright yellow for light mode
      case 'accent':
        return theme.colors.accent;
      case 'surface':
      default:
        return elevated ? theme.colors.surfaceElevated : theme.colors.surface;
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
      <View
        style={[
          styles.gradient,
          { backgroundColor: getCardColor() }
        ]}
      >
        {children}
      </View>
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
