# SecureYT Chrome Extension

Advanced YouTube content filtering with multi-layer authentication system.

## Features

- **Channel Filtering**: Block all YouTube content except from pre-approved channels
- **Multi-Factor Authentication**: Three-layer security verification:
  1. Password verification
  2. Phone verification (simulated notification)
  3. Voice verification
- **Temporary Access**: Grant time-limited access to all content
- **Real-time Filtering**: Automatically blocks unauthorized content as you browse

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" 
4. Select the `extension` folder from this project
5. The SecureYT extension should now appear in your extensions

## Setup

1. Click the SecureYT extension icon in your browser toolbar
2. Configure your settings:
   - **YouTube Channel URL**: Enter the channel you want to allow
   - **Channel Name**: Set a display name for the channel
   - **Security Password**: Create a password for unlocking
   - **Phone Number**: Enter your phone number
3. Click "Save Settings"
4. Visit YouTube to see the filtering in action

## Usage

1. **Normal Mode**: Only your approved channel content will be visible
2. **Unlock Content**: Click "Temporary Unlock" on blocked content to start security verification
3. **Security Process**: Complete all three verification steps to gain temporary access
4. **End Access**: Use the extension popup to end temporary access early

## Security Features

- Content is blocked by default unless from approved channels
- Three-step verification process ensures authorized access only
- Temporary access automatically expires after the configured duration
- All settings stored securely in Chrome's sync storage

## Development

This is a standalone Chrome extension that requires no external server or database.