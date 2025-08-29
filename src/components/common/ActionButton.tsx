/**
 * Reusable ActionButton component for consistent action button displays
 * Implements DRY principle by centralizing action button UI logic
 * Follows SOLID principles with single responsibility for action button presentation
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/theme.context';
import { TextStyles, Spacing } from '../../styles';

/**
 * Props for ActionButton component
 */
interface ActionButtonProps {
  /** Icon to display */
  icon: keyof typeof Ionicons.glyphMap;
  /** Button text */
  text: string;
  /** Button press callback */
  onPress: () => void;
  /** Icon and text color */
  color?: string;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Icon size */
  iconSize?: number;
}

/**
 * ActionButton component for consistent action button styling
 * Used in note items, category items, and other action contexts
 * 
 * @example
 * ```tsx
 * <ActionButton
 *   icon="create-outline"
 *   text="Edit"
 *   onPress={handleEdit}
 *   color={theme.colors.primary}
 * />
 * ```
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  text,
  onPress,
  color,
  style,
  textStyle,
  iconSize = 20,
}) => {
  const { theme } = useTheme();
  const buttonColor = color || theme.colors.primary;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon} 
        size={iconSize} 
        color={buttonColor} 
      />
      <Text style={[
        styles.text,
        TextStyles.captionMedium,
        { color: buttonColor },
        textStyle
      ]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  text: {
    // Additional text styles if needed
  },
});

export default ActionButton;
