import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import type definitions for categories
import { Category } from '../types';

// Import storage service for persistent data operations
import { storageService } from '../services';

// Import utility functions for ID generation, string validation, and color contrast  
import { generateId, isValidString } from '../utils';
import { useTheme } from '../contexts/theme.context';
import { 
  ColorPicker
} from '../components/common';
import { COLOR_OPTIONS, Spacing, TextStyles, Colors } from '../styles';

/**
 * Screen for creating new categories
 * Follows SOLID principles by having a single responsibility
 */
const CategoryCreateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  
  // Default color for new categories
  const defaultColor = '#8B5CF6';
  
  // Use shared color options for consistency
  const colorOptions = COLOR_OPTIONS;
  
  // State management
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Save new category
   * Follows DRY principle by reusing validation logic
   */
  const saveCategory = async () => {
    try {
      if (!isValidString(categoryName)) {
        Alert.alert('Error', 'Please enter a category name.');
        return;
      }

      setIsLoading(true);

      // Create new category
      const newCategory: Category = {
        id: generateId(),
        name: categoryName.trim(),
        color: selectedColor,
        createdAt: new Date().toISOString(),
      };
      
      await storageService.addCategory(newCategory);
      
      // Navigate back
      navigation.goBack();
      
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'Failed to save category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Action Bar at Top */}
      <View style={[styles.actionBar, {
        backgroundColor: theme.colors.background,
        borderBottomColor: theme.colors.border
      }]}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.cancelButton, { color: Colors.ERROR_RED }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.actionBarTitle, { color: theme.colors.text }]}>
          New Category
        </Text>
        <TouchableOpacity
          onPress={saveCategory}
          disabled={isLoading || !categoryName.trim()}
        >
          <Text style={[
            styles.saveButton,
            { color: theme.colors.primary },
            (isLoading || !categoryName.trim()) && { color: theme.colors.textSecondary }
          ]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Name Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
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
            autoFocus
          />
        </View>

        {/* Color Picker */}
        <View style={styles.colorSection}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Color</Text>
          <ColorPicker
            label=""
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
            colors={colorOptions}
            style={styles.colorPicker}
          />
        </View>

        {/* Preview */}
        <View style={styles.previewSection}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Preview</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.BASE,
    paddingTop: 60,
    paddingBottom: Spacing.BASE,
    borderBottomWidth: 0.5,
  },
  actionBarTitle: {
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.BASE,
    paddingTop: Spacing.BASE,
  },
  inputSection: {
    marginBottom: Spacing.XXL,
  },
  colorSection: {
    marginBottom: Spacing.XXL,
  },
  label: {
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
  colorPicker: {
    marginTop: Spacing.SM,
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
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: Spacing.MD,
  },
  previewText: {
    ...TextStyles.bodyMedium,
    fontSize: 17,
  },
});

export default CategoryCreateScreen;
