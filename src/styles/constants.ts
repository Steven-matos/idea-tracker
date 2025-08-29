/**
 * Shared style constants for consistent design across the application
 * Implements DRY principle by centralizing design tokens
 * Follows KISS principle with simple, focused constant definitions
 */

/**
 * Color constants for consistent theming
 */
export const Colors = {
  // Primary colors
  PRIMARY_BLUE: '#2563EB',
  PRIMARY_BLUE_DARK: '#1E40AF',
  PRIMARY_BLUE_LIGHT: '#3B82F6',
  
  // Secondary colors
  SECONDARY_YELLOW: '#FDE047',
  SECONDARY_YELLOW_DARK: '#CA8A04',
  
  // Accent colors
  ACCENT_PURPLE: '#8B5CF6',
  ACCENT_PURPLE_LIGHT: '#A78BFA',
  
  // Status colors
  SUCCESS_GREEN: '#10B981',
  SUCCESS_GREEN_BRIGHT: '#34D399',
  ERROR_RED: '#EF4444',
  ERROR_RED_LIGHT: '#F87171',
  WARNING_AMBER: '#F59E0B',
  WARNING_AMBER_BRIGHT: '#FBBF24',
  
  // Neutral colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_50: '#F9FAFB',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',
} as const;

/**
 * Predefined color options for categories and UI elements
 */
export const COLOR_OPTIONS = [
  Colors.ACCENT_PURPLE,    // Purple
  Colors.PRIMARY_BLUE,     // Blue  
  Colors.SUCCESS_GREEN,    // Green
  Colors.WARNING_AMBER,    // Orange
  Colors.ERROR_RED,        // Red
  '#8B5A2B',              // Brown
] as const;

/**
 * Typography constants
 */
export const Typography = {
  // Font sizes
  FONT_SIZE_XS: 12,
  FONT_SIZE_SM: 14,
  FONT_SIZE_BASE: 16,
  FONT_SIZE_LG: 18,
  FONT_SIZE_XL: 20,
  FONT_SIZE_2XL: 24,
  
  // Font weights
  FONT_WEIGHT_NORMAL: '400' as const,
  FONT_WEIGHT_MEDIUM: '500' as const,
  FONT_WEIGHT_SEMIBOLD: '600' as const,
  FONT_WEIGHT_BOLD: '700' as const,
  
  // Line heights
  LINE_HEIGHT_TIGHT: 20,
  LINE_HEIGHT_NORMAL: 22,
  LINE_HEIGHT_RELAXED: 24,
} as const;

/**
 * Spacing constants for consistent layout
 */
export const Spacing = {
  XS: 4,
  SM: 8,
  MD: 12,
  BASE: 16,
  LG: 20,
  XL: 24,
  XXL: 32,
  XXXL: 40,
  XXXXL: 48,
  XXXXXL: 60,
} as const;

/**
 * Border radius constants
 */
export const BorderRadius = {
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  FULL: 999,
} as const;

/**
 * Shadow constants
 */
export const Shadows = {
  SMALL: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  MEDIUM: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  LARGE: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

/**
 * Animation constants
 */
export const Animation = {
  DURATION_SHORT: 200,
  DURATION_MEDIUM: 300,
  DURATION_LONG: 500,
} as const;

/**
 * Layout constants
 */
export const Layout = {
  // Button heights
  BUTTON_HEIGHT_SM: 36,
  BUTTON_HEIGHT_MD: 48,
  BUTTON_HEIGHT_LG: 56,
  
  // FAB sizes
  FAB_SIZE_SM: 48,
  FAB_SIZE_MD: 56,
  FAB_SIZE_LG: 64,
  
  // Input heights
  INPUT_HEIGHT_SM: 40,
  INPUT_HEIGHT_MD: 48,
  INPUT_HEIGHT_LG: 56,
  
  // Header heights
  HEADER_HEIGHT: 100,
  STATUS_BAR_HEIGHT: 60,
} as const;
