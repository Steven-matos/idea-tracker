import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Import screens (we'll create these next)
import NotesScreen from '../screens/NotesScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreateNoteScreen from '../screens/CreateNoteScreen';
import EditNoteScreen from '../screens/EditNoteScreen';

import { RootStackParamList, BottomTabParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

/**
 * Bottom tab navigator component with theme support
 * Contains the main app screens accessible via tabs
 * Implements SOLID principles by separating navigation concerns
 */
const TabNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Notes':
              iconName = focused ? 'bulb' : 'bulb-outline';
              break;
            case 'Categories':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0.5,
          borderTopColor: theme.colors.border,
          height: Platform.OS === 'ios' ? 90 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '600',
          color: theme.colors.text,
        },
      })}
    >
      {/* 
        Tab screens are intentionally not rendered to hide them from the tab bar.
        If you want to conditionally hide/show tabs, you can use listeners or set tabBarButton to () => null.
        Example for hiding all tabs:
      */}
      {/* 
        Hide tab bar buttons and also hide the header for all tab screens to prevent "Notes" or any tab name from showing at the top.
        This follows KISS and DRY by centralizing the header hiding logic.
      */}
      {/* 
        Tab screens with header hidden to remove the label at the top,
        but keep the tab bar visible. Follows KISS and DRY by only overriding headerShown.
      */}
      <Tab.Screen 
        name="Notes" 
        component={NotesScreen}
        options={{ 
          headerShown: false // Hide header/title only
        }}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoriesScreen}
        options={{ 
          title: 'Categories',
          headerShown: false // Hide header/title only
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          headerShown: false // Hide header/title only
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Main app navigator component with theme support
 * Contains the tab navigator and modal screens
 * Follows DRY principle by centralizing navigation theme configuration
 */
const AppNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();

  // Create custom navigation theme based on app theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '600',
            color: theme.colors.text,
          },
          // headerBackTitleVisible: false, // Deprecated in newer versions
          headerTintColor: theme.colors.primary,
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateNote" 
          component={CreateNoteScreen}
          options={{ 
            title: 'New Note',
            presentation: 'modal',
            headerLeft: () => null,
          }}
        />
        <Stack.Screen 
          name="EditNote" 
          component={EditNoteScreen}
          options={{ 
            title: 'Edit Note',
            presentation: 'modal',
            headerLeft: () => null,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
