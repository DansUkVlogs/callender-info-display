// Time & Date Tile
class TimeTile {
    constructor() {
        this.timeFormat = '12'; // 12 or 24 hour format
        this.showSeconds = false;
        this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        this.init();
    }

    init() {
        this.render();
        this.startClock();
        this.setupEventListeners();
        
        // Listen for global updates
        window.addEventListener('tileUpdate', () => {
            this.update();
        });
    }

    setupEventListeners() {
        const timeDisplay = document.getElementById('timeDisplay');
        
        // Click to toggle format
        timeDisplay.addEventListener('click', () => {
            this.toggleTimeFormat();
        });
        
        // Double click to toggle seconds
        let clickCount = 0;
        timeDisplay.addEventListener('click', () => {
            clickCount++;
            setTimeout(() => {
                if (clickCount === 2) {
                    this.toggleSeconds();
                }
                clickCount = 0;
            }, 300);
        });
    }

    startClock() {
        this.updateTime();
        
        // Update every second if showing seconds, otherwise every minute
        const interval = this.showSeconds ? 1000 : 60000;
        
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        
        this.clockInterval = setInterval(() => {
            this.updateTime();
        }, interval);
    }

    updateTime() {
        const now = new Date();
        const timeElement = document.querySelector('.current-time');
        const dateElement = document.querySelector('.current-date');
        const timezoneElement = document.querySelector('.timezone');
        
        if (timeElement) {
            timeElement.textContent = this.formatTime(now);
        }
        
        if (dateElement) {
            dateElement.textContent = this.formatDate(now);
        }
        
        if (timezoneElement) {
            timezoneElement.textContent = this.formatTimezone();
        }
    }

    formatTime(date) {
        const options = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: this.timeFormat === '12',
            timeZone: this.timezone
        };
        
        if (this.showSeconds) {
            options.second = '2-digit';
        }
        
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }

    formatDate(date) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: this.timezone
        };
        
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }

    formatTimezone() {
        try {
            const shortName = new Intl.DateTimeFormat('en', {
                timeZoneName: 'short',
                timeZone: this.timezone
            }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value;
            
            return shortName || this.timezone;
        } catch (e) {
            return this.timezone;
        }
    }

    render() {
        const timeDisplay = document.getElementById('timeDisplay');
        
        timeDisplay.innerHTML = `
            <div class="current-time">--:--</div>
            <div class="current-date">Loading...</div>
            <div class="timezone">${this.formatTimezone()}</div>
        `;
        
        // Initial time update
        this.updateTime();
    }

    toggleTimeFormat() {
        this.timeFormat = this.timeFormat === '12' ? '24' : '12';
        this.updateTime();
        this.saveSettings();
        
        // Visual feedback
        const timeElement = document.querySelector('.current-time');
        if (timeElement) {
            timeElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                timeElement.style.transform = '';
            }, 200);
        }
    }

    toggleSeconds() {
        this.showSeconds = !this.showSeconds;
        this.startClock(); // Restart with new interval
        this.saveSettings();
        
        // Visual feedback
        const timeDisplay = document.getElementById('timeDisplay');
        timeDisplay.style.transform = 'scale(0.95)';
        setTimeout(() => {
            timeDisplay.style.transform = '';
        }, 200);
    }

    setTimezone(timezone) {
        try {
            // Validate timezone
            Intl.DateTimeFormat(undefined, { timeZone: timezone });
            this.timezone = timezone;
            this.render();
            this.saveSettings();
        } catch (e) {
            console.warn('Invalid timezone:', timezone);
        }
    }

    update() {
        // Called periodically - check if we need to update anything
        this.updateTime();
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('smartDisplayHub_timeSettings')) || {};
            this.timeFormat = settings.timeFormat || '12';
            this.showSeconds = settings.showSeconds || false;
            this.timezone = settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
            console.warn('Failed to load time settings:', e);
        }
    }

    saveSettings() {
        try {
            const settings = {
                timeFormat: this.timeFormat,
                showSeconds: this.showSeconds,
                timezone: this.timezone
            };
            localStorage.setItem('smartDisplayHub_timeSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save time settings:', e);
        }
    }

    // World clock functionality
    addWorldClock(timezone, label) {
        // TODO: Implement multiple timezone display
        console.log('World clock feature coming soon');
    }

    // Alarm functionality
    setAlarm(time, label, days = []) {
        // TODO: Implement alarm system
        console.log('Alarm feature coming soon');
    }

    // Stopwatch functionality
    startStopwatch() {
        if (!this.stopwatchStartTime) {
            this.stopwatchStartTime = Date.now();
            this.stopwatchInterval = setInterval(() => {
                this.updateStopwatch();
            }, 10); // Update every 10ms for smooth display
        }
    }

    stopStopwatch() {
        if (this.stopwatchInterval) {
            clearInterval(this.stopwatchInterval);
            this.stopwatchInterval = null;
        }
    }

    resetStopwatch() {
        this.stopStopwatch();
        this.stopwatchStartTime = null;
        this.stopwatchElapsed = 0;
    }

    updateStopwatch() {
        if (this.stopwatchStartTime) {
            this.stopwatchElapsed = Date.now() - this.stopwatchStartTime;
            // Update display if stopwatch is visible
        }
    }

    formatStopwatchTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    destroy() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        if (this.stopwatchInterval) {
            clearInterval(this.stopwatchInterval);
        }
    }
}

// Make available globally
window.TimeTile = TimeTile;