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
import { StackNavigationProp } from '@react-navigation/stack';
import { Audio } from 'expo-av';

import { Idea, Category, RootStackParamList } from '../types';
import { storageService } from '../services/StorageService';
import { isValidString, formatDuration, configureAudioForSpeakerPlayback } from '../utils';

type EditIdeaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditIdea'>;
type EditIdeaScreenRouteProp = RouteProp<RootStackParamList, 'EditIdea'>;

/**
 * Screen for editing existing ideas
 */
const EditIdeaScreen: React.FC = () => {
  const navigation = useNavigation<EditIdeaScreenNavigationProp>();
  const route = useRoute<EditIdeaScreenRouteProp>();
  
  // State management
  const [idea, setIdea] = useState<Idea | null>(null);
  const [textContent, setTextContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Voice playback state
  const [playbackObject, setPlaybackObject] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  /**
   * Load idea and categories data
   */
  const loadData = async () => {
    try {
      const [ideaData, categoriesData] = await Promise.all([
        storageService.getIdeaById(route.params.ideaId),
        storageService.getCategories(),
      ]);
      
      if (!ideaData) {
        Alert.alert('Error', 'Idea not found.');
        navigation.goBack();
        return;
      }
      
      setIdea(ideaData);
      setTextContent(ideaData.content);
      setSelectedCategoryId(ideaData.categoryId);
      setIsFavorite(ideaData.isFavorite);
      setCategories(categoriesData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load idea.');
      navigation.goBack();
    }
  };

  /**
   * Play or pause voice recording
   */
  const togglePlayback = async () => {
    try {
      if (!idea?.audioPath) return;

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

      // Configure audio mode for speaker playback
      await configureAudioForSpeakerPlayback();

      const { sound } = await Audio.Sound.createAsync({ uri: idea.audioPath });
      setPlaybackObject(sound);
      
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      });
      
      await sound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  /**
   * Save changes to the idea
   */
  const saveChanges = async () => {
    try {
      if (!idea) return;

      // Validation for text ideas
      if (idea.type === 'text' && !isValidString(textContent)) {
        Alert.alert('Error', 'Please enter some text for your idea.');
        return;
      }

      if (!selectedCategoryId) {
        Alert.alert('Error', 'Please select a category for your idea.');
        return;
      }

      setIsLoading(true);

      // Create updated idea object
      const updatedIdea: Idea = {
        ...idea,
        content: idea.type === 'text' ? textContent.trim() : idea.content,
        categoryId: selectedCategoryId,
        isFavorite,
        updatedAt: new Date().toISOString(),
      };

      // Save to storage
      await storageService.updateIdea(updatedIdea);

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
   * Delete the idea
   */
  const deleteIdea = () => {
    if (!idea) return;

    Alert.alert(
      'Delete Idea',
      'Are you sure you want to delete this idea? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteIdea(idea.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting idea:', error);
              Alert.alert('Error', 'Failed to delete idea. Please try again.');
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
    const hasChanges = 
      (idea?.type === 'text' && textContent !== idea.content) ||
      selectedCategoryId !== idea?.categoryId ||
      isFavorite !== idea?.isFavorite;

    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackObject) {
        playbackObject.unloadAsync();
      }
    };
  }, [playbackObject]);

  if (!idea) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#FF3B30' : '#007AFF'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={saveChanges} disabled={isLoading}>
            <Text style={[styles.saveButton, isLoading && styles.disabledButton]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Idea Type Badge */}
        <View style={styles.section}>
          <View style={styles.typeBadge}>
            <Ionicons 
              name={idea.type === 'voice' ? 'mic' : 'document-text'} 
              size={16} 
              color="#007AFF" 
            />
            <Text style={styles.typeBadgeText}>
              {idea.type === 'voice' ? 'Voice Note' : 'Text Note'}
            </Text>
          </View>
        </View>

        {/* Category Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categorySelector}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategoryId === category.id && {
                    backgroundColor: category.color,
                  },
                ]}
                onPress={() => setSelectedCategoryId(category.id)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategoryId === category.id && { color: '#FFFFFF' },
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        {idea.type === 'text' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Write your idea here..."
              value={textContent}
              onChangeText={setTextContent}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#C7C7CC"
            />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Recording</Text>
            <View style={styles.voiceContainer}>
              <View style={styles.voiceInfo}>
                <Ionicons name="mic" size={24} color="#007AFF" />
                <View style={styles.voiceDetails}>
                  <Text style={styles.voiceDuration}>
                    {formatDuration(idea.audioDuration || 0)}
                  </Text>
                  <Text style={styles.voiceDate}>
                    Recorded {new Date(idea.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayback}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="#007AFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.metadataContainer}>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Created</Text>
              <Text style={styles.metadataValue}>
                {new Date(idea.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            {idea.updatedAt !== idea.createdAt && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Updated</Text>
                <Text style={styles.metadataValue}>
                  {new Date(idea.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Delete Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteButton} onPress={deleteIdea}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Delete Idea</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    fontSize: 17,
    color: '#007AFF',
  },
  favoriteButton: {
    marginRight: 16,
  },
  saveButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#C7C7CC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 6,
  },
  categorySelector: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voiceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  voiceDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  voiceDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metadataContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metadataLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  metadataValue: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default EditIdeaScreen;
