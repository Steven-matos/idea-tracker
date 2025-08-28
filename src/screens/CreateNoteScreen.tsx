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
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Import type definitions for notes, categories, and navigation
import type { Note, Category, NoteType, RootStackParamList } from '../types';

// Import storage service for persistent data operations
import { storageService } from '../services';

// Import utility functions for ID generation, duration formatting, and string validation
import { generateId, formatDuration, isValidString } from '../utils';

// Import custom theme context hook for theming
import { useTheme } from '../contexts/ThemeContext';

// Import common UI components
import { GradientCard, ProfessionalButton, ProfessionalHeader } from '../components/common';

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
  const [textContent, setTextContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(route.params?.categoryId || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice recording state
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [playbackObject, setPlaybackObject] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationInterval, setDurationInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Category creation state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#8B5CF6');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Predefined color options
  const colorOptions = [
    '#8B5CF6', // Purple
    '#3B82F6', // Blue  
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#8B5A2B', // Brown
  ];
  
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
   * Create a new category
   */
  const createNewCategory = async () => {
    try {
      if (!isValidString(newCategoryName)) {
        Alert.alert('Error', 'Please enter a category name.');
        return;
      }

      setIsCreatingCategory(true);

      // Check if category name already exists
      const existingCategory = categories.find(
        cat => cat.name.toLowerCase() === newCategoryName.toLowerCase()
      );
      
      if (existingCategory) {
        Alert.alert('Error', 'A category with this name already exists.');
        return;
      }

      // Create new category
      const newCategory: Category = {
        id: generateId(),
        name: newCategoryName.trim(),
        color: newCategoryColor,
        createdAt: new Date().toISOString(),
      };

      // Save to storage
      await storageService.addCategory(newCategory);

      // Update local state
      setCategories(prev => [...prev, newCategory]);
      setSelectedCategoryId(newCategory.id);

      // Reset form and close modal
      setNewCategoryName('');
      setNewCategoryColor('#8B5CF6');
      setShowCategoryModal(false);

      Alert.alert('Success', 'New category created successfully!');
      
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert('Error', 'Failed to create category. Please try again.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  /**
   * Reset category creation form
   */
  const resetCategoryForm = () => {
    setNewCategoryName('');
    setNewCategoryColor('#8B5CF6');
    setShowCategoryModal(false);
  };

  /**
   * Request audio permissions
   */
  const requestAudioPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is required to record voice notes.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  };

  /**
   * Start voice recording
   */
  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermissions();
      if (!hasPermission) return;

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordedUri(null);

      // Start duration timer
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setDurationInterval(interval);

      // Start pulse animation
      startPulseAnimation();

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  /**
   * Stop voice recording
   */
  const stopRecording = async () => {
    try {
      if (!recording) return;

      // Stop recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecording(null);
      setIsRecording(false);
      setRecordedUri(uri);
      
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
   * Play recorded audio
   */
  const playRecording = async () => {
    try {
      if (!recordedUri) return;

      // Stop any existing playback
      if (playbackObject) {
        await playbackObject.stopAsync();
        setPlaybackObject(null);
      }

      // Create new playback object
      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
      setPlaybackObject(sound);

      // Play audio
      await sound.playAsync();
      setIsPlaying(true);

      // Listen for playback status
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

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
        await playbackObject.stopAsync();
        setPlaybackObject(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
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

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationInterval) {
        clearInterval(durationInterval);
      }
      if (playbackObject) {
        stopPlayback();
      }
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <ProfessionalHeader
        title="New Note"
        subtitle="Capture your thoughts"
        variant="primary"
      />

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
                color={theme.colors.text} 
              />
              <Text style={[
                styles.typeText,
                noteType === 'text' && { color: theme.colors.text }
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
                color={theme.colors.text} 
              />
              <Text style={[
                styles.typeText,
                noteType === 'voice' && { color: theme.colors.text }
              ]}>
                Voice
              </Text>
            </TouchableOpacity>
          </View>
        </GradientCard>

        {/* Content Input */}
        {noteType === 'text' ? (
          <GradientCard variant="surface" elevated>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Note Content
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface
                }
              ]}
              placeholder="Write your note here..."
              placeholderTextColor={theme.colors.textSecondary}
              value={textContent}
              onChangeText={setTextContent}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
              {textContent.length}/1000
            </Text>
          </GradientCard>
        ) : (
          <GradientCard variant="surface" elevated>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Voice Recording
            </Text>
            
            {/* Recording Controls */}
            <View style={styles.recordingControls}>
              {!isRecording && !recordedUri && (
                <TouchableOpacity
                  style={[styles.recordButton, { backgroundColor: theme.colors.secondaryLight }]}
                  onPress={startRecording}
                >
                  <Ionicons name="mic" size={32} color={theme.colors.text} />
                </TouchableOpacity>
              )}

              {isRecording && (
                <TouchableOpacity
                  style={[styles.stopButton, { backgroundColor: theme.colors.error }]}
                  onPress={stopRecording}
                >
                  <Ionicons name="stop" size={32} color={theme.colors.text} />
                </TouchableOpacity>
              )}

              {recordedUri && !isRecording && (
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: theme.colors.success }]}
                  onPress={playRecording}
                >
                  <Ionicons name="play" size={32} color={theme.colors.text} />
                </TouchableOpacity>
              )}

              {isPlaying && (
                <TouchableOpacity
                  style={[styles.stopButton, { backgroundColor: theme.colors.error }]}
                  onPress={stopPlayback}
                >
                  <Ionicons name="stop" size={32} color={theme.colors.text} />
                </TouchableOpacity>
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
                  Playing... {formatDuration(recordingDuration)}
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
              onPress={() => setShowCategoryModal(true)}
            >
              <Ionicons name="add-circle" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.categoryText, { color: theme.colors.textSecondary }]}>
                New Category
              </Text>
            </TouchableOpacity>
          </View>
        </GradientCard>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: theme.colors.surface }]}>
        <ProfessionalButton
          title="Cancel"
          onPress={handleCancel}
          variant="destructive"
          style={styles.cancelButton}
        />
        <ProfessionalButton
          title="Save Note"
          onPress={saveNote}
          variant="success"
          style={styles.saveButton}
          loading={isLoading}
          disabled={isLoading || (noteType === 'text' && !textContent.trim()) || (noteType === 'voice' && !recordedUri)}
        />
      </View>

      {/* Category Creation Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Create New Category
            </Text>
            <TextInput
              style={[styles.modalInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Category Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <View style={styles.modalColorPicker}>
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>
                Choose a color for your category
              </Text>
              <View style={styles.colorGrid}>
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.selectedColorOption
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  >
                    {newCategoryColor === color && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <ProfessionalButton
                title="Cancel"
                onPress={resetCategoryForm}
                variant="destructive"
                style={styles.modalCancelButton}
              />
              <ProfessionalButton
                title={isCreatingCategory ? 'Creating...' : 'Create Category'}
                onPress={createNewCategory}
                variant="success"
                style={styles.modalSaveButton}
                loading={isCreatingCategory}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  recordingControls: {
    alignItems: 'center',
    marginVertical: 20,
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
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minHeight: 40,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalColorPicker: {
    alignItems: 'center',
    marginBottom: 20,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 10,
  },
  modalSaveButton: {
    flex: 1,
    marginLeft: 10,
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
