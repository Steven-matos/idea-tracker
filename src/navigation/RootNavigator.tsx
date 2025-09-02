import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, TouchableOpacity, View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import screens with updated names
import NotesListScreen from '../screens/NotesListScreen';
import CategoriesListScreen from '../screens/CategoriesListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NoteCreateScreen from '../screens/NoteCreateScreen';
import NoteEditScreen from '../screens/NoteEditScreen';
import NoteViewScreen from '../screens/NoteViewScreen';
import CategoryCreateScreen from '../screens/CategoryCreateScreen';

import { RootStackParamList, BottomTabParamList } from '../types';
import { useTheme } from '../contexts/theme.context';
import { CloudKitErrorBoundary } from '../components/common';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

/**
 * Custom centered button component for the bottom tab bar
 * Follows SOLID principles by having a single responsibility
 * Handles both note and category creation based on current tab
 */
const CenteredButton: React.FC<{ onPress: () => void; theme: any }> = ({ onPress, theme }) => (
  <TouchableOpacity
    style={[styles.centeredButton, { backgroundColor: '#2563EB' }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Ionicons name="add" size={36} color="#fff" />
  </TouchableOpacity>
  );

/**
 * Bottom tab navigator component with theme support
 * Contains the main app screens accessible via tabs
 * Implements SOLID principles by separating navigation concerns
 */
const TabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [currentTab, setCurrentTab] = React.useState<string>('Notes');

  /**
   * Handle + button press based on current tab
   * Follows DRY principle by centralizing navigation logic
   */
  const handleAddPress = () => {
    if (currentTab === 'Categories') {
      navigation.navigate('CreateCategory', {});
    } else {
      navigation.navigate('CreateNote');
    }
  };

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
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
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
        component={NotesListScreen}
        options={{ 
          headerShown: false, // Hide header/title only
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            setCurrentTab('Notes');
          },
        }}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoriesListScreen}
        options={{ 
          title: 'Categories',
          headerShown: false, // Hide header/title only
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'folder' : 'folder-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            setCurrentTab('Categories');
          },
        }}
      />
      <Tab.Screen 
        name="AddButton" 
        component={View} // Placeholder component for + button
        options={{ 
          title: '',
          headerShown: false,
          tabBarButton: () => (
            <CenteredButton 
              onPress={handleAddPress} 
              theme={theme}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleAddPress();
          },
        }}
      />
      <Tab.Screen 
        name="AI" 
        component={View} // Placeholder component
        options={{ 
          title: 'AI',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'sparkles' : 'sparkles-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            Alert.alert(
              'AI Feature',
              'This feature is coming soon! 🚀',
              [
                { text: 'OK', style: 'default' }
              ]
            );
          },
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          headerShown: false, // Hide header/title only
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'settings' : 'settings-outline'} 
              size={size} 
              color={color} 
            />
          ),
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
    <CloudKitErrorBoundary>
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
            component={NoteCreateScreen}
            options={{ 
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="CreateCategory" 
            component={CategoryCreateScreen}
            options={{ 
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="EditNote" 
            component={NoteEditScreen}
            options={{ 
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="ViewNote" 
            component={NoteViewScreen}
            options={{ 
              headerShown: false,
              presentation: 'modal',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </CloudKitErrorBoundary>
  );
};

const styles = StyleSheet.create({
  centeredButton: {
    position: 'absolute',
    left: '50%',
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: Platform.OS === 'ios' ? 25 : 0,
    transform: [
      { translateX: -36 }, // Center horizontally (half of width)
      { translateY: -25 }  // Move button up more
    ],
  },
});

export default AppNavigator;
