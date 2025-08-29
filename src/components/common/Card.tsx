import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/theme.context';
import { CardStyles, Colors, mergeStyles } from '../../styles';

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
        return theme.isDark ? Colors.SECONDARY_YELLOW_DARK : Colors.SECONDARY_YELLOW;
      case 'accent':
        return theme.colors.accent;
      case 'surface':
      default:
        return elevated ? theme.colors.surfaceElevated : theme.colors.surface;
    }
  };

  /**
   * Get card styles based on variant and elevation
   * Uses shared style constants for consistency
   */
  const getCardStyles = (): ViewStyle => {
    const baseStyles = { ...CardStyles.base };
    const elevatedStyles = elevated ? CardStyles.elevated : {};
    const surfaceStyles = CardStyles.surface(theme.colors.surface);

    return mergeStyles(baseStyles, surfaceStyles, elevatedStyles);
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
    // Note: This component maintains its existing structure
    // The gradient styling is preserved for visual consistency
  },
});

export default GradientCard;
