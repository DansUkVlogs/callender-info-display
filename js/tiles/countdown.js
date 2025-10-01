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
        const customCountdownTile = document.getElementById('customCountdownTile');
        
        console.log('Countdown setupEventListeners - editCountdownBtn found:', !!editCountdownBtn);
        console.log('Countdown setupEventListeners - customCountdownTile found:', !!customCountdownTile);
        
        if (editCountdownBtn) {
            editCountdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Countdown gear button clicked!');
                this.showCountdownEditor();
            });
        } else {
            console.warn('Edit countdown button not found!');
        }
        
        // Click to cycle through countdowns
        if (customCountdownTile) {
            customCountdownTile.addEventListener('click', () => {
                this.cycleCountdown();
            });
        }
    }

    render() {
        this.renderCustomCountdown();
    }

    renderCustomCountdown(element) {
        const customCountdown = element || document.getElementById('customCountdown');
        
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
            ${this.countdowns.length > 1 ? this.generateCountdownDots(countdown) : ''}
        `;
        
        // Add dot event listeners if there are multiple countdowns
        if (this.countdowns.length > 1) {
            this.addCountdownDotEventListeners();
        }
        
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
        
        this.render();
        
        // Visual feedback
        const customCountdownTile = document.getElementById('customCountdownTile');
        if (customCountdownTile) {
            customCountdownTile.style.transform = 'scale(0.95)';
            setTimeout(() => {
                customCountdownTile.style.transform = '';
            }, 150);
        }
    }

    showCountdownEditor() {
        console.log('showCountdownEditor called!');
        const modal = document.createElement('div');
        modal.className = 'countdown-editor-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Create Countdown</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="countdown-source-selection">
                        <h4>Choose countdown source:</h4>
                        
                        <div class="source-option preset-option">
                            <div class="option-header">
                                <input type="radio" id="preset-source" name="countdown-source" value="preset" checked>
                                <label for="preset-source">
                                    <h5>🎊 Preset Events</h5>
                                    <p>Choose from popular countdown events</p>
                                </label>
                            </div>
                            <div class="preset-events">
                                <div class="preset-event" data-preset="new-year">
                                    <span class="preset-icon">🎉</span>
                                    <div class="preset-info">
                                        <div class="preset-title">New Year ${new Date().getFullYear() + 1}</div>
                                        <div class="preset-date">${this.getNewYearCountdown()}</div>
                                    </div>
                                </div>
                                <div class="preset-event" data-preset="christmas">
                                    <span class="preset-icon">🎄</span>
                                    <div class="preset-info">
                                        <div class="preset-title">Christmas ${new Date().getFullYear()}</div>
                                        <div class="preset-date">${this.getChristmasCountdown()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="source-option calendar-option">
                            <div class="option-header">
                                <input type="radio" id="calendar-source" name="countdown-source" value="calendar">
                                <label for="calendar-source">
                                    <h5>📅 Calendar Events</h5>
                                    <p>Create countdown from your upcoming events</p>
                                </label>
                            </div>
                            <div class="calendar-events">
                                ${this.renderCalendarEventsList()}
                            </div>
                        </div>

                        <div class="source-option custom-option">
                            <div class="option-header">
                                <input type="radio" id="custom-source" name="countdown-source" value="custom">
                                <label for="custom-source">
                                    <h5>✏️ Custom Event</h5>
                                    <p>Create your own custom countdown</p>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button class="create-countdown-btn" disabled>Create Countdown</button>
                        <button class="cancel-btn">Cancel</button>
                    </div>

                    ${this.countdowns.length > 0 ? `
                        <div class="existing-countdowns">
                            <h4>Current Countdowns:</h4>
                            <div class="countdown-list">
                                ${this.countdowns.map((countdown, index) => `
                                    <div class="countdown-item" data-index="${index}">
                                        <div class="countdown-info">
                                            <div class="countdown-title">${this.escapeHtml(countdown.title)}</div>
                                            <div class="countdown-target">${new Date(countdown.targetDate).toLocaleDateString()}</div>
                                        </div>
                                        <div class="countdown-actions">
                                            <button class="delete-btn" data-index="${index}">×</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Make modal visible
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        let selectedSource = 'preset';
        let selectedEvent = null;
        
        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        });
        
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                }, 300);
            }
        });
        
        // Source selection
        modal.querySelectorAll('input[name="countdown-source"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                selectedSource = e.target.value;
                selectedEvent = null;
                this.updateCreateButton(modal, selectedSource, selectedEvent);
                this.updateSourceVisibility(modal, selectedSource);
            });
        });
        
        // Preset event selection
        modal.querySelectorAll('.preset-event').forEach(preset => {
            preset.addEventListener('click', () => {
                modal.querySelectorAll('.preset-event').forEach(p => p.classList.remove('selected'));
                preset.classList.add('selected');
                selectedEvent = preset.dataset.preset;
                modal.querySelector('#preset-source').checked = true;
                selectedSource = 'preset';
                this.updateCreateButton(modal, selectedSource, selectedEvent);
            });
        });
        
        // Calendar event selection
        modal.querySelectorAll('.calendar-event').forEach(calEvent => {
            calEvent.addEventListener('click', () => {
                modal.querySelectorAll('.calendar-event').forEach(e => e.classList.remove('selected'));
                calEvent.classList.add('selected');
                selectedEvent = calEvent.dataset.eventId;
                modal.querySelector('#calendar-source').checked = true;
                selectedSource = 'calendar';
                this.updateCreateButton(modal, selectedSource, selectedEvent);
            });
        });
        
        // Custom source selection
        modal.querySelector('#custom-source').addEventListener('change', () => {
            selectedSource = 'custom';
            selectedEvent = 'custom';
            this.updateCreateButton(modal, selectedSource, selectedEvent);
        });
        
        // Create countdown button
        modal.querySelector('.create-countdown-btn').addEventListener('click', () => {
            this.createCountdownFromSelection(selectedSource, selectedEvent);
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        });
        
        // Delete buttons for existing countdowns
        modal.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (confirm('Delete this countdown?')) {
                    this.countdowns.splice(index, 1);
                    this.saveCountdowns();
                    modal.classList.remove('show');
                    setTimeout(() => {
                        if (document.body.contains(modal)) {
                            document.body.removeChild(modal);
                        }
                    }, 300);
                    this.render();
                }
            });
        });
        
        // Initialize
        this.updateCreateButton(modal, selectedSource, selectedEvent);
        this.updateSourceVisibility(modal, selectedSource);
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
            this.render();
        }, 1000);
    }

    updateNextEventCountdown() {
        this.renderCustomCountdown();
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

    getNewYearCountdown() {
        const newYear = new Date(new Date().getFullYear() + 1, 0, 1);
        const timeUntil = this.getTimeUntil(newYear);
        return `${timeUntil.description} • ${newYear.toLocaleDateString()}`;
    }

    getChristmasCountdown() {
        const currentYear = new Date().getFullYear();
        let christmas = new Date(currentYear, 11, 25); // December 25th
        
        // If Christmas has passed this year, get next year's Christmas
        if (christmas < new Date()) {
            christmas = new Date(currentYear + 1, 11, 25);
        }
        
        const timeUntil = this.getTimeUntil(christmas);
        return `${timeUntil.description} • ${christmas.toLocaleDateString()}`;
    }

    renderCalendarEventsList() {
        try {
            const events = JSON.parse(localStorage.getItem('smartDisplayHub_events')) || [];
            const now = new Date();
            
            const upcomingEvents = events
                .map(event => {
                    const eventDate = new Date(event.date + 'T' + (event.time || '00:00'));
                    return { ...event, datetime: eventDate };
                })
                .filter(event => event.datetime > now)
                .sort((a, b) => a.datetime - b.datetime)
                .slice(0, 5); // Show only next 5 events
            
            if (upcomingEvents.length === 0) {
                return `
                    <div class="no-calendar-events">
                        <p>No upcoming calendar events found.</p>
                        <small>Add events to your calendar to create countdowns from them.</small>
                    </div>
                `;
            }
            
            return upcomingEvents.map(event => {
                const timeUntil = this.getTimeUntil(event.datetime);
                return `
                    <div class="calendar-event" data-event-id="${event.id || event.title}">
                        <span class="calendar-icon">📅</span>
                        <div class="calendar-info">
                            <div class="calendar-title">${this.escapeHtml(event.title)}</div>
                            <div class="calendar-date">${timeUntil.description} • ${event.datetime.toLocaleDateString()}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (e) {
            return `
                <div class="calendar-error">
                    <p>Unable to load calendar events.</p>
                </div>
            `;
        }
    }

    updateCreateButton(modal, selectedSource, selectedEvent) {
        const createBtn = modal.querySelector('.create-countdown-btn');
        
        if (selectedSource === 'preset' && selectedEvent) {
            createBtn.disabled = false;
            createBtn.textContent = 'Create Countdown';
        } else if (selectedSource === 'calendar' && selectedEvent) {
            createBtn.disabled = false;
            createBtn.textContent = 'Create Countdown';
        } else if (selectedSource === 'custom') {
            createBtn.disabled = false;
            createBtn.textContent = 'Create Custom Countdown';
        } else {
            createBtn.disabled = true;
            createBtn.textContent = 'Select an option';
        }
    }

    updateSourceVisibility(modal, selectedSource) {
        // Update visual indication of selected source
        modal.querySelectorAll('.source-option').forEach(option => {
            option.classList.remove('active');
        });
        modal.querySelector(`.${selectedSource}-option`).classList.add('active');
    }

    createCountdownFromSelection(source, event) {
        let countdownData;
        
        if (source === 'preset') {
            countdownData = this.createPresetCountdown(event);
        } else if (source === 'calendar') {
            countdownData = this.createCalendarCountdown(event);
        } else if (source === 'custom') {
            this.showCountdownForm();
            return;
        }
        
        if (countdownData) {
            this.countdowns.push(countdownData);
            this.saveCountdowns();
            this.render();
        }
    }

    createPresetCountdown(presetType) {
        switch (presetType) {
            case 'new-year':
                const newYear = new Date(new Date().getFullYear() + 1, 0, 1);
                return {
                    id: Date.now().toString(),
                    title: `New Year ${newYear.getFullYear()}`,
                    targetDate: newYear.toISOString(),
                    description: 'Welcome the new year!',
                    color: 'default',
                    createdAt: new Date().toISOString()
                };
                
            case 'christmas':
                const currentYear = new Date().getFullYear();
                let christmas = new Date(currentYear, 11, 25);
                
                if (christmas < new Date()) {
                    christmas = new Date(currentYear + 1, 11, 25);
                }
                
                return {
                    id: Date.now().toString(),
                    title: `Christmas ${christmas.getFullYear()}`,
                    targetDate: christmas.toISOString(),
                    description: 'Merry Christmas!',
                    color: 'green',
                    createdAt: new Date().toISOString()
                };
                
            default:
                return null;
        }
    }

    createCalendarCountdown(eventId) {
        try {
            const events = JSON.parse(localStorage.getItem('smartDisplayHub_events')) || [];
            const event = events.find(e => (e.id || e.title) === eventId);
            
            if (!event) return null;
            
            const eventDate = new Date(event.date + 'T' + (event.time || '00:00'));
            
            return {
                id: Date.now().toString(),
                title: event.title,
                targetDate: eventDate.toISOString(),
                description: event.description || `Countdown to ${event.title}`,
                color: 'blue',
                createdAt: new Date().toISOString()
            };
        } catch (e) {
            console.warn('Failed to create calendar countdown:', e);
            return null;
        }
    }

    generateCountdownDots(currentCountdown) {
        const currentIndex = this.countdowns.indexOf(currentCountdown);
        const dots = this.countdowns.map((_, index) => {
            const isActive = index === currentIndex;
            return `<span class="countdown-dot ${isActive ? 'active' : ''}" data-index="${index}"></span>`;
        }).join('');
        
        return `<div class="countdown-dots">${dots}</div>`;
    }

    addCountdownDotEventListeners() {
        const dots = document.querySelectorAll('.countdown-dots .countdown-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent tile click from triggering
                const index = parseInt(dot.dataset.index);
                if (index >= 0 && index < this.countdowns.length) {
                    this.activeCountdown = this.countdowns[index];
                    this.render();
                    
                    // Visual feedback
                    dot.style.transform = 'scale(1.4)';
                    setTimeout(() => {
                        dot.style.transform = '';
                    }, 150);
                }
            });
        });
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Make available globally
window.CountdownTile = CountdownTile;