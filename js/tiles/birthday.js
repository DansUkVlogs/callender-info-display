// Birthday Tile
class BirthdayTile {
    constructor() {
        this.birthdays = this.loadBirthdays();
        this.celebrationActive = false;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.checkForTodaysBirthdays();
        
        // Listen for global updates
        window.addEventListener('tileUpdate', () => {
            this.update();
        });
    }

    setupEventListeners() {
        const birthdayTile = document.getElementById('birthdayTile');
        
        // Click to manage birthdays
        birthdayTile.addEventListener('click', () => {
            if (this.celebrationActive) {
                this.stopCelebration();
            } else {
                this.showBirthdayManager();
            }
        });
        
        // Listen for calendar interactions to highlight birthdays
        window.addEventListener('calendarRendered', () => {
            this.highlightBirthdaysOnCalendar();
        });
    }

    render() {
        const birthdayInfo = document.getElementById('birthdayInfo');
        
        const todaysBirthdays = this.getTodaysBirthdays();
        const nextBirthday = this.getNextBirthday();
        
        if (todaysBirthdays.length > 0) {
            this.renderTodaysBirthdays(todaysBirthdays);
        } else if (nextBirthday) {
            this.renderNextBirthday(nextBirthday);
        } else {
            this.renderNoBirthdays();
        }
    }

    renderTodaysBirthdays(birthdays) {
        const birthdayInfo = document.getElementById('birthdayInfo');
        
        birthdayInfo.innerHTML = `
            <div class="birthday-celebration">🎉</div>
            <div class="birthday-today">
                ${birthdays.length === 1 ? 
                    `${this.escapeHtml(birthdays[0].name)}'s Birthday!` :
                    `${birthdays.length} Birthdays Today!`
                }
            </div>
            <div class="birthday-list">
                ${birthdays.map(birthday => `
                    <div class="birthday-person">
                        ${this.escapeHtml(birthday.name)} 
                        ${birthday.birthYear ? `(${this.calculateAge(birthday.birthYear)})` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        // Start celebration animation
        this.startCelebration();
    }

    renderNextBirthday(birthday) {
        const birthdayInfo = document.getElementById('birthdayInfo');
        const daysUntil = this.getDaysUntilBirthday(birthday);
        
        birthdayInfo.innerHTML = `
            <div class="birthday-icon">🎂</div>
            <div class="birthday-next">
                Next: ${this.escapeHtml(birthday.name)}
            </div>
            <div class="birthday-countdown">
                ${daysUntil === 1 ? 'Tomorrow' : 
                  daysUntil === 0 ? 'Today' : 
                  `${daysUntil} days`}
            </div>
            ${birthday.birthYear ? `<div class="birthday-age">Turning ${this.calculateAge(birthday.birthYear) + 1}</div>` : ''}
        `;
    }

    renderNoBirthdays() {
        const birthdayInfo = document.getElementById('birthdayInfo');
        
        birthdayInfo.innerHTML = `
            <div class="no-birthdays">
                <div class="birthday-icon">🎈</div>
                <div class="birthday-message">No birthdays added</div>
                <div class="birthday-suggestion">Click to add birthdays</div>
            </div>
        `;
    }

    getTodaysBirthdays() {
        const today = new Date();
        const todayString = this.formatDateString(today);
        
        return this.birthdays.filter(birthday => {
            const birthdayDate = new Date(birthday.date);
            const birthdayString = this.formatDateString(birthdayDate);
            return birthdayString === todayString;
        });
    }

    getNextBirthday() {
        if (this.birthdays.length === 0) return null;
        
        const today = new Date();
        const currentYear = today.getFullYear();
        
        // Calculate next occurrence of each birthday
        const upcomingBirthdays = this.birthdays.map(birthday => {
            const birthdayThisYear = new Date(currentYear, 
                new Date(birthday.date).getMonth(), 
                new Date(birthday.date).getDate());
            
            // If birthday already passed this year, use next year
            if (birthdayThisYear <= today) {
                birthdayThisYear.setFullYear(currentYear + 1);
            }
            
            return {
                ...birthday,
                nextOccurrence: birthdayThisYear
            };
        });
        
        // Sort by next occurrence and return the nearest
        upcomingBirthdays.sort((a, b) => a.nextOccurrence - b.nextOccurrence);
        return upcomingBirthdays[0];
    }

    getDaysUntilBirthday(birthday) {
        const today = new Date();
        const nextBirthday = birthday.nextOccurrence || this.getNextBirthday().nextOccurrence;
        
        const diffTime = nextBirthday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    calculateAge(birthYear) {
        const currentYear = new Date().getFullYear();
        return currentYear - birthYear;
    }

    formatDateString(date) {
        return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    startCelebration() {
        if (this.celebrationActive) return;
        
        this.celebrationActive = true;
        const birthdayTile = document.getElementById('birthdayTile');
        birthdayTile.classList.add('celebrating');
        
        // Create confetti effect
        this.createConfetti();
        
        // Auto-stop celebration after 30 seconds
        setTimeout(() => {
            this.stopCelebration();
        }, 30000);
    }

    stopCelebration() {
        this.celebrationActive = false;
        const birthdayTile = document.getElementById('birthdayTile');
        birthdayTile.classList.remove('celebrating');
        
        // Remove confetti
        document.querySelectorAll('.confetti').forEach(confetti => {
            confetti.remove();
        });
    }

    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    left: ${Math.random() * 100}vw;
                    top: -10px;
                    z-index: 1000;
                    pointer-events: none;
                    animation: fall 3s linear forwards;
                `;
                
                document.body.appendChild(confetti);
                
                // Remove after animation
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 100);
        }
    }

    showBirthdayManager() {
        const modal = document.createElement('div');
        modal.className = 'birthday-manager-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Birthday Manager</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="birthday-list-manager">
                        ${this.birthdays.map((birthday, index) => `
                            <div class="birthday-item" data-index="${index}">
                                <div class="birthday-info">
                                    <div class="birthday-name">${this.escapeHtml(birthday.name)}</div>
                                    <div class="birthday-date">
                                        ${new Date(birthday.date).toLocaleDateString()}
                                        ${birthday.birthYear ? ` (${this.calculateAge(birthday.birthYear)} years old)` : ''}
                                    </div>
                                </div>
                                <div class="birthday-actions">
                                    <button class="edit-birthday-btn" data-index="${index}">Edit</button>
                                    <button class="delete-birthday-btn" data-index="${index}">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                        ${this.birthdays.length === 0 ? '<div class="no-birthdays-msg">No birthdays added yet</div>' : ''}
                    </div>
                    <button class="add-birthday-btn">Add Birthday</button>
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
        
        modal.querySelector('.add-birthday-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.showBirthdayForm();
        });
        
        // Edit and delete buttons
        modal.querySelectorAll('.edit-birthday-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                document.body.removeChild(modal);
                this.showBirthdayForm(this.birthdays[index]);
            });
        });
        
        modal.querySelectorAll('.delete-birthday-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (confirm(`Delete ${this.birthdays[index].name}'s birthday?`)) {
                    this.birthdays.splice(index, 1);
                    this.saveBirthdays();
                    document.body.removeChild(modal);
                    this.render();
                }
            });
        });
    }

    showBirthdayForm(birthday = null) {
        const isEdit = birthday !== null;
        const modal = document.createElement('div');
        modal.className = 'birthday-form-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${isEdit ? 'Edit' : 'Add'} Birthday</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="birthday-form">
                        <div class="form-group">
                            <label>Name:</label>
                            <input type="text" name="name" value="${isEdit ? this.escapeHtml(birthday.name) : ''}" placeholder="Person's name" required autofocus>
                        </div>
                        <div class="form-group">
                            <label>Birthday:</label>
                            <input type="date" name="date" value="${isEdit ? birthday.date : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Birth Year (optional):</label>
                            <input type="number" name="birthYear" value="${isEdit ? (birthday.birthYear || '') : ''}" min="1900" max="${new Date().getFullYear()}" placeholder="For age calculation">
                        </div>
                        <div class="form-group">
                            <label>Relationship:</label>
                            <select name="relationship">
                                <option value="">Select relationship</option>
                                <option value="family" ${isEdit && birthday.relationship === 'family' ? 'selected' : ''}>Family</option>
                                <option value="friend" ${isEdit && birthday.relationship === 'friend' ? 'selected' : ''}>Friend</option>
                                <option value="colleague" ${isEdit && birthday.relationship === 'colleague' ? 'selected' : ''}>Colleague</option>
                                <option value="other" ${isEdit && birthday.relationship === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Notes:</label>
                            <textarea name="notes" placeholder="Gift ideas, preferences, etc.">${isEdit ? (birthday.notes || '') : ''}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit">${isEdit ? 'Update' : 'Add'} Birthday</button>
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
        
        modal.querySelector('.birthday-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const birthdayData = {
                id: isEdit ? birthday.id : Date.now().toString(),
                name: formData.get('name').trim(),
                date: formData.get('date'),
                birthYear: formData.get('birthYear') ? parseInt(formData.get('birthYear')) : null,
                relationship: formData.get('relationship') || null,
                notes: formData.get('notes').trim() || null,
                createdAt: isEdit ? birthday.createdAt : new Date().toISOString()
            };
            
            if (isEdit) {
                const index = this.birthdays.findIndex(b => b.id === birthday.id);
                this.birthdays[index] = birthdayData;
            } else {
                this.birthdays.push(birthdayData);
            }
            
            this.saveBirthdays();
            document.body.removeChild(modal);
            this.render();
            
            // Notify calendar to update
            window.dispatchEvent(new CustomEvent('birthdaysUpdated'));
        });
    }

    checkForTodaysBirthdays() {
        const todaysBirthdays = this.getTodaysBirthdays();
        
        if (todaysBirthdays.length > 0) {
            // Show browser notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
                const names = todaysBirthdays.map(b => b.name).join(', ');
                new Notification('🎉 Birthday Today!', {
                    body: `Today is ${names}'s birthday!`,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.89 2 2 2zm4.5 3.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5S14.17 8 15 8s1.5.67 1.5 1.5zm-9 0C7.5 8.67 6.83 8 6 8s-1.5.67-1.5 1.5S5.17 11 6 11s1.5-.67 1.5-1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
                    tag: 'birthday-notification'
                });
            }
        }
    }

    highlightBirthdaysOnCalendar() {
        // This would integrate with the calendar tile to highlight birthday dates
        const calendarDays = document.querySelectorAll('.calendar-day');
        
        calendarDays.forEach(day => {
            const dateStr = day.dataset.date;
            if (dateStr) {
                const date = new Date(dateStr);
                const dateString = this.formatDateString(date);
                
                const hasBirthday = this.birthdays.some(birthday => {
                    const birthdayDate = new Date(birthday.date);
                    return this.formatDateString(birthdayDate) === dateString;
                });
                
                if (hasBirthday) {
                    day.classList.add('birthday');
                }
            }
        });
    }

    update() {
        // Check if we need to update for new day
        const now = new Date();
        if (!this.lastUpdateDate || now.toDateString() !== this.lastUpdateDate.toDateString()) {
            this.render();
            this.checkForTodaysBirthdays();
            this.lastUpdateDate = now;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadBirthdays() {
        try {
            return JSON.parse(localStorage.getItem('smartDisplayHub_birthdays')) || this.getDefaultBirthdays();
        } catch (e) {
            console.warn('Failed to load birthdays:', e);
            return this.getDefaultBirthdays();
        }
    }

    saveBirthdays() {
        try {
            localStorage.setItem('smartDisplayHub_birthdays', JSON.stringify(this.birthdays));
        } catch (e) {
            console.warn('Failed to save birthdays:', e);
        }
    }

    getDefaultBirthdays() {
        // Start with empty array - users will add their own birthdays
        return [];
    }

    // Integration with external services
    async importFromContacts() {
        // TODO: Implement contact import functionality
        console.log('Contact import not implemented yet');
    }

    async syncWithGoogleContacts() {
        // TODO: Implement Google Contacts API integration
        console.log('Google Contacts sync not implemented yet');
    }
}

// Add CSS for confetti animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    .birthday-tile.celebrating {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Make available globally
window.BirthdayTile = BirthdayTile;