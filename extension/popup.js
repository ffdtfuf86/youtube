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

// Extension removal security variables\nlet removalStep = 1;\nlet removalVerificationWord = '';\n\n// Extension removal security modal\nfunction showRemovalSecurityModal() {\n  const modal = document.createElement('div');\n  modal.id = 'removalSecurityModal';\n  modal.className = 'security-modal';\n  modal.innerHTML = `\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <h2>🛡️ Extension Removal Security</h2>\n        <button class=\"close-modal\" onclick=\"closeRemovalModal()\">×</button>\n      </div>\n      \n      <div class=\"progress-bar\">\n        <div class=\"progress-fill\" id=\"removalProgressFill\"></div>\n      </div>\n      <div class=\"step-indicator\" id=\"removalStepIndicator\">Step 1 of 3</div>\n      \n      <div class=\"verification-steps\">\n        <div class=\"step\" id=\"removalStep1\">\n          <h3>Step 1: Password Verification</h3>\n          <p>Enter your security password to proceed with extension removal:</p>\n          <input type=\"password\" id=\"removalPassword\" placeholder=\"Enter security password\">\n          <button class=\"verify-btn\" onclick=\"verifyRemovalPassword()\">Verify Password</button>\n          <div class=\"warning\">⚠️ This will permanently remove SecureYT and all protections!</div>\n        </div>\n        \n        <div class=\"step\" id=\"removalStep2\" style=\"display: none;\">\n          <h3>Step 2: Phone Verification</h3>\n          <p>A verification code has been sent to your phone:</p>\n          <div class=\"verification-word\" id=\"removalVerificationWord\"></div>\n          <p>Confirm you received the verification code:</p>\n          <button class=\"verify-btn\" onclick=\"confirmRemovalCall()\">I Received the Code</button>\n        </div>\n        \n        <div class=\"step\" id=\"removalStep3\" style=\"display: none;\">\n          <h3>Step 3: Voice Verification</h3>\n          <p>Speak the verification word to complete removal authorization:</p>\n          <input type=\"text\" id=\"removalSpokenWord\" placeholder=\"Enter the verification word\">\n          <button class=\"verify-btn\" onclick=\"verifyRemovalVoice()\">Complete Removal Authorization</button>\n          <div class=\"final-warning\">🚨 Extension will be authorized for removal after this step!</div>\n        </div>\n      </div>\n    </div>\n  `;\n  \n  document.body.appendChild(modal);\n  modal.style.display = 'flex';\n  document.getElementById('removalPassword').focus();\n}\n\nfunction verifyRemovalPassword() {\n  const enteredPassword = document.getElementById('removalPassword').value;\n  \n  if (!enteredPassword) {\n    alert('Please enter your password');\n    return;\n  }\n  \n  if (enteredPassword === currentSettings.securityPassword) {\n    showRemovalStep(2);\n    initiateRemovalPhoneVerification();\n  } else {\n    alert('Invalid password. Extension removal blocked.');\n    document.getElementById('removalPassword').value = '';\n    document.getElementById('removalPassword').focus();\n  }\n}\n\nfunction initiateRemovalPhoneVerification() {\n  const words = ['REMOVE', 'DELETE', 'UNINSTALL', 'DISABLE', 'DESTROY', 'ELIMINATE'];\n  removalVerificationWord = words[Math.floor(Math.random() * words.length)];\n  document.getElementById('removalVerificationWord').textContent = removalVerificationWord;\n  \n  chrome.runtime.sendMessage({\n    action: 'showNotification',\n    title: 'SecureYT - REMOVAL VERIFICATION',\n    message: `Extension removal code: ${removalVerificationWord}`\n  });\n}\n\nfunction confirmRemovalCall() {\n  showRemovalStep(3);\n  document.getElementById('removalSpokenWord').focus();\n}\n\nfunction verifyRemovalVoice() {\n  const spokenWord = document.getElementById('removalSpokenWord').value.toUpperCase().trim();\n  \n  if (!spokenWord) {\n    alert('Please enter the verification word');\n    return;\n  }\n  \n  if (spokenWord === removalVerificationWord) {\n    chrome.runtime.sendMessage({\n      action: 'verifySecurityForRemoval',\n      credentials: {\n        password: currentSettings.securityPassword,\n        phoneVerification: true,\n        voiceVerification: true\n      }\n    }, (response) => {\n      if (response?.verified) {\n        closeRemovalModal();\n        alert('✅ Extension removal authorized! You can now safely remove SecureYT from chrome://extensions');\n      } else {\n        alert('❌ Verification failed. Extension removal blocked.');\n      }\n    });\n  } else {\n    alert('Voice verification failed. Extension removal blocked.');\n    document.getElementById('removalSpokenWord').value = '';\n    document.getElementById('removalSpokenWord').focus();\n  }\n}\n\nfunction showRemovalStep(step) {\n  for (let i = 1; i <= 3; i++) {\n    const stepElement = document.getElementById(`removalStep${i}`);\n    if (stepElement) stepElement.style.display = 'none';\n  }\n  \n  const currentStepElement = document.getElementById(`removalStep${step}`);\n  if (currentStepElement) currentStepElement.style.display = 'block';\n  \n  const progress = (step / 3) * 100;\n  const progressFill = document.getElementById('removalProgressFill');\n  const stepIndicator = document.getElementById('removalStepIndicator');\n  \n  if (progressFill) progressFill.style.width = progress + '%';\n  if (stepIndicator) stepIndicator.textContent = `Step ${step} of 3`;\n  \n  removalStep = step;\n}\n\nfunction closeRemovalModal() {\n  const modal = document.getElementById('removalSecurityModal');\n  if (modal) {\n    modal.remove();\n  }\n  removalStep = 1;\n  removalVerificationWord = '';\n}\n\n// Incognito disable modal\nfunction showIncognitoDisableModal() {\n  const modal = document.createElement('div');\n  modal.id = 'incognitoDisableModal';\n  modal.className = 'security-modal';\n  modal.innerHTML = `\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <h2>🔓 Temporarily Disable Incognito Block</h2>\n        <button class=\"close-modal\" onclick=\"closeIncognitoModal()\">×</button>\n      </div>\n      \n      <div class=\"step\">\n        <h3>Security Verification Required</h3>\n        <p>Enter your security password to temporarily disable incognito blocking for 1 hour:</p>\n        <input type=\"password\" id=\"incognitoPassword\" placeholder=\"Enter security password\">\n        <button class=\"verify-btn\" onclick=\"disableIncognitoBlock()\">Disable for 1 Hour</button>\n        <div class=\"info\">ℹ️ Incognito blocking will automatically re-enable after 1 hour.</div>\n      </div>\n    </div>\n  `;\n  \n  document.body.appendChild(modal);\n  modal.style.display = 'flex';\n  document.getElementById('incognitoPassword').focus();\n}\n\nfunction disableIncognitoBlock() {\n  const password = document.getElementById('incognitoPassword').value;\n  \n  chrome.runtime.sendMessage({\n    action: 'disableIncognitoBlock',\n    password: password\n  }, (response) => {\n    if (response?.success) {\n      closeIncognitoModal();\n      alert('✅ Incognito blocking disabled for 1 hour');\n      updateUI();\n    } else {\n      alert('❌ Invalid password. Incognito blocking remains active.');\n      document.getElementById('incognitoPassword').value = '';\n    }\n  });\n}\n\nfunction closeIncognitoModal() {\n  const modal = document.getElementById('incognitoDisableModal');\n  if (modal) {\n    modal.remove();\n  }\n}\n\nconsole.log('SecureYT popup loaded');