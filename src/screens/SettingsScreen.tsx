import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { AppSettings, ThemeMode } from '../types';
import { storageService } from '../services/StorageService';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Screen for app settings and preferences
 * Implements SOLID principles with single responsibility for settings management
 */
const SettingsScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  
  // State management
  const [settings, setSettings] = useState<AppSettings>({
    defaultCategoryId: 'general',
    audioQuality: 'medium',
    showTutorial: true,
    themeMode: 'system',
  });
  const [categories, setCategories] = useState<any[]>([]);

  /**
   * Load settings and categories from storage
   */
  const loadData = async () => {
    try {
      const [settingsData, categoriesData] = await Promise.all([
        storageService.getSettings(),
        storageService.getCategories(),
      ]);
      
      setSettings(settingsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings.');
    }
  };

  /**
   * Save settings to storage
   */
  const saveSettings = async (updatedSettings: AppSettings) => {
    try {
      await storageService.storeSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  /**
   * Update audio quality setting
   */
  const updateAudioQuality = (quality: 'low' | 'medium' | 'high') => {
    const updatedSettings = { ...settings, audioQuality: quality };
    saveSettings(updatedSettings);
  };

  /**
   * Update default category setting
   */
  const updateDefaultCategory = (categoryId: string) => {
    const updatedSettings = { ...settings, defaultCategoryId: categoryId };
    saveSettings(updatedSettings);
  };

  /**
   * Toggle tutorial setting
   */
  const toggleTutorial = (value: boolean) => {
    const updatedSettings = { ...settings, showTutorial: value };
    saveSettings(updatedSettings);
  };

  /**
   * Update theme mode setting
   * Follows DRY principle by reusing the theme context setter
   */
  const updateThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    const updatedSettings = { ...settings, themeMode: mode };
    setSettings(updatedSettings);
  };

  /**
   * Get theme mode display text
   * Implements KISS principle with simple text mapping
   */
  const getThemeModeText = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  /**
   * Clear all data with confirmation
   */
  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all ideas and reset the app? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearAllData();
              await storageService.initializeStorage();
              await loadData();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  /**
   * Show app info
   */
  const showAppInfo = () => {
    Alert.alert(
      'Idea Tracker',
      'Version 1.0.0\n\nA simple app to track your ideas with text and voice notes.\n\nBuilt with React Native and Expo.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Render setting row with theme support
   * Follows DRY principle by centralizing row rendering logic
   */
  const renderSettingRow = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: theme.isDark ? theme.colors.border : '#E3F2FD' }]}>
          <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (onPress && (
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      ))}
    </TouchableOpacity>
  );

  /**
   * Render section header with theme support
   */
  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>{title}</Text>
  );

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const defaultCategory = categories.find(cat => cat.id === settings.defaultCategoryId);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Appearance Settings */}
      {renderSectionHeader('Appearance')}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        {renderSettingRow(
          theme.isDark ? 'moon' : 'sunny',
          'Theme',
          getThemeModeText(themeMode),
          () => {
            Alert.alert(
              'Theme',
              'Choose your preferred theme:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Light', onPress: () => updateThemeMode('light') },
                { text: 'Dark', onPress: () => updateThemeMode('dark') },
                { text: 'System', onPress: () => updateThemeMode('system') },
              ]
            );
          }
        )}
      </View>

      {/* General Settings */}
      {renderSectionHeader('General')}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        {renderSettingRow(
          'folder-outline',
          'Default Category',
          defaultCategory?.name || 'General',
          () => {
            Alert.alert(
              'Default Category',
              'Choose the default category for new ideas:',
              [
                { text: 'Cancel', style: 'cancel' },
                ...categories.map(category => ({
                  text: category.name,
                  onPress: () => updateDefaultCategory(category.id),
                })),
              ]
            );
          }
        )}
        
        {renderSettingRow(
          'volume-high-outline',
          'Audio Quality',
          settings.audioQuality.charAt(0).toUpperCase() + settings.audioQuality.slice(1),
          () => {
            Alert.alert(
              'Audio Quality',
              'Choose the audio recording quality:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Low', onPress: () => updateAudioQuality('low') },
                { text: 'Medium', onPress: () => updateAudioQuality('medium') },
                { text: 'High', onPress: () => updateAudioQuality('high') },
              ]
            );
          }
        )}
        
        {renderSettingRow(
          'help-circle-outline',
          'Show Tutorial',
          'Show tutorial on app start',
          undefined,
          <Switch
            value={settings.showTutorial}
            onValueChange={toggleTutorial}
            trackColor={{ false: theme.colors.border, true: theme.colors.success }}
            thumbColor={theme.colors.surface}
          />
        )}
      </View>

      {/* Storage */}
      {renderSectionHeader('Storage')}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        {renderSettingRow(
          'trash-outline',
          'Clear All Data',
          'Delete all ideas and reset app',
          clearAllData
        )}
      </View>

      {/* About */}
      {renderSectionHeader('About')}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        {renderSettingRow(
          'information-circle-outline',
          'App Information',
          'Version and details',
          showAppInfo
        )}
        
        {renderSettingRow(
          'star-outline',
          'Rate App',
          'Leave a review on the App Store',
          () => {
            Alert.alert(
              'Rate App',
              'Thank you for using Idea Tracker! Rating and reviews help us improve the app.',
              [{ text: 'OK' }]
            );
          }
        )}
        
        {renderSettingRow(
          'mail-outline',
          'Contact Support',
          'Get help or send feedback',
          () => {
            Alert.alert(
              'Contact Support',
              'For support or feedback, please email us at support@ideatracker.app',
              [{ text: 'OK' }]
            );
          }
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Made with ❤️ for organizing your ideas
        </Text>
        <Text style={[styles.footerVersion, { color: theme.colors.textSecondary }]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerVersion: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SettingsScreen;
