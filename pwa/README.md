# SecureYT Progressive Web App

A mobile-optimized Progressive Web App for secure YouTube content filtering with multi-factor authentication.

## Features

- 📱 **Works on all phones** (iPhone & Android)
- 🛡️ **Content filtering** - Only show videos from approved channels
- 🔐 **Multi-factor authentication** - Password + Phone + Voice verification
- ⏰ **Temporary access** - Time-limited full access to all content
- 🔄 **Offline support** - Works without internet after installation
- 📲 **Install from browser** - No app store required

## Installation

### From any mobile browser:

1. Open your phone's browser (Chrome, Safari, Firefox, etc.)
2. Visit your PWA URL
3. Look for "Add to Home Screen" or "Install" prompt
4. Tap "Install" or "Add"
5. The app will appear on your home screen like any other app

### Manual installation:

1. Open the website in your mobile browser
2. For **iPhone (Safari)**: Tap Share button → "Add to Home Screen"
3. For **Android (Chrome)**: Tap menu (⋮) → "Add to Home screen"
4. For **Android (Firefox)**: Tap menu → "Install"

## Setup

1. Open the SecureYT app from your home screen
2. Tap the settings button (⚙️) in the top right
3. Configure your settings:
   - **YouTube Channel URL**: The only channel you want to allow
   - **Channel Name**: Display name for the channel
   - **Security Password**: Password for unlocking
   - **Phone Number**: For verification notifications
   - **Access Duration**: How long temporary access lasts
4. Tap "Save Settings"

## Usage

### Normal Browsing
- Tap "Open Filtered YouTube" to browse only your approved channel
- All other content will be blocked and hidden
- Navigate safely knowing only approved content is visible

### Temporary Access
- Tap "Temporary Unlock" when you need full YouTube access
- Complete the 3-step security verification:
  1. Enter your security password
  2. Confirm the verification word from the notification
  3. Type the verification word to complete voice verification
- Enjoy full YouTube access for your configured duration
- Access automatically expires and filtering resumes

### Security Features
- All settings stored securely on your device
- No external servers or accounts required
- Multi-layer verification prevents unauthorized access
- Automatic expiration ensures temporary access doesn't last forever

## How It Works

- **Client-side filtering**: All filtering happens on your device
- **Local storage**: Settings stored in your browser's secure storage
- **Browser notifications**: Simulated phone verification via notifications
- **Iframe filtering**: YouTube content displayed in filtered iframe
- **Progressive enhancement**: Works offline after first visit

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses Service Worker for offline functionality
- Responsive design optimized for mobile devices
- Web App Manifest for native app-like experience
- Local storage for settings persistence
- No external dependencies or frameworks

## Browser Support

- ✅ Chrome (Android & Desktop)
- ✅ Safari (iOS & macOS)
- ✅ Firefox (Android & Desktop)
- ✅ Edge (All platforms)
- ✅ Samsung Internet
- ✅ Most modern mobile browsers

## Privacy & Security

- **No data collection**: Everything stays on your device
- **No external servers**: Completely self-contained
- **No tracking**: No analytics or monitoring
- **Local storage only**: Settings never leave your device
- **Open source**: All code is visible and auditable