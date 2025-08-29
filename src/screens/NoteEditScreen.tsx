import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import {
  createAudioPlayer,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';

import { Note, Category, RootStackParamList } from '../types';
import { storageService } from '../services/storage.service';
import { isValidString, getLightColor } from '../utils';
import { useTheme } from '../contexts/theme.context';
import { GradientCard, ProfessionalButton, ColorPicker, NoteFormCard } from '../components/common';
import { Colors, Spacing } from '../styles';


type EditNoteScreenNavigationProp = any;
type EditNoteScreenRouteProp = RouteProp<RootStackParamList, 'EditNote'>;

/**
 * Screen for editing existing notes
 */
const EditNoteScreen: React.FC = () => {
  const navigation = useNavigation<EditNoteScreenNavigationProp>();
  const route = useRoute<EditNoteScreenRouteProp>();
  const { theme } = useTheme();
  
  // State management
  const [note, setNote] = useState<Note | null>(null);
  const [noteLabel, setNoteLabel] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice playback state
  const [playbackObject, setPlaybackObject] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackCheckInterval, setPlaybackCheckInterval] = useState<NodeJS.Timeout | null>(null);
  

  
  /**
   * Load note and categories data
   */
  const loadData = async () => {
    try {
      const [noteData, categoriesData] = await Promise.all([
        storageService.getNoteById(route.params.noteId),
        storageService.getCategories(),
      ]);
      
      if (!noteData) {
        Alert.alert('Error', 'Note not found.');
        navigation.goBack();
        return;
      }
      
      setNote(noteData);
      setNoteLabel(noteData.label);
      setTextContent(noteData.content);
      setSelectedCategoryId(noteData.categoryId);
      setCategories(categoriesData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load note.');
      navigation.goBack();
    }
  };

  /**
   * Play or pause voice recording
   */
  const togglePlayback = async () => {
    try {
      if (!note || note.type !== 'voice' || !note.audioPath) return;

      if (playbackObject) {
        if (isPlaying) {
          await playbackObject.pauseAsync();
          setIsPlaying(false);
        } else {
          await playbackObject.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      // Create new playback object
      const player = createAudioPlayer({ uri: note.audioPath });
      setPlaybackObject(player);

      // Play audio
      player.play();
      setIsPlaying(true);

      // Start playback check interval
      const interval = setInterval(() => {
        // Simple approach: check if still playing
        if (playbackObject && !playbackObject.playing) {
          setIsPlaying(false);
          setPlaybackCheckInterval(null);
        }
      }, 500);
      setPlaybackCheckInterval(interval);

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
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  /**
   * Save changes to the note
   */
  const saveChanges = async () => {
    try {
      if (!note) return;

      // Validation
      if (!noteLabel.trim()) {
        Alert.alert('Error', 'Please enter a label for your note.');
        return;
      }

      // Validation for text notes
      if (note.type === 'text' && !isValidString(textContent)) {
        Alert.alert('Error', 'Please enter some text for your note.');
        return;
      }

      if (!selectedCategoryId) {
        Alert.alert('Error', 'Please select a category for your note.');
        return;
      }

      setIsLoading(true);

      // Create updated note object
      const updatedNote: Note = {
        ...note,
        label: noteLabel.trim(),
        content: note.type === 'text' ? textContent.trim() : note.content,
        categoryId: selectedCategoryId,
        updatedAt: new Date().toISOString(),
      };

      // Save to storage
      await storageService.updateNote(updatedNote);

      // Navigate back
      navigation.goBack();
      
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete the note
   */
  const deleteNote = () => {
    if (!note) return;

    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteNote(note.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };



  /**
   * Cancel and go back
   */
  const handleCancel = () => {
    // Stop playback if active
    if (playbackObject) {
      stopPlayback();
    }
    
    navigation.goBack();
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Refresh categories when screen comes into focus (e.g., after creating a new category)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackObject) {
        stopPlayback();
      }
      if (playbackCheckInterval) {
        clearInterval(playbackCheckInterval);
      }
    };
  }, []);

  if (!note) {
    return null;
  }

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
          Edit Note
        </Text>
        <TouchableOpacity 
          onPress={saveChanges} 
          disabled={isLoading}
        >
          <Text style={[
            styles.saveButton, 
            { color: theme.colors.primary },
            isLoading && { color: theme.colors.textSecondary }
          ]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Note Form Card - Combined Label and Content */}
        <NoteFormCard
          noteLabel={noteLabel}
          onNoteLabelChange={setNoteLabel}
          textContent={textContent}
          onTextContentChange={setTextContent}
          isTextNote={note.type === 'text'}
          maxLabelLength={100}
          maxContentLength={1000}
        />

        {/* Voice Recording Section - Only show for voice notes */}
        {note.type !== 'text' && (
          <GradientCard variant="surface" elevated>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Voice Recording
            </Text>
            
            {/* Playback Controls */}
            <View style={styles.playbackContainer}>
              <View style={styles.playbackInfo}>
                <Ionicons name="mic" size={24} color={theme.colors.primary} />
                <Text style={[styles.playbackDuration, { color: theme.colors.text }]}>
                  {note.audioDuration ? `${Math.floor(note.audioDuration / 60)}:${(note.audioDuration % 60).toFixed(0).padStart(2, '0')}` : 'Unknown duration'}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.playButton,
                  { backgroundColor: isPlaying ? theme.colors.error : theme.colors.primary }
                ]}
                onPress={togglePlayback}
              >
                <Ionicons 
                  name={isPlaying ? 'stop' : 'play'} 
                  size={24} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
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



        {/* Delete Note */}
        <GradientCard variant="surface" elevated style={styles.deleteCard}>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              { 
                borderColor: theme.colors.error,
                backgroundColor: getLightColor(theme.colors.error, 0.05)
              }
            ]}
            onPress={deleteNote}
            activeOpacity={0.7}
          >
            <View style={styles.deleteButtonContent}>
              <View style={[
                styles.deleteButtonIcon,
                { backgroundColor: getLightColor(theme.colors.error, 0.1) }
              ]}>
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              </View>
              <View style={styles.deleteButtonTextContainer}>
                <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
                  Delete Note
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={theme.colors.error} />
            </View>
          </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },


  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  playbackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playbackDuration: {
    fontSize: 18,
    fontWeight: '500',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    minHeight: 32,
    maxHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  deleteCard: {
    padding: Spacing.MD,
  },
  deleteButton: {
    width: '100%',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.MD,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  deleteButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonTextContainer: {
    flex: 1,
    marginHorizontal: Spacing.SM,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },

});

export default EditNoteScreen;
