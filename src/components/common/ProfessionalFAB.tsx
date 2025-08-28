import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  Platform,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for ProfessionalFAB component
 */
interface ProfessionalFABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
}

/**
 * ProfessionalFAB component with modern solid color styling
 * Implements SOLID principles with single responsibility for floating action button
 * Follows DRY principle by centralizing FAB styling logic
 * Uses KISS principle with simple, focused component design
 */
const ProfessionalFAB: React.FC<ProfessionalFABProps> = ({
  icon,
  onPress,
  style,
  variant = 'primary',
  size = 'medium'
}) => {
  const { theme } = useTheme();

  /**
   * Get solid colors based on variant
   */
  const getFABColor = (): string => {
    switch (variant) {
      case 'primary':
        return '#2563EB'; // Professional blue (same as buttons)
      case 'secondary':
        return theme.isDark ? '#CA8A04' : '#FDE047'; // Dark yellow for dark mode, bright yellow for light mode
      case 'accent':
        return theme.colors.accent;
      default:
        return '#2563EB'; // Professional blue
    }
  };

  /**
   * Get FAB size based on size prop
   */
  const getFABSize = (): number => {
    switch (size) {
      case 'small':
        return 48;
      case 'large':
        return 64;
      default: // medium
        return 56;
    }
  };

  /**
   * Get icon size based on FAB size
   */
  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 28;
      default: // medium
        return 24;
    }
  };

  const fabSize = getFABSize();
  const iconSize = getIconSize();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { 
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          bottom: Platform.OS === 'ios' ? 40 : 30,
        },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { 
            borderRadius: fabSize / 2,
            backgroundColor: getFABColor()
          }
        ]}
      />
      
      <Ionicons 
        name={icon} 
        size={iconSize} 
        color="#FFFFFF" 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
});

export default ProfessionalFAB;
