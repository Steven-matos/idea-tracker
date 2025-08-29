import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme.context';
import GradientCard from './Card';
import { formatDuration } from '../../utils';

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
  /**
   * Voice recording related props
   */
  noteType?: 'text' | 'voice';
  isRecording?: boolean;
  isPlaying?: boolean;
  recordedUri?: string | null;
  recordingDeleted?: boolean;
  recordingDuration?: number;
  playbackPosition?: number;
  playbackDuration?: number;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onPlayRecording?: () => void;
  onStopPlayback?: () => void;
  onDeleteRecording?: () => void;
  pulseAnim?: any;
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
  noteType = 'text',
  isRecording = false,
  isPlaying = false,
  recordedUri = null,
  recordingDeleted = false,
  recordingDuration = 0,
  playbackPosition = 0,
  playbackDuration = 0,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onStopPlayback,
  onDeleteRecording,
  pulseAnim,
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

        {/* Voice Recording Section - Only show for voice notes */}
        {noteType === 'voice' && (
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Voice Recording
            </Text>
            
            {/* Recording Controls */}
            <View style={styles.recordingControls}>
              {/* Show record button when no recording exists and not currently recording */}
              {(!recordedUri || recordingDeleted) && !isRecording && (
                <TouchableOpacity
                  style={[styles.recordButton, { 
                    backgroundColor: theme.colors.secondaryLight,
                    borderColor: theme.colors.secondary
                  }]}
                  onPress={onStartRecording}
                >
                  <Ionicons name="mic" size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
              )}

              {/* Show stop button when recording */}
              {isRecording && (
                <TouchableOpacity
                  style={[styles.stopButton, { 
                    backgroundColor: theme.colors.error,
                    borderColor: theme.colors.error
                  }]}
                  onPress={onStopRecording}
                >
                  <Ionicons name="stop" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}

              {/* Show playback controls when we have a recording and not currently recording */}
              {recordedUri && !isRecording && (
                <View style={styles.recordingPlaybackControls}>
                  {/* Play/Stop button */}
                  <TouchableOpacity
                    style={[
                      isPlaying ? styles.stopButton : styles.playButton,
                      { 
                        backgroundColor: isPlaying ? theme.colors.error : theme.colors.success,
                        borderColor: isPlaying ? theme.colors.error : theme.colors.success
                      }
                    ]}
                    onPress={isPlaying ? onStopPlayback : onPlayRecording}
                  >
                    <Ionicons
                      name={isPlaying ? "stop" : "play"}
                      size={24}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>

                  {/* Action buttons row - only show when not playing */}
                  {!isPlaying && (
                    <View style={styles.recordingActionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, { 
                          backgroundColor: 'transparent',
                          borderColor: theme.colors.primary
                        }]}
                        onPress={onStartRecording}
                      >
                        <Ionicons name="mic" size={18} color={theme.colors.primary} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                          Re-record
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, { 
                          backgroundColor: 'transparent',
                          borderColor: theme.colors.error
                        }]}
                        onPress={onDeleteRecording}
                      >
                        <Ionicons name="trash" size={18} color={theme.colors.error} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Recording Status */}
            {isRecording && (
              <View style={styles.recordingStatus}>
                <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={[styles.recordingDot, { backgroundColor: theme.colors.error }]} />
                </Animated.View>
                <Text style={[styles.recordingText, { color: theme.colors.error }]}>
                  Recording... {formatDuration(recordingDuration)}
                </Text>
              </View>
            )}

            {/* Playback Status */}
            {isPlaying && (
              <View style={styles.recordingStatus}>
                <View style={styles.recordingIndicator}>
                  <View style={[styles.recordingDot, { backgroundColor: theme.colors.success }]} />
                </View>
                <Text style={[styles.recordingText, { color: theme.colors.success }]}>
                  Playing... {formatDuration(playbackPosition)} / {formatDuration(playbackDuration)}
                </Text>
              </View>
            )}

            {/* Recording Duration */}
            {recordedUri && !isRecording && !isPlaying && (
              <Text style={[styles.durationText, { color: theme.colors.textSecondary }]}>
                Duration: {formatDuration(recordingDuration)}
              </Text>
            )}
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
  // Voice recording styles
  recordingControls: {
    alignItems: 'center',
    marginVertical: 16,
  },
  recordingPlaybackControls: {
    alignItems: 'center',
    gap: 16,
  },
  recordingActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  durationText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});
