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

import { Idea, Category, IdeaFilters, RootStackParamList } from '../types';
import { storageService } from '../services/StorageService';
import { formatDate, truncateText, filterBySearchText, getLightColor } from '../utils';

type IdeasScreenNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Main screen displaying list of ideas with search and filter functionality
 */
const IdeasScreen: React.FC = () => {
  const navigation = useNavigation<IdeasScreenNavigationProp>();
  
  // State management
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Load data from storage
   */
  const loadData = async () => {
    try {
      const [ideasData, categoriesData] = await Promise.all([
        storageService.getIdeas(),
        storageService.getCategories(),
      ]);
      
      setIdeas(ideasData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load ideas. Please try again.');
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
   * Filter ideas based on search text and selected category
   */
  const applyFilters = useCallback(() => {
    let filtered = [...ideas];

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(idea => idea.categoryId === selectedCategoryId);
    }

    // Filter by search text
    if (searchText.trim()) {
      filtered = filterBySearchText(filtered, searchText, ['content']);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredIdeas(filtered);
  }, [ideas, searchText, selectedCategoryId]);

  /**
   * Delete an idea with confirmation
   */
  const handleDeleteIdea = (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    Alert.alert(
      'Delete Idea',
      `Are you sure you want to delete "${truncateText(idea.content, 50)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteIdea(ideaId);
              await loadData();
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
   * Navigate to edit idea screen
   */
  const handleEditIdea = (ideaId: string) => {
    navigation.navigate('EditIdea', { ideaId });
  };

  /**
   * Navigate to create idea screen
   */
  const handleCreateIdea = () => {
    navigation.navigate('CreateIdea', { 
      categoryId: selectedCategoryId || undefined 
    });
  };

  /**
   * Get category by ID
   */
  const getCategoryById = (categoryId: string): Category | undefined => {
    return categories.find(cat => cat.id === categoryId);
  };

  /**
   * Render individual idea item
   */
  const renderIdeaItem = ({ item }: { item: Idea }) => {
    const category = getCategoryById(item.categoryId);
    
    return (
      <TouchableOpacity
        style={styles.ideaItem}
        onPress={() => handleEditIdea(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.ideaHeader}>
          <View style={styles.ideaTypeAndCategory}>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: category ? getLightColor(category.color, 0.2) : getLightColor('#6B7280', 0.2) }
            ]}>
              <Text style={[
                styles.categoryText,
                { color: category?.color || '#6B7280' }
              ]}>
                {category?.name || 'Unknown'}
              </Text>
            </View>
            <View style={styles.ideaTypeIcon}>
              <Ionicons 
                name={item.type === 'voice' ? 'mic' : 'document-text'} 
                size={16} 
                color="#8E8E93" 
              />
            </View>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <Text style={styles.ideaContent} numberOfLines={3}>
          {item.content}
        </Text>
        
        {item.type === 'voice' && item.audioDuration && (
          <View style={styles.audioDuration}>
            <Ionicons name="time-outline" size={14} color="#8E8E93" />
            <Text style={styles.audioDurationText}>
              {Math.floor(item.audioDuration / 60)}:{(item.audioDuration % 60).toFixed(0).padStart(2, '0')}
            </Text>
          </View>
        )}
        
        <View style={styles.ideaActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditIdea(item.id)}
          >
            <Ionicons name="create-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteIdea(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render category filter button
   */
  const renderCategoryFilter = ({ item }: { item: Category | { id: '', name: 'All', color: '#000' } }) => {
    const isSelected = selectedCategoryId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryFilter,
          isSelected && { backgroundColor: item.color },
        ]}
        onPress={() => setSelectedCategoryId(item.id)}
      >
        <Text style={[
          styles.categoryFilterText,
          isSelected && { color: '#FFFFFF' },
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bulb-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Ideas Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Tap the + button to create your first idea
      </Text>
    </View>
  );

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Prepare category filter data
  const categoryFilterData = [
    { id: '', name: 'All', color: '#000' },
    ...categories,
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ideas..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#8E8E93"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoryFilterData}
          keyExtractor={(item) => item.id || 'all'}
          renderItem={renderCategoryFilter}
          contentContainerStyle={styles.categoryFilters}
        />
      </View>

      {/* Ideas List */}
      <FlatList
        data={filteredIdeas}
        keyExtractor={(item) => item.id}
        renderItem={renderIdeaItem}
        contentContainerStyle={styles.ideaList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateIdea}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000000',
  },
  filtersContainer: {
    paddingBottom: 8,
  },
  categoryFilters: {
    paddingHorizontal: 16,
  },
  categoryFilter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  ideaList: {
    paddingHorizontal: 16,
    paddingBottom: 120, // Space for FAB
  },
  ideaItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ideaTypeAndCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ideaTypeIcon: {
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
  },
  ideaContent: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 8,
  },
  audioDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  audioDurationText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  ideaActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingTop: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 40 : 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default IdeasScreen;
