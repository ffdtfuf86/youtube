# Overview

SecureYT is a Chrome extension that provides enhanced security-focused YouTube content filtering. The extension allows users to configure approved YouTube channels and implements a multi-step verification process (password + phone verification + voice verification) to grant temporary access to all content. It's built as a standalone Chrome extension that requires no external backend or database.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Chrome Extension Architecture
- **Extension Type**: Manifest V3 Chrome extension with service worker
- **Content Scripts**: JavaScript injected into YouTube pages for real-time content filtering
- **Background Service Worker**: Manages alarms, notifications, and extension state
- **Popup Interface**: HTML/CSS/JavaScript settings panel accessible from browser toolbar
- **Storage**: Chrome's built-in sync storage for user settings and configuration
- **Permissions**: Active tab, storage, background, and notifications permissions

## Extension Components
- **manifest.json**: Extension configuration and permissions
- **background.js**: Service worker handling timers, notifications, and inter-component communication  
- **content.js**: Content script for YouTube page modification and security modal injection
- **popup.html/popup.js**: Settings interface for channel configuration and security setup
- **content.css**: Styling for blocked content overlays and security modals

## Security Architecture
- **Multi-Factor Authentication**: Three-layer verification system
  1. Password verification against extension-stored credentials
  2. Phone verification via browser notifications (simulated)
  3. Voice verification with randomly generated verification words
- **Temporary Access**: Time-limited access with automatic expiration using Chrome alarms
- **Channel Restrictions**: Real-time content filtering blocks all YouTube content except approved channels
- **Local Storage**: All security settings stored locally in Chrome's secure sync storage

## Data Flow
- Users configure approved YouTube channels and security settings via extension popup
- Content script monitors YouTube pages and filters content in real-time
- Access requests trigger the multi-step verification modal overlay
- Successful verification grants temporary access with automatic timer expiration
- Background service worker manages notifications and access expiration

# External Dependencies

## Browser APIs
- **Chrome Extension APIs**: Storage, alarms, notifications, tabs, and runtime APIs
- **Web APIs**: DOM manipulation, content script injection, message passing
- **YouTube DOM**: Real-time content filtering by analyzing YouTube's page structure

## No External Services Required
- **Self-Contained**: All functionality runs within the browser extension
- **Local Storage**: Uses Chrome's built-in sync storage for all data persistence
- **Simulated Verification**: Phone verification uses browser notifications instead of SMS
- **No Backend**: Completely standalone with no server dependencies

## Installation Requirements
- **Chrome Browser**: Requires Google Chrome or Chromium-based browser
- **Developer Mode**: Must enable Chrome extension developer mode for installation
- **Permissions**: Users must grant extension permissions for YouTube access and notifications