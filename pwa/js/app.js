// SecureYT PWA Main Application
class SecureYTApp {
    constructor() {
        this.settings = {
            allowedChannelId: null,
            allowedChannelName: '',
            allowedChannelUrl: '',
            securityPassword: '',
            phoneNumber: '',
            temporaryAccessDuration: 30,
            hasTemporaryAccess: false,
            accessExpiry: null
        };
        
        this.deferredPrompt = null;
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        this.setupPWAInstall();
        this.checkAccessExpiry();
        
        // Check for settings parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('settings')) {
            this.openSettings();
        }
    }

    // Local Storage Management
    async loadSettings() {
        try {
            const stored = localStorage.getItem('secureyt-settings');
            if (stored) {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async saveSettings() {
        try {
            localStorage.setItem('secureyt-settings', JSON.stringify(this.settings));
            this.updateUI();
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsForm').addEventListener('submit', (e) => this.handleSettingsSubmit(e));

        // Action buttons
        document.getElementById('openYouTubeBtn').addEventListener('click', () => this.openFilteredYouTube());
        document.getElementById('unlockBtn').addEventListener('click', () => this.startUnlockProcess());
        document.getElementById('endAccessBtn').addEventListener('click', () => this.endTemporaryAccess());

        // PWA install
        document.getElementById('installBtn')?.addEventListener('click', () => this.installPWA());
        document.getElementById('dismissBtn')?.addEventListener('click', () => this.dismissInstall());

        // Listen for beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Listen for appinstalled
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallPrompt();
        });
    }

    // UI Updates
    updateUI() {
        // Status indicators
        const filterStatus = document.getElementById('filterStatus');
        const filterStatusText = document.getElementById('filterStatusText');
        const accessStatus = document.getElementById('accessStatus');
        const accessStatusText = document.getElementById('accessStatusText');

        if (this.settings.hasTemporaryAccess && this.settings.accessExpiry > Date.now()) {
            filterStatus.className = 'status-icon';
            filterStatusText.textContent = 'Disabled';
            accessStatus.className = 'status-icon active';
            accessStatusText.textContent = 'Active';
            document.getElementById('endAccessBtn').style.display = 'block';
        } else {
            filterStatus.className = 'status-icon active';
            filterStatusText.textContent = 'Active';
            accessStatus.className = 'status-icon';
            accessStatusText.textContent = 'Inactive';
            document.getElementById('endAccessBtn').style.display = 'none';
            
            // Clear expired access
            if (this.settings.hasTemporaryAccess) {
                this.settings.hasTemporaryAccess = false;
                this.settings.accessExpiry = null;
                this.saveSettings();
            }
        }

        // Channel information
        const channelSection = document.getElementById('channelSection');
        const channelName = document.getElementById('channelName');
        const channelUrl = document.getElementById('channelUrl');

        if (this.settings.allowedChannelName && this.settings.allowedChannelUrl) {
            channelSection.style.display = 'block';
            channelName.textContent = this.settings.allowedChannelName;
            channelUrl.textContent = this.settings.allowedChannelUrl;
        } else {
            channelSection.style.display = 'none';
        }

        // Update form fields
        document.getElementById('channelUrlInput').value = this.settings.allowedChannelUrl || '';
        document.getElementById('channelNameInput').value = this.settings.allowedChannelName || '';
        document.getElementById('passwordInput').value = this.settings.securityPassword || '';
        document.getElementById('phoneInput').value = this.settings.phoneNumber || '';
        document.getElementById('durationInput').value = this.settings.temporaryAccessDuration || 30;
    }

    // Settings Management
    openSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('show');
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('show');
    }

    async handleSettingsSubmit(e) {
        e.preventDefault();
        
        const channelUrl = document.getElementById('channelUrlInput').value.trim();
        const channelName = document.getElementById('channelNameInput').value.trim();
        const password = document.getElementById('passwordInput').value.trim();
        const phone = document.getElementById('phoneInput').value.trim();
        const duration = parseInt(document.getElementById('durationInput').value);

        // Validation
        if (!channelUrl) {
            this.showAlert('Please enter a YouTube channel URL');
            return;
        }

        if (!channelName) {
            this.showAlert('Please enter a channel name');
            return;
        }

        if (!password) {
            this.showAlert('Please set a security password');
            return;
        }

        if (!phone) {
            this.showAlert('Please enter your phone number');
            return;
        }

        // Extract channel ID
        const channelId = this.extractChannelId(channelUrl);
        if (!channelId) {
            this.showAlert('Invalid YouTube channel URL');
            return;
        }

        // Save settings
        this.settings.allowedChannelId = channelId;
        this.settings.allowedChannelName = channelName;
        this.settings.allowedChannelUrl = channelUrl;
        this.settings.securityPassword = password;
        this.settings.phoneNumber = phone;
        this.settings.temporaryAccessDuration = duration;

        await this.saveSettings();
        this.closeSettings();
        this.showAlert('Settings saved successfully!');
    }

    extractChannelId(url) {
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

    // YouTube Integration
    openFilteredYouTube() {
        if (!this.settings.allowedChannelId) {
            this.showAlert('Please configure your allowed channel first');
            this.openSettings();
            return;
        }

        // Create filtered YouTube interface
        this.createFilteredYouTubeView();
    }

    createFilteredYouTubeView() {
        // Open YouTube in a filtered iframe or redirect to YouTube with filtering
        const youtubeUrl = `https://youtube.com/channel/${this.settings.allowedChannelId}`;
        
        // For PWA, we'll open in the same window with filtering
        window.location.href = '/youtube-filter.html?channel=' + encodeURIComponent(this.settings.allowedChannelId);
    }

    // Security System
    startUnlockProcess() {
        if (!this.settings.securityPassword) {
            this.showAlert('Please configure security settings first');
            this.openSettings();
            return;
        }

        // Initialize security modal
        window.securitySystem.startVerification();
    }

    async endTemporaryAccess() {
        if (confirm('Are you sure you want to end temporary access? Content filtering will resume immediately.')) {
            this.settings.hasTemporaryAccess = false;
            this.settings.accessExpiry = null;
            await this.saveSettings();
            this.showAlert('Temporary access ended');
        }
    }

    grantTemporaryAccess() {
        const duration = this.settings.temporaryAccessDuration * 60 * 1000; // Convert to milliseconds
        this.settings.hasTemporaryAccess = true;
        this.settings.accessExpiry = Date.now() + duration;
        this.saveSettings();
        
        // Set timer to automatically expire access
        setTimeout(() => {
            this.checkAccessExpiry();
        }, duration);

        this.showAlert(`Temporary access granted for ${this.settings.temporaryAccessDuration} minutes!`);
    }

    checkAccessExpiry() {
        if (this.settings.hasTemporaryAccess && this.settings.accessExpiry) {
            if (Date.now() >= this.settings.accessExpiry) {
                this.settings.hasTemporaryAccess = false;
                this.settings.accessExpiry = null;
                this.saveSettings();
                this.showAlert('Temporary access has expired');
            } else {
                // Set timer for remaining time
                const remainingTime = this.settings.accessExpiry - Date.now();
                setTimeout(() => {
                    this.checkAccessExpiry();
                }, remainingTime);
            }
        }
    }

    // PWA Installation
    setupPWAInstall() {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('PWA is already installed');
            return;
        }

        // Show install prompt after delay
        setTimeout(() => {
            if (this.deferredPrompt) {
                this.showInstallPrompt();
            }
        }, 5000);
    }

    showInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.style.display = 'block';
            installPrompt.classList.add('slide-in');
        }
    }

    hideInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.style.display = 'none';
        }
    }

    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            this.deferredPrompt = null;
            this.hideInstallPrompt();
        }
    }

    dismissInstall() {
        this.hideInstallPrompt();
        this.deferredPrompt = null;
    }

    // Utility Functions
    showAlert(message) {
        // Simple alert for now - could be replaced with custom modal
        alert(message);
    }

    // Getters for other modules
    getSettings() {
        return this.settings;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.secureYTApp = new SecureYTApp();
});