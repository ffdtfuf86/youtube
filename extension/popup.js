// SecureYT Popup Script - Enhanced settings management

// Extension-only mode - no backend required

let currentSettings = {};

// Load current settings
async function loadSettings() {
  try {
    // Get from extension storage
    const result = await chrome.storage.sync.get(null);
    currentSettings = result;
    updateUI();
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Update UI based on current settings
function updateUI() {
  // Update status indicators
  const channelStatus = document.getElementById('channel-status');
  const accessStatus = document.getElementById('access-status');
  
  if (currentSettings.allowedChannelId) {
    channelStatus.className = 'status-icon active';
  } else {
    channelStatus.className = 'status-icon inactive';
  }
  
  if (currentSettings.hasTemporaryAccess) {
    accessStatus.className = 'status-icon active';
  } else {
    accessStatus.className = 'status-icon inactive';
  }
  
  // Update current channel display
  if (currentSettings.allowedChannelName && currentSettings.allowedChannelUrl) {
    document.getElementById('current-channel').style.display = 'block';
    document.getElementById('channel-name').textContent = currentSettings.allowedChannelName;
    document.getElementById('channel-url').textContent = currentSettings.allowedChannelUrl;
  } else {
    document.getElementById('current-channel').style.display = 'none';
  }
  
  // Update access status display
  const accessDisplay = document.getElementById('access-display');
  const endAccessBtn = document.getElementById('end-access');
  
  if (currentSettings.hasTemporaryAccess) {
    accessDisplay.textContent = 'Temporary access is active';
    accessDisplay.className = 'access-status active';
    endAccessBtn.style.display = 'block';
  } else {
    accessDisplay.textContent = 'Content filtering is active';
    accessDisplay.className = 'access-status inactive';
    endAccessBtn.style.display = 'none';
  }
  
  // Update form fields
  document.getElementById('channel-url-input').value = currentSettings.allowedChannelUrl || '';
  document.getElementById('channel-name-input').value = currentSettings.allowedChannelName || '';
  document.getElementById('password-input').value = currentSettings.securityPassword || '';
  document.getElementById('phone-input').value = currentSettings.phoneNumber || '';
}

// Extract channel ID from YouTube URL
function extractChannelIdFromUrl(url) {
  if (!url) return null;
  
  const patterns = [
    /youtube\.com\/channel\/([^\/\?]+)/,
    /youtube\.com\/c\/([^\/\?]+)/,
    /youtube\.com\/user\/([^\/\?]+)/,
    /youtube\.com\/@([^\/\?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Save settings with enhanced security verification
async function saveSettings() {
  // Check if settings are locked (require additional verification)
  const result = await chrome.storage.sync.get(['settingsLocked', 'securityPassword']);
  
  if (result.settingsLocked && result.securityPassword) {
    const currentPassword = prompt('Enter your current security password to change settings:');
    if (currentPassword !== result.securityPassword) {
      alert('Invalid password. Settings change denied.');
      return;
    }
    // Unlock settings temporarily
    await chrome.storage.sync.set({ settingsLocked: false });
  }
  
  const channelUrl = document.getElementById('channel-url-input').value.trim();
  const channelName = document.getElementById('channel-name-input').value.trim();
  const password = document.getElementById('password-input').value.trim();
  const phone = document.getElementById('phone-input').value.trim();
  
  if (!channelUrl) {
    alert('Please enter a YouTube channel URL');
    return;
  }
  
  if (!channelName) {
    alert('Please enter a channel name');
    return;
  }
  
  if (!password) {
    alert('Please set a security password');
    return;
  }
  
  if (!phone) {
    alert('Please enter your phone number');
    return;
  }
  
  // Additional security check for suspicious changes
  if (result.securityPassword && password !== result.securityPassword) {
    const confirmChange = confirm('You are changing the security password. This will require re-verification. Continue?');
    if (!confirmChange) return;
  }
  
  const channelId = extractChannelIdFromUrl(channelUrl);
  if (!channelId) {
    alert('Invalid YouTube channel URL');
    return;
  }
  
  const settings = {
    allowedChannelId: channelId,
    allowedChannelName: channelName,
    allowedChannelUrl: channelUrl,
    securityPassword: password,
    phoneNumber: phone,
    voiceVerificationEnabled: true,
    temporaryAccessDuration: 30
  };
  
  try {
    // Save to extension storage
    await chrome.storage.sync.set(settings);
    
    // Update current settings and UI
    currentSettings = { ...currentSettings, ...settings };
    updateUI();
    
    // Lock settings after successful change to prevent tampering
    setTimeout(async () => {
      await chrome.storage.sync.set({ settingsLocked: true });
    }, 5000);
    
    // Show success message
    const saveBtn = document.getElementById('save-settings');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✅ Settings Saved!';
    saveBtn.style.background = '#10b981';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = '';
    }, 2000);
    
    // Reload YouTube tabs to apply new settings
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.reload(tab.id);
      });
    });
    
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('Failed to save settings.');
  }
}

// End temporary access with verification
async function endTemporaryAccess() {
  const confirmEnd = confirm('Are you sure you want to end temporary access? Content filtering will resume immediately.');
  if (!confirmEnd) return;
  
  try {
    // Update storage
    await chrome.storage.sync.set({ hasTemporaryAccess: false });
    
    // Send message to background script
    chrome.runtime.sendMessage({ action: 'endTemporaryAccess' });
    
    
    // Update UI
    currentSettings.hasTemporaryAccess = false;
    updateUI();
    
    // Reload YouTube tabs
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.reload(tab.id);
      });
    });
    
    alert('Temporary access ended successfully');
    
  } catch (error) {
    console.error('Failed to end access:', error);
    alert('Failed to end temporary access');
  }
}

// Test on YouTube
function testOnYouTube() {
  chrome.tabs.create({ url: 'https://youtube.com' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('end-access').addEventListener('click', endTemporaryAccess);
  document.getElementById('test-youtube').addEventListener('click', testOnYouTube);
  
  // Auto-focus first empty field
  const inputs = document.querySelectorAll('input');
  for (const input of inputs) {
    if (!input.value) {
      input.focus();
      break;
    }
  }
});

console.log('SecureYT popup loaded');