// Timer Tile
class TimerTile {
    constructor() {
        this.timers = [];
        this.activeTimer = null;
        this.timerInterval = null;
        this.presetTimers = [
            { name: 'Pomodoro', minutes: 25 },
            { name: 'Short Break', minutes: 5 },
            { name: 'Long Break', minutes: 15 },
            { name: 'Tea', minutes: 3 },
            { name: 'Coffee', minutes: 4 }
        ];
        this.init();
    }

    init() {
        // Store instance on the timer tile element
        const timerTile = document.getElementById('timerTile');
        if (timerTile) {
            timerTile.__timerInstance = this;
        }
        
        this.render();
        this.setupEventListeners();
        
        // Listen for global updates
        window.addEventListener('tileUpdate', () => {
            this.update();
        });
    }

    setupEventListeners() {
        const timerDisplay = document.getElementById('timerDisplay');
        
        // Long press for timer settings
        let longPressTimer;
        timerDisplay.addEventListener('mousedown', () => {
            longPressTimer = setTimeout(() => {
                this.showTimerSettings();
            }, 800);
        });
        
        timerDisplay.addEventListener('mouseup', () => {
            clearTimeout(longPressTimer);
        });
        
        timerDisplay.addEventListener('mouseleave', () => {
            clearTimeout(longPressTimer);
        });
    }

    render() {
        const timerDisplay = document.getElementById('timerDisplay');
        
        if (!this.activeTimer) {
            timerDisplay.innerHTML = `
                <div class="timer-setup">
                    <div class="timer-time">00:00</div>
                    <div class="timer-presets">
                        ${this.presetTimers.map((preset, index) => `
                            <button class="preset-timer" tabindex="0" onmousedown="console.log('Button ${index}: ${preset.name} clicked at', event.target); window.timerTileInstance.startPresetTimer(${preset.minutes}, '${preset.name}')">
                                ${preset.name}
                            </button>
                        `).join('')}
                        <button class="preset-timer custom-btn" tabindex="0" onmousedown="console.log('Custom button clicked at', event.target); window.timerTileInstance.showCustomTimerDialog()">
                            Custom
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const timer = this.activeTimer;
        const timeRemaining = this.formatTime(Math.max(0, timer.duration - timer.elapsed));
        const progress = Math.min(1, timer.elapsed / timer.duration) * 100;
        
        timerDisplay.innerHTML = `
            <div class="active-timer">
                <div class="timer-name">${this.escapeHtml(timer.name)}</div>
                <div class="timer-time">${timeRemaining}</div>
                <div class="timer-progress">
                    <div class="timer-progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="timer-controls">
                    <button class="timer-btn" tabindex="0" onclick="console.log('Button 1: ${timer.isRunning ? 'Pause' : 'Resume'} clicked at', event.target); window.timerTileInstance.${timer.isRunning ? 'pauseTimer()' : 'resumeTimer()'}">
                        ${timer.isRunning ? 'Pause' : 'Resume'}
                    </button>
                    <button class="timer-btn" tabindex="0" onclick="console.log('Button 2: Stop clicked at', event.target); window.timerTileInstance.stopTimer()">Stop</button>
                    <button class="timer-btn" tabindex="0" onclick="console.log('Button 3: Reset clicked at', event.target); window.timerTileInstance.resetTimer()">Reset</button>
                    <button class="timer-btn" tabindex="0" onclick="console.log('Button 4: +1m clicked at', event.target); window.timerTileInstance.addTime(60)">+1m</button>
                </div>
            </div>
        `;
        
        // Add visual indicator if timer is complete
        if (timer.elapsed >= timer.duration) {
            timerDisplay.classList.add('timer-complete');
        } else {
            timerDisplay.classList.remove('timer-complete');
        }
    }

    handleTimerAction(action) {
        console.log('handleTimerAction called with:', action, 'activeTimer:', this.activeTimer);
        switch (action) {
            case 'pause':
                console.log('Calling pauseTimer');
                this.pauseTimer();
                break;
            case 'resume':
                console.log('Calling resumeTimer');
                this.resumeTimer();
                break;
            case 'stop':
                console.log('Calling stopTimer');
                this.stopTimer();
                break;
            case 'reset':
                console.log('Calling resetTimer');
                this.resetTimer();
                break;
            case 'add1':
                console.log('Calling addTime(60)');
                this.addTime(60); // Add 1 minute
                break;
            case 'custom':
                console.log('Calling showCustomTimerDialog');
                this.showCustomTimerDialog();
                break;
        }
    }

    startPresetTimer(minutes, name) {
        this.startTimer(minutes * 60, name);
    }

    startTimer(durationSeconds, name = 'Timer') {
        this.stopTimer(); // Stop any existing timer
        
        this.activeTimer = {
            id: Date.now().toString(),
            name: name,
            duration: durationSeconds,
            elapsed: 0,
            isRunning: true,
            startTime: Date.now()
        };
        
        this.startTimerInterval();
        this.render();
        
        // Visual feedback
        const timerTile = document.getElementById('timerTile');
        timerTile.style.transform = 'scale(1.05)';
        setTimeout(() => {
            timerTile.style.transform = '';
        }, 200);
    }

    pauseTimer() {
        if (this.activeTimer && this.activeTimer.isRunning) {
            this.activeTimer.isRunning = false;
            this.stopTimerInterval();
            this.render();
        }
    }

    resumeTimer() {
        if (this.activeTimer && !this.activeTimer.isRunning) {
            this.activeTimer.isRunning = true;
            this.activeTimer.startTime = Date.now() - (this.activeTimer.elapsed * 1000);
            this.startTimerInterval();
            this.render();
        }
    }

    stopTimer() {
        if (this.activeTimer) {
            this.stopTimerInterval();
            this.activeTimer = null;
            this.render();
            
            // Remove complete state
            document.getElementById('timerDisplay').classList.remove('timer-complete');
        }
    }

    resetTimer() {
        if (this.activeTimer) {
            // Reset elapsed time to 0 but keep the timer running state
            this.activeTimer.elapsed = 0;
            this.activeTimer.startTime = Date.now();
            this.render();
            
            // Remove complete state
            document.getElementById('timerDisplay').classList.remove('timer-complete');
            
            // Visual feedback
            const timerTile = document.getElementById('timerTile');
            timerTile.style.transform = 'scale(1.02)';
            setTimeout(() => {
                timerTile.style.transform = '';
            }, 200);
        }
    }

    addTime(seconds) {
        console.log('addTime called with', seconds, 'seconds, activeTimer exists:', !!this.activeTimer);
        if (this.activeTimer) {
            console.log('Before - duration:', this.activeTimer.duration, 'elapsed:', this.activeTimer.elapsed);
            this.activeTimer.duration += seconds;
            console.log('After - duration:', this.activeTimer.duration);
            this.render();
            
            // Visual feedback
            const timerTile = document.getElementById('timerTile');
            if (timerTile) {
                timerTile.style.backgroundColor = '#28a745';
                setTimeout(() => {
                    timerTile.style.backgroundColor = '';
                }, 300);
            }
        } else {
            console.log('No active timer to add time to');
        }
    }

    startTimerInterval() {
        this.stopTimerInterval();
        
        this.timerInterval = setInterval(() => {
            if (!this.activeTimer || !this.activeTimer.isRunning) return;
            
            const now = Date.now();
            this.activeTimer.elapsed = Math.floor((now - this.activeTimer.startTime) / 1000);
            
            this.render();
            
            // Check if timer is complete
            if (this.activeTimer.elapsed >= this.activeTimer.duration) {
                this.onTimerComplete();
            }
        }, 100); // Update every 100ms for smooth progress bar
    }

    stopTimerInterval() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    onTimerComplete() {
        this.activeTimer.isRunning = false;
        this.stopTimerInterval();
        this.render();
        
        // Visual and audio notification
        this.showTimerCompleteNotification();
        this.playTimerSound();
        
        // Browser notification if supported
        this.showBrowserNotification();
    }

    showTimerCompleteNotification() {
        const notification = document.createElement('div');
        notification.className = 'timer-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">⏰</div>
                <div class="notification-text">
                    <div class="notification-title">Timer Complete!</div>
                    <div class="notification-subtitle">${this.escapeHtml(this.activeTimer.name)}</div>
                </div>
                <button class="notification-dismiss">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto dismiss after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 10000);
        
        // Manual dismiss
        notification.querySelector('.notification-dismiss').addEventListener('click', () => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        });
        
        // Flash the timer tile
        const timerTile = document.getElementById('timerTile');
        timerTile.classList.add('timer-flash');
        setTimeout(() => {
            timerTile.classList.remove('timer-flash');
        }, 3000);
    }

    playTimerSound() {
        try {
            // Create a simple beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            
            // Repeat the beep 3 times
            setTimeout(() => {
                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                osc2.frequency.setValueAtTime(800, audioContext.currentTime);
                gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
                osc2.start();
                osc2.stop(audioContext.currentTime + 0.2);
            }, 300);
            
            setTimeout(() => {
                const osc3 = audioContext.createOscillator();
                const gain3 = audioContext.createGain();
                osc3.connect(gain3);
                gain3.connect(audioContext.destination);
                osc3.frequency.setValueAtTime(800, audioContext.currentTime);
                gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
                osc3.start();
                osc3.stop(audioContext.currentTime + 0.2);
            }, 600);
        } catch (e) {
            console.warn('Could not play timer sound:', e);
        }
    }

    showBrowserNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: `${this.activeTimer.name} has finished`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
                tag: 'timer-complete'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }

    showCustomTimerDialog() {
        const modal = document.createElement('div');
        modal.className = 'custom-timer-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Custom Timer</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="custom-timer-form">
                        <div class="form-group">
                            <label>Timer Name:</label>
                            <input type="text" name="name" placeholder="e.g., Workout, Study Session" required autofocus>
                        </div>
                        <div class="time-inputs">
                            <div class="time-input-group">
                                <label>Hours:</label>
                                <input type="number" name="hours" min="0" max="23" value="0">
                            </div>
                            <div class="time-input-group">
                                <label>Minutes:</label>
                                <input type="number" name="minutes" min="0" max="59" value="5">
                            </div>
                            <div class="time-input-group">
                                <label>Seconds:</label>
                                <input type="number" name="seconds" min="0" max="59" value="0">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="submit">Start Timer</button>
                            <button type="button" class="cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus input
        setTimeout(() => {
            modal.querySelector('input[name="name"]').focus();
        }, 100);
        
        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        modal.querySelector('.custom-timer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const hours = parseInt(formData.get('hours')) || 0;
            const minutes = parseInt(formData.get('minutes')) || 0;
            const seconds = parseInt(formData.get('seconds')) || 0;
            const name = formData.get('name').trim();
            
            const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
            
            if (totalSeconds > 0) {
                this.startTimer(totalSeconds, name);
                document.body.removeChild(modal);
            }
        });
    }

    showTimerSettings() {
        const modal = document.createElement('div');
        modal.className = 'timer-settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Timer Settings</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h4>Preset Timers</h4>
                        <div class="preset-list">
                            ${this.presetTimers.map((preset, index) => `
                                <div class="preset-item">
                                    <span>${preset.name} - ${preset.minutes}m</span>
                                    <button class="edit-preset" data-index="${index}">Edit</button>
                                </div>
                            `).join('')}
                        </div>
                        <button class="add-preset-btn">Add Preset</button>
                    </div>
                    <div class="settings-section">
                        <h4>Notifications</h4>
                        <label>
                            <input type="checkbox" id="soundEnabled" checked>
                            Sound notifications
                        </label>
                        <label>
                            <input type="checkbox" id="browserNotifications">
                            Browser notifications
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Request notification permission if needed
        modal.querySelector('#browserNotifications').addEventListener('change', (e) => {
            if (e.target.checked && 'Notification' in window) {
                Notification.requestPermission();
            }
        });
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    update() {
        // Updates are handled by the timer interval
    }

    destroy() {
        this.stopTimerInterval();
    }
}

// Make available globally
window.TimerTile = TimerTile;

// Test function for debugging
window.testTimer = function() {
    const instance = window.timerTileInstance;
    if (instance) {
        console.log('Timer instance found:', instance);
        console.log('Active timer:', instance.activeTimer);
        // Start a test timer
        instance.startPresetTimer(1, 'Test Timer');
    } else {
        console.log('No timer instance found');
    }
};