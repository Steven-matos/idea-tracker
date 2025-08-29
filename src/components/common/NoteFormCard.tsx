import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '../../contexts/theme.context';
import GradientCard from './Card';

interface NoteFormCardProps {
  /**
   * The label/title for the note
   */
  noteLabel: string;
  /**
   * Callback when the note label changes
   */
  onNoteLabelChange: (text: string) => void;
  /**
   * The text content of the note
   */
  textContent: string;
  /**
   * Callback when the text content changes
   */
  onTextContentChange: (text: string) => void;
  /**
   * Whether this is a text note type
   */
  isTextNote?: boolean;
  /**
   * Maximum length for the note label
   */
  maxLabelLength?: number;
  /**
   * Maximum length for the text content
   */
  maxContentLength?: number;
}

/**
 * Modern form card component that combines note label and content inputs
 * Provides a unified interface for creating and editing text-based notes
 */
export const NoteFormCard: React.FC<NoteFormCardProps> = ({
  noteLabel,
  onNoteLabelChange,
  textContent,
  onTextContentChange,
  isTextNote = true,
  maxLabelLength = 100,
  maxContentLength = 1000,
}) => {
  const { theme } = useTheme();

  return (
    <GradientCard variant="surface" elevated>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={[styles.headerIconText, { color: theme.colors.primary }]}>
              ✏️
            </Text>
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Note Details
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {isTextNote ? 'Text Note' : 'Voice Note'}
            </Text>
          </View>
        </View>

        {/* Label Input Section */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Title
          </Text>
          <TextInput
            style={[
              styles.labelInput,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
            placeholder="Give your note a title..."
            placeholderTextColor={theme.colors.textSecondary}
            value={noteLabel}
            onChangeText={onNoteLabelChange}
            maxLength={maxLabelLength}
            autoFocus={false}
          />
          <View style={styles.characterCountContainer}>
            <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
              {noteLabel.length}/{maxLabelLength}
            </Text>
          </View>
        </View>

        {/* Content Input Section - Only show for text notes */}
        {isTextNote && (
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Content
            </Text>
            <TextInput
              style={[
                styles.contentInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              placeholder="Write your thoughts here..."
              placeholderTextColor={theme.colors.textSecondary}
              value={textContent}
              onChangeText={onTextContentChange}
              multiline
              textAlignVertical="top"
              maxLength={maxContentLength}
            />
            <View style={styles.characterCountContainer}>
              <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
                {textContent.length}/{maxContentLength}
              </Text>
            </View>
          </View>
        )}

        {/* Visual Separator */}
        <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
      </View>
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerIconText: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  inputSection: {
    marginBottom: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  labelInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 40,
    fontWeight: '400',
  },
  contentInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 180,
    fontWeight: '400',
  },
  characterCountContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  separator: {
    height: 1,
    marginTop: 8,
    opacity: 0.3,
  },
});
