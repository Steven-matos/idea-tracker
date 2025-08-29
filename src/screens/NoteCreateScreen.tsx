import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  createAudioPlayer,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';

// Import type definitions for notes, categories, and navigation
import type { Note, Category, NoteType, RootStackParamList } from '../types';

// Import storage service for persistent data operations
import { storageService } from '../services';

// Import utility functions for ID generation, duration formatting, string validation, and iOS recording options
import { generateId, formatDuration, isValidString, getIOSRecordingOptions } from '../utils';

// Import custom theme context hook for theming
import { useTheme } from '../contexts/theme.context';

// Import common UI components
import { GradientCard, ProfessionalButton, ColorPicker, NoteFormCard } from '../components/common';
import { Spacing, TextStyles, Colors, InputStyles } from '../styles';

type CreateNoteScreenNavigationProp = any;
type CreateNoteScreenRouteProp = RouteProp<RootStackParamList, 'CreateNote'>;

/**
 * Screen for creating new notes (text or voice)
 */
const CreateNoteScreen: React.FC = () => {
  const navigation = useNavigation<CreateNoteScreenNavigationProp>();
  const route = useRoute<CreateNoteScreenRouteProp>();
  const { theme } = useTheme();

  // State management
  const [noteType, setNoteType] = useState<NoteType>('text');
  const [noteLabel, setNoteLabel] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(route.params?.categoryId || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Voice recording state using expo-audio hooks
  // Use iOS-specific recording options based on audio quality setting when on iOS
  const recordingOptions = Platform.OS === 'ios'
    ? getIOSRecordingOptions(audioQuality)
    : RecordingPresets.HIGH_QUALITY;

  const audioRecorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder, 100);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [durationInterval, setDurationInterval] = useState<NodeJS.Timeout | null>(null);
  const [playbackObject, setPlaybackObject] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDeleted, setRecordingDeleted] = useState(false);
  const [isNewSession, setIsNewSession] = useState(true);
  const [playbackCheckInterval, setPlaybackCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Get recording state from hook
  const isRecording = recorderState.isRecording;
  const recordedUri = (recordingDeleted || isNewSession) ? null : audioRecorder.uri;
  const canRecord = recorderState.canRecord;



  // Animation
  const pulseAnim = useState(new Animated.Value(1))[0];

  /**
   * Load categories from storage
   */
  const loadCategories = async () => {
    try {
      const categoriesData = await storageService.getCategories();
      setCategories(categoriesData);

      // Set default category if none selected
      if (!selectedCategoryId && categoriesData.length > 0) {
        setSelectedCategoryId(categoriesData[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories.');
    }
  };

  /**
   * Load app settings from storage to get audio quality preference
   */
  const loadAppSettings = async () => {
    try {
      const settings = await storageService.getSettings();
      setAudioQuality(settings.audioQuality);
    } catch (error) {
      console.error('Error loading app settings:', error);
      // Continue with default audio quality if loading fails
    }
  };



  /**
   * Request audio permissions and setup audio mode
   */
  const setupAudio = async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();

      if (!status.granted) {
        Alert.alert('Permission Required', 'Microphone access is required to record voice notes.');
        return false;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      return true;
    } catch (error) {
      console.error('Error setting up audio:', error);
      return false;
    }
  };

  /**
   * Configure audio mode for speaker playback
   */
  const configureAudioForPlayback = async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        // On Android, setting playThroughEarpiece to false routes audio to speaker
        // On iOS, audio typically plays through speaker by default
        ...(Platform.OS === 'android' && { playThroughEarpiece: false })
      });
    } catch (error) {
      console.error('Error configuring audio for playback:', error);
    }
  };

  /**
   * Clear/reset recording state for a new recording
   */
  const clearRecording = (resetDuration = true) => {
    if (resetDuration) {
      setRecordingDuration(0);
    }
    setRecordingDeleted(false); // Reset deleted state when starting new recording
    setIsPlaying(false); // Ensure playing state is cleared
    setIsNewSession(true); // Mark as new session to ignore persisted URI
    setPlaybackPosition(0);
    setPlaybackDuration(0);
    if (durationInterval) {
      clearInterval(durationInterval);
      setDurationInterval(null);
    }
    if (playbackCheckInterval) {
      clearInterval(playbackCheckInterval);
      setPlaybackCheckInterval(null);
    }
    if (playbackObject) {
      playbackObject.pause();
      setPlaybackObject(null);
    }
  };

  /**
   * Check if audio playback has finished using simple timer
   */
  const checkPlaybackStatus = () => {
    if (playbackObject && isPlaying) {
      try {
        // Simple approach: increment playback position and check against recorded duration
        setPlaybackPosition(prev => {
          const newPosition = prev + 0.5; // Increment by 0.5 seconds (500ms interval)

          // Check if we've reached the recorded duration with a small buffer to prevent premature stopping
          // Add 0.3 second buffer to account for timing discrepancies between our timer and actual audio playback
          if (recordingDuration > 0 && newPosition >= (recordingDuration + 0.6)) {
            // Audio has finished playing - useEffect will handle clearing interval
            setIsPlaying(false);
            return 0; // Reset position
          }

          return newPosition;
        });

        // Set playback duration to recording duration if not set
        if (playbackDuration === 0 && recordingDuration > 0) {
          setPlaybackDuration(recordingDuration);
        }
      } catch (error) {
        console.error('Error checking playback status:', error);
        // Fallback: just check if still playing
        if (playbackObject && !playbackObject.playing) {
          setIsPlaying(false);
          setPlaybackPosition(0);
          // useEffect will handle clearing interval
        }
      }
    }
  };

  /**
   * Start voice recording using expo-audio hooks
   */
  const startRecording = async () => {
    try {
      const hasPermission = await setupAudio();
      if (!hasPermission) return;

      // Stop any active playback first
      if (isPlaying) {
        await stopPlayback();
      }

      // Clear previous recording state
      clearRecording();

      // Prepare and start recording
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      // Mark that we're no longer in a new session
      setIsNewSession(false);

      // Start duration timer
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setDurationInterval(interval);

      // Start pulse animation
      startPulseAnimation();

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Stop voice recording using expo-audio hooks
   */
  const stopRecording = async () => {
    try {
      if (!isRecording) return;

      // Stop recording - the recording will be available on audioRecorder.uri
      await audioRecorder.stop();

      // Stop duration timer
      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }

      // Stop pulse animation
      stopPulseAnimation();

    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  /**
   * Delete current recording and reset to initial state
   */
  const deleteRecording = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Stop any playback
            if (isPlaying) {
              stopPlayback();
            }

            // Clear the recording state and mark as deleted
            clearRecording();
            setRecordingDeleted(true);
          },
        },
      ]
    );
  };

  /**
   * Play recorded audio using expo-audio
   */
  const playRecording = async () => {
    try {
      if (!recordedUri) return;

      // Stop any existing playback
      if (playbackObject) {
        playbackObject.pause();
        setPlaybackObject(null);
      }

      // Configure audio mode for speaker playback
      await configureAudioForPlayback();

      // Create and play audio using createAudioPlayer
      const player = createAudioPlayer({ uri: recordedUri });
      player.play();

      // Set all states at once - useEffect will handle starting the interval
      setPlaybackObject(player);
      setIsPlaying(true);
      setPlaybackPosition(0);
      setPlaybackDuration(recordingDuration);

    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  /**
   * Stop audio playback
   */
  const stopPlayback = async () => {
    try {
      if (playbackObject) {
        playbackObject.pause();
        setPlaybackObject(null);
      }
      setIsPlaying(false);
      setPlaybackPosition(0); // Reset playback position
      // useEffect will handle clearing the interval when isPlaying becomes false
    } catch (error) {
      console.error('Error stopping playback:', error);
      setIsPlaying(false); // Ensure playing state is cleared even on error
      setPlaybackPosition(0);
    }
  };

  /**
   * Start pulse animation for recording
   */
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * Stop pulse animation
   */
  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  /**
   * Save the note
   */
  const saveNote = async () => {
    try {
      // Validation
      if (!noteLabel.trim()) {
        Alert.alert('Error', 'Please enter a label for your note.');
        return;
      }

      if (noteType === 'text' && !isValidString(textContent)) {
        Alert.alert('Error', 'Please enter some text for your note.');
        return;
      }

      if (!selectedCategoryId) {
        Alert.alert('Error', 'Please select a category for your note.');
        return;
      }

      setIsLoading(true);

      let audioPath: string | undefined;
      let audioDuration: number | undefined;

      // Handle voice recording
      if (noteType === 'voice' && recordedUri) {
        // Create recordings directory if it doesn't exist
        const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
        const dirInfo = await FileSystem.getInfoAsync(recordingsDir);

        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
        }

        // Move recording to permanent location
        const fileName = `${generateId()}.m4a`;
        const finalPath = `${recordingsDir}${fileName}`;

        await FileSystem.moveAsync({
          from: recordedUri,
          to: finalPath,
        });

        audioPath = finalPath;
        audioDuration = recordingDuration;
      }

      // Create note object
      const newNote: Note = {
        id: generateId(),
        type: noteType,
        label: noteLabel.trim(),
        content: noteType === 'text' ? textContent.trim() : `Voice note (${formatDuration(recordingDuration)})`,
        audioPath,
        audioDuration,
        categoryId: selectedCategoryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
      };

      // Save to storage
      await storageService.addNote(newNote);

      // Navigate back
      navigation.goBack();

    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancel and go back
   */
  const handleCancel = () => {
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Stop playback if active
    if (playbackObject) {
      stopPlayback();
    }

    navigation.goBack();
  };

  // Load categories and settings on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        loadCategories(),
        loadAppSettings(),
      ]);
    };

    loadInitialData();
  }, []);

  // Refresh categories when screen comes into focus (e.g., after creating a new category)
  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
    }, [])
  );

  // Setup audio permissions on mount
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  // Initialize recording state
  useEffect(() => {
    // Reset any previous recording state
    setRecordingDeleted(false);
    setIsPlaying(false);
    setRecordingDuration(0);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
    if (playbackObject) {
      playbackObject.pause();
      setPlaybackObject(null);
    }
    if (durationInterval) {
      clearInterval(durationInterval);
      setDurationInterval(null);
    }
    if (playbackCheckInterval) {
      clearInterval(playbackCheckInterval);
      setPlaybackCheckInterval(null);
    }
  }, []);

  // Start playback interval when playback state changes
  useEffect(() => {
    if (playbackObject && isPlaying && recordingDuration > 0) {
      const interval = setInterval(checkPlaybackStatus, 500);
      setPlaybackCheckInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else if (playbackCheckInterval) {
      clearInterval(playbackCheckInterval);
      setPlaybackCheckInterval(null);
    }
  }, [playbackObject, isPlaying, recordingDuration]);

  // Update recording options when audio quality changes (iOS only)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // The audioRecorder will automatically use the new recordingOptions
      // since it's recalculated on each render when audioQuality changes
      console.log(`Audio quality updated to: ${audioQuality}`);
    }
  }, [audioQuality]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationInterval) {
        clearInterval(durationInterval);
      }
      if (playbackCheckInterval) {
        clearInterval(playbackCheckInterval);
      }
      if (playbackObject) {
        stopPlayback();
      }
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Action Buttons at Top */}
      <View style={[styles.actionBar, {
        backgroundColor: theme.colors.background,
        borderBottomColor: theme.colors.border
      }]}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.cancelButton, { color: Colors.ERROR_RED }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.actionBarTitle, { color: theme.colors.text }]}>
          New Note
        </Text>
        <TouchableOpacity
          onPress={saveNote}
          disabled={isLoading || !noteLabel.trim() || (noteType === 'text' && !textContent.trim()) || (noteType === 'voice' && (!recordedUri || recordingDeleted))}
        >
          <Text style={[
            styles.saveButton,
            { color: theme.colors.primary },
            (isLoading || !noteLabel.trim() || (noteType === 'text' && !textContent.trim()) || (noteType === 'voice' && (!recordedUri || recordingDeleted))) && { color: theme.colors.textSecondary }
          ]}>
            {isLoading ? 'Saving...' : 'Save Note'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Note Type Selection */}
        <GradientCard variant="surface" elevated>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Note Type
          </Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                noteType === 'text' && { backgroundColor: theme.colors.secondaryLight }
              ]}
              onPress={() => setNoteType('text')}
            >
              <Ionicons
                name="document-text"
                size={24}
                color={noteType === 'text' ? theme.colors.text : (theme.isDark ? '#000000' : theme.colors.text)}
              />
              <Text style={[
                styles.typeText,
                { color: noteType === 'text' ? theme.colors.text : (theme.isDark ? '#000000' : theme.colors.text) }
              ]}>
                Text
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                noteType === 'voice' && { backgroundColor: theme.colors.secondaryLight }
              ]}
              onPress={() => setNoteType('voice')}
            >
              <Ionicons
                name="mic"
                size={24}
                color={noteType === 'voice' ? theme.colors.text : (theme.isDark ? '#000000' : theme.colors.text)}
              />
              <Text style={[
                styles.typeText,
                { color: noteType === 'voice' ? theme.colors.text : (theme.isDark ? '#000000' : theme.colors.text) }
              ]}>
                Voice
              </Text>
            </TouchableOpacity>
          </View>
        </GradientCard>
        {/* Note Form Card - Combined Label and Content */}
        <NoteFormCard
          noteLabel={noteLabel}
          onNoteLabelChange={setNoteLabel}
          textContent={textContent}
          onTextContentChange={setTextContent}
          isTextNote={noteType === 'text'}
          maxLabelLength={100}
          maxContentLength={1000}
        />

        {/* Voice Recording Section - Only show for voice notes */}
        {noteType === 'voice' && (
          <GradientCard variant="surface" elevated>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Voice Recording
            </Text>

            {/* Recording Controls */}
            <View style={styles.recordingControls}>
              {/* Show record button when no recording exists and not currently recording */}
              {(!recordedUri || recordingDeleted) && !isRecording && (
                <TouchableOpacity
                  style={[styles.recordButton, { backgroundColor: theme.colors.secondaryLight }]}
                  onPress={startRecording}
                >
                  <Ionicons name="mic" size={32} color={theme.colors.text} />
                </TouchableOpacity>
              )}

              {/* Show stop button when recording */}
              {isRecording && (
                <TouchableOpacity
                  style={[styles.stopButton, { backgroundColor: theme.colors.error }]}
                  onPress={stopRecording}
                >
                  <Ionicons name="stop" size={32} color={theme.colors.text} />
                </TouchableOpacity>
              )}

              {/* Show playback controls when we have a recording and not currently recording */}
              {recordedUri && !isRecording && (
                <View style={styles.recordingPlaybackControls}>
                  {/* Play/Stop button */}
                  <TouchableOpacity
                    style={[
                      isPlaying ? styles.stopButton : styles.playButton,
                      { backgroundColor: isPlaying ? theme.colors.error : theme.colors.success }
                    ]}
                    onPress={isPlaying ? stopPlayback : playRecording}
                  >
                    <Ionicons
                      name={isPlaying ? "stop" : "play"}
                      size={32}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>

                  {/* Action buttons row - only show when not playing */}
                  {!isPlaying && (
                    <View style={styles.recordingActionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                        onPress={startRecording}
                      >
                        <Ionicons name="mic" size={20} color={theme.colors.text} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                          Re-record
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                        onPress={deleteRecording}
                      >
                        <Ionicons name="trash" size={20} color={theme.colors.text} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
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
                <View style={[styles.recordingIndicator]}>
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
          </GradientCard>
        )}

        {/* Category Selection */}
        <GradientCard variant="surface" elevated>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  selectedCategoryId === category.id && {
                    backgroundColor: category.color,
                    borderColor: category.color
                  }
                ]}
                onPress={() => setSelectedCategoryId(category.id)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategoryId === category.id && { color: '#fff' }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.categoryOption, { borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('CreateCategory', {})}
            >
              <Ionicons name="add-circle" size={15} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </GradientCard>
      </ScrollView>

      {/* Category creation now handled by CategoryCreateScreen */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.LG,
    paddingBottom: Spacing.LG,
  },
  sectionTitle: {
    ...TextStyles.h3,
    marginBottom: Spacing.SM,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.SM,
    paddingVertical: Spacing.BASE,
    paddingHorizontal: Spacing.LG,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  typeText: {
    ...TextStyles.bodyMedium,
  },


  recordingControls: {
    alignItems: 'center',
    marginVertical: Spacing.LG,
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    minHeight: 32,
    maxHeight: 32,
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  actionBarTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 17,
  },
  saveButton: {
    fontSize: 17,
    fontWeight: '600',
  },





  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 15,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedColorOption: {
    borderColor: '#fff',
    borderWidth: 3,
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  customColorPicker: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  customColorPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 15,
  },
  customColorPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  customColorPickerControls: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 15,
    gap: 20,
  },
  customColorPickerSlider: {
    alignItems: 'center',
  },
  customColorPickerLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  customColorPickerInput: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  colorPreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  colorPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  customColorPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 12,
  },
  customColorPickerCancelButton: {
    flex: 1,
  },
  customColorPickerApplyButton: {
    flex: 1,
  },
  customColorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minHeight: 40,
    backgroundColor: 'transparent',
  },
  customColorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderContainer: {
    position: 'relative',
    width: 250,
    height: 40,
    justifyContent: 'center',
    marginVertical: 10,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  sliderTrackContainer: {
    width: 250,
    height: 40,
    justifyContent: 'center',
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -7,
    marginLeft: -10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
  },

});

export default CreateNoteScreen;
