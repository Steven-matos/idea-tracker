import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ColorSpectrumSlider } from './index';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ColorPickerDemo component showcasing ColorSpectrumSlider usage
 * Implements SOLID principles with single responsibility for demonstration
 * Follows DRY principle by reusing existing components
 * Uses KISS principle with simple demo layout
 */
const ColorPickerDemo: React.FC = () => {
  const { theme } = useTheme();
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');

  /**
   * Handle color change from the slider
   * @param color - New hex color value
   */
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    console.log('Selected color:', color);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Custom Color Picker
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Drag the circular selector to choose your color
      </Text>

      {/* Color Spectrum Slider */}
      <View style={styles.sliderContainer}>
        <ColorSpectrumSlider
          initialColor={selectedColor}
          onColorChange={handleColorChange}
          width={300}
          height={24}
          selectorSize={36}
        />
      </View>

      {/* Color Preview */}
      <View style={styles.previewContainer}>
        <Text style={[styles.previewLabel, { color: theme.colors.text }]}>
          Selected Color:
        </Text>
        <View style={styles.colorPreview}>
          <View 
            style={[
              styles.colorSwatch, 
              { backgroundColor: selectedColor }
            ]} 
          />
          <Text style={[styles.colorValue, { color: theme.colors.text }]}>
            {selectedColor}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  sliderContainer: {
    marginBottom: 32,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  colorValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});

export default ColorPickerDemo;
