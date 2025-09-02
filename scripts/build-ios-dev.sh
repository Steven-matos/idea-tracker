#!/bin/bash

# iOS Development Build Script for Notes Tracker with CloudKit
# This script creates a development build with native CloudKit support

echo "🚀 Building iOS Development Build with CloudKit Support..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check if logged in to Expo
if ! eas whoami &> /dev/null; then
    echo "🔐 Please log in to Expo:"
    echo "   eas login"
    echo "   Then run this script again."
    exit 1
fi

echo "📱 Creating iOS development build..."
echo "   This will take 10-15 minutes..."

# Create development build
eas build --platform ios --profile development

echo ""
echo "✅ Build completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Download the .ipa file from the link above"
echo "   2. Install on your iOS device using Xcode or TestFlight"
echo "   3. Test CloudKit functionality in the app"
echo ""
echo "⚠️  Important: Don't use Expo Go - use the development build!"
echo "   Expo Go cannot access native CloudKit modules."
