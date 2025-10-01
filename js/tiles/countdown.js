// Countdown Tile
class CountdownTile {
    constructor() {
        this.countdowns = this.loadCountdowns();
        this.activeCountdown = null;
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.startCountdownUpdates();
        
        // Listen for global updates
        window.addEventListener('tileUpdate', () => {
            this.update();
        });
        
        // Listen for calendar events to update next event countdown
        window.addEventListener('eventAdded', (e) => {
            this.updateNextEventCountdown();
        });
    }

    setupEventListeners() {
        const editCountdownBtn = document.querySelector('#customCountdownTile .edit-countdown-btn');
        const nextEventTile = document.getElementById('nextEventTile');
        const customCountdownTile = document.getElementById('customCountdownTile');
        
        if (editCountdownBtn) {
            editCountdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showCountdownEditor();
            });
        }
        
        // Click to cycle through countdowns
        customCountdownTile.addEventListener('click', () => {
            this.cycleCountdown();
        });
        
        // Next event tile click
        nextEventTile.addEventListener('click', () => {
            this.showNextEventDetails();
        });
    }

    render() {
        this.renderNextEventCountdown();
        this.renderCustomCountdown();
    }

    renderNextEventCountdown() {
        const nextEventCountdown = document.getElementById('nextEventCountdown');
        const nextEvent = this.getNextEvent();
        
        if (!nextEvent) {
            nextEventCountdown.innerHTML = `
                <div class="no-events">
                    <div class="countdown-event">No upcoming events</div>
                    <div class="countdown-suggestion">Add an event to see countdown</div>
                </div>
            `;
            return;
        }
        
        const timeUntil = this.getTimeUntil(nextEvent.datetime);
        
        nextEventCountdown.innerHTML = `
            <div class="countdown-event">${this.escapeHtml(nextEvent.title)}</div>
            <div class="countdown-time">${timeUntil.formatted}</div>
            <div class="countdown-units">${timeUntil.description}</div>
            <div class="countdown-date">${this.formatEventDate(nextEvent.datetime)}</div>
        `;
    }

    renderCustomCountdown() {
        const customCountdown = document.getElementById('customCountdown');
        
        if (this.countdowns.length === 0) {
            customCountdown.innerHTML = `
                <div class="no-countdown">
                    <div class="countdown-event">No countdown set</div>
                    <div class="countdown-suggestion">Click gear to create</div>
                </div>
            `;
            return;
        }
        
        const countdown = this.activeCountdown || this.countdowns[0];
        const timeUntil = this.getTimeUntil(countdown.targetDate);
        
        customCountdown.innerHTML = `
            <div class="countdown-event">${this.escapeHtml(countdown.title)}</div>
            <div class="countdown-time">${timeUntil.formatted}</div>
            <div class="countdown-units">${timeUntil.description}</div>
            ${this.countdowns.length > 1 ? `<div class="countdown-indicator">${this.countdowns.indexOf(countdown) + 1} / ${this.countdowns.length}</div>` : ''}
        `;
        
        // Add special styling for past events
        if (timeUntil.isPast) {
            customCountdown.classList.add('countdown-past');
        } else {
            customCountdown.classList.remove('countdown-past');
        }
    }

    getNextEvent() {
        try {
            const events = JSON.parse(localStorage.getItem('smartDisplayHub_events')) || [];
            const now = new Date();
            
            const upcomingEvents = events
                .map(event => {
                    const eventDate = new Date(event.date + 'T' + (event.time || '00:00'));
                    return { ...event, datetime: eventDate };
                })
                .filter(event => event.datetime > now)
                .sort((a, b) => a.datetime - b.datetime);
            
            return upcomingEvents[0] || null;
        } catch (e) {
            console.warn('Failed to get next event:', e);
            return null;
        }
    }

    getTimeUntil(targetDate) {
        const now = new Date();
        const target = new Date(targetDate);
        const diffMs = target - now;
        const isPast = diffMs < 0;
        const absDiffMs = Math.abs(diffMs);
        
        const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((absDiffMs % (1000 * 60)) / 1000);
        
        let formatted = '';
        let description = '';
        
        if (days > 0) {
            formatted = `${days}d ${hours}h`;
            description = days === 1 ? '1 day' : `${days} days`;
        } else if (hours > 0) {
            formatted = `${hours}h ${minutes}m`;
            description = hours === 1 ? '1 hour' : `${hours} hours`;
        } else if (minutes > 0) {
            formatted = `${minutes}m ${seconds}s`;
            description = minutes === 1 ? '1 minute' : `${minutes} minutes`;
        } else {
            formatted = `${seconds}s`;
            description = seconds === 1 ? '1 second' : `${seconds} seconds`;
        }
        
        if (isPast) {
            formatted = `-${formatted}`;
            description = `${description} ago`;
        } else {
            description = `in ${description}`;
        }
        
        return { formatted, description, isPast, days, hours, minutes, seconds };
    }

    formatEventDate(date) {
        const eventDate = new Date(date);
        const now = new Date();
        const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return eventDate.toLocaleDateString(undefined, { weekday: 'long' });
        
        return eventDate.toLocaleDateString();
    }

    cycleCountdown() {
        if (this.countdowns.length <= 1) return;
        
        const currentIndex = this.activeCountdown ? this.countdowns.indexOf(this.activeCountdown) : 0;
        const nextIndex = (currentIndex + 1) % this.countdowns.length;
        this.activeCountdown = this.countdowns[nextIndex];
        
        this.renderCustomCountdown();
        
        // Visual feedback
        const customCountdownTile = document.getElementById('customCountdownTile');
        customCountdownTile.style.transform = 'scale(0.95)';
        setTimeout(() => {
            customCountdownTile.style.transform = '';
        }, 150);
    }

    showCountdownEditor() {
        const modal = document.createElement('div');
        modal.className = 'countdown-editor-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Countdown Manager</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="countdown-list">
                        ${this.countdowns.map((countdown, index) => `
                            <div class="countdown-item" data-index="${index}">
                                <div class="countdown-info">
                                    <div class="countdown-title">${this.escapeHtml(countdown.title)}</div>
                                    <div class="countdown-target">${new Date(countdown.targetDate).toLocaleDateString()}</div>
                                </div>
                                <div class="countdown-actions">
                                    <button class="edit-btn" data-index="${index}">Edit</button>
                                    <button class="delete-btn" data-index="${index}">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                        ${this.countdowns.length === 0 ? '<div class="no-countdowns">No countdowns created yet</div>' : ''}
                    </div>
                    <button class="add-countdown-btn">Add New Countdown</button>
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
        
        modal.querySelector('.add-countdown-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.showCountdownForm();
        });
        
        // Edit and delete buttons
        modal.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                document.body.removeChild(modal);
                this.showCountdownForm(this.countdowns[index]);
            });
        });
        
        modal.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (confirm('Delete this countdown?')) {
                    this.countdowns.splice(index, 1);
                    this.saveCountdowns();
                    document.body.removeChild(modal);
                    this.render();
                }
            });
        });
    }

    showCountdownForm(countdown = null) {
        const isEdit = countdown !== null;
        const modal = document.createElement('div');
        modal.className = 'countdown-form-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${isEdit ? 'Edit' : 'Add'} Countdown</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="countdown-form">
                        <div class="form-group">
                            <label>Title:</label>
                            <input type="text" name="title" value="${isEdit ? this.escapeHtml(countdown.title) : ''}" placeholder="e.g., Vacation, Birthday, Project Deadline" required autofocus>
                        </div>
                        <div class="form-group">
                            <label>Target Date:</label>
                            <input type="date" name="date" value="${isEdit ? countdown.targetDate.split('T')[0] : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Target Time:</label>
                            <input type="time" name="time" value="${isEdit ? (countdown.targetDate.split('T')[1] || '00:00') : '00:00'}">
                        </div>
                        <div class="form-group">
                            <label>Description (optional):</label>
                            <textarea name="description" placeholder="Additional details about this countdown">${isEdit ? (countdown.description || '') : ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Color Theme:</label>
                            <select name="color">
                                <option value="default" ${isEdit && countdown.color === 'default' ? 'selected' : ''}>Default</option>
                                <option value="red" ${isEdit && countdown.color === 'red' ? 'selected' : ''}>Red</option>
                                <option value="green" ${isEdit && countdown.color === 'green' ? 'selected' : ''}>Green</option>
                                <option value="blue" ${isEdit && countdown.color === 'blue' ? 'selected' : ''}>Blue</option>
                                <option value="purple" ${isEdit && countdown.color === 'purple' ? 'selected' : ''}>Purple</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit">${isEdit ? 'Update' : 'Create'} Countdown</button>
                            <button type="button" class="cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus input
        setTimeout(() => {
            modal.querySelector('input[name="title"]').focus();
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
        
        modal.querySelector('.countdown-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const countdownData = {
                id: isEdit ? countdown.id : Date.now().toString(),
                title: formData.get('title').trim(),
                targetDate: formData.get('date') + 'T' + formData.get('time'),
                description: formData.get('description').trim(),
                color: formData.get('color'),
                createdAt: isEdit ? countdown.createdAt : new Date().toISOString()
            };
            
            if (isEdit) {
                const index = this.countdowns.findIndex(c => c.id === countdown.id);
                this.countdowns[index] = countdownData;
            } else {
                this.countdowns.push(countdownData);
            }
            
            this.saveCountdowns();
            document.body.removeChild(modal);
            this.render();
        });
    }

    showNextEventDetails() {
        const nextEvent = this.getNextEvent();
        if (!nextEvent) return;
        
        // Show event details modal (would integrate with calendar tile)
        window.dispatchEvent(new CustomEvent('showEventDetails', { detail: nextEvent }));
    }

    startCountdownUpdates() {
        // Update every second for active countdowns
        this.updateInterval = setInterval(() => {
            this.renderNextEventCountdown();
            this.renderCustomCountdown();
        }, 1000);
    }

    updateNextEventCountdown() {
        this.renderNextEventCountdown();
    }

    update() {
        // Called periodically - updates are handled by the interval
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadCountdowns() {
        try {
            return JSON.parse(localStorage.getItem('smartDisplayHub_countdowns')) || this.getDefaultCountdowns();
        } catch (e) {
            console.warn('Failed to load countdowns:', e);
            return this.getDefaultCountdowns();
        }
    }

    saveCountdowns() {
        try {
            localStorage.setItem('smartDisplayHub_countdowns', JSON.stringify(this.countdowns));
        } catch (e) {
            console.warn('Failed to save countdowns:', e);
        }
    }

    getDefaultCountdowns() {
        const newYear = new Date(new Date().getFullYear() + 1, 0, 1);
        return [
            {
                id: '1',
                title: 'New Year',
                targetDate: newYear.toISOString(),
                description: 'Welcome the new year!',
                color: 'default',
                createdAt: new Date().toISOString()
            }
        ];
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Make available globally
window.CountdownTile = CountdownTile;