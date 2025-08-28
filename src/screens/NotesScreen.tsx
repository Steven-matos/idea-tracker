import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Note, Category, NoteFilters, RootStackParamList } from '../types';
import { storageService } from '../services/StorageService';
import { formatDate, truncateText, filterBySearchText, getLightColor } from '../utils';
import { useTheme } from '../contexts/ThemeContext';
import { GradientCard, ProfessionalButton, ProfessionalHeader, ProfessionalSearchInput, ProfessionalCategoryFilter, ProfessionalFAB } from '../components/common';

type NotesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Main screen displaying list of notes with search and filter functionality
 */
const NotesScreen: React.FC = () => {
  const navigation = useNavigation<NotesScreenNavigationProp>();
  const { theme } = useTheme();
  
  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Load data from storage
   */
  const loadData = async () => {
    try {
      const [notesData, categoriesData] = await Promise.all([
        storageService.getNotes(),
        storageService.getCategories(),
      ]);
      
      setNotes(notesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh data from storage
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  /**
   * Filter notes based on search text and selected category
   */
  const applyFilters = useCallback(() => {
    let filtered = [...notes];

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(note => note.categoryId === selectedCategoryId);
    }

    // Filter by search text
    if (searchText.trim()) {
      filtered = filterBySearchText(filtered, searchText, ['content']);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredNotes(filtered);
  }, [notes, searchText, selectedCategoryId]);

  /**
   * Delete a note with confirmation
   */
  const deleteNote = (note: Note) => {
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
              await loadData();
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
   * Navigate to edit note screen
   */
  const handleEditNote = (note: Note) => {
    navigation.navigate('EditNote', { noteId: note.id });
  };

  /**
   * Navigate to create note screen
   */
  const handleCreateNote = () => {
    navigation.navigate('CreateNote', { categoryId: selectedCategoryId });
  };

  /**
   * Get category by ID
   */
  const getCategoryById = (categoryId: string): Category | undefined => {
    return categories.find(c => c.id === categoryId);
  };

  /**
   * Render individual note item
   */
  const renderNoteItem = ({ item }: { item: Note }) => {
    const category = categories.find(c => c.id === item.categoryId);
    
    return (
      <GradientCard variant="surface" elevated>
        <View style={styles.noteHeader}>
          <View style={styles.noteTypeAndCategory}>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: category ? getLightColor(category.color, 0.2) : getLightColor(theme.colors.textSecondary, 0.2) }
            ]}>
              <Text style={[
                styles.categoryText,
                { color: category?.color || theme.colors.textSecondary }
              ]}>
                {category?.name || 'Unknown'}
              </Text>
            </View>
            <View style={styles.noteTypeIcon}>
              <Ionicons 
                name={item.type === 'voice' ? 'mic' : 'document-text'} 
                size={16} 
                color={theme.colors.textSecondary} 
              />
            </View>
          </View>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        
        <Text style={[styles.noteContent, { color: theme.colors.text }]} numberOfLines={3}>
          {item.content}
        </Text>
        
        {item.type === 'voice' && item.audioDuration && (
          <View style={styles.audioDuration}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.audioDurationText, { color: theme.colors.textSecondary }]}>
              {Math.floor(item.audioDuration / 60)}:{(item.audioDuration % 60).toFixed(0).padStart(2, '0')}
            </Text>
          </View>
        )}
        
        <View style={styles.noteActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditNote(item)}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteNote(item)}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </GradientCard>
    );
  };

  /**
   * Render empty state when no notes exist
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bulb-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
        No Notes Yet
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>
        Start capturing your thoughts by creating your first note
      </Text>
      <ProfessionalButton
        title="Create Note"
        onPress={handleCreateNote}
        variant="primary"
        style={styles.createButton}
      />
    </View>
  );

  // Apply filters when data changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Prepare category filter data
  const categoryFilterData: Array<Category | { id: '', name: 'All', color: '#000' }> = [
    { id: '', name: 'All', color: '#000' },
    ...categories,
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Professional Header */}
      <ProfessionalHeader
        title="My Notes"
        subtitle="Capture and organize your thoughts"
        variant="primary"
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <ProfessionalSearchInput
          placeholder="Search notes..."
          value={searchText}
          onChangeText={setSearchText}
          onClear={() => setSearchText('')}
        />
      </View>

      {/* Category Filters */}
      <ProfessionalCategoryFilter
        categories={categoryFilterData}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteItem}
        contentContainerStyle={styles.noteList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />

      {/* Floating Action Button - Only show when there are notes */}
      {notes.length > 0 && (
        <ProfessionalFAB 
          icon="add" 
          onPress={handleCreateNote} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  noteList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteTypeAndCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noteTypeIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '400',
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  audioDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  audioDurationText: {
    fontSize: 12,
    fontWeight: '400',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    minWidth: 140,
  },
});

export default NotesScreen;
