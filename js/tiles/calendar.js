// Calendar Tile
class CalendarTile {
    constructor() {
        this.currentDate = new Date();
        this.events = this.loadEvents();
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        
        // Listen for global updates
        window.addEventListener('tileUpdate', () => {
            this.update();
        });
    }

    setupEventListeners() {
        const calendarView = document.getElementById('calendarView');
        
        // Navigation buttons will be added dynamically
        calendarView.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-nav')) {
                const direction = e.target.dataset.direction;
                this.navigate(direction);
            } else if (e.target.classList.contains('calendar-day')) {
                const day = parseInt(e.target.dataset.day);
                this.selectDay(day);
            }
        });
    }

    render() {
        const calendarView = document.getElementById('calendarView');
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        calendarView.innerHTML = `
            <div class="calendar-header">
                <button class="calendar-nav" data-direction="prev">&lt;</button>
                <h4>${this.getMonthName(currentMonth)} ${currentYear}</h4>
                <button class="calendar-nav" data-direction="next">&gt;</button>
            </div>
            <div class="calendar-weekdays">
                ${this.getWeekdayHeaders()}
            </div>
            <div class="calendar-grid">
                ${this.getCalendarDays()}
            </div>
        `;
    }

    getMonthName(month) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month];
    }

    getWeekdayHeaders() {
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return weekdays.map(day => `<div class="calendar-weekday">${day}</div>`).join('');
    }

    getCalendarDays() {
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        
        // Start from the first Sunday of the month view
        startDate.setDate(startDate.getDate() - startDate.getDay());
        
        const days = [];
        const today = new Date();
        
        for (let i = 0; i < 42; i++) { // 6 weeks × 7 days
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = date.getMonth() === currentMonth;
            const isToday = date.toDateString() === today.toDateString();
            const hasEvent = this.hasEvent(date);
            const hasBirthday = this.hasBirthday(date);
            
            let classes = 'calendar-day';
            if (!isCurrentMonth) classes += ' other-month';
            if (isToday) classes += ' today';
            if (hasEvent) classes += ' has-event';
            if (hasBirthday) classes += ' birthday';
            
            days.push(`
                <div class="${classes}" data-day="${date.getDate()}" data-date="${date.toISOString()}">
                    ${date.getDate()}
                </div>
            `);
        }
        
        return days.join('');
    }

    navigate(direction) {
        if (direction === 'prev') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else if (direction === 'next') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        }
        this.render();
    }

    selectDay(day) {
        const selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        const events = this.getEventsForDate(selectedDate);
        
        if (events.length > 0) {
            this.showDayEvents(selectedDate, events);
        } else {
            this.showAddEventDialog(selectedDate);
        }
    }

    showDayEvents(date, events) {
        const modal = document.createElement('div');
        modal.className = 'day-events-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Events for ${date.toLocaleDateString()}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    ${events.map(event => `
                        <div class="event-item">
                            <div class="event-time">${event.time}</div>
                            <div class="event-title">${event.title}</div>
                            ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                        </div>
                    `).join('')}
                    <button class="add-event-btn">Add Event</button>
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
        
        modal.querySelector('.add-event-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.showAddEventDialog(date);
        });
    }

    showAddEventDialog(date) {
        const modal = document.createElement('div');
        modal.className = 'add-event-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Event - ${date.toLocaleDateString()}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="add-event-form">
                        <div class="form-group">
                            <label>Title:</label>
                            <input type="text" name="title" required>
                        </div>
                        <div class="form-group">
                            <label>Time:</label>
                            <input type="time" name="time">
                        </div>
                        <div class="form-group">
                            <label>Description:</label>
                            <textarea name="description"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit">Add Event</button>
                            <button type="button" class="cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.add-event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const event = {
                id: Date.now().toString(),
                date: date.toISOString().split('T')[0],
                title: formData.get('title'),
                time: formData.get('time') || '00:00',
                description: formData.get('description') || ''
            };
            
            this.addEvent(event);
            document.body.removeChild(modal);
            this.render();
        });
    }

    hasEvent(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.some(event => event.date === dateStr);
    }

    hasBirthday(date) {
        // Check if there's a birthday on this date
        const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return this.getBirthdays().some(birthday => birthday.date.endsWith(monthDay));
    }

    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => event.date === dateStr);
    }

    addEvent(event) {
        this.events.push(event);
        this.saveEvents();
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('eventAdded', { detail: event }));
    }

    loadEvents() {
        try {
            return JSON.parse(localStorage.getItem('smartDisplayHub_events')) || this.getDefaultEvents();
        } catch (e) {
            console.warn('Failed to load events:', e);
            return this.getDefaultEvents();
        }
    }

    saveEvents() {
        try {
            localStorage.setItem('smartDisplayHub_events', JSON.stringify(this.events));
        } catch (e) {
            console.warn('Failed to save events:', e);
        }
    }

    getBirthdays() {
        try {
            return JSON.parse(localStorage.getItem('smartDisplayHub_birthdays')) || [];
        } catch (e) {
            return [];
        }
    }

    getDefaultEvents() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        return [
            {
                id: '1',
                date: today.toISOString().split('T')[0],
                title: 'Welcome to Smart Display Hub!',
                time: '09:00',
                description: 'Start customizing your dashboard'
            },
            {
                id: '2',
                date: tomorrow.toISOString().split('T')[0],
                title: 'Sample Event',
                time: '14:00',
                description: 'This is how events will appear'
            }
        ];
    }

    update() {
        // Update calendar if date has changed
        const now = new Date();
        if (now.toDateString() !== this.lastUpdate?.toDateString()) {
            this.render();
            this.lastUpdate = now;
        }
    }

    // Integration methods for external calendar services
    async syncWithGoogleCalendar() {
        // TODO: Implement Google Calendar API integration
        console.log('Google Calendar sync not implemented yet');
    }

    async syncWithOutlook() {
        // TODO: Implement Outlook Calendar API integration
        console.log('Outlook Calendar sync not implemented yet');
    }
}

// Make available globally
window.CalendarTile = CalendarTile;