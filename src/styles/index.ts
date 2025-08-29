/**
 * Centralized styles export
 * Provides a single entry point for all style-related utilities
 * Implements SOLID principles by organizing styles into focused modules
 */

export * from './constants';
export * from './shared';

// Re-export commonly used style utilities for convenience
export {
  Colors,
  COLOR_OPTIONS,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
  Layout,
} from './constants';

export {
  ButtonStyles,
  TextStyles,
  CardStyles,
  InputStyles,
  LayoutStyles,
  PlatformStyles,
  AnimationStyles,
  createThemeAwareStyle,
  createConditionalStyle,
  mergeStyles,
} from './shared';
