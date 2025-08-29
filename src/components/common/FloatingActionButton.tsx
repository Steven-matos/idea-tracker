import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  Platform,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/theme.context';
import { Colors, Layout, Shadows, PlatformStyles } from '../../styles';

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
   * Uses shared color constants for consistency
   */
  const getFABColor = (): string => {
    switch (variant) {
      case 'primary':
        return Colors.PRIMARY_BLUE;
      case 'secondary':
        return theme.isDark ? Colors.SECONDARY_YELLOW_DARK : Colors.SECONDARY_YELLOW;
      case 'accent':
        return theme.colors.accent;
      default:
        return Colors.PRIMARY_BLUE;
    }
  };

  /**
   * Get FAB size based on size prop
   * Uses shared layout constants
   */
  const getFABSize = (): number => {
    const sizes = {
      small: Layout.FAB_SIZE_SM,
      medium: Layout.FAB_SIZE_MD,
      large: Layout.FAB_SIZE_LG,
    };
    return sizes[size];
  };

  /**
   * Get icon size based on FAB size
   */
  const getIconSize = (): number => {
    const iconSizes = {
      small: 20,
      medium: 24,
      large: 28,
    };
    return iconSizes[size];
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
        color={Colors.WHITE} 
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
    ...Shadows.LARGE,
  },
});

export default ProfessionalFAB;
