// Calendar Tile
class CalendarTile {
    constructor() {
        this.currentDate = new Date();
        this.events = this.loadEvents();
        this.viewMode = this.loadViewMode() || 'month'; // month, week, workweek, 3day
        this.externalCalendars = this.loadExternalCalendars();
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
        const settingsBtn = document.querySelector('#calendarTile .calendar-settings-btn');
        
        // Calendar settings button
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showCalendarSettings();
            });
        }
        
        // Navigation buttons will be added dynamically
        calendarView.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-nav')) {
                const direction = e.target.dataset.direction;
                this.navigate(direction);
            } else if (e.target.classList.contains('calendar-day')) {
                const day = parseInt(e.target.dataset.day);
                this.selectDay(day);
            } else if (e.target.classList.contains('view-mode-btn')) {
                const viewMode = e.target.dataset.view;
                this.changeViewMode(viewMode);
            }
        });
    }

    render() {
        const calendarView = document.getElementById('calendarView');
        
        // Add view mode buttons
        const viewModeButtons = `
            <div class="calendar-view-modes">
                <button class="view-mode-btn ${this.viewMode === 'month' ? 'active' : ''}" data-view="month">Month</button>
                <button class="view-mode-btn ${this.viewMode === 'week' ? 'active' : ''}" data-view="week">Week</button>
                <button class="view-mode-btn ${this.viewMode === 'workweek' ? 'active' : ''}" data-view="workweek">Work Week</button>
                <button class="view-mode-btn ${this.viewMode === '3day' ? 'active' : ''}" data-view="3day">3 Day</button>
            </div>
        `;
        
        let content = '';
        
        switch (this.viewMode) {
            case 'month':
                content = this.renderMonthView();
                break;
            case 'week':
                content = this.renderWeekView();
                break;
            case 'workweek':
                content = this.renderWorkWeekView();
                break;
            case '3day':
                content = this.render3DayView();
                break;
        }
        
        calendarView.innerHTML = viewModeButtons + content;
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
        const multiplier = direction === 'prev' ? -1 : 1;
        
        switch (this.viewMode) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + multiplier);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + (7 * multiplier));
                break;
            case 'workweek':
                this.currentDate.setDate(this.currentDate.getDate() + (7 * multiplier));
                break;
            case '3day':
                this.currentDate.setDate(this.currentDate.getDate() + (3 * multiplier));
                break;
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
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
        
        // Function to close modal with animation
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        };
        
        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        modal.querySelector('.add-event-btn').addEventListener('click', () => {
            closeModal();
            setTimeout(() => {
                this.showAddEventDialog(date);
            }, 300);
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
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
        
        // Function to close modal with animation
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        };
        
        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('.cancel-btn').addEventListener('click', closeModal);
        
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
            closeModal();
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

    // Calendar View Rendering Methods
    renderMonthView() {
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        return `
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

    renderWeekView() {
        const weekStart = this.getWeekStart(this.currentDate);
        const weekDates = this.getWeekDates(weekStart);
        
        return `
            <div class="calendar-header">
                <button class="calendar-nav" data-direction="prev">&lt;</button>
                <h4>Week of ${weekStart.toLocaleDateString()}</h4>
                <button class="calendar-nav" data-direction="next">&gt;</button>
            </div>
            <div class="week-view">
                ${this.renderWeekGrid(weekDates)}
            </div>
        `;
    }

    renderWorkWeekView() {
        const weekStart = this.getWeekStart(this.currentDate);
        const workWeekDates = this.getWorkWeekDates(weekStart);
        
        return `
            <div class="calendar-header">
                <button class="calendar-nav" data-direction="prev">&lt;</button>
                <h4>Work Week of ${weekStart.toLocaleDateString()}</h4>
                <button class="calendar-nav" data-direction="next">&gt;</button>
            </div>
            <div class="week-view work-week">
                ${this.renderWeekGrid(workWeekDates)}
            </div>
        `;
    }

    render3DayView() {
        const threeDayDates = this.get3DayDates(this.currentDate);
        const today = new Date();
        
        // Create a more descriptive header
        let headerText = '';
        if (threeDayDates[0].toDateString() === today.toDateString()) {
            headerText = 'Today - Next 2 Days';
        } else {
            headerText = `${threeDayDates[0].toLocaleDateString()} - ${threeDayDates[2].toLocaleDateString()}`;
        }
        
        return `
            <div class="calendar-header">
                <button class="calendar-nav" data-direction="prev">&lt;</button>
                <h4>${headerText}</h4>
                <button class="calendar-nav" data-direction="next">&gt;</button>
            </div>
            <div class="week-view three-day">
                ${this.renderWeekGrid(threeDayDates)}
            </div>
        `;
    }

    // Helper Methods for Different Views
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    getWeekDates(weekStart) {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            dates.push(date);
        }
        return dates;
    }

    getWorkWeekDates(weekStart) {
        const dates = [];
        for (let i = 1; i < 6; i++) { // Monday to Friday
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            dates.push(date);
        }
        return dates;
    }

    get3DayDates(centerDate) {
        const dates = [];
        for (let i = 0; i <= 2; i++) {
            const date = new Date(centerDate);
            date.setDate(centerDate.getDate() + i);
            dates.push(date);
        }
        return dates;
    }

    renderWeekGrid(dates) {
        const timeSlots = this.generateTimeSlots();
        const today = new Date();
        
        let grid = '<div class="week-grid">';
        
        // Header with days
        grid += '<div class="week-header">';
        grid += '<div class="time-column-header"></div>';
        dates.forEach(date => {
            const isToday = date.toDateString() === today.toDateString();
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });
            const dayNum = date.getDate();
            grid += `<div class="day-header ${isToday ? 'today' : ''}">${dayName}<br><span class="day-num">${dayNum}</span></div>`;
        });
        grid += '</div>';
        
        // Time slots with events
        timeSlots.forEach(timeSlot => {
            grid += '<div class="time-row">';
            grid += `<div class="time-label">${timeSlot}</div>`;
            
            dates.forEach(date => {
                const dayEvents = this.getEventsForDate(date);
                const slotEvents = this.getEventsForTimeSlot(dayEvents, timeSlot);
                
                grid += '<div class="time-slot">';
                slotEvents.forEach(event => {
                    grid += `<div class="event-block" data-event-id="${event.id}">${event.title}</div>`;
                });
                grid += '</div>';
            });
            
            grid += '</div>';
        });
        
        // All-day events section
        grid += '<div class="all-day-section">';
        grid += '<div class="time-label">All Day</div>';
        dates.forEach(date => {
            const dayEvents = this.getEventsForDate(date);
            const allDayEvents = dayEvents.filter(event => !event.time || event.time === '00:00');
            
            grid += '<div class="all-day-slot">';
            allDayEvents.forEach(event => {
                grid += `<div class="all-day-event" data-event-id="${event.id}">${event.title}</div>`;
            });
            grid += '</div>';
        });
        grid += '</div>';
        
        grid += '</div>';
        return grid;
    }

    generateTimeSlots() {
        const slots = [];
        for (let hour = 6; hour < 22; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    }

    getEventsForTimeSlot(events, timeSlot) {
        return events.filter(event => {
            if (!event.time || event.time === '00:00') return false;
            const eventHour = parseInt(event.time.split(':')[0]);
            const eventMinute = parseInt(event.time.split(':')[1]);
            const slotHour = parseInt(timeSlot.split(':')[0]);
            const slotMinute = parseInt(timeSlot.split(':')[1]);
            
            // Check if event time falls within this 30-minute slot
            const eventTotalMinutes = eventHour * 60 + eventMinute;
            const slotTotalMinutes = slotHour * 60 + slotMinute;
            
            return eventTotalMinutes >= slotTotalMinutes && eventTotalMinutes < slotTotalMinutes + 30;
        });
    }

    // Calendar Settings Modal
    showCalendarSettings() {
        const modal = document.createElement('div');
        modal.className = 'calendar-settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Calendar Settings</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h4>Default View</h4>
                        <div class="setting-group">
                            <label><input type="radio" name="defaultView" value="month" ${this.viewMode === 'month' ? 'checked' : ''}> Month View</label>
                            <label><input type="radio" name="defaultView" value="week" ${this.viewMode === 'week' ? 'checked' : ''}> Week View</label>
                            <label><input type="radio" name="defaultView" value="workweek" ${this.viewMode === 'workweek' ? 'checked' : ''}> Work Week View</label>
                            <label><input type="radio" name="defaultView" value="3day" ${this.viewMode === '3day' ? 'checked' : ''}> 3 Day View</label>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h4>External Calendar Integration</h4>
                        <div class="integration-options">
                            <div class="integration-item">
                                <h5>Google Calendar</h5>
                                <p>Connect your Google Calendar to sync events</p>
                                <button class="connect-btn" data-provider="google">
                                    ${this.externalCalendars.google ? 'Reconnect' : 'Connect'} Google Calendar
                                </button>
                                ${this.externalCalendars.google ? '<button class="disconnect-btn" data-provider="google">Disconnect</button>' : ''}
                            </div>
                            
                            <div class="integration-item">
                                <h5>Microsoft Outlook</h5>
                                <p>Connect your Outlook Calendar to sync events</p>
                                <button class="connect-btn" data-provider="outlook">
                                    ${this.externalCalendars.outlook ? 'Reconnect' : 'Connect'} Outlook Calendar
                                </button>
                                ${this.externalCalendars.outlook ? '<button class="disconnect-btn" data-provider="outlook">Disconnect</button>' : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h4>Sync Settings</h4>
                        <div class="setting-group">
                            <label><input type="checkbox" ${this.getSyncSetting('autoSync') ? 'checked' : ''}> Auto-sync every 15 minutes</label>
                            <label><input type="checkbox" ${this.getSyncSetting('syncPastEvents') ? 'checked' : ''}> Sync past events (30 days)</label>
                            <label><input type="checkbox" ${this.getSyncSetting('syncFutureEvents') ? 'checked' : ''}> Sync future events (90 days)</label>
                        </div>
                        <button class="sync-now-btn">Sync Now</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
        
        // Function to close modal with animation
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        };
        
        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // View mode change
        modal.querySelectorAll('input[name="defaultView"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeViewMode(e.target.value);
                this.saveViewMode(e.target.value);
            });
        });
        
        // Connect buttons
        modal.querySelectorAll('.connect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const provider = e.target.dataset.provider;
                this.connectExternalCalendar(provider);
            });
        });
        
        // Disconnect buttons
        modal.querySelectorAll('.disconnect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const provider = e.target.dataset.provider;
                this.disconnectExternalCalendar(provider);
            });
        });
        
        // Sync now button
        modal.querySelector('.sync-now-btn').addEventListener('click', () => {
            this.syncAllCalendars();
        });
    }

    // View Mode Management
    changeViewMode(newMode) {
        this.viewMode = newMode;
        this.render();
    }

    saveViewMode(mode) {
        localStorage.setItem('calendarViewMode', mode);
    }

    loadViewMode() {
        return localStorage.getItem('calendarViewMode');
    }

    // External Calendar Management
    loadExternalCalendars() {
        try {
            return JSON.parse(localStorage.getItem('externalCalendars')) || {
                google: null,
                outlook: null
            };
        } catch (e) {
            return { google: null, outlook: null };
        }
    }

    saveExternalCalendars() {
        localStorage.setItem('externalCalendars', JSON.stringify(this.externalCalendars));
    }

    async connectExternalCalendar(provider) {
        if (provider === 'google') {
            await this.connectGoogleCalendar();
        } else if (provider === 'outlook') {
            await this.connectOutlookCalendar();
        }
    }

    disconnectExternalCalendar(provider) {
        this.externalCalendars[provider] = null;
        this.saveExternalCalendars();
        // Refresh settings modal
        document.querySelector('.calendar-settings-modal .close-btn').click();
        this.showCalendarSettings();
    }

    getSyncSetting(setting) {
        const settings = JSON.parse(localStorage.getItem('calendarSyncSettings') || '{}');
        return settings[setting] || false;
    }

    // Integration methods for external calendar services
    async connectGoogleCalendar() {
        // Google Calendar API integration
        try {
            // This would use Google Calendar API
            console.log('Initiating Google Calendar connection...');
            
            // Placeholder for Google OAuth flow
            const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
                `client_id=YOUR_GOOGLE_CLIENT_ID&` +
                `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
                `scope=https://www.googleapis.com/auth/calendar.readonly&` +
                `response_type=code&` +
                `access_type=offline`;
            
            // For now, show instructions
            alert(`To connect Google Calendar:
1. Go to Google Cloud Console
2. Create a project and enable Calendar API
3. Create OAuth 2.0 credentials
4. Add your domain to authorized origins
5. Update the client ID in the code`);
            
        } catch (error) {
            console.error('Google Calendar connection error:', error);
        }
    }

    async connectOutlookCalendar() {
        // Microsoft Graph API integration
        try {
            // This would use Microsoft Graph API
            console.log('Initiating Outlook Calendar connection...');
            
            // Placeholder for Microsoft OAuth flow
            const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
                `client_id=YOUR_MICROSOFT_CLIENT_ID&` +
                `response_type=code&` +
                `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
                `scope=https://graph.microsoft.com/calendars.read&` +
                `response_mode=query`;
            
            // For now, show instructions
            alert(`To connect Outlook Calendar:
1. Go to Azure App Registrations
2. Create a new application
3. Add Calendar.Read permissions
4. Add your domain to redirect URIs
5. Update the client ID in the code`);
            
        } catch (error) {
            console.error('Outlook Calendar connection error:', error);
        }
    }

    async syncWithGoogleCalendar() {
        // TODO: Implement Google Calendar API integration
        console.log('Google Calendar sync not implemented yet');
    }

    async syncWithOutlook() {
        // TODO: Implement Outlook Calendar API integration
        console.log('Outlook Calendar sync not implemented yet');
    }

    async syncAllCalendars() {
        console.log('Syncing all connected calendars...');
        
        if (this.externalCalendars.google) {
            await this.syncWithGoogleCalendar();
        }
        
        if (this.externalCalendars.outlook) {
            await this.syncWithOutlook();
        }
        
        this.render();
    }
}

// Make available globally
window.CalendarTile = CalendarTile;