// Theme Management
class ThemeManager {
    constructor() {
        this.themes = ['auto', 'light', 'dark', 'night'];
        this.init();
    }

    init() {
        this.setupThemeHandlers();
        this.detectSystemTheme();
    }

    setupThemeHandlers() {
        // Listen for system theme changes
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addListener(() => {
                if (this.getCurrentTheme() === 'auto') {
                    this.applyAutoTheme();
                }
            });
        }

        // Listen for time-based theme changes (for auto mode)
        this.setupTimeBasedThemes();
    }

    detectSystemTheme() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            return darkModeQuery.matches ? 'dark' : 'light';
        }
        return 'light';
    }

    setupTimeBasedThemes() {
        // Check every hour for time-based theme changes
        setInterval(() => {
            if (this.getCurrentTheme() === 'auto') {
                this.applyAutoTheme();
            }
        }, 60 * 60 * 1000); // 1 hour
    }

    getCurrentTheme() {
        if (window.smartDisplayHub) {
            return window.smartDisplayHub.settings.theme || 'auto';
        }
        return 'auto';
    }

    applyAutoTheme() {
        const hour = new Date().getHours();
        const systemTheme = this.detectSystemTheme();
        
        let theme;
        
        // Night mode between 10 PM and 6 AM
        if (hour >= 22 || hour < 6) {
            theme = 'night';
        } else {
            // Follow system preference during day hours
            theme = systemTheme;
        }
        
        this.applyTheme(theme);
    }

    applyTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'auto') {
            this.applyAutoTheme();
            return;
        }
        
        // Remove all theme classes
        this.themes.forEach(t => {
            html.classList.remove(`theme-${t}`);
        });
        
        // Add current theme class
        html.classList.add(`theme-${theme}`);
        html.setAttribute('data-theme', theme);
        
        // Update theme color meta tag for mobile browsers
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            const colors = {
                light: '#ffffff',
                dark: '#2c3e50',
                night: '#1a1a1a'
            };
            themeColorMeta.content = colors[theme] || colors.dark;
        }
        
        // Store preference if not auto
        if (theme !== 'auto' && window.smartDisplayHub) {
            window.smartDisplayHub.settings.theme = theme;
            window.smartDisplayHub.saveSettings();
        }

        // Notify tiles of theme change
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme, isAuto: false } 
        }));
    }

    cycleTheme() {
        const current = this.getCurrentTheme();
        const currentIndex = this.themes.indexOf(current);
        const nextTheme = this.themes[(currentIndex + 1) % this.themes.length];
        
        if (window.smartDisplayHub) {
            window.smartDisplayHub.setTheme(nextTheme);
        }
        
        return nextTheme;
    }

    getThemeIcon(theme) {
        const icons = {
            auto: '🌓',
            light: '☀️',
            dark: '🌙',
            night: '🌚'
        };
        return icons[theme] || icons.auto;
    }

    // Accessibility helpers
    getHighContrastMode() {
        if (window.matchMedia) {
            return window.matchMedia('(prefers-contrast: high)').matches;
        }
        return false;
    }

    getReducedMotion() {
        if (window.matchMedia) {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        return false;
    }

    applyAccessibilityPreferences() {
        const html = document.documentElement;
        
        if (this.getHighContrastMode()) {
            html.classList.add('high-contrast');
        } else {
            html.classList.remove('high-contrast');
        }
        
        if (this.getReducedMotion()) {
            html.classList.add('reduced-motion');
        } else {
            html.classList.remove('reduced-motion');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    
    // Apply accessibility preferences
    window.themeManager.applyAccessibilityPreferences();
    
    // Listen for accessibility preference changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-contrast: high)').addListener(() => {
            window.themeManager.applyAccessibilityPreferences();
        });
        
        window.matchMedia('(prefers-reduced-motion: reduce)').addListener(() => {
            window.themeManager.applyAccessibilityPreferences();
        });
    }
});