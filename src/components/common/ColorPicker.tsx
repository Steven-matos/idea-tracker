/**
 * Reusable ColorPicker component for consistent color selection
 * Implements DRY principle by centralizing color picker logic
 * Follows SOLID principles with single responsibility for color selection
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/theme.context';
import { COLOR_OPTIONS, TextStyles, Spacing, BorderRadius, Shadows } from '../../styles';

/**
 * Props for ColorPicker component
 */
interface ColorPickerProps {
  /** Currently selected color */
  selectedColor: string;
  /** Callback when color is selected */
  onColorSelect: (color: string) => void;
  /** Available color options (defaults to COLOR_OPTIONS) */
  colors?: readonly string[];
  /** Label text (optional) */
  label?: string;
  /** Custom container style */
  style?: ViewStyle;
}

/**
 * ColorPicker component with predefined color options
 * Used in category creation, note creation, and other color selection contexts
 * 
 * @example
 * ```tsx
 * <ColorPicker
 *   label="Choose Color"
 *   selectedColor={selectedColor}
 *   onColorSelect={setSelectedColor}
 * />
 * ```
 */
const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  colors = COLOR_OPTIONS,
  label,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <Text style={[
          styles.label,
          TextStyles.bodyMedium,
          { color: theme.colors.text }
        ]}>
          {label}
        </Text>
      )}
      
      {/* Color Grid */}
      <View style={styles.colorGrid}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColorOption
            ]}
            onPress={() => onColorSelect(color)}
            activeOpacity={0.8}
          >
            {selectedColor === color && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styles handled by parent
  },
  label: {
    marginBottom: Spacing.MD,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.MD,
    marginTop: Spacing.SM,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.FULL,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.SMALL,
  },
  selectedColorOption: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    ...Shadows.MEDIUM,
  },
});

export default ColorPicker;
