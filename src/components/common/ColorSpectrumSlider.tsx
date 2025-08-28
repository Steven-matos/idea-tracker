import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for ColorSpectrumSlider component
 */
interface ColorSpectrumSliderProps {
  /** Initial color value in hex format */
  initialColor?: string;
  /** Callback function when color changes */
  onColorChange: (color: string) => void;
  /** Width of the slider (defaults to screen width minus 32) */
  width?: number;
  /** Height of the slider bar */
  height?: number;
  /** Size of the circular selector */
  selectorSize?: number;
  /** Custom style for the container */
  style?: any;
}

/**
 * ColorSpectrumSlider component with horizontal gradient spectrum
 * Implements SOLID principles with single responsibility for color selection
 * Follows DRY principle by centralizing color calculation logic
 * Uses KISS principle with simple, focused slider design
 */
const ColorSpectrumSlider: React.FC<ColorSpectrumSliderProps> = ({
  initialColor = '#8B5CF6',
  onColorChange,
  width = Dimensions.get('window').width - 32,
  height = 20,
  selectorSize = 32,
  style
}) => {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const [currentColor, setCurrentColor] = useState(initialColor);
  const [containerLayout, setContainerLayout] = useState({ x: 0, y: 0 });

  /**
   * Convert HSV to RGB color values
   * @param h - Hue (0-360)
   * @param s - Saturation (0-100)
   * @param v - Value (0-100)
   * @returns RGB object with values 0-255
   */
  const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
    const c = (v / 100) * (s / 100);
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = (v / 100) - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  /**
   * Convert RGB to hex color string
   * @param r - Red value (0-255)
   * @param g - Green value (0-255)
   * @param b - Blue value (0-255)
   * @returns Hex color string
   */
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  /**
   * Get color at specific position on the slider
   * @param position - Position from 0 to 1
   * @returns Hex color string
   */
  const getColorAtPosition = (position: number): string => {
    const hue = position * 360;
    const rgb = hsvToRgb(hue, 100, 100);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };

  /**
   * Handle pan gesture for color selection
   * @param event - Pan gesture event
   */
  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { absoluteX } = event.nativeEvent;
    
    // Calculate position relative to the container
    const relativeX = absoluteX - containerLayout.x;
    
    // Clamp the position within the slider bounds
    const newPosition = Math.max(0, Math.min(width - selectorSize, relativeX));
    
    translateX.setValue(newPosition);
    
    const positionRatio = newPosition / (width - selectorSize);
    const newColor = getColorAtPosition(positionRatio);
    
    setCurrentColor(newColor);
    onColorChange(newColor);
  };

  /**
   * Set initial position based on initial color
   */
  useEffect(() => {
    // Simple approximation for initial position based on color
    // This could be improved with more sophisticated color analysis
    const initialPosition = (width - selectorSize) * 0.75; // Default to purple area
    translateX.setValue(initialPosition);
  }, [width, selectorSize]);

  /**
   * Generate gradient colors for the spectrum
   */
  const gradientColors = [
    '#FF0000', // Red
    '#FF8000', // Orange
    '#FFFF00', // Yellow
    '#80FF00', // Lime
    '#00FF00', // Green
    '#00FF80', // Cyan
    '#0080FF', // Blue
    '#8000FF', // Purple
    '#FF00FF', // Magenta
  ];

  return (
    <View 
      style={[styles.container, { width }, style]}
      onLayout={(event) => {
        const { x, y } = event.nativeEvent.layout;
        setContainerLayout({ x, y });
      }}
    >
      {/* Color Spectrum Bar */}
      <View style={[styles.spectrumBar, { height }]}>
        <View style={styles.gradientContainer}>
          {gradientColors.map((color, index) => (
            <View
              key={index}
              style={[
                styles.gradientSegment,
                {
                  backgroundColor: color,
                  width: `${100 / gradientColors.length}%`,
                }
              ]}
            />
          ))}
        </View>
      </View>

      {/* Circular Selector */}
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <Animated.View
          style={[
            styles.selector,
            {
              width: selectorSize,
              height: selectorSize,
              borderRadius: selectorSize / 2,
              transform: [{ translateX }],
              backgroundColor: currentColor,
            }
          ]}
        >
          <View style={styles.selectorRing} />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  spectrumBar: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  gradientSegment: {
    height: '100%',
  },
  selector: {
    position: 'absolute',
    top: -6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectorRing: {
    width: '80%',
    height: '80%',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default ColorSpectrumSlider;
