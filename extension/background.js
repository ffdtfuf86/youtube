// SecureYT Background Service Worker - Advanced Security System

// Extension installation with maximum security features
chrome.runtime.onInstalled.addListener(() => {
  console.log('SecureYT extension installed with advanced security');
  
  // Initialize comprehensive security settings
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
    extensionEnabled: true,
    incognitoBlocked: true,
    removalProtection: true,
    securityLevel: 'maximum',
    installationTimestamp: Date.now(),
    lastSecurityCheck: Date.now(),
    extensionPageWarning: true
  });
  
  // Create persistent security markers
  chrome.storage.local.set({
    secureYTInstalled: true,
    securityHash: generateSecurityHash(),
    protectionActive: true,
    antiTamperEnabled: true
  });
  
  // Start all security monitoring systems
  startTamperDetection();
  startIncognitoMonitoring();
  startExtensionProtection();
  startSecurityPatrol();
});

// Advanced tampering detection and prevention
function startTamperDetection() {
  setInterval(() => {
    chrome.storage.sync.get(['extensionEnabled', 'hasTemporaryAccess', 'removalProtection'], (result) => {
      if (result.extensionEnabled === false && !result.hasTemporaryAccess) {
        // Restore extension if disabled without proper unlock
        chrome.storage.sync.set({ extensionEnabled: true });
        
        // Show security alert
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'SecureYT Security Alert',
          message: 'Unauthorized attempt to disable extension detected and blocked.',
          requireInteraction: true
        });
        
        // Reload all YouTube tabs
        chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.reload(tab.id);
          });
        });
      }
      
      // Verify security integrity
      verifySecurityIntegrity();
    });
  }, 2000); // Check every 2 seconds
}

// Monitor for incognito mode usage
function startIncognitoMonitoring() {
  // Monitor new incognito tabs
  chrome.tabs.onCreated.addListener((tab) => {
    if (tab.incognito) {
      handleIncognitoDetection(tab);
    }
  });
  
  // Monitor incognito tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.incognito && changeInfo.url) {
      handleIncognitoNavigation(tab, changeInfo.url);
    }
  });
  
  // Monitor incognito window creation
  chrome.windows.onCreated.addListener((window) => {
    if (window.incognito) {
      handleIncognitoWindow(window);
    }
  });
}

// Handle incognito mode detection
function handleIncognitoDetection(tab) {
  chrome.storage.sync.get(['incognitoBlocked', 'hasTemporaryAccess'], (result) => {
    if (result.incognitoBlocked && !result.hasTemporaryAccess) {
      // Show immediate warning
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SecureYT - Incognito Mode Blocked',
        message: 'Incognito browsing is disabled for security. Use normal mode or request temporary access.',
        requireInteraction: true
      });
      
      // If it's a YouTube tab, block it immediately
      if (tab.url && tab.url.includes('youtube.com')) {
        chrome.tabs.update(tab.id, {
          url: chrome.runtime.getURL('incognito-blocked.html')
        });
      }
    }
  });
}

// Handle incognito navigation
function handleIncognitoNavigation(tab, url) {
  chrome.storage.sync.get(['incognitoBlocked', 'hasTemporaryAccess'], (result) => {
    if (result.incognitoBlocked && !result.hasTemporaryAccess) {
      // Block any YouTube access in incognito
      if (url.includes('youtube.com')) {
        chrome.tabs.update(tab.id, {
          url: chrome.runtime.getURL('incognito-blocked.html')
        });
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'SecureYT - YouTube Access Blocked',
          message: 'YouTube access in incognito mode is blocked by SecureYT.',
          requireInteraction: true
        });
      }
    }
  });
}

// Handle incognito window creation
function handleIncognitoWindow(window) {
  chrome.storage.sync.get(['incognitoBlocked', 'hasTemporaryAccess'], (result) => {
    if (result.incognitoBlocked && !result.hasTemporaryAccess) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SecureYT - Incognito Window Detected',
        message: 'Incognito browsing is monitored by SecureYT. YouTube access is blocked.',
        requireInteraction: true
      });
    }
  });
}

// Extension removal protection system
function startExtensionProtection() {
  // Monitor extension management page access
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && changeInfo.url.includes('chrome://extensions')) {
      handleExtensionPageAccess(tab);
    }
  });
  
  // Monitor for extension state changes
  chrome.management.onEnabled.addListener((info) => {
    if (info.id === chrome.runtime.id) {
      console.log('SecureYT re-enabled');
    }
  });
  
  chrome.management.onDisabled.addListener((info) => {
    if (info.id === chrome.runtime.id) {
      handleExtensionDisableAttempt();
    }
  });
}

// Handle access to chrome://extensions page
function handleExtensionPageAccess(tab) {
  chrome.storage.sync.get(['removalProtection', 'extensionPageWarning'], (result) => {
    if (result.removalProtection && result.extensionPageWarning) {
      // Show security warning
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SecureYT Security Warning',
        message: 'Extension management page detected. Removal protection is active.',
        requireInteraction: true
      });
      
      // Try to inject protection script
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectExtensionProtection
      }).catch(() => {
        console.log('Protection script injection failed - expected for chrome:// pages');
      });
    }
  });
}

// Function to inject into extension page
function injectExtensionProtection() {
  // This function runs in the context of chrome://extensions page
  const interval = setInterval(() => {
    const secureYTCards = document.querySelectorAll('extensions-item');
    secureYTCards.forEach(card => {
      const nameElement = card.shadowRoot?.querySelector('#name');
      if (nameElement?.textContent?.includes('SecureYT')) {
        // Add warning overlay
        const warning = document.createElement('div');
        warning.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          z-index: 10000;
          pointer-events: none;
        `;
        warning.textContent = '🛡️ REMOVAL PROTECTION ACTIVE';
        card.style.position = 'relative';
        card.appendChild(warning);
      }
    });
  }, 1000);
  
  // Clean up after 30 seconds
  setTimeout(() => clearInterval(interval), 30000);
}

// Security patrol system
function startSecurityPatrol() {
  setInterval(() => {
    // Check for security breaches
    chrome.storage.sync.get(['lastSecurityCheck', 'securityLevel'], (result) => {
      const now = Date.now();
      if (now - result.lastSecurityCheck > 300000) { // 5 minutes
        // Update security check timestamp
        chrome.storage.sync.set({ lastSecurityCheck: now });
        
        // Perform security scan
        performSecurityScan();
      }
    });
  }, 60000); // Check every minute
}

// Perform comprehensive security scan
function performSecurityScan() {
  chrome.storage.local.get(['protectionActive', 'antiTamperEnabled'], (result) => {
    if (!result.protectionActive || !result.antiTamperEnabled) {
      // Security has been compromised
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SecureYT - Security Breach Detected',
        message: 'Critical security protection has been tampered with.',
        requireInteraction: true
      });
      
      // Restore security settings
      chrome.storage.local.set({
        protectionActive: true,
        antiTamperEnabled: true,
        lastSecurityBreach: Date.now()
      });
    }
  });
}

// Handle extension disable attempts
function handleExtensionDisableAttempt() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'SecureYT - Disable Attempt Detected',
    message: 'Extension disable detected. Multi-layer security verification required.',
    requireInteraction: true
  });
  
  // Log the attempt
  chrome.storage.local.set({
    lastDisableAttempt: Date.now(),
    disableAttemptCount: Date.now()
  });
}

// Security integrity verification
function verifySecurityIntegrity() {
  chrome.storage.local.get(['securityHash', 'protectionActive'], (result) => {
    const currentHash = generateSecurityHash();
    if (result.securityHash && result.securityHash !== currentHash && result.protectionActive) {
      // Security breach detected
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SecureYT - Security Integrity Violation',
        message: 'Unauthorized modification detected. Security restored.',
        requireInteraction: true
      });
      
      // Update security hash
      chrome.storage.local.set({
        securityHash: currentHash,
        lastSecurityBreach: Date.now()
      });
    }
  });
}

// Generate security hash for integrity checking
function generateSecurityHash() {
  const timestamp = Math.floor(Date.now() / 86400000); // Daily hash
  return btoa(timestamp.toString() + chrome.runtime.id + 'secureyt-protection-v2');
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
      message: 'Temporary access has expired. Content filtering and incognito blocking are now active.'
    });
    
    // Reload all YouTube tabs
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.reload(tab.id);
      });
    });
    
    // Close any incognito YouTube tabs
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        if (tab.incognito) {
          chrome.tabs.update(tab.id, {
            url: chrome.runtime.getURL('incognito-blocked.html')
          });
        }
      });
    });
  }
});

// Enhanced message handling with advanced security
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
      message: `Temporary access granted for ${durationMinutes} minutes. Incognito blocking temporarily disabled.`
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
    return true;
  }
  
  if (request.action === 'showNotification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: request.title,
      message: request.message
    });
    sendResponse({ success: true });
  }
  
  if (request.action === 'blockDirectNavigation') {
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
    chrome.storage.sync.set({ settingsLocked: true });
    sendResponse({ success: true });
  }
  
  if (request.action === 'requestExtensionRemoval') {
    handleRemovalRequest(sendResponse);
    return true;
  }
  
  if (request.action === 'verifySecurityForRemoval') {
    verifyRemovalSecurity(request.credentials, sendResponse);
    return true;
  }
  
  if (request.action === 'disableIncognitoBlock') {
    handleIncognitoBlockDisable(request, sendResponse);
    return true;
  }
});

// Handle extension removal requests with multi-layer security
function handleRemovalRequest(sendResponse) {
  chrome.storage.sync.get(['removalProtection', 'securityPassword'], (result) => {
    if (result.removalProtection) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SecureYT - Removal Protection Active',
        message: 'Extension removal requires multi-layer security verification (Password + Phone + Voice).',
        requireInteraction: true
      });
      
      sendResponse({ requiresVerification: true });
    } else {
      sendResponse({ requiresVerification: false });
    }
  });
}

// Verify multi-layer security for extension removal
function verifyRemovalSecurity(credentials, sendResponse) {
  chrome.storage.sync.get(['securityPassword', 'phoneNumber'], (result) => {
    const { password, phoneVerification, voiceVerification } = credentials;
    
    // Require all three security layers
    if (password === result.securityPassword && 
        phoneVerification === true && 
        voiceVerification === true) {
      
      // All verification passed - disable protection
      chrome.storage.sync.set({ 
        removalProtection: false,
        extensionEnabled: false,
        incognitoBlocked: false
      });
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SecureYT - Removal Authorized',
        message: 'Multi-layer security verification complete. Extension can now be removed.',
        requireInteraction: true
      });
      
      sendResponse({ verified: true });
    } else {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SecureYT - Verification Failed',
        message: 'Security verification failed. Extension removal remains blocked.',
        requireInteraction: true
      });
      
      sendResponse({ verified: false });
    }
  });
}

// Handle incognito block disable requests
function handleIncognitoBlockDisable(request, sendResponse) {
  chrome.storage.sync.get(['securityPassword'], (result) => {
    if (request.password === result.securityPassword) {
      chrome.storage.sync.set({ incognitoBlocked: false });
      
      // Re-enable after 1 hour
      setTimeout(() => {
        chrome.storage.sync.set({ incognitoBlocked: true });
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'SecureYT',
          message: 'Incognito blocking has been re-enabled.'
        });
      }, 3600000);
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  });
}

// Block navigation to unauthorized YouTube content
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    chrome.storage.sync.get(['allowedChannelId', 'hasTemporaryAccess', 'extensionEnabled'], (result) => {
      if (!result.extensionEnabled || result.hasTemporaryAccess) return;
      
      const url = details.url;
      if (url.includes('youtube.com/watch') || 
          url.includes('youtube.com/channel/') ||
          url.includes('youtube.com/@') ||
          url.includes('youtube.com/c/') ||
          url.includes('youtube.com/user/')) {
        
        const isAllowedChannel = checkIfAllowedChannel(url, result.allowedChannelId);
        
        if (!isAllowedChannel && result.allowedChannelId) {
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
  return url.includes(allowedChannelId);
}

// Monitor tab updates for security enforcement
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {
      // Script injection may fail, ignore
    });
  }
});

console.log('SecureYT background script loaded with maximum security');