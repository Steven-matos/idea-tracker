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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

import { Idea, Category, IdeaType, RootStackParamList } from '../types';
import { storageService } from '../services/StorageService';
import { generateId, isValidString, formatDuration, configureAudioForRecording, configureAudioForSpeakerPlayback } from '../utils';

type CreateIdeaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateIdea'>;
type CreateIdeaScreenRouteProp = RouteProp<RootStackParamList, 'CreateIdea'>;

/**
 * Screen for creating new ideas (text or voice)
 */
const CreateIdeaScreen: React.FC = () => {
  const navigation = useNavigation<CreateIdeaScreenNavigationProp>();
  const route = useRoute<CreateIdeaScreenRouteProp>();
  
  // State management
  const [ideaType, setIdeaType] = useState<IdeaType>('text');
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
   * Request audio permissions
   */
  const requestAudioPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Audio recording permission is required to record voice ideas.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  };

  /**
   * Start recording audio
   */
  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermissions();
      if (!hasPermission) return;

      // Configure audio mode for recording
      await configureAudioForRecording();

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      
      // Set up status update
      newRecording.setOnRecordingStatusUpdate((status: any) => {
        if (status.isRecording) {
          setRecordingDuration(status.durationMillis / 1000);
        }
      });
      
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      
      // Start pulse animation
      startPulseAnimation();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  /**
   * Stop recording audio
   */
  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      stopPulseAnimation();
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        setRecordedUri(uri);
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  /**
   * Play recorded audio
   */
  const playRecording = async () => {
    try {
      if (!recordedUri) return;

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

      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
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
   * Delete recorded audio
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
            setRecordedUri(null);
            setRecordingDuration(0);
            if (playbackObject) {
              playbackObject.unloadAsync();
              setPlaybackObject(null);
            }
            setIsPlaying(false);
          },
        },
      ]
    );
  };

  /**
   * Start pulse animation for recording
   */
  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isRecording) pulse();
      });
    };
    pulse();
  };

  /**
   * Stop pulse animation
   */
  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  /**
   * Save the idea
   */
  const saveIdea = async () => {
    try {
      // Validation
      if (ideaType === 'text') {
        if (!isValidString(textContent)) {
          Alert.alert('Error', 'Please enter some text for your idea.');
          return;
        }
              } else {
          if (!recordedUri) {
            Alert.alert('Error', 'Please record a voice note for your idea.');
            return;
          }
        }

      if (!selectedCategoryId) {
        Alert.alert('Error', 'Please select a category for your idea.');
        return;
      }

      setIsLoading(true);

      let audioPath: string | undefined;
      let audioDuration: number | undefined;

      // Handle voice recording
      if (ideaType === 'voice' && recordedUri) {
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

      // Create idea object
      const newIdea: Idea = {
        id: generateId(),
        type: ideaType,
        content: ideaType === 'text' ? textContent.trim() : `Voice note (${formatDuration(recordingDuration)})`,
        audioPath,
        audioDuration,
        categoryId: selectedCategoryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
      };

      // Save to storage
      await storageService.addIdea(newIdea);

      // Navigate back
      navigation.goBack();
      
    } catch (error) {
      console.error('Error saving idea:', error);
      Alert.alert('Error', 'Failed to save idea. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancel and go back
   */
  const handleCancel = () => {
    if (isRecording) {
      Alert.alert(
        'Recording in Progress',
        'Please stop recording before canceling.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (textContent.trim() || recordedUri) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your idea?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
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
        playbackObject.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [durationInterval, playbackObject, recording]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={saveIdea} disabled={isLoading}>
          <Text style={[styles.saveButton, isLoading && styles.disabledButton]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Idea Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, ideaType === 'text' && styles.activeTypeButton]}
              onPress={() => setIdeaType('text')}
            >
              <Ionicons 
                name="document-text" 
                size={20} 
                color={ideaType === 'text' ? '#FFFFFF' : '#007AFF'} 
              />
              <Text style={[
                styles.typeButtonText,
                ideaType === 'text' && styles.activeTypeButtonText
              ]}>
                Text
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, ideaType === 'voice' && styles.activeTypeButton]}
              onPress={() => setIdeaType('voice')}
            >
              <Ionicons 
                name="mic" 
                size={20} 
                color={ideaType === 'voice' ? '#FFFFFF' : '#007AFF'} 
              />
              <Text style={[
                styles.typeButtonText,
                ideaType === 'voice' && styles.activeTypeButtonText
              ]}>
                Voice
              </Text>
            </TouchableOpacity>
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

        {/* Content Input */}
        {ideaType === 'text' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Idea</Text>
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
            
            {!recordedUri ? (
              <View style={styles.recordingContainer}>
                {isRecording && (
                  <Text style={styles.recordingDuration}>
                    {formatDuration(recordingDuration)}
                  </Text>
                )}
                
                <Animated.View style={[
                  styles.recordButton,
                  isRecording && { transform: [{ scale: pulseAnim }] },
                ]}>
                  <TouchableOpacity
                    style={[
                      styles.recordButtonInner,
                      isRecording && styles.recordingButton,
                    ]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Ionicons
                      name={isRecording ? 'stop' : 'mic'}
                      size={32}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </Animated.View>
                
                <Text style={styles.recordingInstructions}>
                  {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
                </Text>
              </View>
            ) : (
              <View style={styles.playbackContainer}>
                <View style={styles.playbackInfo}>
                  <Ionicons name="mic" size={24} color="#007AFF" />
                  <Text style={styles.playbackDuration}>
                    {formatDuration(recordingDuration)}
                  </Text>
                </View>
                
                <View style={styles.playbackControls}>
                  <TouchableOpacity
                    style={styles.playbackButton}
                    onPress={playRecording}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={24}
                      color="#007AFF"
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={deleteRecording}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  cancelButton: {
    fontSize: 17,
    color: '#007AFF',
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
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  activeTypeButtonText: {
    color: '#FFFFFF',
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
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  recordingDuration: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 24,
  },
  recordButton: {
    marginBottom: 16,
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  recordingInstructions: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  playbackContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playbackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playbackDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playbackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreateIdeaScreen;
