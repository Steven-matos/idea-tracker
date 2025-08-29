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
import { storageService } from '../services/storage.service';
import { formatDate, truncateText, filterBySearchText, getLightColor } from '../utils';
import { useTheme } from '../contexts/theme.context';
import { useAsyncOperation } from '../hooks';
import { 
  GradientCard, 
  ProfessionalButton, 
  ProfessionalHeader, 
  ProfessionalSearchInput, 
  ProfessionalCategoryFilter, 
  EmptyState,
  ActionButton
} from '../components/common';
import { Spacing, TextStyles, Colors } from '../styles';

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
      filtered = filterBySearchText(filtered, searchText, ['label', 'content']);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredNotes(filtered);
  }, [notes, searchText, selectedCategoryId]);



  /**
   * Navigate to view note screen
   */
  const handleViewNote = (note: Note) => {
    navigation.navigate('ViewNote', { noteId: note.id });
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
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleViewNote(item)}
        style={styles.noteTouchable}
      >
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
            {item.label}
          </Text>
          
          {item.type === 'voice' && item.audioDuration && (
            <View style={styles.audioDuration}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.audioDurationText, { color: theme.colors.textSecondary }]}>
                {Math.floor(item.audioDuration / 60)}:{(item.audioDuration % 60).toFixed(0).padStart(2, '0')}
              </Text>
            </View>
          )}
          
          {/* View indicator */}
          <View style={styles.viewIndicator}>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </View>
        </GradientCard>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state when no notes exist
   * Uses shared EmptyState component for consistency
   */
  const renderEmptyState = () => (
    <EmptyState
      icon="bulb-outline"
      title="No Notes Yet"
      subtitle="Start capturing your thoughts by creating your first note"
      actionText="Create Note"
      onAction={handleCreateNote}
      actionVariant="primary"
    />
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


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.BASE,
  },
  noteList: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: 100,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  noteTypeAndCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  categoryText: {
    ...TextStyles.label,
  },
  noteTypeIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    ...TextStyles.label,
  },
  noteContent: {
    ...TextStyles.body,
    marginBottom: Spacing.MD,
  },
  audioDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
    marginBottom: Spacing.MD,
  },
  audioDurationText: {
    ...TextStyles.label,
  },
  noteTouchable: {
    marginBottom: Spacing.MD,
  },
  viewIndicator: {
    alignItems: 'flex-end',
    marginTop: Spacing.SM,
  },
});

export default NotesScreen;
