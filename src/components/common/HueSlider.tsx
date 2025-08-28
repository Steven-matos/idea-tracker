import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * HueSlider
 * A horizontal rainbow gradient slider with a draggable thumb that outputs a hex color.
 */
type HueSliderProps = {
  width?: number;
  height?: number;
  thumbSize?: number;
  initialHue?: number;
  onChange: (hex: string) => void;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const hsvToHex = (h: number, s = 100, v = 100) => {
  const c = (v / 100) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v / 100 - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const HueSlider: React.FC<HueSliderProps> = ({
  width = 280,
  height = 20,
  thumbSize = 32,
  initialHue = 270, // near purple
  onChange,
}) => {
  const usable = width - thumbSize;
  const initialX = (clamp(initialHue, 0, 360) / 360) * usable;
  const translateX = useRef(new Animated.Value(initialX)).current;

  const gradientStops = useMemo(() => {
    const stops: string[] = [];
    for (let h = 0; h <= 360; h += 12) stops.push(hsvToHex(h));
    return stops;
  }, []);

  const handleGesture = (event: PanGestureHandlerGestureEvent) => {
    const { x } = event.nativeEvent;
    const rel = clamp(x - thumbSize / 2, 0, usable);
    
    // Update the animated value smoothly
    Animated.timing(translateX, {
      toValue: rel,
      duration: 0, // Immediate update for smooth dragging
      useNativeDriver: false,
    }).start();
    
    const hue = (rel / usable) * 360;
    onChange(hsvToHex(hue));
  };

  return (
    <View style={[styles.root, { width, height: Math.max(height, thumbSize) }]}>
      <View style={[styles.track, { width, height, borderRadius: height / 2 }]}>
        <LinearGradient
          colors={gradientStops}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
        />
      </View>

      <PanGestureHandler onGestureEvent={handleGesture}>
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              transform: [{ translateX }],
            },
          ]}
        >
          <View
            style={{
              width: thumbSize * 0.55,
              height: thumbSize * 0.55,
              borderRadius: (thumbSize * 0.55) / 2,
              backgroundColor: '#fff',
              borderWidth: 2,
              borderColor: '#eee',
            }}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { justifyContent: 'center', alignItems: 'flex-start' },
  track: { overflow: 'hidden', backgroundColor: '#d1d5db' },
  thumb: {
    position: 'absolute',
    top: -6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default HueSlider;


