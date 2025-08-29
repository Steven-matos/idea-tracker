# Note Taker

A React Native application built with Expo for capturing and organizing your ideas. Create text-based ideas or record voice notes, organize them with customizable categories, and manage them locally on your device with a beautiful iOS-inspired interface.

## Features

### ✨ Core Features
- **Text Ideas**: Create and edit text-based ideas and thoughts
- **Voice Ideas**: Record voice notes with playback functionality
- **Categories**: Organize ideas with customizable color-coded categories
- **Local Storage**: All data stored locally on device (no backend required)
- **Search & Filter**: Find ideas by content or category
- **iOS-Inspired Design**: Beautiful native iOS design patterns and interactions

### 📱 User Interface
- Clean, modern iOS-inspired design with proper navigation
- Tab-based navigation for seamless app experience
- Modal screens for creating and editing ideas
- Intuitive voice recording with visual feedback
- Professional color-coded category system
- Pull-to-refresh functionality
- Floating Action Button for quick idea creation

### 🎙️ Voice Recording Features
- High-quality audio recording with expo-audio
- Real-time duration display during recording
- Playback controls for voice ideas
- Automatic file management and cleanup
- Configurable recording quality settings

### 📂 Category Management
- Create unlimited custom categories with color selection
- Edit existing categories with color picker
- Default "General" category (cannot be deleted)
- Advanced category-based filtering
- Visual category indicators throughout the app
- Smart category migration when categories are deleted

## Tech Stack

- **Framework**: React Native 0.79.5 with Expo ~53.0.20
- **Language**: TypeScript ~5.8.3 (strict mode)
- **Navigation**: React Navigation v7 (Stack & Bottom Tabs)
- **Storage**: AsyncStorage 2.1.2 for data persistence
- **Audio**: Expo Audio ~0.4.9 for voice recording/playback
- **Animations**: React Native Reanimated ~3.17.4
- **Gestures**: React Native Gesture Handler ~2.24.0
- **Styling**: Expo Linear Gradient ~14.1.5
- **Icons**: Expo Vector Icons v14.1.0 (Ionicons)
- **Safe Area**: React Native Safe Area Context 5.4.0

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd idea-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on iOS Simulator**
   ```bash
   npm run ios
   ```

5. **Run on Android Emulator**
   ```bash
   npm run android
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── category/       # Category-related components
│   ├── common/         # Common UI components (Buttons, Cards, Headers, etc.)
│   │   ├── ActionButton.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ColorPicker.tsx
│   │   ├── EmptyState.tsx
│   │   ├── FloatingActionButton.tsx
│   │   ├── Header.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── SearchInput.tsx
│   └── note/           # Note/Idea-related components
├── contexts/           # React Context providers
│   └── theme.context.tsx
├── hooks/              # Custom React hooks
│   ├── useAsyncOperation.ts
│   └── index.ts
├── navigation/         # Navigation configuration
│   └── RootNavigator.tsx
├── screens/            # Main application screens
│   ├── NotesListScreen.tsx
│   ├── NoteCreateScreen.tsx
│   ├── NoteEditScreen.tsx
│   ├── CategoriesListScreen.tsx
│   └── SettingsScreen.tsx
├── services/           # Business logic and data services
│   ├── storage.service.ts
│   └── index.ts
├── styles/             # Shared styling and constants
│   ├── constants.ts
│   ├── shared.ts
│   └── index.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── utils/              # Utility functions
    └── index.ts
```

## Key Features Implementation

### Local Storage
- Uses AsyncStorage 2.1.2 for persistent data storage
- Structured data models for ideas and categories
- Automatic initialization with default categories
- Smart storage service with error handling
- Theme preferences and app settings persistence

### Voice Recording
- Expo Audio integration for high-quality recording
- Automatic file system management for audio files
- Configurable recording quality controls
- Advanced playback functionality with progress tracking
- Proper cleanup of audio resources

### iOS-Inspired Design
- Modern iOS design system with proper typography
- Native navigation patterns with React Navigation v7
- Comprehensive safe area handling
- Beautiful modal transitions and animations
- Professional color schemes and gradients

## Data Models

### Note (Idea)
```typescript
interface Note {
  /** Unique identifier for the note */
  id: string;
  /** Type of note content (text or voice) */
  type: NoteType;
  /** Text content of the note (for text type) or title for voice notes */
  content: string;
  /** File path for voice recordings (only for voice type) */
  audioPath?: string;
  /** Duration of voice recording in seconds (only for voice type) */
  audioDuration?: number;
  /** Category ID this note belongs to */
  categoryId: string;
  /** Timestamp when the note was created */
  createdAt: string;
  /** Timestamp when the note was last updated */
  updatedAt: string;
  /** Whether the note is marked as favorite */
  isFavorite: boolean;
}
```

### Category
```typescript
interface Category {
  /** Unique identifier for the category */
  id: string;
  /** Display name of the category */
  name: string;
  /** Color code for the category (hex format) */
  color: string;
  /** Timestamp when the category was created */
  createdAt: string;
}
```

### App Settings
```typescript
interface AppSettings {
  /** Default category ID for new notes */
  defaultCategoryId: string;
  /** Audio recording quality setting */
  audioQuality: 'low' | 'medium' | 'high';
  /** Whether to show tutorial on app start */
  showTutorial: boolean;
  /** Theme mode preference */
  themeMode: ThemeMode;
}
```

## Permissions

### iOS
- **Microphone**: Required for voice recording functionality (`NSMicrophoneUsageDescription`)
- **Audio Background Modes**: Enables audio playback in background

### Android
- **RECORD_AUDIO**: Required for voice recording
- **WRITE_EXTERNAL_STORAGE**: Required for saving audio files  
- **READ_EXTERNAL_STORAGE**: Required for accessing saved audio files

## Development

### Code Style
- Follows SOLID principles for clean architecture
- Implements DRY (Don't Repeat Yourself) methodology
- Adheres to KISS (Keep It Simple, Stupid) principle
- Comprehensive JSDoc documentation for all functions

### State Management
- React hooks for local component state management
- Context API for theme and global state management
- AsyncStorage for persistent data storage
- Custom hooks for async operations and error handling

### Error Handling
- Comprehensive error handling with user-friendly messages
- Graceful fallbacks for failed operations
- Proper cleanup of resources and listeners

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Built with React Native 0.79.5 and Expo ~53.0.20
- Icons provided by Expo Vector Icons (Ionicons)
- Design inspired by iOS Human Interface Guidelines
- Audio functionality powered by Expo Audio
- Navigation powered by React Navigation v7
