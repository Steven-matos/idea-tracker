# Idea Tracker

A React Native application built with Expo for tracking and organizing your ideas. Capture ideas through text or voice recordings, categorize them, and manage them locally on your device.

## Features

### ✨ Core Features
- **Text Ideas**: Create and edit text-based ideas
- **Voice Ideas**: Record voice notes with playback functionality
- **Categories**: Organize ideas with customizable categories
- **Local Storage**: All data stored locally on device (no backend required)
- **Search & Filter**: Find ideas by content or category
- **iOS-Focused Design**: Native iOS design patterns and interactions

### 📱 User Interface
- Clean, iOS-native design with proper navigation
- Tab-based navigation for main features
- Modal screens for creating and editing ideas
- Intuitive voice recording with visual feedback
- Category color coding and filtering
- Pull-to-refresh functionality

### 🎙️ Voice Recording Features
- High-quality audio recording
- Real-time duration display
- Playback controls for voice ideas
- Automatic file management
- Recording quality settings

### 📂 Category Management
- Create custom categories with colors
- Edit existing categories
- Default "General" category (cannot be deleted)
- Category-based filtering
- Visual category indicators
- Ideas automatically moved to "General" when category is deleted

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
│   ├── common/         # Common UI components
│   └── idea/           # Idea-related components
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── screens/            # Main application screens
│   ├── IdeasScreen.tsx
│   ├── CreateIdeaScreen.tsx
│   ├── EditIdeaScreen.tsx
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
- Structured data models for ideas and categories
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

### Idea
```typescript
interface Idea {
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
- Microphone access for voice recording
- Background audio for playback

### Android
- Record audio permission
- Storage permissions for file management

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- JSDoc comments for all functions
- DRY principles applied throughout
- Consistent iOS design patterns

### Architecture
- Service-based architecture for data management
- Type-safe interfaces for all data models
- Modular component structure
- Clean separation of concerns

## Building for Production

### iOS
1. Update `bundleIdentifier` in `app.json`
2. Configure signing in Xcode
3. Build with `eas build --platform ios`

### Android
1. Update `package` in `app.json`
2. Configure keystore
3. Build with `eas build --platform android`

## Contributing

1. Follow the existing code style and patterns
2. Add JSDoc comments for new functions
3. Ensure TypeScript compliance
4. Test on both iOS and Android
5. Update documentation as needed

## License

This project is licensed under the MIT License.

## Support

For support or questions, please create an issue in the repository.
