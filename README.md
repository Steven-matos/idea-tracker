# Notes Tracker

A React Native application built with Expo for tracking and organizing your notes. Capture notes through text or voice recordings, categorize them, and manage them locally on your device.

## Features

### ✨ Core Features
- **Text Notes**: Create and edit text-based notes
- **Voice Notes**: Record voice notes with playback functionality
- **Categories**: Organize notes with customizable categories
- **Local Storage**: All data stored locally on device (no backend required)
- **Search & Filter**: Find notes by content or category
- **iOS-Focused Design**: Native iOS design patterns and interactions

### 📱 User Interface
- Clean, iOS-native design with proper navigation
- Tab-based navigation for main features
- Modal screens for creating and editing notes
- Intuitive voice recording with visual feedback
- Category color coding and filtering
- Pull-to-refresh functionality

### 🎙️ Voice Recording Features
- High-quality audio recording
- Real-time duration display
- Playback controls for voice notes
- Automatic file management
- Recording quality settings

### 📂 Category Management
- Create custom categories with colors
- Edit existing categories
- Default "General" category (cannot be deleted)
- Category-based filtering
- Visual category indicators
- Notes automatically moved to "General" when category is deleted

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack & Tab)
- **Storage**: AsyncStorage for data persistence
- **Audio**: Expo AV for voice recording/playback
- **File System**: Expo FileSystem for audio file management
- **Icons**: Expo Vector Icons (Ionicons)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notes-tracker
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
│   ├── common/         # Common UI components
│   └── note/           # Note-related components
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── screens/            # Main application screens
│   ├── NotesScreen.tsx
│   ├── CreateNoteScreen.tsx
│   ├── EditNoteScreen.tsx
│   ├── CategoriesScreen.tsx
│   └── SettingsScreen.tsx
├── services/           # Business logic and data services
│   └── StorageService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── utils/              # Utility functions
    └── index.ts
```

## Key Features Implementation

### Local Storage
- Uses AsyncStorage for persistent data storage
- Structured data models for notes and categories
- Automatic initialization with default categories
- Data export/import capabilities

### Voice Recording
- Expo AV integration for audio recording
- File system management for audio files
- Recording quality controls
- Playback functionality with progress tracking

### iOS-Native Design
- iOS design system colors and typography
- Native navigation patterns
- Proper safe area handling
- iOS-style modals and transitions

## Data Models

### Note
```typescript
interface Note {
  id: string;
  type: 'text' | 'voice';
  content: string;
  audioPath?: string;
  audioDuration?: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}
```

### Category
```typescript
interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}
```

## Permissions

### iOS
- **Microphone**: Required for voice recording functionality
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
- React hooks for local component state
- Context API for theme management
- AsyncStorage for persistent data storage

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React Native and Expo
- Icons provided by Ionicons
- Design inspired by iOS Human Interface Guidelines
