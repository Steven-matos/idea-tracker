# Notes Tracker

A React Native app for organizing and managing notes with text and voice recording capabilities.

## Features

### Core Functionality
- **Text Notes**: Create, edit, and organize text-based notes
- **Voice Notes**: Record and manage audio notes with quality settings
- **Categories**: Organize notes with customizable categories and colors
- **Search & Filter**: Find notes quickly with search and category filtering
- **Favorites**: Mark important notes as favorites for easy access

### Settings & Preferences
- **Theme Support**: Light, dark, and system theme modes
- **Audio Quality**: Configurable recording quality (low, medium, high)
- **Default Categories**: Set preferred default category for new notes
- **Storage Management**: Clear all data with confirmation
- **Storage Statistics**: Comprehensive view of app storage usage including:
  - Total storage used by the app
  - Breakdown by note type (text vs voice)
  - Metadata storage information
  - Device storage information when available
  - Visual progress bar showing storage usage
  - Real-time statistics with refresh capability

### Technical Features
- **TypeScript**: Full type safety and modern development experience
- **Expo**: Managed workflow for cross-platform development
- **AsyncStorage**: Persistent data storage with efficient caching
- **Responsive Design**: Optimized for both iOS and Android
- **Accessibility**: ARIA support and screen reader compatibility

## Storage Statistics

The app provides detailed storage analytics in the Settings screen:

- **Real-time Calculation**: Automatically calculates storage usage for notes and metadata
- **Visual Progress**: Color-coded progress bar showing storage utilization
- **Detailed Breakdown**: Separate statistics for text notes, voice notes, and app metadata
- **Device Information**: Shows available device storage when possible
- **Refresh Capability**: Manual refresh button to update statistics
- **Last Updated**: Timestamp showing when statistics were last calculated

### Storage Calculation Details

- **Text Notes**: Estimated at 2 bytes per character (Unicode support)
- **Voice Notes**: Estimated at 1MB per minute of audio
- **Metadata**: Includes JSON overhead, timestamps, and IDs
- **Device Storage**: Uses expo-file-system when available for accurate device information

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd idea-tracker

# Install dependencies
npm install

# Start the development server
npm start
```

## Dependencies

- **React Native**: 0.79.5
- **Expo**: ~53.0.20
- **TypeScript**: ~5.8.3
- **Navigation**: React Navigation v7
- **Storage**: AsyncStorage with expo-file-system for device info
- **Audio**: expo-audio for voice recording
- **Icons**: Expo Vector Icons

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (buttons, cards, etc.)
│   ├── category/       # Category-specific components
│   └── note/           # Note-specific components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
├── screens/            # App screens
├── services/           # Data and API services
├── styles/             # Global styles and themes
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

## Development Principles

This project follows modern React Native development best practices:

- **SOLID Principles**: Single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion
- **DRY (Don't Repeat Yourself)**: Centralized logic and reusable components
- **KISS (Keep It Simple, Stupid)**: Simple, maintainable code structure
- **TypeScript**: Strict typing for better development experience
- **Component Composition**: Modular, reusable component architecture

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the established patterns
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
