import { useState } from 'react';
import { Alert } from 'react-native';
import { Category } from '../types';
import { storageService } from '../services/storage.service';
import { generateId, isValidString } from '../utils';
import { COLOR_OPTIONS } from '../styles';

/**
 * Custom hook for managing category creation and selection
 * Follows DRY principle by centralizing category management logic
 * Implements SOLID principles with single responsibility for category operations
 */
export const useCategoryManager = () => {
  // Category creation state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#8B5CF6');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Use shared color options for consistency
  const colorOptions = COLOR_OPTIONS;

  /**
   * Create a new category
   * @param categories - Current list of categories to check for duplicates
   * @param onCategoryCreated - Callback when category is successfully created
   */
  const createNewCategory = async (
    categories: Category[],
    onCategoryCreated?: (newCategory: Category) => void
  ) => {
    try {
      if (!isValidString(newCategoryName)) {
        Alert.alert('Error', 'Please enter a category name.');
        return;
      }

      setIsCreatingCategory(true);

      // Check if category name already exists
      const existingCategory = categories.find(
        cat => cat.name.toLowerCase() === newCategoryName.toLowerCase()
      );
      
      if (existingCategory) {
        Alert.alert('Error', 'A category with this name already exists.');
        return;
      }

      // Create new category
      const newCategory: Category = {
        id: generateId(),
        name: newCategoryName.trim(),
        color: newCategoryColor,
        createdAt: new Date().toISOString(),
      };

      // Save to storage
      await storageService.addCategory(newCategory);

      // Call callback if provided
      if (onCategoryCreated) {
        onCategoryCreated(newCategory);
      }

      // Reset form and close modal
      resetCategoryForm();

      Alert.alert('Success', 'New category created successfully!');
      
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert('Error', 'Failed to create category. Please try again.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  /**
   * Reset category creation form
   */
  const resetCategoryForm = () => {
    setNewCategoryName('');
    setNewCategoryColor('#8B5CF6');
    setShowCategoryModal(false);
  };

  /**
   * Open category creation modal
   */
  const openCategoryModal = () => {
    setShowCategoryModal(true);
  };

  /**
   * Close category creation modal
   */
  const closeCategoryModal = () => {
    setShowCategoryModal(false);
  };

  return {
    // State
    showCategoryModal,
    newCategoryName,
    newCategoryColor,
    isCreatingCategory,
    colorOptions,
    
    // Actions
    setNewCategoryName,
    setNewCategoryColor,
    createNewCategory,
    resetCategoryForm,
    openCategoryModal,
    closeCategoryModal,
  };
};
