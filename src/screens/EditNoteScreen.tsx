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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Audio } from 'expo-av';

import { Note, Category, RootStackParamList } from '../types';
import { storageService } from '../services/StorageService';
import { isValidString } from '../utils';
import { useTheme } from '../contexts/ThemeContext';
import { GradientCard, ProfessionalButton, ProfessionalHeader } from '../components/common';

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
  const [textContent, setTextContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Voice playback state
  const [playbackObject, setPlaybackObject] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
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
      const { sound } = await Audio.Sound.createAsync({ uri: note.audioPath });
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
   * Save changes to the note
   */
  const saveChanges = async () => {
    try {
      if (!note) return;

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
    };
  }, []);

  if (!note) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <ProfessionalHeader
        title="Edit Note"
        subtitle="Modify your note"
        variant="primary"
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Note Type Display */}
        <GradientCard variant="surface" elevated>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Note Type
          </Text>
          <View style={styles.typeDisplay}>
            <Ionicons 
              name={note.type === 'voice' ? 'mic' : 'document-text'} 
              size={24} 
              color={theme.colors.text} 
            />
            <Text style={[styles.typeText, { color: theme.colors.text }]}>
              {note.type === 'voice' ? 'Voice Note' : 'Text Note'}
            </Text>
          </View>
        </GradientCard>

        {/* Content Input */}
        {note.type === 'text' ? (
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
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: theme.colors.surface }]}>
        <ProfessionalButton
          title="Save & Close"
          onPress={saveChanges}
          variant="success"
          style={styles.saveButton}
          loading={isLoading}
          disabled={isLoading}
        />
        <ProfessionalButton
          title="Delete"
          onPress={deleteNote}
          variant="destructive"
          style={styles.deleteButton}
        />
      </View>
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
  typeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  categoryText: {
    fontSize: 14,
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
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
});

export default EditNoteScreen;
