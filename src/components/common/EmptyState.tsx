/**
 * Reusable EmptyState component for consistent empty state displays
 * Implements DRY principle by centralizing empty state UI logic
 * Follows SOLID principles with single responsibility for empty state presentation
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/theme.context';
import Button from './Button';
import { TextStyles, LayoutStyles, Spacing } from '../../styles';

/**
 * Props for EmptyState component
 */
interface EmptyStateProps {
  /** Icon to display */
  icon: keyof typeof Ionicons.glyphMap;
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Action button text (optional) */
  actionText?: string;
  /** Action button callback (optional) */
  onAction?: () => void;
  /** Action button variant */
  actionVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  /** Custom container style */
  style?: ViewStyle;
}

/**
 * EmptyState component with consistent styling and optional action button
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon="bulb-outline"
 *   title="No Notes Yet"
 *   subtitle="Start capturing your thoughts by creating your first note"
 *   actionText="Create Note"
 *   onAction={handleCreateNote}
 *   actionVariant="primary"
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionText,
  onAction,
  actionVariant = 'primary',
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, LayoutStyles.center, style]}>
      {/* Icon */}
      <Ionicons 
        name={icon} 
        size={64} 
        color={theme.colors.textSecondary} 
      />
      
      {/* Title */}
      <Text style={[
        styles.title, 
        TextStyles.h2,
        { color: theme.colors.text }
      ]}>
        {title}
      </Text>
      
      {/* Subtitle */}
      {subtitle && (
        <Text style={[
          styles.subtitle,
          TextStyles.body,
          { color: theme.colors.textSecondary }
        ]}>
          {subtitle}
        </Text>
      )}
      
      {/* Action Button */}
      {actionText && onAction && (
        <Button
          title={actionText}
          onPress={onAction}
          variant={actionVariant}
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.XXXL,
    paddingTop: Spacing.XXXXXL,
  },
  title: {
    marginTop: Spacing.BASE,
    marginBottom: Spacing.SM,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.XL,
  },
  actionButton: {
    minWidth: 140,
  },
});

export default EmptyState;
