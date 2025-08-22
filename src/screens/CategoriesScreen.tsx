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
import { useTheme } from '../contexts/ThemeContext';
import { 
  GradientCard, 
  ProfessionalButton, 
  ProfessionalHeader, 
  ProfessionalFAB 
} from '../components/common';

/**
 * Screen for managing categories
 */
const CategoriesScreen: React.FC = () => {
  const { theme } = useTheme();
  
  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6B7280'); // Updated to neutral color
  const [isLoading, setIsLoading] = useState(false);

  // Predefined colors for categories - neutral palette
  const categoryColors = [
    '#6B7280', // Gray
    '#9CA3AF', // Slate
    '#D1D5DB', // Light Gray
    '#4B5563', // Dark Gray
    '#F3F4F6', // Very Light Gray
    '#374151', // Charcoal
    '#8B5CF6', // Subtle Purple
    '#A78BFA', // Light Purple
    '#E9D5FF', // Very Light Purple
    '#6B7280', // Medium Gray
    '#9CA3AF', // Light Slate
    '#D1D5DB', // Pale Gray
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
      <GradientCard variant="surface" elevated>
        <View style={styles.categoryInfo}>
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
          <View style={styles.categoryDetails}>
            <Text style={[styles.categoryName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.categoryDate, { color: theme.colors.textSecondary }]}>
              Created {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          
          {/* Don't allow deletion of the General category */}
          {item.id !== 'general' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteCategory(item)}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </GradientCard>
    );
  };

  /**
   * Render color picker
   */
  const renderColorPicker = () => (
    <View style={styles.colorPicker}>
      <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Color</Text>
      <View style={styles.colorGrid}>
        {categoryColors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && { 
                borderColor: theme.colors.surface,
                shadowColor: theme.colors.shadow
              },
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
      <Ionicons name="folder-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.textSecondary }]}>
        No Categories
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Professional Header */}
      <ProfessionalHeader
        title="Categories"
        subtitle="Organize your ideas"
        variant="primary"
      />

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
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Professional Floating Action Button */}
      <ProfessionalFAB 
        icon="add" 
        onPress={openAddModal} 
      />

      {/* Add/Edit Category Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { 
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border 
          }]}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>
            <TouchableOpacity onPress={saveCategory} disabled={isLoading}>
              <Text style={[
                styles.saveButton, 
                { color: theme.colors.primary },
                isLoading && { color: theme.colors.textSecondary }
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Name</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow
                }]}
                placeholder="Category name"
                value={categoryName}
                onChangeText={setCategoryName}
                placeholderTextColor={theme.colors.textSecondary}
                maxLength={30}
              />
            </View>

            {renderColorPicker()}

            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Preview</Text>
              <View style={[styles.previewContainer, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow
              }]}>
                <View style={[styles.colorIndicator, { backgroundColor: selectedColor }]} />
                <Text style={[styles.previewText, { color: theme.colors.text }]}>
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
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
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
    marginBottom: 2,
  },
  categoryDate: {
    fontSize: 13,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
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
    marginBottom: 12,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
    borderWidth: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewSection: {
    marginBottom: 32,
  },
  previewContainer: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  previewText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default CategoriesScreen;
