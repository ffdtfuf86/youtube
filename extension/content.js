// SecureYT Content Script - Filters YouTube content
let allowedChannelId = null;
let hasTemporaryAccess = false;
let securityModalInjected = false;

// Configuration
const BACKEND_URL = 'http://localhost:5000';
const USER_ID = 'user-1'; // In production, this would be from authentication

// Load settings from extension storage
chrome.storage.sync.get(['allowedChannelId', 'hasTemporaryAccess'], (result) => {
  allowedChannelId = result.allowedChannelId;
  hasTemporaryAccess = result.hasTemporaryAccess || false;
  console.log('SecureYT: Loaded settings', { allowedChannelId, hasTemporaryAccess });
  filterContent();
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.allowedChannelId) {
      allowedChannelId = changes.allowedChannelId.newValue;
    }
    if (changes.hasTemporaryAccess) {
      hasTemporaryAccess = changes.hasTemporaryAccess.newValue;
    }
    filterContent();
  }
});

// Extract channel ID from various YouTube URL formats
function extractChannelId(element) {
  const channelLinks = element.querySelectorAll('a[href*="/channel/"], a[href*="/@"], a[href*="/c/"], a[href*="/user/"]');
  
  for (const link of channelLinks) {
    const href = link.getAttribute('href');
    if (!href) continue;
    
    // Direct channel ID (/channel/UCxxxxx)
    const channelMatch = href.match(/\/channel\/([^\/\?]+)/);
    if (channelMatch) return channelMatch[1];
    
    // Handle username (@username) - would need API lookup in real implementation
    const handleMatch = href.match(/\/@([^\/\?]+)/);
    if (handleMatch) return `@${handleMatch[1]}`;
    
    // Custom URL (/c/customname)
    const customMatch = href.match(/\/c\/([^\/\?]+)/);
    if (customMatch) return `c/${customMatch[1]}`;
    
    // Legacy user URL (/user/username)
    const userMatch = href.match(/\/user\/([^\/\?]+)/);
    if (userMatch) return `user/${userMatch[1]}`;
  }
  
  return null;
}

// Check if content should be blocked
function shouldBlockContent(element) {
  if (hasTemporaryAccess) return false;
  if (!allowedChannelId) return false;
  
  const channelId = extractChannelId(element);
  if (!channelId) return false;
  
  return channelId !== allowedChannelId;
}

// Create blocked content overlay
function createBlockedOverlay(originalElement) {
  const overlay = document.createElement('div');
  overlay.className = 'secureyt-blocked-content';
  overlay.innerHTML = `
    <div class="secureyt-block-message">
      <div class="secureyt-shield-icon">🛡️</div>
      <h3>Content Blocked by SecureYT</h3>
      <p>This channel is not in your allowed list</p>
      <button class="secureyt-unlock-btn" onclick="window.secureYTUnlock()">
        🔓 Temporary Unlock
      </button>
    </div>
  `;
  
  // Match original element dimensions
  const rect = originalElement.getBoundingClientRect();
  overlay.style.width = originalElement.offsetWidth + 'px';
  overlay.style.height = originalElement.offsetHeight + 'px';
  
  return overlay;
}

// Filter YouTube content
function filterContent() {
  if (!allowedChannelId && !hasTemporaryAccess) return;
  
  // Target different YouTube page layouts
  const selectors = [
    // Home page video thumbnails
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    
    // Search results
    'ytd-video-renderer',
    'ytd-channel-renderer',
    
    // Sidebar recommendations
    'ytd-compact-video-renderer',
    'ytd-watch-next-secondary-results-renderer ytd-compact-video-renderer',
    
    // Channel pages
    'ytd-grid-video-renderer',
    'ytd-rich-grid-media'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // Skip if already processed
      if (element.hasAttribute('data-secureyt-processed')) return;
      element.setAttribute('data-secureyt-processed', 'true');
      
      if (shouldBlockContent(element)) {
        // Hide original element
        element.style.display = 'none';
        
        // Create and insert blocked overlay
        const overlay = createBlockedOverlay(element);
        element.parentNode.insertBefore(overlay, element);
      }
    });
  });
  
  // Block direct navigation to unauthorized channels
  if (window.location.pathname.startsWith('/channel/') || 
      window.location.pathname.startsWith('/@') ||
      window.location.pathname.startsWith('/c/') ||
      window.location.pathname.startsWith('/user/')) {
    
    const currentChannelId = extractChannelId(document);
    if (currentChannelId && shouldBlockContent(document)) {
      blockEntirePage();
    }
  }
}

// Block entire page for direct channel navigation
function blockEntirePage() {
  const overlay = document.createElement('div');
  overlay.id = 'secureyt-page-overlay';
  overlay.innerHTML = `
    <div class="secureyt-page-block">
      <div class="secureyt-shield-icon">🛡️</div>
      <h1>Channel Blocked by SecureYT</h1>
      <p>This channel is not in your allowed list</p>
      <div class="secureyt-actions">
        <button class="secureyt-unlock-btn" onclick="window.secureYTUnlock()">
          🔓 Temporary Unlock
        </button>
        <button class="secureyt-home-btn" onclick="window.location.href='https://youtube.com'">
          🏠 Go to Home
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

// Inject security modal
function injectSecurityModal() {
  if (securityModalInjected) return;
  
  const modalHTML = `
    <div id="secureyt-security-modal" class="secureyt-modal-overlay" style="display: none;">
      <div class="secureyt-modal">
        <div class="secureyt-modal-header">
          <h2>Security Verification</h2>
          <div class="secureyt-progress">
            <div class="secureyt-progress-bar" id="secureyt-progress"></div>
            <span id="secureyt-step-text">Step 1 of 3</span>
          </div>
        </div>
        
        <div class="secureyt-modal-content">
          <!-- Step 1: Password -->
          <div id="secureyt-step-1" class="secureyt-step">
            <div class="secureyt-step-icon">🔑</div>
            <h3>Enter Password</h3>
            <input type="password" id="secureyt-password" placeholder="Your security password">
            <button onclick="window.secureYTVerifyPassword()">Continue</button>
          </div>
          
          <!-- Step 2: Phone -->
          <div id="secureyt-step-2" class="secureyt-step" style="display: none;">
            <div class="secureyt-step-icon">📞</div>
            <h3>Phone Verification</h3>
            <p>We're calling your phone with a verification word.</p>
            <div id="secureyt-verification-word" class="secureyt-word-display"></div>
            <button onclick="window.secureYTConfirmCall()">I Received the Call</button>
          </div>
          
          <!-- Step 3: Voice -->
          <div id="secureyt-step-3" class="secureyt-step" style="display: none;">
            <div class="secureyt-step-icon">🎤</div>
            <h3>Voice Verification</h3>
            <p>Say the verification word clearly:</p>
            <div class="secureyt-recording-area">
              <button id="secureyt-record-btn" onclick="window.secureYTToggleRecording()">
                🎤 Start Recording
              </button>
            </div>
            <input type="text" id="secureyt-spoken-word" placeholder="What did you say?">
            <button onclick="window.secureYTVerifyVoice()">Verify Recording</button>
          </div>
        </div>
        
        <button class="secureyt-close-btn" onclick="window.secureYTCloseModal()">✕</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  securityModalInjected = true;
}

// Global functions for security modal
window.secureYTUnlock = function() {
  injectSecurityModal();
  document.getElementById('secureyt-security-modal').style.display = 'flex';
};

window.secureYTCloseModal = function() {
  document.getElementById('secureyt-security-modal').style.display = 'none';
  resetSecurityModal();
};

window.secureYTVerifyPassword = async function() {
  const password = document.getElementById('secureyt-password').value;
  if (!password) {
    alert('Please enter your password');
    return;
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID, password })
    });
    
    if (response.ok) {
      showStep(2);
      initiatePhoneVerification();
    } else {
      alert('Invalid password');
    }
  } catch (error) {
    alert('Verification failed. Please try again.');
  }
};

window.secureYTConfirmCall = function() {
  showStep(3);
};

window.secureYTToggleRecording = function() {
  const btn = document.getElementById('secureyt-record-btn');
  if (btn.textContent.includes('Start')) {
    btn.textContent = '⏹️ Stop Recording';
    btn.style.backgroundColor = '#ef4444';
  } else {
    btn.textContent = '🎤 Start Recording';
    btn.style.backgroundColor = '#3b82f6';
  }
};

window.secureYTVerifyVoice = async function() {
  const spokenWord = document.getElementById('secureyt-spoken-word').value;
  if (!spokenWord) {
    alert('Please enter the word you spoke');
    return;
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/verify-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID, spokenWord })
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(`Access granted for ${data.duration} minutes!`);
      
      // Update storage to enable temporary access
      chrome.storage.sync.set({ hasTemporaryAccess: true });
      
      // Close modal and refresh page
      window.secureYTCloseModal();
      location.reload();
    } else {
      alert('Voice verification failed. Please try again.');
    }
  } catch (error) {
    alert('Verification failed. Please try again.');
  }
};

async function initiatePhoneVerification() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/verify-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID })
    });
    
    if (response.ok) {
      const data = await response.json();
      document.getElementById('secureyt-verification-word').textContent = data.verificationWord;
    } else {
      alert('Phone verification failed');
    }
  } catch (error) {
    alert('Phone verification failed');
  }
}

function showStep(stepNumber) {
  // Hide all steps
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`secureyt-step-${i}`).style.display = 'none';
  }
  
  // Show current step
  document.getElementById(`secureyt-step-${stepNumber}`).style.display = 'block';
  
  // Update progress
  const progress = (stepNumber / 3) * 100;
  document.getElementById('secureyt-progress').style.width = progress + '%';
  document.getElementById('secureyt-step-text').textContent = `Step ${stepNumber} of 3`;
}

function resetSecurityModal() {
  showStep(1);
  document.getElementById('secureyt-password').value = '';
  document.getElementById('secureyt-spoken-word').value = '';
  document.getElementById('secureyt-verification-word').textContent = '';
}

// Run content filtering on page load and navigation
filterContent();

// Watch for page changes (YouTube is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(filterContent, 1000); // Delay to let content load
  }
}).observe(document, { subtree: true, childList: true });

// Periodic content filtering for dynamically loaded content
setInterval(filterContent, 2000);

console.log('SecureYT: Content script loaded');