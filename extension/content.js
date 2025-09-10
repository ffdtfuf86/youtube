// SecureYT Content Script - Enhanced YouTube content filtering
let allowedChannelId = null;
let hasTemporaryAccess = false;
let securityModalInjected = false;
let filterCount = 0; // Track filtered content

// Configuration - Extension-only mode
const EXTENSION_ID = chrome.runtime.id;

// Load settings from extension storage with security checks
chrome.storage.sync.get(['allowedChannelId', 'hasTemporaryAccess', 'extensionEnabled'], (result) => {
  allowedChannelId = result.allowedChannelId;
  hasTemporaryAccess = result.hasTemporaryAccess || false;
  
  // Security check - ensure extension is enabled
  if (result.extensionEnabled === false && !hasTemporaryAccess) {
    // Force re-enable if disabled without proper unlock
    chrome.storage.sync.set({ extensionEnabled: true });
  }
  
  console.log('SecureYT: Loaded settings', { allowedChannelId, hasTemporaryAccess });
  filterContent();
  
  // Start aggressive monitoring for this tab
  startAggressiveFiltering();
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

// Enhanced content filtering with comprehensive selectors
function filterContent() {
  if (!allowedChannelId && !hasTemporaryAccess) return;
  
  // Comprehensive selectors for all YouTube layouts (updated for 2024)
  const selectors = [
    // Home page and feed
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-rich-grid-media',
    'ytd-rich-section-renderer',
    
    // Search results
    'ytd-video-renderer',
    'ytd-channel-renderer',
    'ytd-playlist-renderer',
    'ytd-radio-renderer',
    
    // Sidebar and recommendations
    'ytd-compact-video-renderer',
    'ytd-watch-next-secondary-results-renderer ytd-compact-video-renderer',
    'ytd-compact-radio-renderer',
    'ytd-compact-playlist-renderer',
    
    // Channel pages
    'ytd-grid-video-renderer',
    'ytd-rich-grid-media',
    'ytd-grid-channel-renderer',
    
    // Shorts and new formats
    'ytd-reel-item-renderer',
    'ytd-rich-shelf-renderer',
    'ytd-continuation-item-renderer',
    
    // Comments and community posts
    'ytd-comment-thread-renderer',
    'ytd-backstage-post-thread-renderer',
    
    // Live streams and premieres
    'ytd-live-chat-frame',
    'ytd-video-primary-info-renderer',
    
    // Mobile-responsive elements
    '[data-context-item-id]',
    '.ytd-video-meta-block',
    '.ytd-channel-name'
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
  
  // Enhanced blocking for various YouTube pages
  const currentPath = window.location.pathname;
  const currentUrl = window.location.href;
  
  // Block unauthorized channel pages
  if (currentPath.startsWith('/channel/') || 
      currentPath.startsWith('/@') ||
      currentPath.startsWith('/c/') ||
      currentPath.startsWith('/user/')) {
    
    const currentChannelId = extractChannelId(document);
    if (currentChannelId && shouldBlockContent(document)) {
      blockEntirePage();
      return;
    }
  }
  
  // Block unauthorized individual videos
  if (currentPath.startsWith('/watch') && currentUrl.includes('v=')) {
    // Check if video is from unauthorized channel
    const channelElements = document.querySelectorAll('a[href*="/channel/"], a[href*="/@"], a[href*="/c/"], a[href*="/user/"]');
    for (const element of channelElements) {
      if (shouldBlockContent(element.parentElement)) {
        blockEntirePage();
        return;
      }
    }
  }
  
  // Block Shorts from unauthorized channels
  if (currentPath.startsWith('/shorts/')) {
    const currentChannelId = extractChannelId(document);
    if (currentChannelId && shouldBlockContent(document)) {
      blockEntirePage();
      return;
    }
  }
  
  // Additional security: Block access to unauthorized playlists
  if (currentPath.startsWith('/playlist') || currentUrl.includes('list=')) {
    const playlistOwner = document.querySelector('[data-context-item-id]');
    if (playlistOwner && shouldBlockContent(playlistOwner)) {
      blockEntirePage();
      return;
    }
  }
}

// Block entire page for direct channel navigation with enhanced security
function blockEntirePage() {
  // Clear all existing content first to prevent any potential bypass
  if (document.body) {
    document.body.innerHTML = '';
  }
  
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
  
  // Notify background script about direct navigation attempt
  chrome.runtime.sendMessage({ action: 'blockDirectNavigation' });
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
  
  // Get stored password from extension storage
  chrome.storage.sync.get(['securityPassword'], (result) => {
    if (result.securityPassword === password) {
      showStep(2);
      initiatePhoneVerification();
    } else {
      alert('Invalid password');
    }
  });
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
  const spokenWord = document.getElementById('secureyt-spoken-word').value.toLowerCase().trim();
  if (!spokenWord) {
    alert('Please enter the word you spoke');
    return;
  }
  
  // Get the verification word from storage
  chrome.storage.local.get(['currentVerificationWord'], (result) => {
    const expectedWord = result.currentVerificationWord?.toLowerCase().trim();
    
    if (spokenWord === expectedWord) {
      chrome.storage.sync.get(['temporaryAccessDuration'], (settings) => {
        const duration = settings.temporaryAccessDuration || 30;
        alert(`Access granted for ${duration} minutes!`);
        
        // Enable temporary access and set timer
        chrome.runtime.sendMessage({
          action: 'setTemporaryAccess',
          duration: duration
        });
        
        // Close modal and refresh page
        window.secureYTCloseModal();
        location.reload();
      });
    } else {
      alert('Voice verification failed. Please try again.');
    }
  });
};

async function initiatePhoneVerification() {
  // Generate a random verification word
  const words = ['SECURE', 'VERIFY', 'ACCESS', 'UNLOCK', 'CONFIRM', 'GUARD', 'SHIELD', 'TRUST', 'SAFE', 'CHECK'];
  const verificationWord = words[Math.floor(Math.random() * words.length)];
  
  // Store the word for voice verification
  chrome.storage.local.set({ currentVerificationWord: verificationWord });
  
  // Display the word
  document.getElementById('secureyt-verification-word').textContent = verificationWord;
  
  // Simulate phone call notification
  chrome.runtime.sendMessage({
    action: 'showNotification',
    title: 'SecureYT Phone Verification',
    message: `Your verification word is: ${verificationWord}`
  });
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

// Enhanced monitoring and filtering
function startAggressiveFiltering() {
  // More frequent filtering for dynamically loaded content
  setInterval(filterContent, 1000);
  
  // Monitor for any attempts to modify our blocked overlays
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Check if our blocked overlays were removed
      mutation.removedNodes.forEach((node) => {
        if (node.className && node.className.includes('secureyt-blocked-content')) {
          // Re-apply filtering if our blocks were removed
          setTimeout(filterContent, 100);
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Prevent right-click and developer tools on blocked content
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.secureyt-blocked-content') || e.target.closest('#secureyt-page-overlay')) {
      e.preventDefault();
      return false;
    }
  });
  
  // Prevent F12 and other developer tool shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U')) {
      
      chrome.storage.sync.get(['hasTemporaryAccess'], (result) => {
        if (!result.hasTemporaryAccess) {
          e.preventDefault();
          alert('Developer tools are disabled while content filtering is active');
          return false;
        }
      });
    }
  });
}

// Periodic content filtering for dynamically loaded content
setInterval(filterContent, 2000);

console.log('SecureYT: Content script loaded with enhanced security');