// SecureYT Background Service Worker - Enhanced security management

// Extension installation with improved defaults and security
chrome.runtime.onInstalled.addListener(() => {
  console.log('SecureYT extension installed');
  
  // Initialize default settings
  chrome.storage.sync.set({
    allowedChannelId: null,
    allowedChannelName: '',
    allowedChannelUrl: '',
    securityPassword: '',
    phoneNumber: '',
    voiceVerificationEnabled: true,
    temporaryAccessDuration: 30,
    hasTemporaryAccess: false,
    lastSettingsChange: Date.now(),
    settingsLocked: false,
    extensionEnabled: true
  });
  
  // Start monitoring for tampering
  startTamperDetection();
});

// Monitor for extension tampering and settings changes
function startTamperDetection() {
  setInterval(() => {
    // Check if settings have been tampered with
    chrome.storage.sync.get(['extensionEnabled', 'hasTemporaryAccess'], (result) => {
      if (result.extensionEnabled === false && !result.hasTemporaryAccess) {
        // Restore extension if disabled without proper unlock
        chrome.storage.sync.set({ extensionEnabled: true });
        
        // Reload all YouTube tabs to re-apply filtering
        chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.reload(tab.id);
          });
        });
      }
    });
  }, 5000); // Check every 5 seconds
}

// Handle temporary access expiration
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'temporaryAccessExpiry') {
    // Disable temporary access
    chrome.storage.sync.set({ hasTemporaryAccess: false });
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecureYT',
      message: 'Temporary access has expired. Content filtering is now active.'
    });
    
    // Reload all YouTube tabs
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.reload(tab.id);
      });
    });
  }
});

// Enhanced message handling with security checks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setTemporaryAccess') {
    // Set temporary access
    chrome.storage.sync.set({ hasTemporaryAccess: true });
    
    // Set alarm for expiry
    const durationMinutes = request.duration || 30;
    chrome.alarms.create('temporaryAccessExpiry', {
      delayInMinutes: durationMinutes
    });
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecureYT',
      message: `Temporary access granted for ${durationMinutes} minutes.`
    });
    
    sendResponse({ success: true });
  }
  
  if (request.action === 'endTemporaryAccess') {
    // Clear temporary access
    chrome.storage.sync.set({ hasTemporaryAccess: false });
    chrome.alarms.clear('temporaryAccessExpiry');
    
    // Reload all YouTube tabs
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.reload(tab.id);
      });
    });
    
    sendResponse({ success: true });
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse(settings);
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'showNotification') {
    // Show notification for phone verification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: request.title,
      message: request.message
    });
    
    sendResponse({ success: true });
  }
  
  if (request.action === 'blockDirectNavigation') {
    // Block direct navigation to unauthorized channels
    chrome.tabs.update(sender.tab.id, {
      url: 'https://youtube.com'
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecureYT - Access Blocked',
      message: 'Direct navigation to unauthorized channel blocked'
    });
    
    sendResponse({ success: true });
  }
  
  if (request.action === 'requireSettingsVerification') {
    // Additional verification required for settings changes
    chrome.storage.sync.set({ settingsLocked: true });
    sendResponse({ success: true });
  }
});

// Block navigation to unauthorized YouTube content
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    chrome.storage.sync.get(['allowedChannelId', 'hasTemporaryAccess', 'extensionEnabled'], (result) => {
      if (!result.extensionEnabled || result.hasTemporaryAccess) return;
      
      const url = details.url;
      if (url.includes('youtube.com/watch') || 
          url.includes('youtube.com/channel/') ||
          url.includes('youtube.com/@') ||
          url.includes('youtube.com/c/') ||
          url.includes('youtube.com/user/')) {
        
        // Extract channel info from URL
        const isAllowedChannel = checkIfAllowedChannel(url, result.allowedChannelId);
        
        if (!isAllowedChannel && result.allowedChannelId) {
          // Block navigation and redirect to home
          chrome.tabs.update(details.tabId, {
            url: 'https://youtube.com'
          });
        }
      }
    });
  }
}, { url: [{ hostSuffix: 'youtube.com' }] });

function checkIfAllowedChannel(url, allowedChannelId) {
  if (!allowedChannelId) return false;
  
  // Check if URL contains the allowed channel ID
  return url.includes(allowedChannelId);
}

// Monitor tab updates to check for YouTube navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    // Inject content script if needed
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {
      // Script may already be injected, ignore error
    });
  }
});

console.log('SecureYT background script loaded');