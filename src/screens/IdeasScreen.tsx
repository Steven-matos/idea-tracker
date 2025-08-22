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
import { useTheme } from '../contexts/ThemeContext';
import { GradientCard, ProfessionalButton, ProfessionalHeader, ProfessionalSearchInput, ProfessionalCategoryFilter, ProfessionalFAB } from '../components/common';

type IdeasScreenNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Main screen displaying list of ideas with search and filter functionality
 */
const IdeasScreen: React.FC = () => {
  const navigation = useNavigation<IdeasScreenNavigationProp>();
  const { theme } = useTheme();
  
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
    const category = categories.find(c => c.id === item.categoryId);
    
    return (
      <GradientCard variant="surface" elevated>
        <View style={styles.ideaHeader}>
          <View style={styles.ideaTypeAndCategory}>
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
            <View style={styles.ideaTypeIcon}>
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
        
        <Text style={[styles.ideaContent, { color: theme.colors.text }]} numberOfLines={3}>
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
        
        <View style={[styles.ideaActions, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditIdea(item.id)}
          >
            <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteIdea(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </GradientCard>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bulb-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.textSecondary }]}>
        No Ideas Yet
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>
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
  const categoryFilterData: Array<Category | { id: '', name: 'All', color: '#000' }> = [
    { id: '', name: 'All', color: '#000' },
    ...categories,
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Professional Header */}
      <ProfessionalHeader
        title="My Ideas"
        subtitle="Capture and organize your thoughts"
        variant="primary"
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <ProfessionalSearchInput
          placeholder="Search ideas..."
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
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />

      {/* Floating Action Button */}
      <ProfessionalFAB 
        icon="add" 
        onPress={handleCreateIdea} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  ideaList: {
    paddingBottom: 100,
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
    fontWeight: '400',
  },
  ideaContent: {
    fontSize: 16,
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
    marginLeft: 4,
  },
  ideaActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 0.5,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default IdeasScreen;
