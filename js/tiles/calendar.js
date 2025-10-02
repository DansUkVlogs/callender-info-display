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
        const newEventBtn = document.querySelector('#calendarTile .new-event-btn');
        
        // New event button
        if (newEventBtn) {
            newEventBtn.addEventListener('click', () => {
                this.showAddEventDialog(new Date());
            });
        }
        
        // Calendar settings button
        if (settingsBtn) {
            console.log('Settings button found, adding event listener');
            settingsBtn.addEventListener('click', () => {
                console.log('Settings button clicked!');
                this.showCalendarSettings();
            });
        } else {
            console.warn('Calendar settings button not found');
        }
        
        // Navigation buttons will be added dynamically
        calendarView.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-nav')) {
                const direction = e.target.dataset.direction;
                this.navigate(direction);
            } else if (e.target.classList.contains('view-mode-btn')) {
                const viewMode = e.target.dataset.view;
                this.changeViewMode(viewMode);
            } else {
                this.handleViewSpecificClick(e);
            }
        });

        // Add double-click handler for opening event modal
        calendarView.addEventListener('dblclick', (e) => {
            this.handleViewSpecificDoubleClick(e);
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
        
        // Notify Daily Events tile about the selected date
        window.dispatchEvent(new CustomEvent('calendarDaySelected', {
            detail: { date: selectedDate }
        }));
        
        if (events.length > 0) {
            this.showDayEvents(selectedDate, events);
        } else {
            this.showAddEventDialog(selectedDate);
        }
    }

    selectDayOnly(day) {
        const selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        
        // Update visual selection
        this.updateDaySelection(day);
        
        // Notify Daily Events tile about the selected date
        window.dispatchEvent(new CustomEvent('calendarDaySelected', {
            detail: { date: selectedDate }
        }));
    }

    openEventModal(day) {
        const selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        const events = this.getEventsForDate(selectedDate);
        
        if (events.length > 0) {
            this.showDayEvents(selectedDate, events);
        } else {
            this.showAddEventDialog(selectedDate);
        }
    }

    updateDaySelection(selectedDay) {
        // Remove previous selection
        const calendarView = document.getElementById('calendarView');
        
        // Remove from month view calendar days
        const previousSelectedDay = calendarView.querySelector('.calendar-day.selected');
        if (previousSelectedDay) {
            previousSelectedDay.classList.remove('selected');
        }
        
        // Remove from week view date headers
        const previousSelectedHeader = calendarView.querySelector('.date-header.selected');
        if (previousSelectedHeader) {
            previousSelectedHeader.classList.remove('selected');
        }
        
        // Add selection to clicked day in month view
        const dayElements = calendarView.querySelectorAll('.calendar-day');
        dayElements.forEach(dayEl => {
            if (parseInt(dayEl.dataset.day) === selectedDay) {
                dayEl.classList.add('selected');
            }
        });
        
        // Add selection to date headers in week views
        const headerElements = calendarView.querySelectorAll('.date-header');
        headerElements.forEach(headerEl => {
            if (parseInt(headerEl.dataset.day) === selectedDay) {
                headerEl.classList.add('selected');
            }
        });
    }

    handleViewSpecificClick(e) {
        if (this.viewMode === 'month') {
            // Month view: calendar-day elements
            if (e.target.classList.contains('calendar-day')) {
                const day = parseInt(e.target.dataset.day);
                this.selectDayOnly(day);
            }
        } else {
            // Week/Work Week/3-day views
            const dateHeader = e.target.classList.contains('date-header') ? e.target : e.target.closest('.date-header');
            const timeSlot = e.target.classList.contains('time-slot') ? e.target : e.target.closest('.time-slot');
            
            if (dateHeader) {
                // Clicking date header selects the day
                const day = parseInt(dateHeader.dataset.day);
                if (day) {
                    this.selectDayOnly(day);
                }
            } else if (timeSlot) {
                // Clicking time slot opens event modal with specific time
                const day = parseInt(timeSlot.dataset.day);
                const time = timeSlot.dataset.time;
                if (day && time) {
                    this.openEventModalWithTime(day, time);
                }
            }
        }
    }

    handleViewSpecificDoubleClick(e) {
        if (this.viewMode === 'month') {
            // Month view: double-click calendar day to add event
            if (e.target.classList.contains('calendar-day')) {
                const day = parseInt(e.target.dataset.day);
                this.openEventModal(day);
            }
        }
        // For week views, double-click isn't needed as single click on time slots opens event modal
    }

    openEventModalWithTime(day, time) {
        const selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        this.showAddEventDialog(selectedDate, time);
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

    showAddEventDialog(date, presetTime = null) {
        const modal = document.createElement('div');
        modal.className = 'add-event-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New Event - ${date.toLocaleDateString()}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="add-event-form">
                        <div class="form-group">
                            <label>Event Title:</label>
                            <input type="text" name="title" placeholder="Enter event title..." required autofocus>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group half-width">
                                <label>Date:</label>
                                <input type="date" name="date" value="${date.toISOString().split('T')[0]}" required>
                            </div>
                            <div class="form-group half-width">
                                <label>All Day Event:</label>
                                <input type="checkbox" name="allDay" id="allDayToggle">
                            </div>
                        </div>
                        
                        <div class="time-section" id="timeSection">
                            <div class="form-row">
                                <div class="form-group half-width">
                                    <label>Start Time:</label>
                                    <input type="time" name="startTime" value="${presetTime || '09:00'}">
                                </div>
                                <div class="form-group half-width">
                                    <label>End Time:</label>
                                    <input type="time" name="endTime" value="${presetTime ? this.addMinutesToTime(presetTime, 30) : '10:00'}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Location:</label>
                            <input type="text" name="location" placeholder="Event location (optional)">
                        </div>
                        
                        <div class="form-group">
                            <label>Description:</label>
                            <textarea name="description" placeholder="Event description (optional)" rows="3"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Category:</label>
                            <select name="category">
                                <option value="">No Category</option>
                                <option value="work">Work</option>
                                <option value="personal">Personal</option>
                                <option value="meeting">Meeting</option>
                                <option value="appointment">Appointment</option>
                                <option value="reminder">Reminder</option>
                                <option value="birthday">Birthday</option>
                                <option value="holiday">Holiday</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Repeat:</label>
                            <select name="repeat" id="repeatSelect">
                                <option value="none">No Repeat</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="weekdays">Weekdays Only</option>
                                <option value="custom">Custom...</option>
                            </select>
                        </div>
                        
                        <div class="repeat-options" id="repeatOptions" style="display: none;">
                            <div class="form-row">
                                <div class="form-group half-width">
                                    <label>Repeat Every:</label>
                                    <input type="number" name="repeatInterval" value="1" min="1" max="365">
                                </div>
                                <div class="form-group half-width">
                                    <label>Unit:</label>
                                    <select name="repeatUnit">
                                        <option value="days">Days</option>
                                        <option value="weeks">Weeks</option>
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>End Repeat:</label>
                                <select name="repeatEnd">
                                    <option value="never">Never</option>
                                    <option value="after">After number of occurrences</option>
                                    <option value="date">On specific date</option>
                                </select>
                            </div>
                            
                            <div class="repeat-end-options" id="repeatEndOptions" style="display: none;">
                                <div class="form-group" id="repeatCountGroup" style="display: none;">
                                    <label>Number of Occurrences:</label>
                                    <input type="number" name="repeatCount" value="10" min="1" max="365">
                                </div>
                                <div class="form-group" id="repeatUntilGroup" style="display: none;">
                                    <label>End Date:</label>
                                    <input type="date" name="repeatUntil">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="primary-btn">Create Event</button>
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
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked');
                closeModal();
            });
        } else {
            console.error('Close button not found in add event modal');
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cancel button clicked');
                closeModal();
            });
        }
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
        
        // All-day toggle functionality
        const allDayToggle = modal.querySelector('#allDayToggle');
        const timeSection = modal.querySelector('#timeSection');
        
        allDayToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                timeSection.style.display = 'none';
            } else {
                timeSection.style.display = 'block';
            }
        });
        
        // Repeat functionality
        const repeatSelect = modal.querySelector('#repeatSelect');
        const repeatOptions = modal.querySelector('#repeatOptions');
        const repeatEndSelect = modal.querySelector('[name="repeatEnd"]');
        const repeatEndOptions = modal.querySelector('#repeatEndOptions');
        const repeatCountGroup = modal.querySelector('#repeatCountGroup');
        const repeatUntilGroup = modal.querySelector('#repeatUntilGroup');
        
        repeatSelect.addEventListener('change', (e) => {
            if (e.target.value === 'none') {
                repeatOptions.style.display = 'none';
            } else if (e.target.value === 'custom') {
                repeatOptions.style.display = 'block';
            } else {
                repeatOptions.style.display = 'block';
                // Set default values for common repeats
                const interval = modal.querySelector('[name="repeatInterval"]');
                const unit = modal.querySelector('[name="repeatUnit"]');
                
                switch (e.target.value) {
                    case 'daily':
                        interval.value = 1;
                        unit.value = 'days';
                        break;
                    case 'weekly':
                        interval.value = 1;
                        unit.value = 'weeks';
                        break;
                    case 'biweekly':
                        interval.value = 2;
                        unit.value = 'weeks';
                        break;
                    case 'monthly':
                        interval.value = 1;
                        unit.value = 'months';
                        break;
                    case 'yearly':
                        interval.value = 1;
                        unit.value = 'years';
                        break;
                    case 'weekdays':
                        interval.value = 1;
                        unit.value = 'days';
                        break;
                }
            }
        });
        
        repeatEndSelect.addEventListener('change', (e) => {
            repeatCountGroup.style.display = 'none';
            repeatUntilGroup.style.display = 'none';
            
            if (e.target.value === 'never') {
                repeatEndOptions.style.display = 'none';
            } else {
                repeatEndOptions.style.display = 'block';
                if (e.target.value === 'after') {
                    repeatCountGroup.style.display = 'block';
                } else if (e.target.value === 'date') {
                    repeatUntilGroup.style.display = 'block';
                }
            }
        });
        
        modal.querySelector('.add-event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const isAllDay = formData.get('allDay') === 'on';
            const startTime = formData.get('startTime') || '09:00';
            const endTime = formData.get('endTime') || '10:00';
            const repeatType = formData.get('repeat');
            
            const baseEvent = {
                id: Date.now().toString(),
                date: formData.get('date'),
                title: formData.get('title'),
                startTime: isAllDay ? null : startTime,
                endTime: isAllDay ? null : endTime,
                allDay: isAllDay,
                location: formData.get('location') || '',
                description: formData.get('description') || '',
                category: formData.get('category') || '',
                created: new Date().toISOString()
            };
            
            if (repeatType === 'none') {
                // Single event
                this.addEvent(baseEvent);
            } else {
                // Recurring event
                const events = this.generateRecurringEvents(baseEvent, {
                    type: repeatType,
                    interval: parseInt(formData.get('repeatInterval')) || 1,
                    unit: formData.get('repeatUnit') || 'weeks',
                    endType: formData.get('repeatEnd') || 'never',
                    count: parseInt(formData.get('repeatCount')) || 10,
                    until: formData.get('repeatUntil') || null
                });
                
                events.forEach(event => this.addEvent(event));
            }
            
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

    generateRecurringEvents(baseEvent, repeatConfig) {
        const events = [];
        const startDate = new Date(baseEvent.date);
        let currentDate = new Date(startDate);
        let count = 0;
        
        // Calculate end date
        let endDate = null;
        if (repeatConfig.endType === 'date' && repeatConfig.until) {
            endDate = new Date(repeatConfig.until);
        } else if (repeatConfig.endType === 'after') {
            // We'll use the count limit instead
        } else {
            // Default to 2 years for "never" to prevent infinite loops
            endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 2);
        }
        
        while (count < 365 && (repeatConfig.endType !== 'after' || count < repeatConfig.count)) {
            // Break if we've reached the end date
            if (endDate && currentDate > endDate) break;
            
            // Create event for current date
            const event = {
                ...baseEvent,
                id: `${baseEvent.id}_${count}`,
                date: currentDate.toISOString().split('T')[0]
            };
            events.push(event);
            
            // Calculate next occurrence
            switch (repeatConfig.type) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + repeatConfig.interval);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + (7 * repeatConfig.interval));
                    break;
                case 'biweekly':
                    currentDate.setDate(currentDate.getDate() + 14);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + repeatConfig.interval);
                    break;
                case 'yearly':
                    currentDate.setFullYear(currentDate.getFullYear() + repeatConfig.interval);
                    break;
                case 'weekdays':
                    // Skip to next weekday
                    do {
                        currentDate.setDate(currentDate.getDate() + 1);
                    } while (currentDate.getDay() === 0 || currentDate.getDay() === 6); // Skip weekends
                    break;
                case 'custom':
                    if (repeatConfig.unit === 'days') {
                        currentDate.setDate(currentDate.getDate() + repeatConfig.interval);
                    } else if (repeatConfig.unit === 'weeks') {
                        currentDate.setDate(currentDate.getDate() + (7 * repeatConfig.interval));
                    } else if (repeatConfig.unit === 'months') {
                        currentDate.setMonth(currentDate.getMonth() + repeatConfig.interval);
                    } else if (repeatConfig.unit === 'years') {
                        currentDate.setFullYear(currentDate.getFullYear() + repeatConfig.interval);
                    }
                    break;
            }
            
            count++;
            
            // Safety check to prevent infinite loops
            if (count >= (repeatConfig.endType === 'after' ? repeatConfig.count : 365)) {
                break;
            }
        }
        
        return events;
    }

    isRecurringEvent(event) {
        // Check if this event ID contains an underscore (indicating it's part of a recurring series)
        return event.id && event.id.includes('_');
    }

    loadEvents() {
        try {
            return JSON.parse(localStorage.getItem('smartDisplayHub_events')) || [];
        } catch (e) {
            console.warn('Failed to load events:', e);
            return [];
        }
    }

    saveEvents() {
        try {
            localStorage.setItem('smartDisplayHub_events', JSON.stringify(this.events));
        } catch (e) {
            console.warn('Failed to save events:', e);
        }
    }

    clearAllEvents() {
        // Clear all calendar-related localStorage data
        localStorage.removeItem('smartDisplayHub_events');
        localStorage.removeItem('smartDisplayHub_birthdays');
        localStorage.removeItem('externalCalendars');
        localStorage.removeItem('calendarSyncSettings');
        localStorage.removeItem('calendarCredentials');
        
        // Reset the events array and re-render
        this.events = [];
        this.render();
        console.log('All calendar events and data cleared');
    }

    getBirthdays() {
        try {
            return JSON.parse(localStorage.getItem('smartDisplayHub_birthdays')) || [];
        } catch (e) {
            return [];
        }
    }

    addMinutesToTime(timeStr, minutes) {
        const [hours, mins] = timeStr.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMins = totalMinutes % 60;
        return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
    }

    getDefaultEvents() {
        return [];
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
            grid += `<div class="day-header date-header ${isToday ? 'today' : ''}" data-day="${dayNum}">${dayName}<br><span class="day-num">${dayNum}</span></div>`;
        });
        grid += '</div>';
        
        // Time slots with events
        timeSlots.forEach(timeSlot => {
            grid += '<div class="time-row">';
            grid += `<div class="time-label">${timeSlot}</div>`;
            
            dates.forEach(date => {
                const dayEvents = this.getEventsForDate(date);
                const slotEvents = this.getEventsForTimeSlot(dayEvents, timeSlot);
                
                grid += `<div class="time-slot" data-day="${date.getDate()}" data-time="${timeSlot}">`;
                slotEvents.forEach(event => {
                    const recurringClass = this.isRecurringEvent(event) ? ' recurring' : '';
                    grid += `<div class="event-block${recurringClass}" data-event-id="${event.id}">${event.title}</div>`;
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
                const recurringClass = this.isRecurringEvent(event) ? ' recurring' : '';
                grid += `<div class="all-day-event${recurringClass}" data-event-id="${event.id}">${event.title}</div>`;
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
        console.log('showCalendarSettings called');
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
                    
                    <div class="settings-section">
                        <h4>Data Management</h4>
                        <div class="setting-group">
                            <p>⚠️ This will permanently delete all calendar events and data</p>
                            <button class="clear-all-btn" style="background: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">Clear All Events</button>
                        </div>
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
        
        // Clear all events button
        modal.querySelector('.clear-all-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all calendar events and data? This cannot be undone.')) {
                this.clearAllEvents();
                closeModal();
            }
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
        try {
            console.log('Initiating Google Calendar connection...');
            
            // Create a setup modal for Google Calendar
            const setupModal = document.createElement('div');
            setupModal.className = 'google-setup-modal';
            setupModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Connect Google Calendar</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="setup-info">
                            <h4>Setup Instructions:</h4>
                            <ol>
                                <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                                <li>Create a new project or select existing one</li>
                                <li>Enable the Google Calendar API</li>
                                <li>Create OAuth 2.0 credentials (Web application)</li>
                                <li>Add <strong>${window.location.origin}</strong> to authorized JavaScript origins</li>
                                <li>Add <strong>${window.location.origin}</strong> to authorized redirect URIs</li>
                                <li>Copy your Client ID below</li>
                            </ol>
                            <div class="redirect-info">
                                <p><strong>Current redirect URI:</strong> <code>${window.location.origin}</code></p>
                                <p><small>Copy this exact URL into your Google OAuth settings</small></p>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Google Client ID:</label>
                            <input type="text" id="googleClientId" placeholder="Enter your Google OAuth Client ID" 
                                   value="${this.getStoredClientId('google') || ''}">
                            <small>This will be stored locally in your browser</small>
                        </div>
                        
                        <div class="form-actions">
                            <button class="connect-btn" id="connectGoogleBtn">Connect Google Calendar</button>
                            <button class="test-btn" id="testGoogleBtn">Test Connection</button>
                            <button class="cancel-btn">Cancel</button>
                        </div>
                        
                        <div id="connectionStatus" class="connection-status"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(setupModal);
            
            // Show modal with animation
            setTimeout(() => {
                setupModal.classList.add('show');
            }, 100);
            
            // Function to close modal
            const closeSetupModal = () => {
                setupModal.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(setupModal)) {
                        document.body.removeChild(setupModal);
                    }
                }, 300);
            };
            
            // Event listeners
            setupModal.querySelector('.close-btn').addEventListener('click', closeSetupModal);
            setupModal.querySelector('.cancel-btn').addEventListener('click', closeSetupModal);
            
            setupModal.querySelector('#connectGoogleBtn').addEventListener('click', () => {
                const clientId = setupModal.querySelector('#googleClientId').value;
                if (clientId) {
                    this.storeClientId('google', clientId);
                    this.initiateGoogleOAuth(clientId);
                } else {
                    this.showConnectionStatus('Please enter your Google Client ID', 'error');
                }
            });
            
            setupModal.querySelector('#testGoogleBtn').addEventListener('click', () => {
                const clientId = setupModal.querySelector('#googleClientId').value;
                if (clientId) {
                    this.testGoogleConnection(clientId);
                } else {
                    this.showConnectionStatus('Please enter your Google Client ID', 'error');
                }
            });
            
        } catch (error) {
            console.error('Google Calendar connection error:', error);
        }
    }

    async connectOutlookCalendar() {
        try {
            console.log('Initiating Outlook Calendar connection...');
            
            // Create a setup modal for Outlook Calendar
            const setupModal = document.createElement('div');
            setupModal.className = 'outlook-setup-modal';
            setupModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Connect Outlook Calendar</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="setup-info">
                            <h4>Setup Instructions:</h4>
                            <ol>
                                <li>Go to <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank">Azure App Registrations</a></li>
                                <li>Create a new application (Single-page application)</li>
                                <li>Add Microsoft Graph API permissions: Calendars.Read</li>
                                <li>Add <strong>${window.location.origin}</strong> to redirect URIs</li>
                                <li>Copy your Application (Client) ID below</li>
                            </ol>
                            <div class="redirect-info">
                                <p><strong>Current redirect URI:</strong> <code>${window.location.origin}</code></p>
                                <p><small>Copy this exact URL into your Azure app redirect URIs</small></p>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Microsoft Client ID:</label>
                            <input type="text" id="outlookClientId" placeholder="Enter your Azure App Client ID" 
                                   value="${this.getStoredClientId('outlook') || ''}">
                            <small>This will be stored locally in your browser</small>
                        </div>
                        
                        <div class="form-actions">
                            <button class="connect-btn" id="connectOutlookBtn">Connect Outlook Calendar</button>
                            <button class="test-btn" id="testOutlookBtn">Test Connection</button>
                            <button class="cancel-btn">Cancel</button>
                        </div>
                        
                        <div id="connectionStatus" class="connection-status"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(setupModal);
            
            // Show modal with animation
            setTimeout(() => {
                setupModal.classList.add('show');
            }, 100);
            
            // Function to close modal
            const closeSetupModal = () => {
                setupModal.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(setupModal)) {
                        document.body.removeChild(setupModal);
                    }
                }, 300);
            };
            
            // Event listeners
            setupModal.querySelector('.close-btn').addEventListener('click', closeSetupModal);
            setupModal.querySelector('.cancel-btn').addEventListener('click', closeSetupModal);
            
            setupModal.querySelector('#connectOutlookBtn').addEventListener('click', () => {
                const clientId = setupModal.querySelector('#outlookClientId').value;
                if (clientId) {
                    this.storeClientId('outlook', clientId);
                    this.initiateOutlookOAuth(clientId);
                } else {
                    this.showConnectionStatus('Please enter your Microsoft Client ID', 'error');
                }
            });
            
            setupModal.querySelector('#testOutlookBtn').addEventListener('click', () => {
                const clientId = setupModal.querySelector('#outlookClientId').value;
                if (clientId) {
                    this.testOutlookConnection(clientId);
                } else {
                    this.showConnectionStatus('Please enter your Microsoft Client ID', 'error');
                }
            });
            
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

    // OAuth Helper Methods
    storeClientId(provider, clientId) {
        const credentials = JSON.parse(localStorage.getItem('calendarCredentials') || '{}');
        credentials[provider] = { clientId };
        localStorage.setItem('calendarCredentials', JSON.stringify(credentials));
    }

    getStoredClientId(provider) {
        const credentials = JSON.parse(localStorage.getItem('calendarCredentials') || '{}');
        return credentials[provider]?.clientId || '';
    }

    showConnectionStatus(message, type) {
        const statusDiv = document.querySelector('#connectionStatus');
        if (statusDiv) {
            statusDiv.innerHTML = `<div class="status-message ${type}">${message}</div>`;
        }
    }

    // Google Calendar OAuth Flow
    initiateGoogleOAuth(clientId) {
        const redirectUri = encodeURIComponent(window.location.origin);
        const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly');
        const state = encodeURIComponent(JSON.stringify({ provider: 'google', timestamp: Date.now() }));
        
        const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${redirectUri}&` +
            `scope=${scope}&` +
            `response_type=code&` +
            `access_type=offline&` +
            `state=${state}`;
        
        // Open OAuth window
        const popup = window.open(authUrl, 'googleAuth', 'width=500,height=600');
        
        // Listen for OAuth completion
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                this.checkGoogleAuthCompletion();
            }
        }, 1000);
        
        this.showConnectionStatus('Opening Google authentication window...', 'info');
    }

    // Outlook Calendar OAuth Flow
    initiateOutlookOAuth(clientId) {
        const redirectUri = encodeURIComponent(window.location.origin);
        const scope = encodeURIComponent('https://graph.microsoft.com/calendars.read');
        const state = encodeURIComponent(JSON.stringify({ provider: 'outlook', timestamp: Date.now() }));
        
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${clientId}&` +
            `response_type=code&` +
            `redirect_uri=${redirectUri}&` +
            `scope=${scope}&` +
            `state=${state}&` +
            `response_mode=query`;
        
        // Open OAuth window
        const popup = window.open(authUrl, 'outlookAuth', 'width=500,height=600');
        
        // Listen for OAuth completion
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                this.checkOutlookAuthCompletion();
            }
        }, 1000);
        
        this.showConnectionStatus('Opening Microsoft authentication window...', 'info');
    }

    // Test Connection Methods
    async testGoogleConnection(clientId) {
        try {
            this.showConnectionStatus('Testing Google Calendar connection...', 'info');
            
            // Simple validation
            if (clientId && clientId.includes('.googleusercontent.com')) {
                this.showConnectionStatus('✓ Client ID format appears valid. Click "Connect" to authenticate.', 'success');
            } else {
                this.showConnectionStatus('⚠ Invalid Client ID format. Please check your Google Cloud Console.', 'warning');
            }
        } catch (error) {
            this.showConnectionStatus('✗ Connection test failed: ' + error.message, 'error');
        }
    }

    async testOutlookConnection(clientId) {
        try {
            this.showConnectionStatus('Testing Outlook Calendar connection...', 'info');
            
            // Simple validation
            if (clientId && clientId.length === 36 && clientId.includes('-')) {
                this.showConnectionStatus('✓ Client ID format appears valid. Click "Connect" to authenticate.', 'success');
            } else {
                this.showConnectionStatus('⚠ Invalid Client ID format. Please check your Azure App Registration.', 'warning');
            }
        } catch (error) {
            this.showConnectionStatus('✗ Connection test failed: ' + error.message, 'error');
        }
    }

    // Auth Completion Handlers
    checkGoogleAuthCompletion() {
        // Check for stored tokens or success indicators
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('code') && urlParams.get('state')) {
            const state = JSON.parse(decodeURIComponent(urlParams.get('state')));
            if (state.provider === 'google') {
                this.handleGoogleAuthSuccess(urlParams.get('code'));
            }
        }
    }

    checkOutlookAuthCompletion() {
        // Check for stored tokens or success indicators
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('code') && urlParams.get('state')) {
            const state = JSON.parse(decodeURIComponent(urlParams.get('state')));
            if (state.provider === 'outlook') {
                this.handleOutlookAuthSuccess(urlParams.get('code'));
            }
        }
    }

    handleGoogleAuthSuccess(authCode) {
        this.externalCalendars.google = {
            connected: true,
            authCode: authCode,
            connectedAt: new Date().toISOString()
        };
        this.saveExternalCalendars();
        this.showConnectionStatus('✓ Google Calendar connected successfully!', 'success');
        console.log('Google Calendar connected with auth code:', authCode);
    }

    handleOutlookAuthSuccess(authCode) {
        this.externalCalendars.outlook = {
            connected: true,
            authCode: authCode,
            connectedAt: new Date().toISOString()
        };
        this.saveExternalCalendars();
        this.showConnectionStatus('✓ Outlook Calendar connected successfully!', 'success');
        console.log('Outlook Calendar connected with auth code:', authCode);
    }
}

// Make available globally
window.CalendarTile = CalendarTile;