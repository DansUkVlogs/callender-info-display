// Calendar Tile — placeholder (final)
// Simple placeholder to avoid errors while the calendar is being rebuilt.

class CalendarTile {
    constructor(container) {
        this.container = container || document.getElementById('calendarView') || document.getElementById('calendar-tile') || document.querySelector('#calendarTile');
        this.render();
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="calendar-coming-soon" style="padding:16px;text-align:center;">
                <h3 style="margin:0 0 8px;">Calendar — coming soon</h3>
                <p style="margin:0;color:#666">We're rebuilding this tile. Stay tuned — the calendar will return soon.</p>
            </div>
        `;
    }

    // Compatibility no-ops
    update(){}
    navigate(){}
    showCalendarSettings(){}
    clearAllEvents(){}

    static init(container){
        return new CalendarTile(container);
    }
}

// Expose for legacy callers
window.CalendarTile = CalendarTile;

        
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
                        <h4>View Mode</h4>
                        <div class="view-mode-selector">
                            <button class="view-mode-btn ${this.viewMode === 'month' ? 'active' : ''}" data-view="month">
                                <div class="view-icon">📅</div>
                                <div class="view-name">Month</div>
                            </button>
                            <button class="view-mode-btn ${this.viewMode === 'week' ? 'active' : ''}" data-view="week">
                                <div class="view-icon">📊</div>
                                <div class="view-name">Week</div>
                            </button>
                            <button class="view-mode-btn ${this.viewMode === 'workweek' ? 'active' : ''}" data-view="workweek">
                                <div class="view-icon">💼</div>
                                <div class="view-name">Work Week</div>
                            </button>
                            <button class="view-mode-btn ${this.viewMode === '3day' ? 'active' : ''}" data-view="3day">
                                <div class="view-icon">📋</div>
                                <div class="view-name">3 Day</div>
                            </button>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h4>Data Management</h4>
                        <div class="setting-group">
                            <p class="warning-text">⚠️ This will permanently delete all calendar events and data</p>
                            <button class="clear-all-btn">
                                <span class="btn-icon">🗑️</span>
                                Clear All Events
                            </button>
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
        
        // View mode buttons
        modal.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                modal.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Change view mode
                const viewMode = btn.dataset.view;
                this.changeViewMode(viewMode);
                console.log("1291 " + viewMode + " " + this.viewMode);
                this.saveViewMode(viewMode);
                console.log("1293 " + viewMode + " " + this.viewMode);
            });
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
        console.log("1309 " + newMode);
    console.log('🎯 changeViewMode called with:', newMode);
    console.log('🎯 Current viewMode before change:', this.viewMode);
    console.log('🎯 WHO CALLED changeViewMode? Stack trace:');
    console.log(new Error().stack.split('\n').slice(1, 6).join('\n'));

    // DIAGNOSTIC (button-based): Check view-mode buttons at start
    const allBtnsStart = document.querySelectorAll('.view-mode-btn');
    console.log('� View-mode buttons at START of changeViewMode:');
    allBtnsStart.forEach(b => console.log(`  ${b.dataset.view}: active=${b.classList.contains('active')}`));
        
        const oldMode = this.viewMode;
        this.viewMode = newMode;
        
        // Save the mode to localStorage
        this.saveViewMode(newMode);
        
        // Only re-render if the mode actually changed and it affects the calendar content
        if (oldMode !== newMode) {
            console.log('🔥 View mode changed from', oldMode, 'to', newMode, '- radio already set by user');
            
            // Don't interfere with radio states - user interaction already set them correctly
            // CSS animation will trigger automatically from the :checked state
            
            // DIAGNOSTIC (button-based): Check view-mode buttons before renderCalendarContent
            const allBtnsBefore = document.querySelectorAll('.view-mode-btn');
            console.log('� View-mode buttons BEFORE renderCalendarContent:');
            allBtnsBefore.forEach(b => console.log(`  ${b.dataset.view}: active=${b.classList.contains('active')}`));
            
            // Render new content immediately 
            console.log('🔥 About to call renderCalendarContent');
            this.renderCalendarContent();
            
            // DIAGNOSTIC (button-based): Check view-mode buttons after renderCalendarContent
            setTimeout(() => {
                const allBtnsAfter = document.querySelectorAll('.view-mode-btn');
                console.log('� View-mode buttons AFTER renderCalendarContent:');
                allBtnsAfter.forEach(b => console.log(`  ${b.dataset.view}: active=${b.classList.contains('active')}`));
            }, 50);
        } else {
            // Just update radio state if render was called for other reasons
            console.log('ℹ️ ELSE BRANCH: view did not change; updating button UI to match current mode');
            // Update the button UI and sliding background to reflect the mode deterministically
            this.updateViewModeUI(newMode);
        }
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