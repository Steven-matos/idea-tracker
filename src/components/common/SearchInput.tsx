import React from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  TextInputProps 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/theme.context';

/**
 * Props for ProfessionalSearchInput component
 */
interface ProfessionalSearchInputProps extends TextInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'surface';
}

/**
 * ProfessionalSearchInput component with modern solid color styling
 * Implements SOLID principles with single responsibility for search input
 * Follows DRY principle by centralizing search input styling logic
 * Uses KISS principle with simple, focused component design
 */
const ProfessionalSearchInput: React.FC<ProfessionalSearchInputProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  style,
  variant = 'surface',
  ...textInputProps
}) => {
  const { theme } = useTheme();

  /**
   * Get solid colors based on variant
   */
  const getSearchColor = (): string => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.isDark ? '#CA8A04' : '#FDE047'; // Dark yellow for dark mode, bright yellow for light mode
      case 'surface':
        return theme.colors.surface;
      default:
        return theme.colors.surface;
    }
  };

  /**
   * Get border color based on variant
   */
  const getBorderColor = (): string => {
    return variant === 'surface' ? theme.colors.border : 'rgba(255, 255, 255, 0.3)';
  };

  /**
   * Get icon color based on variant
   */
  const getIconColor = (): string => {
    return variant === 'surface' ? theme.colors.textSecondary : 'rgba(255, 255, 255, 0.8)';
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.gradient, 
          { 
            backgroundColor: getSearchColor(),
            borderColor: getBorderColor() 
          }
        ]}
      >
        <View style={styles.inputContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={getIconColor()} 
            style={styles.searchIcon}
          />
          
          <TextInput
            style={[
              styles.input,
              { 
                color: variant === 'surface' ? theme.colors.text : '#FFFFFF'
              }
            ]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor={variant === 'surface' ? theme.colors.textSecondary : 'rgba(255, 255, 255, 0.7)'}
            {...textInputProps}
          />
          
          {value.length > 0 && onClear && (
            <TouchableOpacity onPress={onClear} style={styles.clearButton}>
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={getIconColor()} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  gradient: {
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 12,
    padding: 4,
  },
});

export default ProfessionalSearchInput;
