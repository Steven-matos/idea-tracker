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

import { AppSettings } from '../types';
import { storageService } from '../services/StorageService';

/**
 * Screen for app settings and preferences
 */
const SettingsScreen: React.FC = () => {
  // State management
  const [settings, setSettings] = useState<AppSettings>({
    defaultCategoryId: 'general',
    audioQuality: 'medium',
    showTutorial: true,
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
   * Render setting row
   */
  const renderSettingRow = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={20} color="#007AFF" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (onPress && (
        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
      ))}
    </TouchableOpacity>
  );

  /**
   * Render section header
   */
  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const defaultCategory = categories.find(cat => cat.id === settings.defaultCategoryId);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* General Settings */}
      {renderSectionHeader('General')}
      <View style={styles.section}>
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
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        )}
      </View>

      {/* Storage */}
      {renderSectionHeader('Storage')}
      <View style={styles.section}>
        {renderSettingRow(
          'trash-outline',
          'Clear All Data',
          'Delete all ideas and reset app',
          clearAllData
        )}
      </View>

      {/* About */}
      {renderSectionHeader('About')}
      <View style={styles.section}>
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
        <Text style={styles.footerText}>
          Made with ❤️ for organizing your ideas
        </Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E5E5EA',
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
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    color: '#000000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerVersion: {
    fontSize: 12,
    color: '#C7C7CC',
    textAlign: 'center',
  },
});

export default SettingsScreen;
