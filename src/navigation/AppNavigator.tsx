import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Import screens (we'll create these next)
import IdeasScreen from '../screens/IdeasScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreateIdeaScreen from '../screens/CreateIdeaScreen';
import EditIdeaScreen from '../screens/EditIdeaScreen';

import { RootStackParamList, BottomTabParamList } from '../types';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

/**
 * Bottom tab navigator component
 * Contains the main app screens accessible via tabs
 */
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Ideas':
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
        tabBarActiveTintColor: '#007AFF', // iOS blue
        tabBarInactiveTintColor: '#8E8E93', // iOS gray
        tabBarStyle: {
          backgroundColor: '#F2F2F7', // iOS light background
          borderTopWidth: 0.5,
          borderTopColor: '#C6C6C8',
          height: Platform.OS === 'ios' ? 90 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#F2F2F7',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '600',
          color: '#000000',
        },
      })}
    >
      <Tab.Screen 
        name="Ideas" 
        component={IdeasScreen}
        options={{ title: 'My Ideas' }}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoriesScreen}
        options={{ title: 'Categories' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

/**
 * Main app navigator component
 * Contains the tab navigator and modal screens
 */
const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#F2F2F7',
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '600',
            color: '#000000',
          },
          headerBackTitleVisible: false,
          headerTintColor: '#007AFF',
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateIdea" 
          component={CreateIdeaScreen}
          options={{ 
            title: 'New Idea',
            presentation: 'modal',
            headerLeft: () => null,
          }}
        />
        <Stack.Screen 
          name="EditIdea" 
          component={EditIdeaScreen}
          options={{ 
            title: 'Edit Idea',
            presentation: 'modal',
            headerLeft: () => null,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
