// SecureYT Background Service Worker - Enhanced security management

// Extension installation with improved defaults
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
    hasTemporaryAccess: false
  });
});

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

// Listen for messages from content script and popup
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
});

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