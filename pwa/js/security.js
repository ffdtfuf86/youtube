// SecureYT PWA Security System
class SecuritySystem {
    constructor() {
        this.currentStep = 1;
        this.verificationWord = '';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Security modal event listeners
        document.getElementById('verifyPasswordBtn').addEventListener('click', () => this.verifyPassword());
        document.getElementById('confirmCallBtn').addEventListener('click', () => this.confirmCall());
        document.getElementById('verifyVoiceBtn').addEventListener('click', () => this.verifyVoice());
        
        // Close modal when clicking outside
        document.getElementById('securityModal').addEventListener('click', (e) => {
            if (e.target.id === 'securityModal') {
                this.closeModal();
            }
        });

        // Enter key support
        document.getElementById('securityPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyPassword();
        });

        document.getElementById('spokenWord').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyVoice();
        });
    }

    startVerification() {
        this.currentStep = 1;
        this.resetModal();
        this.showModal();
        this.showStep(1);
    }

    showModal() {
        const modal = document.getElementById('securityModal');
        modal.classList.add('show');
        document.getElementById('securityPassword').focus();
    }

    closeModal() {
        const modal = document.getElementById('securityModal');
        modal.classList.remove('show');
        this.resetModal();
    }

    resetModal() {
        this.currentStep = 1;
        this.verificationWord = '';
        document.getElementById('securityPassword').value = '';
        document.getElementById('spokenWord').value = '';
        document.getElementById('verificationWord').textContent = '';
        this.showStep(1);
    }

    showStep(step) {
        // Hide all steps
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`step${i}`).style.display = 'none';
        }

        // Show current step
        document.getElementById(`step${step}`).style.display = 'block';

        // Update progress
        const progress = (step / 3) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('stepIndicator').textContent = `Step ${step} of 3`;

        this.currentStep = step;
    }

    async verifyPassword() {
        const enteredPassword = document.getElementById('securityPassword').value;
        const settings = window.secureYTApp.getSettings();

        if (!enteredPassword) {
            this.showAlert('Please enter your password');
            return;
        }

        if (enteredPassword === settings.securityPassword) {
            this.showStep(2);
            this.initiatePhoneVerification();
        } else {
            this.showAlert('Invalid password. Please try again.');
            document.getElementById('securityPassword').value = '';
            document.getElementById('securityPassword').focus();
        }
    }

    initiatePhoneVerification() {
        // Generate random verification word
        const words = [
            'SECURE', 'VERIFY', 'ACCESS', 'UNLOCK', 'CONFIRM', 
            'GUARD', 'SHIELD', 'TRUST', 'SAFE', 'CHECK',
            'PROTECT', 'DEFEND', 'WATCH', 'ALERT', 'STRONG'
        ];
        
        this.verificationWord = words[Math.floor(Math.random() * words.length)];
        document.getElementById('verificationWord').textContent = this.verificationWord;

        // Show notification (simulated phone call)
        this.showPhoneNotification();
    }

    showPhoneNotification() {
        const settings = window.secureYTApp.getSettings();
        
        // Create notification if browser supports it
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    const notification = new Notification('SecureYT Phone Verification', {
                        body: `Your verification word is: ${this.verificationWord}`,
                        icon: '/icons/icon-192.png',
                        badge: '/icons/icon-72.png',
                        tag: 'phone-verification',
                        requireInteraction: true
                    });

                    // Auto close after 10 seconds
                    setTimeout(() => {
                        notification.close();
                    }, 10000);
                }
            });
        }

        // Also show visual indicator
        this.showAlert(`Phone verification initiated for ${settings.phoneNumber}. Check your notifications!`);
    }

    confirmCall() {
        this.showStep(3);
        document.getElementById('spokenWord').focus();
    }

    verifyVoice() {
        const spokenWord = document.getElementById('spokenWord').value.toUpperCase().trim();
        
        if (!spokenWord) {
            this.showAlert('Please enter the verification word');
            return;
        }

        if (spokenWord === this.verificationWord) {
            this.verificationSuccess();
        } else {
            this.showAlert('Voice verification failed. Please try again.');
            document.getElementById('spokenWord').value = '';
            document.getElementById('spokenWord').focus();
        }
    }

    verificationSuccess() {
        this.closeModal();
        
        // Grant temporary access
        window.secureYTApp.grantTemporaryAccess();

        // Show success message
        const settings = window.secureYTApp.getSettings();
        this.showAlert(`✅ Verification successful! You now have temporary access for ${settings.temporaryAccessDuration} minutes.`);
    }

    showAlert(message) {
        // Create custom alert that looks better than browser alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'custom-alert';
        alertDiv.innerHTML = `
            <div class="alert-content">
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;

        // Add styles for custom alert
        alertDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const alertContent = alertDiv.querySelector('.alert-content');
        alertContent.style.cssText = `
            background: #1a1a1a;
            border: 2px solid #ef4444;
            border-radius: 12px;
            padding: 2rem;
            max-width: 90%;
            text-align: center;
            color: white;
        `;

        const button = alertContent.querySelector('button');
        button.style.cssText = `
            background: #ef4444;
            border: none;
            border-radius: 6px;
            color: white;
            padding: 0.75rem 1.5rem;
            margin-top: 1rem;
            cursor: pointer;
            font-weight: 600;
        `;

        document.body.appendChild(alertDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Utility methods for external access
    isVerificationInProgress() {
        const modal = document.getElementById('securityModal');
        return modal.classList.contains('show');
    }

    getCurrentStep() {
        return this.currentStep;
    }
}

// Initialize security system
document.addEventListener('DOMContentLoaded', () => {
    window.securitySystem = new SecuritySystem();
});