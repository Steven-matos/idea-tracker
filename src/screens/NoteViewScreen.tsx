import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { createAudioPlayer } from 'expo-audio';

import { Note, Category, RootStackParamList } from '../types';
import { storageService } from '../services/storage.service';
import { formatDate, getLightColor } from '../utils';
import { useTheme } from '../contexts/theme.context';
import { 
  GradientCard, 
  ProfessionalButton, 
  ProfessionalHeader,
  ActionButton
} from '../components/common';
import { Spacing, TextStyles, Colors } from '../styles';

type NoteViewScreenRouteProp = RouteProp<RootStackParamList, 'ViewNote'>;
type NoteViewScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get('window');

/**
 * Screen for viewing individual notes with full content display
 * Implements SOLID principles by having a single responsibility for note viewing
 * Features modern, polished UI design with enhanced visual hierarchy
 */
const NoteViewScreen: React.FC = () => {
  const route = useRoute<NoteViewScreenRouteProp>();
  const navigation = useNavigation<NoteViewScreenNavigationProp>();
  const { theme } = useTheme();
  
  const [note, setNote] = useState<Note | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load note and category data from storage
   * Follows DRY principle by reusing storage service
   */
  const loadNoteData = async () => {
    try {
      setLoading(true);
      const noteData = await storageService.getNoteById(route.params.noteId);
      if (noteData) {
        setNote(noteData);
        const categoryData = await storageService.getCategoryById(noteData.categoryId);
        setCategory(categoryData);
      }
    } catch (error) {
      console.error('Error loading note:', error);
      Alert.alert('Error', 'Failed to load note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle note deletion with confirmation
   * Implements KISS principle with straightforward confirmation flow
   */
  const handleDeleteNote = () => {
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
   * Handle navigation to edit screen
   */
  const handleEditNote = () => {
    if (note) {
      navigation.navigate('EditNote', { noteId: note.id });
    }
  };

  /**
   * Handle audio playback for voice notes
   * Manages audio state and playback controls using expo-audio
   */
  const handleAudioPlayback = async () => {
    if (!note || note.type !== 'voice' || !note.audioPath) return;

    try {
      if (isPlaying && audioPlayer) {
        // Stop current playback
        audioPlayer.stop();
        setIsPlaying(false);
        setAudioPlayer(null);
      } else {
        // Create new audio player and start playback
        const player = createAudioPlayer({ uri: note.audioPath });
        setAudioPlayer(player);
        setIsPlaying(true);
        
        // Start playback
        player.play();
        
        // Set a timeout to handle playback completion
        // Note: expo-audio doesn't have built-in ended event, so we use duration
        if (note.audioDuration) {
          setTimeout(() => {
            setIsPlaying(false);
            setAudioPlayer(null);
          }, note.audioDuration * 1000);
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
    }
  };

  /**
   * Cleanup audio resources when component unmounts
   */
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        try {
          audioPlayer.stop();
        } catch (error) {
          console.error('Error stopping audio player:', error);
        }
      }
    };
  }, [audioPlayer]);

  /**
   * Load note data when screen comes into focus
   */
  useFocusEffect(
    React.useCallback(() => {
      loadNoteData();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ProfessionalHeader
          title="Loading..."
          subtitle="Please wait"
          variant="primary"
        />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ProfessionalHeader
          title="Note Not Found"
          subtitle="The requested note could not be loaded"
          variant="primary"
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            The note you're looking for doesn't exist or has been deleted.
          </Text>
          <ProfessionalButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="secondary"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { 
              borderColor: theme.colors.primary,
              backgroundColor: getLightColor(theme.colors.primary, 0.05)
            }
          ]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContent}>
            <Ionicons 
              name="chevron-back" 
              size={18} 
              color={theme.colors.primary} 
            />
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              Back
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            View Note
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Read and manage your note
          </Text>
        </View>
        
        {/* Subtle visual separator */}
        <View style={styles.headerSeparator} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Unified Note Content Card */}
        <GradientCard variant="surface" elevated style={styles.unifiedCard}>
          {/* Note Header Section */}
          <View style={styles.noteHeader}>
            <View style={styles.noteTypeAndCategory}>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: category ? getLightColor(category.color, 0.15) : getLightColor(theme.colors.textSecondary, 0.15) }
              ]}>
                <Text style={[
                  styles.categoryText,
                  { color: category?.color || theme.colors.textSecondary }
                ]}>
                  {category?.name || 'Unknown'}
                </Text>
              </View>
              <View style={[
                styles.noteTypeIcon,
                { backgroundColor: getLightColor(theme.colors.primary, 0.1) }
              ]}>
                <Ionicons 
                  name={note.type === 'voice' ? 'mic' : 'document-text'} 
                  size={18} 
                  color={theme.colors.primary} 
                />
              </View>
            </View>
            <View style={styles.dateContainer}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                {formatDate(note.createdAt)}
              </Text>
            </View>
          </View>
          
          {/* Note Label/Title */}
          <Text style={[styles.noteLabel, { color: theme.colors.text }]}>
            {note.label}
          </Text>

          {/* Content Divider */}
          <View style={styles.contentDivider} />

          {/* Note Content Section */}
          {note.type === 'text' ? (
            <View style={styles.textContentContainer}>
              <View style={styles.contentHeader}>
                <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.contentTitle, { color: theme.colors.text }]}>
                  Note Content
                </Text>
              </View>
              <Text style={[styles.noteContent, { color: theme.colors.text }]}>
                {note.content}
              </Text>
            </View>
          ) : (
            <View style={styles.audioContentContainer}>
              <View style={styles.contentHeader}>
                <Ionicons name="mic-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.contentTitle, { color: theme.colors.text }]}>
                  Voice Recording
                </Text>
              </View>
              
              <View style={styles.audioSection}>
                <View style={styles.audioInfo}>
                  <View style={styles.audioDurationBadge}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.audioDurationText, { color: theme.colors.primary }]}>
                      {Math.floor((note.audioDuration || 0) / 60)}:{((note.audioDuration || 0) % 60).toFixed(0).padStart(2, '0')}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    { 
                      backgroundColor: isPlaying ? theme.colors.error : theme.colors.primary,
                      transform: [{ scale: isPlaying ? 1.1 : 1 }]
                    }
                  ]}
                  onPress={handleAudioPlayback}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={isPlaying ? 'pause' : 'play'} 
                    size={28} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Favorite Status (Inline) */}
          {note.isFavorite && (
            <View style={styles.favoriteInline}>
              <View style={[
                styles.favoriteIcon,
                { backgroundColor: getLightColor(Colors.SECONDARY_YELLOW, 0.15) }
              ]}>
                <Ionicons name="star" size={16} color={Colors.SECONDARY_YELLOW} />
              </View>
              <Text style={[styles.favoriteText, { color: Colors.SECONDARY_YELLOW }]}>
                Favorite Note
              </Text>
            </View>
          )}
        </GradientCard>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.editButton,
              { 
                backgroundColor: 'transparent',
                borderColor: theme.colors.primary,
              }
            ]}
            onPress={handleEditNote}
            activeOpacity={0.7}
          >
            <View style={styles.buttonContent}>
              <View style={[
                styles.buttonIcon,
                { backgroundColor: getLightColor(theme.colors.primary, 0.1) }
              ]}>
                <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                  Edit Note
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
              { 
                backgroundColor: 'transparent',
                borderColor: theme.colors.error,
              }
            ]}
            onPress={handleDeleteNote}
            activeOpacity={0.7}
          >
            <View style={styles.buttonContent}>
              <View style={[
                styles.buttonIcon,
                { backgroundColor: getLightColor(theme.colors.error, 0.1) }
              ]}>
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                  Delete Note
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={theme.colors.error} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XXL,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.LG,
    backgroundColor: 'transparent',
    marginBottom: Spacing.MD,
  },
  backButton: {
    width: 80,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.LG,
    marginTop: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  headerTextContainer: {
    flex: 1,
    paddingTop: 4,
  },
  headerTitle: {
    ...TextStyles.h2,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: Spacing.XS,
  },
  headerSubtitle: {
    ...TextStyles.label,
    fontSize: 13,
    lineHeight: 18,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginTop: Spacing.MD,
    marginBottom: Spacing.SM,
    borderRadius: 0.5,
  },
  unifiedCard: {
    marginBottom: Spacing.LG,
    padding: Spacing.LG,
    borderRadius: 20,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.LG,
  },
  noteTypeAndCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryText: {
    ...TextStyles.label,
    fontWeight: '600',
    fontSize: 13,
  },
  noteTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
  },
  dateText: {
    ...TextStyles.label,
    fontSize: 12,
    fontWeight: '500',
  },
  noteLabel: {
    ...TextStyles.h2,
    marginBottom: 0,
    fontWeight: '700',
    lineHeight: 32,
  },
  contentDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: Spacing.LG,
    borderRadius: 0.5,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    marginBottom: Spacing.MD,
    paddingBottom: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    paddingTop: Spacing.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
  },
  contentTitle: {
    ...TextStyles.h3,
    fontWeight: '600',
  },
  textContentContainer: {
    minHeight: 80,
    paddingTop: Spacing.SM,
  },
  noteContent: {
    ...TextStyles.body,
    lineHeight: 26,
    fontSize: 16,
  },
  audioContentContainer: {
    minHeight: 100,
    paddingTop: Spacing.SM,
  },
  audioSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.MD,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  audioInfo: {
    flex: 1,
  },
  audioDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  audioDurationText: {
    ...TextStyles.label,
    fontWeight: '600',
    fontSize: 14,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  favoriteInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
    marginTop: Spacing.MD,
  },
  favoriteIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteText: {
    ...TextStyles.label,
    fontSize: 13,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.MD,
    marginTop: Spacing.LG,
    paddingHorizontal: Spacing.SM,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.MD,
    borderRadius: 16,
    borderWidth: 1.5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  editButton: {
    // Primary color already set in component
  },
  deleteButton: {
    // Error color already set in component
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  buttonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTextContainer: {
    flex: 1,
    marginHorizontal: Spacing.SM,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.XL,
  },
  errorText: {
    ...TextStyles.body,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
});

export default NoteViewScreen;
