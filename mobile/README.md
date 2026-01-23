# Second Brain Mobile App

React Native mobile app for Second Brain with quick capture, offline support, and push notifications.

## Setup

### Prerequisites
- Node.js >= 16
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS)

### Installation

```bash
cd mobile
npm install
```

### Running

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable components
│   ├── services/         # API and sync services
│   ├── storage/          # Offline storage
│   ├── navigation/       # Navigation configuration
│   └── utils/            # Utility functions
├── android/              # Android native code
├── ios/                  # iOS native code
└── package.json
```

## Features

- Quick capture interface
- Offline support with sync
- Push notifications
- Mobile-optimized views
- Widget support (iOS/Android)

## Development

See individual story implementations for detailed feature documentation.
