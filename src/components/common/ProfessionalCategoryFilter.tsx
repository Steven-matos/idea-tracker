import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  FlatList 
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for ProfessionalCategoryFilter component
 */
interface ProfessionalCategoryFilterProps {
  categories: Array<{ id: string; name: string; color: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'surface';
}

/**
 * ProfessionalCategoryFilter component with modern styling
 * Implements SOLID principles with single responsibility for category filtering
 * Follows DRY principle by centralizing filter styling logic
 * Uses KISS principle with simple, focused component design
 */
const ProfessionalCategoryFilter: React.FC<ProfessionalCategoryFilterProps> = ({
  categories,
  selectedId,
  onSelect,
  style,
  variant = 'surface'
}) => {
  const { theme } = useTheme();

  /**
   * Render individual category filter item
   */
  const renderCategoryItem = ({ item }: { item: { id: string; name: string; color: string } }) => {
    const isSelected = selectedId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          { 
            backgroundColor: isSelected ? item.color : theme.colors.surfaceVariant,
            borderColor: isSelected ? item.color : theme.colors.border
          },
        ]}
        onPress={() => onSelect(item.id)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.categoryText,
          { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.categoriesList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfessionalCategoryFilter;
