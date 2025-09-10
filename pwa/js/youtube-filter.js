// SecureYT PWA YouTube Content Filter
class YouTubeFilter {
    constructor() {
        this.isFilteringActive = true;
        this.allowedChannelId = null;
        this.hasTemporaryAccess = false;
        this.observer = null;
        this.init();
    }

    async init() {
        // Load settings
        await this.loadSettings();
        
        // Only start filtering if we're on a YouTube-like page or in the app's YouTube view
        if (this.shouldActivateFiltering()) {
            this.startFiltering();
        }

        // Listen for settings changes
        this.setupSettingsListener();
    }

    async loadSettings() {
        const settings = window.secureYTApp?.getSettings();
        if (settings) {
            this.allowedChannelId = settings.allowedChannelId;
            this.hasTemporaryAccess = settings.hasTemporaryAccess;
            this.isFilteringActive = !this.hasTemporaryAccess;
        }
    }

    shouldActivateFiltering() {
        // Check if we're in a YouTube context
        return window.location.href.includes('youtube') || 
               window.location.pathname.includes('youtube-filter');
    }

    setupSettingsListener() {
        // Listen for storage changes (if settings are updated elsewhere)
        window.addEventListener('storage', (e) => {
            if (e.key === 'secureyt-settings') {
                this.loadSettings();
                this.updateFiltering();
            }
        });

        // Check for settings updates periodically
        setInterval(() => {
            this.loadSettings();
            this.updateFiltering();
        }, 5000);
    }

    startFiltering() {
        if (!this.allowedChannelId || this.hasTemporaryAccess) {
            return;
        }

        // Create YouTube iframe with filtering
        this.createFilteredYouTubeInterface();
        
        // Set up content monitoring
        this.setupContentMonitoring();
    }

    createFilteredYouTubeInterface() {
        // Create a filtered YouTube viewing interface
        const container = document.createElement('div');
        container.id = 'youtube-container';
        container.innerHTML = `
            <div class="youtube-header">
                <div class="header-controls">
                    <button id="backToApp" class="control-btn">⬅️ Back to SecureYT</button>
                    <h2>Filtered YouTube - ${this.getAllowedChannelName()}</h2>
                    <button id="refreshContent" class="control-btn">🔄 Refresh</button>
                </div>
            </div>
            <div class="youtube-content">
                <iframe id="youtube-frame" 
                        src="https://www.youtube.com/channel/${this.allowedChannelId}" 
                        width="100%" 
                        height="600"
                        frameborder="0"
                        allowfullscreen>
                </iframe>
            </div>
            <div class="filter-status">
                <span class="status-indicator active">🛡️ Content filtering is active</span>
                <button id="requestUnlock" class="unlock-button">🔓 Request Temporary Access</button>
            </div>
        `;

        // Add styles
        const styles = `
            <style>
                #youtube-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #1a1a1a;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                }
                
                .youtube-header {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    padding: 1rem;
                    color: white;
                }
                
                .header-controls {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                
                .header-controls h2 {
                    margin: 0;
                    font-size: 1.2rem;
                    flex: 1;
                    text-align: center;
                    min-width: 200px;
                }
                
                .control-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    border-radius: 6px;
                    color: white;
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                
                .control-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                
                .youtube-content {
                    flex: 1;
                    padding: 0;
                    overflow: hidden;
                }
                
                #youtube-frame {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                
                .filter-status {
                    background: #374151;
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                
                .status-indicator {
                    color: #10b981;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .unlock-button {
                    background: #ef4444;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                
                .unlock-button:hover {
                    background: #dc2626;
                    transform: translateY(-1px);
                }
                
                @media (max-width: 768px) {
                    .header-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .header-controls h2 {
                        text-align: center;
                        order: -1;
                        margin-bottom: 0.5rem;
                    }
                    
                    .filter-status {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .control-btn,
                    .unlock-button {
                        width: 100%;
                        justify-content: center;
                    }
                }
            </style>
        `;

        // Insert into document
        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(container);

        // Setup event listeners
        this.setupYouTubeInterfaceEvents();
    }

    setupYouTubeInterfaceEvents() {
        document.getElementById('backToApp').addEventListener('click', () => {
            this.closeYouTubeInterface();
        });

        document.getElementById('refreshContent').addEventListener('click', () => {
            this.refreshYouTubeContent();
        });

        document.getElementById('requestUnlock').addEventListener('click', () => {
            this.requestTemporaryAccess();
        });

        // Monitor iframe for unauthorized navigation
        this.monitorIframeNavigation();
    }

    monitorIframeNavigation() {
        const iframe = document.getElementById('youtube-frame');
        
        // Monitor for navigation attempts
        setInterval(() => {
            try {
                // Check if iframe has navigated to unauthorized content
                // Note: Due to CORS, we can't directly access iframe content
                // In a real implementation, this would need server-side filtering
                
                // For demo purposes, we'll just ensure the iframe stays on the allowed channel
                if (iframe && iframe.src && !iframe.src.includes(this.allowedChannelId)) {
                    console.log('Unauthorized navigation detected, redirecting...');
                    iframe.src = `https://www.youtube.com/channel/${this.allowedChannelId}`;
                }
            } catch (error) {
                // Expected due to CORS restrictions
                console.log('Iframe monitoring (CORS limited)');
            }
        }, 5000);
    }

    closeYouTubeInterface() {
        const container = document.getElementById('youtube-container');
        if (container) {
            container.remove();
        }
        
        // Return to main app
        if (window.location.pathname.includes('youtube-filter')) {
            window.location.href = '/';
        }
    }

    refreshYouTubeContent() {
        const iframe = document.getElementById('youtube-frame');
        if (iframe) {
            iframe.src = iframe.src; // Force reload
        }
    }

    requestTemporaryAccess() {
        // Close YouTube interface
        this.closeYouTubeInterface();
        
        // Start security verification
        if (window.securitySystem) {
            window.securitySystem.startVerification();
        } else {
            alert('Security system not available');
        }
    }

    getAllowedChannelName() {
        const settings = window.secureYTApp?.getSettings();
        return settings?.allowedChannelName || 'Unknown Channel';
    }

    setupContentMonitoring() {
        // Set up mutation observer to monitor for dynamic content changes
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    this.filterNewContent(mutation.addedNodes);
                }
            });
        });

        // Start observing
        if (document.body) {
            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    filterNewContent(nodes) {
        nodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Filter any new YouTube content that might appear
                this.applyContentFiltering(node);
            }
        });
    }

    applyContentFiltering(element) {
        // Find YouTube video elements and filter them
        const videoElements = element.querySelectorAll('[data-context-item-id], .ytd-video-renderer, .ytd-rich-item-renderer');
        
        videoElements.forEach(videoElement => {
            if (this.shouldBlockElement(videoElement)) {
                this.blockElement(videoElement);
            }
        });
    }

    shouldBlockElement(element) {
        if (!this.isFilteringActive || this.hasTemporaryAccess) {
            return false;
        }

        // Check if element contains content from unauthorized channels
        const channelLinks = element.querySelectorAll('a[href*="/channel/"], a[href*="/@"]');
        
        for (const link of channelLinks) {
            const href = link.getAttribute('href');
            if (href && !href.includes(this.allowedChannelId)) {
                return true;
            }
        }

        return false;
    }

    blockElement(element) {
        // Replace element with blocked content message
        const blockedDiv = document.createElement('div');
        blockedDiv.className = 'secureyt-blocked-mobile';
        blockedDiv.innerHTML = `
            <div class="block-message">
                <div class="shield-icon">🛡️</div>
                <h3>Content Blocked</h3>
                <p>This content is not from your allowed channel</p>
                <button onclick="window.youtubeFilter.requestTemporaryAccess()" class="unlock-btn">
                    🔓 Request Access
                </button>
            </div>
        `;

        // Add styles
        blockedDiv.style.cssText = `
            background: linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%);
            border: 2px solid #ef4444;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            color: white;
            margin: 0.5rem 0;
        `;

        // Replace original element
        element.parentNode?.replaceChild(blockedDiv, element);
    }

    updateFiltering() {
        this.isFilteringActive = !this.hasTemporaryAccess;
        
        // Update UI to reflect current filtering status
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            if (this.hasTemporaryAccess) {
                statusIndicator.textContent = '⚠️ Content filtering is disabled';
                statusIndicator.className = 'status-indicator warning';
            } else {
                statusIndicator.textContent = '🛡️ Content filtering is active';
                statusIndicator.className = 'status-indicator active';
            }
        }
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        const container = document.getElementById('youtube-container');
        if (container) {
            container.remove();
        }
    }
}

// Initialize YouTube filter
document.addEventListener('DOMContentLoaded', () => {
    window.youtubeFilter = new YouTubeFilter();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.youtubeFilter) {
        window.youtubeFilter.destroy();
    }
});