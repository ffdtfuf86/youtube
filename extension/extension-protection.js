// SecureYT Extension Protection Script
// This script runs on chrome://extensions to protect against removal

(() => {
    console.log('SecureYT extension protection script loaded');
    
    let protectionActive = false;
    let securityModal = null;
    
    // Initialize protection
    function initializeProtection() {
        if (protectionActive) return;
        protectionActive = true;
        
        console.log('Initializing SecureYT removal protection');
        
        // Find SecureYT extension card
        const findExtensionCard = () => {
            const cards = document.querySelectorAll('extensions-item');
            for (const card of cards) {
                const nameElement = card.shadowRoot?.querySelector('#name');
                if (nameElement?.textContent?.includes('SecureYT')) {
                    return card;
                }
            }
            return null;
        };
        
        // Add protection overlay to extension card
        const addProtectionOverlay = (card) => {
            if (card.querySelector('.secureyt-protection')) return;
            
            const overlay = document.createElement('div');
            overlay.className = 'secureyt-protection';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(239, 68, 68, 0.95);
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                z-index: 10000;
                border-radius: 8px;
                backdrop-filter: blur(2px);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            overlay.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛡️</div>
                <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">REMOVAL PROTECTION ACTIVE</div>
                <div style="font-size: 0.9rem; opacity: 0.9; text-align: center; max-width: 200px; line-height: 1.4;">
                    Multi-layer security verification required
                </div>
                <button onclick="window.secureYTRequestRemoval()" 
                        style="
                            background: rgba(255, 255, 255, 0.2);
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            border-radius: 4px;
                            color: white;
                            padding: 0.5rem 1rem;
                            margin-top: 1rem;
                            cursor: pointer;
                            font-size: 0.8rem;
                            font-weight: 600;
                        ">
                    Authorize Removal
                </button>
            `;
            
            card.style.position = 'relative';
            card.appendChild(overlay);
            
            // Disable toggle switch
            const toggle = card.shadowRoot?.querySelector('#enableToggle');
            if (toggle) {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showSecurityWarning('Extension disable blocked by SecureYT protection.');
                    return false;
                }, true);
            }
            
            // Disable remove button
            const removeButton = card.shadowRoot?.querySelector('#removeButton');
            if (removeButton) {
                removeButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.secureYTRequestRemoval();
                    return false;
                }, true);
            }
        };
        
        // Monitor for extension card and apply protection
        const monitorExtension = () => {
            const card = findExtensionCard();
            if (card) {
                addProtectionOverlay(card);
            }
        };
        
        // Start monitoring
        monitorExtension();
        setInterval(monitorExtension, 2000);
        
        // Monitor for DOM changes
        const observer = new MutationObserver(monitorExtension);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Add global removal request handler
        window.secureYTRequestRemoval = () => {
            showRemovalSecurityModal();
        };
    }
    
    // Show security warning
    function showSecurityWarning(message) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            font-weight: 600;
            z-index: 100000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        warning.textContent = `🛡️ ${message}`;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.remove();
        }, 5000);
    }
    
    // Show removal security modal
    function showRemovalSecurityModal() {
        if (securityModal) return;
        
        securityModal = document.createElement('div');
        securityModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        securityModal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%);
                border: 2px solid #ef4444;
                border-radius: 16px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                color: white;
                text-align: center;
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🛡️</div>
                <h2 style="color: #ef4444; margin: 0 0 1rem 0;">Extension Removal Protection</h2>
                <p style="color: #cccccc; margin: 1rem 0; line-height: 1.6;">
                    SecureYT requires multi-layer security verification before removal:
                </p>
                <div style="background: #374151; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; text-align: left;">
                    <div style="color: #f59e0b; font-weight: 600; margin-bottom: 1rem;">Required Verification Steps:</div>
                    <div style="color: #d1d5db; margin: 0.5rem 0;">🔑 Security password verification</div>
                    <div style="color: #d1d5db; margin: 0.5rem 0;">📞 Phone number verification</div>
                    <div style="color: #d1d5db; margin: 0.5rem 0;">🎤 Voice verification</div>
                </div>
                <p style="color: #fca5a5; font-size: 0.9rem; margin: 1rem 0;">
                    This protection prevents unauthorized removal and ensures your security settings remain intact.
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                    <button onclick="window.secureYTStartRemovalProcess()" style="
                        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        padding: 1rem 2rem;
                        cursor: pointer;
                        font-weight: 600;
                    ">Start Verification</button>
                    <button onclick="window.secureYTCloseModal()" style="
                        background: #374151;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        padding: 1rem 2rem;
                        cursor: pointer;
                        font-weight: 600;
                    ">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(securityModal);
        
        // Add event handlers
        window.secureYTStartRemovalProcess = () => {
            // Send message to background script to start removal verification
            chrome.runtime.sendMessage({
                action: 'requestExtensionRemoval'
            }, (response) => {
                if (response?.requiresVerification) {
                    showSecurityWarning('Please complete verification in the SecureYT extension popup.');
                    // Open extension popup for verification
                    chrome.tabs.create({
                        url: chrome.runtime.getURL('popup.html')
                    });
                }
            });
            
            window.secureYTCloseModal();
        };
        
        window.secureYTCloseModal = () => {
            if (securityModal) {
                securityModal.remove();
                securityModal = null;
            }
        };
        
        // Close modal when clicking outside
        securityModal.addEventListener('click', (e) => {
            if (e.target === securityModal) {
                window.secureYTCloseModal();
            }
        });
    }
    
    // Wait for page to load, then initialize protection
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeProtection);
    } else {
        setTimeout(initializeProtection, 1000);
    }
    
    // Also initialize when any extension management interactions occur
    document.addEventListener('click', () => {
        setTimeout(initializeProtection, 500);
    });
    
    // Prevent developer tools on this page
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            showSecurityWarning('Developer tools are disabled on extension management page for security.');
            return false;
        }
    });
    
    // Prevent right-click context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showSecurityWarning('Right-click context menu is disabled for security.');
        return false;
    });
    
    console.log('SecureYT extension protection initialized');
})();