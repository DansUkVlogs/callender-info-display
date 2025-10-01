// Settings Management
class SettingsManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupSettingsHandlers();
    }

    setupSettingsHandlers() {
        // Theme settings
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (window.smartDisplayHub) {
                    window.smartDisplayHub.setTheme(e.target.value);
                }
            });
        });

        // Layout settings
        const layoutSelect = document.getElementById('layoutProfile');
        if (layoutSelect) {
            layoutSelect.addEventListener('change', (e) => {
                if (window.smartDisplayHub) {
                    window.smartDisplayHub.loadLayout(e.target.value);
                }
            });
        }

        const saveLayoutBtn = document.getElementById('saveLayout');
        if (saveLayoutBtn) {
            saveLayoutBtn.addEventListener('click', () => {
                if (window.smartDisplayHub) {
                    window.smartDisplayHub.saveCurrentLayout();
                }
            });
        }

        // API settings removed - now hardcoded in tile classes
    }

    // saveApiSettings() method removed - API keys now hardcoded

    // validateApiKey() method removed - API keys now hardcoded

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});