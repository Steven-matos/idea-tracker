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

// Import type definitions for categories
import { Category } from '../types';

// Import storage service for persistent data operations
import { storageService } from '../services';

// Import utility functions for ID generation, string validation, and color contrast  
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
  
  // Default color for new categories
  const defaultColor = '#8B5CF6';
  
  // Predefined color options matching CreateNoteScreen
  const colorOptions = [
    '#8B5CF6', // Purple
    '#3B82F6', // Blue  
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#8B5A2B', // Brown
  ];
  
  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const [isLoading, setIsLoading] = useState(false);

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
    setSelectedColor(defaultColor);
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
    setSelectedColor(defaultColor);
    setEditingCategory(null);
  };

  /**
   * Save category (add or edit)
   * Special handling for General category - only allow color changes, not name changes
   */
  const saveCategory = async () => {
    try {
      // For General category, skip name validation and duplicate checks
      const isGeneralCategory = editingCategory?.id === 'general';
      
      if (!isGeneralCategory && !isValidString(categoryName)) {
        Alert.alert('Error', 'Please enter a category name.');
        return;
      }

      // Check for duplicate names (excluding current category if editing)
      // Skip this check for General category since name won't change
      if (!isGeneralCategory) {
        const existingCategory = categories.find(
          cat => cat.name.toLowerCase() === categoryName.toLowerCase() && 
                 cat.id !== editingCategory?.id
        );

        if (existingCategory) {
          Alert.alert('Error', 'A category with this name already exists.');
          return;
        }
      }

      setIsLoading(true);

      if (editingCategory) {
        // Update existing category
        const updatedCategory: Category = {
          ...editingCategory,
          // For General category, keep original name; for others, use edited name
          name: isGeneralCategory ? editingCategory.name : categoryName.trim(),
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
      // Check if category is being used by any notes
      const notes = await storageService.getNotes();
      const notesInCategory = notes.filter(note => note.categoryId === category.id);
      
      const message = notesInCategory.length > 0 
        ? `Are you sure you want to delete "${category.name}"? ${notesInCategory.length} note(s) in this category will be moved to "General".`
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
                // First, move any notes with this category to "General"
                for (const note of notesInCategory) {
                  await storageService.updateNote({
                    ...note,
                    categoryId: 'general', // Move to General category
                    updatedAt: new Date().toISOString(),
                  });
                }
                
                // Then delete the category
                await storageService.deleteCategory(category.id);
                await loadCategories();
                
                // Show success message if notes were moved
                if (notesInCategory.length > 0) {
                  Alert.alert(
                    'Category Deleted', 
                    `"${category.name}" has been deleted and ${notesInCategory.length} note(s) moved to "General".`
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
   * Render color picker with predefined color options
   * Follows SOLID principles with single responsibility for color selection
   * Uses DRY principle by reusing the same color selection pattern as CreateNoteScreen
   * Implements KISS principle with simple color grid interface
   */
  const renderColorPicker = () => (
    <View style={styles.colorPicker}>
      <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Color</Text>
      <View style={styles.colorGrid}>
        {colorOptions.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColorOption
            ]}
            onPress={() => setSelectedColor(color)}
          >
            {selectedColor === color && (
              <Ionicons name="checkmark" size={16} color="#fff" />
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
        subtitle="Organize your notes"
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
              <Text style={[styles.cancelButton, { color: '#EF4444' }]}>Cancel</Text>
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
              {editingCategory?.id === 'general' ? (
                // Disabled input for General category with explanation
                <View>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: theme.colors.border,
                      color: theme.colors.textSecondary,
                      borderColor: theme.colors.border,
                      shadowColor: theme.colors.shadow
                    }]}
                    value={categoryName}
                    editable={false}
                    placeholder="Category name"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                  <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                    The General category name cannot be changed
                  </Text>
                </View>
              ) : (
                // Editable input for all other categories
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
              )}
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
  helperText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  colorPicker: {
    marginBottom: 32,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedColorOption: {
    borderColor: '#fff',
    borderWidth: 3,
    elevation: 4,
    shadowOpacity: 0.3,
  },
});

export default CategoriesScreen;
