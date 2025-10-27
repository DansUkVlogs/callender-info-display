// Daily Events Tile
class DailyEventsTile {
    constructor() {
        this.selectedDate = new Date(); // Default to today
        this.events = [];
        this.calendarTile = null;
        this.init();
    }

    init() {
        this.loadEvents();
        this.setupEventListeners();
        this.render();
        
        // Listen for calendar day selection changes
        window.addEventListener('calendarDaySelected', (e) => {
            this.selectedDate = e.detail.date;
            this.render();
        });
        
        // Listen for event updates
        window.addEventListener('eventAdded', (e) => {
            this.loadEvents();
            this.render();
        });
        
        window.addEventListener('eventUpdated', (e) => {
            this.loadEvents();
            this.render();
        });
        
        window.addEventListener('eventDeleted', (e) => {
            this.loadEvents();
            this.render();
        });
    }

    setupEventListeners() {
        const tile = document.getElementById('dailyEventsTile');
        
        if (tile) {
            // Click to change date
            tile.addEventListener('click', (e) => {
                if (e.target.classList.contains('daily-events-date') || 
                    e.target.closest('.tile-header')) {
                    this.showDatePicker();
                }
            });
        }
    }

    loadEvents() {
        try {
            this.events = JSON.parse(localStorage.getItem('smartDisplayHub_events')) || [];
        } catch (e) {
            console.warn('Failed to load events for daily events tile:', e);
            this.events = [];
        }
    }

    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => event.date === dateStr);
    }

    render() {
        const dateElement = document.getElementById('dailyEventsDate');
        const contentElement = document.getElementById('dailyEventsContent');
        
        if (!dateElement || !contentElement) {
            console.warn('Daily Events tile elements not found');
            return;
        }

        // Update date display
        const isToday = this.isToday(this.selectedDate);
        const dayName = this.selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = this.selectedDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        dateElement.textContent = isToday ? 'Today' : `${dayName}, ${dateStr}`;
        
        // Get events for selected date
        const dayEvents = this.getEventsForDate(this.selectedDate);
        
        if (dayEvents.length === 0) {
            contentElement.innerHTML = `
                <div class="no-events">
                    <div class="no-events-icon">📅</div>
                    <div class="no-events-text">No events scheduled</div>
                </div>
            `;
            return;
        }

        // Sort events by time
        const sortedEvents = dayEvents.sort((a, b) => {
            if (!a.time && !b.time) return 0;
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });

        // Render events
        const eventsHTML = sortedEvents.map(event => {
            const timeDisplay = event.time ? this.formatTime(event.time) : 'All day';
            const isAllDay = !event.time;
            
            return `
                <div class="daily-event ${isAllDay ? 'all-day' : ''}">
                    <div class="event-time">${timeDisplay}</div>
                    <div class="event-details">
                        <div class="event-title">${this.escapeHtml(event.title)}</div>
                        ${event.description ? `<div class="event-description">${this.escapeHtml(event.description)}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        contentElement.innerHTML = eventsHTML;
    }

    formatTime(timeStr) {
        try {
            const [hours, minutes] = timeStr.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        } catch (e) {
            return timeStr;
        }
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showDatePicker() {
        // Create a simple date picker modal
        const modal = document.createElement('div');
        modal.className = 'date-picker-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Select Date for Events</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="date-picker-content">
                    <input type="date" id="datePicker" value="${this.selectedDate.toISOString().split('T')[0]}">
                    <div class="date-picker-actions">
                        <button class="btn-secondary" id="cancelDatePicker">Cancel</button>
                        <button class="btn-primary" id="confirmDatePicker">Select Date</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners for the modal
        const datePicker = modal.querySelector('#datePicker');
        const confirmBtn = modal.querySelector('#confirmDatePicker');
        const cancelBtn = modal.querySelector('#cancelDatePicker');
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');

        const closeModal = () => {
            document.body.removeChild(modal);
        };

        confirmBtn.addEventListener('click', () => {
            this.selectedDate = new Date(datePicker.value + 'T12:00:00'); // Set to noon to avoid timezone issues
            this.render();
            
            // Dispatch custom event to notify calendar tile if needed
            window.dispatchEvent(new CustomEvent('dailyEventsDateChanged', {
                detail: { date: this.selectedDate }
            }));
            
            closeModal();
        });

        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        // Focus the date input
        setTimeout(() => datePicker.focus(), 100);
    }

    // Method to be called by calendar tile when a day is selected
    setSelectedDate(date) {
        this.selectedDate = new Date(date);
        this.render();
    }

    update() {
        this.loadEvents();
        this.render();
    }
}

// Export the class to the global scope so the main app can instantiate it by name
window.DailyEventsTile = DailyEventsTile;

// NOTE: instantiation is handled by the main app. If you need a standalone instance
// for debugging outside of app.js, uncomment the block below.
/*
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dailyEventsTile')) {
        window.dailyEventsTileInstance = new DailyEventsTile();
    }
});
*/