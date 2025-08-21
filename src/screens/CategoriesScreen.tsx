import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Category } from '../types';
import { storageService } from '../services/StorageService';
import { generateId, isValidString, getContrastColor } from '../utils';

/**
 * Screen for managing categories
 */
const CategoriesScreen: React.FC = () => {
  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#007AFF');
  const [isLoading, setIsLoading] = useState(false);

  // Predefined colors for categories
  const categoryColors = [
    '#007AFF', // Blue
    '#34C759', // Green
    '#FF9500', // Orange
    '#FF3B30', // Red
    '#AF52DE', // Purple
    '#FF2D92', // Pink
    '#5AC8FA', // Light Blue
    '#FFCC00', // Yellow
    '#FF6B35', // Red Orange
    '#32D74B', // Light Green
    '#BF5AF2', // Light Purple
    '#6AC4DC', // Cyan
  ];

  /**
   * Load categories from storage
   */
  const loadCategories = async () => {
    try {
      const categoriesData = await storageService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    }
  };

  /**
   * Refresh categories from storage
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCategories();
    setIsRefreshing(false);
  };

  /**
   * Open add category modal
   */
  const openAddModal = () => {
    setCategoryName('');
    setSelectedColor(categoryColors[0]);
    setEditingCategory(null);
    setShowAddModal(true);
  };

  /**
   * Open edit category modal
   */
  const openEditModal = (category: Category) => {
    setCategoryName(category.name);
    setSelectedColor(category.color);
    setEditingCategory(category);
    setShowAddModal(true);
  };

  /**
   * Close modal and reset state
   */
  const closeModal = () => {
    setShowAddModal(false);
    setCategoryName('');
    setSelectedColor(categoryColors[0]);
    setEditingCategory(null);
  };

  /**
   * Save category (add or edit)
   */
  const saveCategory = async () => {
    try {
      if (!isValidString(categoryName)) {
        Alert.alert('Error', 'Please enter a category name.');
        return;
      }

      // Check for duplicate names (excluding current category if editing)
      const existingCategory = categories.find(
        cat => cat.name.toLowerCase() === categoryName.toLowerCase() && 
               cat.id !== editingCategory?.id
      );

      if (existingCategory) {
        Alert.alert('Error', 'A category with this name already exists.');
        return;
      }

      setIsLoading(true);

      if (editingCategory) {
        // Update existing category
        const updatedCategory: Category = {
          ...editingCategory,
          name: categoryName.trim(),
          color: selectedColor,
        };
        
        await storageService.updateCategory(updatedCategory);
      } else {
        // Add new category
        const newCategory: Category = {
          id: generateId(),
          name: categoryName.trim(),
          color: selectedColor,
          createdAt: new Date().toISOString(),
        };
        
        await storageService.addCategory(newCategory);
      }

      await loadCategories();
      closeModal();
      
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'Failed to save category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete category with confirmation
   */
  const deleteCategory = async (category: Category) => {
    try {
      // Check if category is being used by any ideas
      const ideas = await storageService.getIdeas();
      const ideasInCategory = ideas.filter(idea => idea.categoryId === category.id);
      
      const message = ideasInCategory.length > 0 
        ? `Are you sure you want to delete "${category.name}"? ${ideasInCategory.length} idea(s) in this category will be moved to "General".`
        : `Are you sure you want to delete "${category.name}"?`;
      
      Alert.alert(
        'Delete Category',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // First, move any ideas with this category to "General"
                for (const idea of ideasInCategory) {
                  await storageService.updateIdea({
                    ...idea,
                    categoryId: 'general', // Move to General category
                    updatedAt: new Date().toISOString(),
                  });
                }
                
                // Then delete the category
                await storageService.deleteCategory(category.id);
                await loadCategories();
                
                // Show success message if ideas were moved
                if (ideasInCategory.length > 0) {
                  Alert.alert(
                    'Category Deleted', 
                    `"${category.name}" has been deleted and ${ideasInCategory.length} idea(s) moved to "General".`
                  );
                }
                
              } catch (error) {
                console.error('Error deleting category:', error);
                Alert.alert('Error', 'Failed to delete category. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error checking category usage:', error);
      Alert.alert('Error', 'Failed to check category usage. Please try again.');
    }
  };

  /**
   * Render individual category item
   */
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const textColor = getContrastColor(item.color);
    
    return (
      <View style={styles.categoryItem}>
        <View style={styles.categoryInfo}>
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryDate}>
              Created {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          {/* Don't allow deletion of the General category */}
          {item.id !== 'general' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteCategory(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render color picker
   */
  const renderColorPicker = () => (
    <View style={styles.colorPicker}>
      <Text style={styles.modalLabel}>Color</Text>
      <View style={styles.colorGrid}>
        {categoryColors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColorOption,
            ]}
            onPress={() => setSelectedColor(color)}
          >
            {selectedColor === color && (
              <Ionicons name="checkmark" size={16} color={getContrastColor(color)} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Categories</Text>
      <Text style={styles.emptyStateSubtitle}>
        Tap the + button to create your first category
      </Text>
    </View>
  );

  // Load categories when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Categories List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.categoriesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add/Edit Category Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>
            <TouchableOpacity onPress={saveCategory} disabled={isLoading}>
              <Text style={[styles.saveButton, isLoading && styles.disabledButton]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Category name"
                value={categoryName}
                onChangeText={setCategoryName}
                placeholderTextColor="#C7C7CC"
                maxLength={30}
              />
            </View>

            {renderColorPicker()}

            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.modalLabel}>Preview</Text>
              <View style={styles.previewContainer}>
                <View style={[styles.colorIndicator, { backgroundColor: selectedColor }]} />
                <Text style={styles.previewText}>
                  {categoryName.trim() || 'Category name'}
                </Text>
              </View>
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
    backgroundColor: '#F2F2F7',
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 120, // Space for FAB
  },
  categoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  categoryDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputSection: {
    marginBottom: 32,
  },
  modalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorPicker: {
    marginBottom: 32,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowOpacity: 0.3,
  },
  previewSection: {
    marginBottom: 32,
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previewText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
});

export default CategoriesScreen;
