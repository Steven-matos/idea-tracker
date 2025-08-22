import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
 * ProfessionalFAB component with modern gradient styling
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
   * Get gradient colors based on variant
   */
  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'primary':
        return [theme.colors.primary, theme.colors.primaryDark];
      case 'secondary':
        return [theme.colors.secondary, theme.colors.secondaryDark];
      case 'accent':
        return [theme.colors.accent, theme.colors.accentLight];
      default:
        return [theme.colors.primary, theme.colors.primaryDark];
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
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: fabSize / 2 }
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
