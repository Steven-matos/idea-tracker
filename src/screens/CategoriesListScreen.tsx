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

// Import utility functions for string validation and color contrast  
import { isValidString, getContrastColor } from '../utils';
import { useTheme } from '../contexts/theme.context';
import { useAsyncOperation } from '../hooks';
import { 
  GradientCard, 
  ProfessionalButton, 
  ProfessionalHeader, 
  EmptyState,
  ActionButton,
  ColorPicker
} from '../components/common';
import { COLOR_OPTIONS, Spacing, TextStyles, Colors } from '../styles';

/**
 * Screen for managing categories
 */
const CategoriesScreen: React.FC = () => {
  const { theme } = useTheme();
  
  // Default color for editing categories
  const defaultColor = '#8B5CF6';
  
  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
   * Open edit category modal
   */
  const openEditModal = (category: Category) => {
    setCategoryName(category.name);
    setSelectedColor(category.color);
    setEditingCategory(category);
  };

  /**
   * Close modal and reset state
   */
  const closeModal = () => {
    setCategoryName('');
    setSelectedColor(defaultColor);
    setEditingCategory(null);
  };

  /**
   * Save category (edit only)
   * Special handling for General category - only allow color changes, not name changes
   */
  const saveCategory = async () => {
    try {
      if (!editingCategory) return;
      
      // For General category, skip name validation and duplicate checks
      const isGeneralCategory = editingCategory.id === 'general';
      
      if (!isGeneralCategory && !isValidString(categoryName)) {
        Alert.alert('Error', 'Please enter a category name.');
        return;
      }

      // Check for duplicate names (excluding current category if editing)
      // Skip this check for General category since name won't change
      if (!isGeneralCategory) {
        const existingCategory = categories.find(
          cat => cat.name.toLowerCase() === categoryName.toLowerCase() && 
                 cat.id !== editingCategory.id
        );

        if (existingCategory) {
          Alert.alert('Error', 'A category with this name already exists.');
          return;
        }
      }

      setIsLoading(true);

      // Update existing category
      const updatedCategory: Category = {
        ...editingCategory,
        // For General category, keep original name; for others, use edited name
        name: isGeneralCategory ? editingCategory.name : categoryName.trim(),
        color: selectedColor,
      };
      
      await storageService.updateCategory(updatedCategory);
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
   * Render color picker using shared ColorPicker component
   * Uses shared component for consistency and DRY principles
   */
  const renderColorPicker = () => (
    <ColorPicker
      label="Color"
      selectedColor={selectedColor}
      onColorSelect={setSelectedColor}
      colors={COLOR_OPTIONS}
      style={styles.colorPicker}
    />
  );

  /**
   * Render empty state using shared EmptyState component
   */
  const renderEmptyState = () => (
    <EmptyState
      icon="folder-outline"
      title="No Categories"
      subtitle="Tap the + button to create your first category"
    />
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

      {/* + Button is now handled by navigation bar */}

      {/* Edit Category Modal */}
      <Modal
        visible={editingCategory !== null}
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
              <Text style={[styles.cancelButton, { color: Colors.ERROR_RED }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Edit Category
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
    paddingHorizontal: Spacing.BASE,
    paddingVertical: Spacing.BASE,
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
    marginRight: Spacing.MD,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    ...TextStyles.bodyMedium,
    fontSize: 17,
    marginBottom: 2,
  },
  categoryDate: {
    ...TextStyles.caption,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: Spacing.SM,
    marginLeft: Spacing.SM,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.BASE,
    paddingTop: 60,
    paddingBottom: Spacing.BASE,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    ...TextStyles.bodyMedium,
    fontSize: 17,
  },
  cancelButton: {
    ...TextStyles.body,
    fontSize: 17,
  },
  saveButton: {
    ...TextStyles.bodyMedium,
    fontSize: 17,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.BASE,
    paddingTop: Spacing.BASE,
  },
  inputSection: {
    marginBottom: Spacing.XXL,
  },
  modalLabel: {
    ...TextStyles.bodyMedium,
    fontSize: 17,
    marginBottom: Spacing.MD,
  },
  textInput: {
    borderRadius: 12,
    padding: Spacing.BASE,
    fontSize: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  helperText: {
    ...TextStyles.label,
    marginTop: 6,
    fontStyle: 'italic',
  },
  colorPicker: {
    marginBottom: Spacing.XXL,
  },
  previewSection: {
    marginBottom: Spacing.XXL,
  },
  previewContainer: {
    borderRadius: 12,
    padding: Spacing.BASE,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  previewText: {
    ...TextStyles.bodyMedium,
    fontSize: 17,
    marginLeft: Spacing.MD,
  },
});

export default CategoriesScreen;
