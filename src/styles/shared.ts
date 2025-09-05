/**
 * Shared style utilities and mixins for consistent styling
 * Implements DRY principle by centralizing common style patterns
 * Follows SOLID principles with single responsibility for style utilities
 */

import { ViewStyle, TextStyle, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from './constants';

/**
 * Common button style variants
 * Centralizes button styling logic to avoid duplication
 */
export const ButtonStyles = {
  base: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    borderRadius: BorderRadius.MD,
  },
  
  sizes: {
    small: {
      paddingHorizontal: Spacing.BASE,
      paddingVertical: Spacing.SM,
      minHeight: 36,
    },
    medium: {
      paddingHorizontal: Spacing.XL,
      paddingVertical: Spacing.MD,
      minHeight: 48,
    },
    large: {
      paddingHorizontal: Spacing.XXL,
      paddingVertical: Spacing.BASE,
      minHeight: 56,
    },
  },
  
  variants: {
    primary: {
      backgroundColor: Colors.PRIMARY_BLUE,
    },
    secondary: (isDark: boolean) => ({
      backgroundColor: isDark ? Colors.SECONDARY_YELLOW_DARK : Colors.SECONDARY_YELLOW,
    }),
    destructive: {
      backgroundColor: Colors.ERROR_RED,
    },
    success: {
      backgroundColor: Colors.SUCCESS_GREEN,
    },
    outline: (borderColor: string) => ({
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor,
    }),
    ghost: {
      backgroundColor: 'transparent',
    },
  },
} as const;

/**
 * Common text style variants
 * Centralizes typography styling to ensure consistency
 */
export const TextStyles = {
  // Headings
  h1: {
    fontSize: Typography.FONT_SIZE_2XL,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
    lineHeight: 32,
  } as TextStyle,
  
  h2: {
    fontSize: Typography.FONT_SIZE_XL,
    fontWeight: Typography.FONT_WEIGHT_SEMIBOLD,
    lineHeight: 28,
  } as TextStyle,
  
  h3: {
    fontSize: Typography.FONT_SIZE_LG,
    fontWeight: Typography.FONT_WEIGHT_SEMIBOLD,
    lineHeight: Typography.LINE_HEIGHT_RELAXED,
  } as TextStyle,
  
  // Body text
  body: {
    fontSize: Typography.FONT_SIZE_BASE,
    fontWeight: Typography.FONT_WEIGHT_NORMAL,
    lineHeight: Typography.LINE_HEIGHT_NORMAL,
  } as TextStyle,
  
  bodyMedium: {
    fontSize: Typography.FONT_SIZE_BASE,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    lineHeight: Typography.LINE_HEIGHT_NORMAL,
  } as TextStyle,
  
  // Small text
  caption: {
    fontSize: Typography.FONT_SIZE_SM,
    fontWeight: Typography.FONT_WEIGHT_NORMAL,
    lineHeight: Typography.LINE_HEIGHT_TIGHT,
  } as TextStyle,
  
  captionMedium: {
    fontSize: Typography.FONT_SIZE_SM,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    lineHeight: Typography.LINE_HEIGHT_TIGHT,
  } as TextStyle,
  
  // Labels
  label: {
    fontSize: Typography.FONT_SIZE_XS,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    lineHeight: Typography.LINE_HEIGHT_TIGHT,
  } as TextStyle,
};

/**
 * Common card style variants
 * Provides consistent card styling across components
 */
export const CardStyles = {
  base: {
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginVertical: Spacing.SM,
    marginHorizontal: Spacing.BASE,
  } as ViewStyle,
  
  elevated: {
    ...Shadows.MEDIUM,
  } as ViewStyle,
  
  surface: (backgroundColor: string) => ({
    backgroundColor,
  }),
};

/**
 * Common input style variants
 * Centralizes form input styling
 */
export const InputStyles = {
  base: {
    borderRadius: BorderRadius.MD,
    padding: Spacing.BASE,
    fontSize: Typography.FONT_SIZE_BASE,
    borderWidth: 1,
    ...Shadows.SMALL,
  } as ViewStyle & TextStyle,
  
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top' as const,
  } as ViewStyle & TextStyle,
};

/**
 * Common layout utilities
 * Provides flexible layout patterns
 */
export const LayoutStyles = {
  // Flex patterns
  flex1: { flex: 1 } as ViewStyle,
  flexRow: { flexDirection: 'row' as const } as ViewStyle,
  flexColumn: { flexDirection: 'column' as const } as ViewStyle,
  
  // Alignment
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  
  centerHorizontal: {
    alignItems: 'center' as const,
  } as ViewStyle,
  
  centerVertical: {
    justifyContent: 'center' as const,
  } as ViewStyle,
  
  spaceBetween: {
    justifyContent: 'space-between' as const,
  } as ViewStyle,
  
  spaceAround: {
    justifyContent: 'space-around' as const,
  } as ViewStyle,
  
  // Positioning
  absolute: { position: 'absolute' as const } as ViewStyle,
  relative: { position: 'relative' as const } as ViewStyle,
  
  // Common padding/margin patterns
  padding: {
    xs: { padding: Spacing.XS } as ViewStyle,
    sm: { padding: Spacing.SM } as ViewStyle,
    md: { padding: Spacing.MD } as ViewStyle,
    base: { padding: Spacing.BASE } as ViewStyle,
    lg: { padding: Spacing.LG } as ViewStyle,
    xl: { padding: Spacing.XL } as ViewStyle,
  },
  
  margin: {
    xs: { margin: Spacing.XS } as ViewStyle,
    sm: { margin: Spacing.SM } as ViewStyle,
    md: { margin: Spacing.MD } as ViewStyle,
    base: { margin: Spacing.BASE } as ViewStyle,
    lg: { margin: Spacing.LG } as ViewStyle,
    xl: { margin: Spacing.XL } as ViewStyle,
  },
};

/**
 * Platform-specific styles
 * Handles platform differences consistently
 */
export const PlatformStyles = {
  statusBarHeight: Platform.OS === 'ios' ? 60 : 20,
  
  shadow: Shadows.MEDIUM,
  
  headerPadding: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  } as ViewStyle,
};

/**
 * Common animation styles
 * Provides consistent animation patterns
 */
export const AnimationStyles = {
  fadeIn: {
    opacity: 1,
  },
  
  fadeOut: {
    opacity: 0,
  },
  
  scale: {
    transform: [{ scale: 1.05 }],
  },
};

/**
 * Utility functions for dynamic styles
 */

/**
 * Creates a style object with theme-aware colors
 * @param lightColor - Color for light theme
 * @param darkColor - Color for dark theme
 * @param isDark - Whether dark theme is active
 * @returns Style object with appropriate color
 */
export const createThemeAwareStyle = (
  lightColor: string,
  darkColor: string,
  isDark: boolean
) => ({
  color: isDark ? darkColor : lightColor,
});

/**
 * Creates a style object with conditional properties
 * @param condition - Boolean condition
 * @param trueStyle - Style when condition is true
 * @param falseStyle - Style when condition is false (optional)
 * @returns Conditional style object
 */
export const createConditionalStyle = <T extends ViewStyle | TextStyle>(
  condition: boolean,
  trueStyle: T,
  falseStyle?: T
): T | {} => {
  return condition ? trueStyle : (falseStyle || {});
};

/**
 * Merges multiple style objects safely
 * @param styles - Array of style objects
 * @returns Merged style object
 */
export const mergeStyles = <T extends ViewStyle | TextStyle>(...styles: (T | undefined)[]): T => {
  return Object.assign({}, ...styles.filter(Boolean)) as T;
};
