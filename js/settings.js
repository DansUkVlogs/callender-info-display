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

        // API settings - auto-save on blur
        const apiInputs = ['weatherApiKey', 'location', 'trafficApiKey'];
        apiInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('blur', () => {
                    this.saveApiSettings();
                });
            }
        });
    }

    saveApiSettings() {
        if (window.smartDisplayHub) {
            const settings = window.smartDisplayHub.settings;
            settings.weatherApiKey = document.getElementById('weatherApiKey').value;
            settings.location = document.getElementById('location').value;
            settings.trafficApiKey = document.getElementById('trafficApiKey').value;
            window.smartDisplayHub.saveSettings();

            // Trigger API-dependent tiles to update
            window.dispatchEvent(new CustomEvent('apiSettingsChanged'));
        }
    }

    validateApiKey(service, key) {
        // Basic validation
        if (!key || key.trim().length === 0) {
            return false;
        }

        switch (service) {
            case 'weather':
                return key.length >= 32; // OpenWeatherMap keys are typically 32 chars
            case 'traffic':
                return key.startsWith('AIza'); // Google Maps API keys start with AIza
            default:
                return key.length > 10;
        }
    }

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