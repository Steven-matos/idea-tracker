/**
 * Common components index file
 * Exports all reusable UI components with improved naming conventions
 * Implements SOLID principles by organizing components into focused modules
 */

// Core UI Components
export { default as Card } from './Card';
export { default as Button } from './Button';
export { default as Header } from './Header';
export { default as FloatingActionButton } from './FloatingActionButton';

// Form Components
export { default as SearchInput } from './SearchInput';
export { default as CategoryFilter } from './CategoryFilter';
export { default as ColorPicker } from './ColorPicker';

// Utility Components
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as EmptyState } from './EmptyState';
export { default as ActionButton } from './ActionButton';

// Specialized Components
export { default as ColorSlider } from './ColorSlider';

// Legacy exports for backward compatibility during transition
export { default as GradientCard } from './Card';
export { default as ProfessionalButton } from './Button';
export { default as ProfessionalHeader } from './Header';
export { default as ProfessionalFAB } from './FloatingActionButton';
export { default as ProfessionalSearchInput } from './SearchInput';
export { default as ProfessionalCategoryFilter } from './CategoryFilter';
export { default as LoadingScreen } from './LoadingSpinner';
export { default as ColorSpectrumSlider } from './ColorSlider';
