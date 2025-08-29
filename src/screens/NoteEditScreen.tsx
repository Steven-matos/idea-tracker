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
import {
  createAudioPlayer,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';

import { Note, Category, RootStackParamList } from '../types';
import { storageService } from '../services/storage.service';
import { isValidString } from '../utils';
import { useTheme } from '../contexts/theme.context';
import { GradientCard, ProfessionalButton, ColorPicker, NoteFormCard } from '../components/common';
import { Colors } from '../styles';
import { useCategoryManager } from '../hooks';

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
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Voice playback state
  const [playbackObject, setPlaybackObject] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackCheckInterval, setPlaybackCheckInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Use category management hook
  const categoryManager = useCategoryManager();
  
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
      setIsFavorite(noteData.isFavorite);
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
        isFavorite,
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
   * Handle category creation using the hook
   */
  const handleCreateCategory = async () => {
    await categoryManager.createNewCategory(categories, (newCategory) => {
      // Update local state
      setCategories(prev => [...prev, newCategory]);
      setSelectedCategoryId(newCategory.id);
    });
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
              onPress={categoryManager.openCategoryModal}
            >
              <Ionicons name="add-circle" size={15} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </GradientCard>

        {/* Favorite Toggle */}
        <GradientCard variant="surface" elevated>
          <TouchableOpacity
            style={styles.favoriteToggle}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={24} 
              color={isFavorite ? theme.colors.error : theme.colors.textSecondary} 
            />
            <Text style={[styles.favoriteText, { color: theme.colors.text }]}>
              {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </Text>
          </TouchableOpacity>
        </GradientCard>

        {/* Delete Note */}
        <GradientCard variant="surface" elevated>
          <ProfessionalButton
            title="Delete Note"
            onPress={deleteNote}
            variant="destructive"
            style={styles.deleteNoteButton}
          />
        </GradientCard>
      </ScrollView>

      {/* Category Creation Modal */}
      <Modal
        visible={categoryManager.showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={categoryManager.closeCategoryModal}
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
              value={categoryManager.newCategoryName}
              onChangeText={categoryManager.setNewCategoryName}
            />
            <ColorPicker
              label="Choose a color for your category"
              selectedColor={categoryManager.newCategoryColor}
              onColorSelect={categoryManager.setNewCategoryColor}
              colors={categoryManager.colorOptions}
              style={styles.modalColorPicker}
            />
            
            <View style={styles.modalButtons}>
              <ProfessionalButton
                title="Cancel"
                onPress={categoryManager.resetCategoryForm}
                variant="destructive"
                style={styles.modalCancelButton}
              />
              <ProfessionalButton
                title={categoryManager.isCreatingCategory ? 'Creating...' : 'Create Category'}
                onPress={handleCreateCategory}
                variant="success"
                style={styles.modalSaveButton}
                loading={categoryManager.isCreatingCategory}
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
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  favoriteText: {
    fontSize: 16,
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
  deleteNoteButton: {
    width: '100%',
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
});

export default EditNoteScreen;
