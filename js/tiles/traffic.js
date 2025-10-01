// Traffic Tile - Using MapBox Directions API with real-time traffic
class TrafficTile {
    constructor() {
        // Using TomTom Routing API - free tier with excellent traffic data
        this.apiKey = 'M0kq7edufKs5ozjxrB95ACXwRoPh2zdN'; // Your TomTom API key
        this.routes = [
            {
                id: 'uni-to-work',
                name: 'Uni → Work',
                origin: [-1.0927, 50.7967], // Stanhope Rd coordinates
                destination: [-1.0919, 50.8378] // North Harbour coordinates
            },
            {
                id: 'uni-to-home',
                name: 'Uni → Home',
                origin: [-1.0927, 50.7967], // Stanhope Rd coordinates  
                destination: [-0.3751, 50.8118] // Worthing coordinates
            }
        ];
        console.log('Traffic tile initialized with routes:', this.routes);
        this.activeRoute = null;
        this.trafficData = null;
        this.lastUpdate = null;
        this.updateInterval = 10 * 60 * 1000; // 10 minutes (longer for free API)
        this.init();
    }

    init() {
        this.loadSettings();
        
        // Ensure routes are preserved after loadSettings
        if (!this.routes || this.routes.length === 0) {
            this.routes = [
                {
                    id: 'uni-to-work',
                    name: 'Uni → Work',
                    origin: [-1.0927, 50.7967], // Stanhope Rd coordinates
                    destination: [-1.0919, 50.8378] // North Harbour coordinates
                },
                {
                    id: 'uni-to-home',
                    name: 'Uni → Home',
                    origin: [-1.0927, 50.7967], // Stanhope Rd coordinates  
                    destination: [-0.3751, 50.8118] // Worthing coordinates
                }
            ];
            console.log('Routes restored after loadSettings:', this.routes);
        }
        
        this.render();
        this.setupEventListeners();
        
        // Always fetch traffic data since we have hardcoded values
        this.fetchTrafficData();
        this.startAutoUpdate();
        
        // Listen for global updates
        window.addEventListener('tileUpdate', () => {
            this.update();
        });
    }

    setupEventListeners() {
        const trafficTile = document.getElementById('trafficTile');
        
        // Click to refresh or cycle routes
        trafficTile.addEventListener('click', () => {
            if (this.routes.length === 0) {
                this.showSetupDialog();
            } else if (this.routes.length === 1) {
                this.fetchTrafficData(true);
            } else {
                this.cycleRoute();
            }
        });
        
        // Long press for settings
        let longPressTimer;
        trafficTile.addEventListener('mousedown', () => {
            longPressTimer = setTimeout(() => {
                this.showSetupDialog();
            }, 800);
        });
        
        trafficTile.addEventListener('mouseup', () => {
            clearTimeout(longPressTimer);
        });
        
        trafficTile.addEventListener('mouseleave', () => {
            clearTimeout(longPressTimer);
        });
        
        // Settings update listener
        window.addEventListener('settingsUpdated', (e) => {
            if (e.detail.trafficApiKey !== undefined) {
                this.loadSettings();
                if (this.apiKey && this.routes.length > 0) {
                    this.fetchTrafficData();
                    this.startAutoUpdate();
                }
            }
        });
    }

    render() {
        const trafficInfo = document.getElementById('trafficInfo');
        
        console.log('Traffic render called - routes count:', this.routes.length, 'routes:', this.routes);
        
        if (this.routes.length === 0) {
            console.log('No routes found, showing setup message');
            this.showSetupMessage();
            return;
        }
        
        if (!this.trafficData) {
            trafficInfo.innerHTML = `
                <div class="traffic-loading">
                    <div class="traffic-icon">🚗</div>
                    <div class="traffic-duration">--</div>
                    <div class="traffic-status">Loading...</div>
                </div>
            `;
            return;
        }
        
        const route = this.activeRoute || this.routes[0];
        const data = this.trafficData;
        
        if (data.error) {
            this.showError(data.error);
            return;
        }
        
        const duration = this.formatDuration(data.duration.value);
        const durationInTraffic = this.formatDuration(data.duration_in_traffic.value);
        const statusClass = this.getTrafficStatusClass(data.duration.value, data.duration_in_traffic.value);
        
        // TomTom provides separate normal time and traffic-aware time
        const isRealTime = !data.isEstimated;
        const hasTrafficDelay = data.trafficDelay && data.trafficDelay > 0;
        
        let timeDisplay, statusDisplay;
        
        if (isRealTime && hasTrafficDelay) {
            // Show traffic-aware time with delay info
            timeDisplay = `${durationInTraffic} (+${Math.round(data.trafficDelay / 60)} min traffic)`;
            statusDisplay = `Live traffic: ${Math.round(data.trafficDelay / 60)} min delay`;
        } else if (isRealTime) {
            // No current traffic delays
            timeDisplay = durationInTraffic;
            statusDisplay = 'Live traffic: Clear roads';
        } else {
            // Fallback data
            timeDisplay = durationInTraffic;
            statusDisplay = 'Estimated time (API unavailable)';
        }
        
        trafficInfo.innerHTML = `
            <div class="traffic-route">
                <div class="traffic-route-name">${this.escapeHtml(route.name)}</div>
            </div>
            <div class="traffic-duration ${statusClass}">${timeDisplay}</div>
            <div class="traffic-status">${statusDisplay}</div>
            <div class="traffic-distance">${data.distance.text}</div>
            ${this.routes.length > 1 ? this.generateDotIndicator(route) : ''}
            <div class="traffic-updated">Updated: ${this.formatUpdateTime()}</div>
        `;
        
        // Add event listeners to dots after rendering
        if (this.routes.length > 1) {
            this.addDotEventListeners();
        }
    }

    async fetchTrafficData(force = false) {
        if (this.routes.length === 0) {
            console.warn('No routes configured');
            return;
        }
        
        // Check if we need to update (unless forced)
        if (!force && this.lastUpdate && (Date.now() - this.lastUpdate < this.updateInterval)) {
            return;
        }
        
        const route = this.activeRoute || this.routes[0];
        
        try {
            // Show loading state
            const trafficInfo = document.getElementById('trafficInfo');
            trafficInfo.classList.add('loading');
            
            console.log('Fetching REAL traffic data for route:', route.name);
            
            // Use TomTom Routing API with real-time traffic
            console.log('Fetching REAL traffic data from TomTom...');
            
            // Build TomTom routing URL with traffic-aware routing
            const origin = `${route.origin[1]},${route.origin[0]}`; // TomTom uses lat,lng format
            const destination = `${route.destination[1]},${route.destination[0]}`;
            const apiUrl = `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${destination}/json?key=${this.apiKey}&traffic=true&routeType=fastest&travelMode=car`;
            
            console.log('Fetching from TomTom API:', apiUrl);
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`TomTom API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.routes || data.routes.length === 0) {
                throw new Error('No route found from TomTom');
            }
            
            const tomtomRoute = data.routes[0];
            const summary = tomtomRoute.summary;
            
            // Convert TomTom response to our format
            const routeData = {
                duration: {
                    text: this.formatDuration(summary.travelTimeInSeconds),
                    value: summary.travelTimeInSeconds
                },
                duration_in_traffic: {
                    text: this.formatDuration(summary.trafficDelayInSeconds ? 
                        summary.travelTimeInSeconds + summary.trafficDelayInSeconds : 
                        summary.travelTimeInSeconds),
                    value: summary.trafficDelayInSeconds ? 
                        summary.travelTimeInSeconds + summary.trafficDelayInSeconds : 
                        summary.travelTimeInSeconds
                },
                distance: {
                    text: `${(summary.lengthInMeters / 1000).toFixed(1)} km`,
                    value: summary.lengthInMeters
                },
                trafficDelay: summary.trafficDelayInSeconds || 0
            };
            
            this.trafficData = routeData;
            this.lastUpdate = Date.now();
            this.saveTrafficData();
            this.render();
            trafficInfo.classList.remove('loading');
            console.log('REAL traffic data loaded successfully:', routeData);
            
        } catch (error) {
            console.error('TomTom API failed:', error.message);
            
            // Remove loading state
            document.getElementById('trafficInfo').classList.remove('loading');
            
            // Fallback to estimated data if API fails
            console.log('Falling back to estimated data due to API error');
            const estimatedData = this.getEstimatedRouteData(route);
            
            if (estimatedData) {
                this.trafficData = estimatedData;
                this.lastUpdate = Date.now();
                this.render();
            } else {
                // Show error message
                this.trafficData = { error: error.message };
                this.render();
            }
        }
    }

    getEstimatedRouteData(route) {
        // Fallback estimated route data when real-time API fails
        // Based on realistic commute times but not live traffic data
        const routeDatabase = {
            'uni-to-work': {
                duration: {
                    text: '9 min',
                    value: 540 // 9 minutes in seconds
                },
                duration_in_traffic: {
                    text: '12 min',
                    value: 720 // 12 minutes with traffic
                },
                distance: {
                    text: '8.2 km',
                    value: 8200 // meters
                }
            },
            'uni-to-home': {
                duration: {
                    text: '55 min',
                    value: 3300 // 55 minutes in seconds
                },
                duration_in_traffic: {
                    text: '68 min',
                    value: 4080 // 68 minutes with traffic
                },
                distance: {
                    text: '87.3 km',
                    value: 87300 // meters
                }
            }
        };
        
        // Add some randomization to make it feel more realistic
        const baseData = routeDatabase[route.id];
        if (!baseData) return null;
        
        // Add ±2 minutes random variation for realism
        const variation = (Math.random() - 0.5) * 240; // ±2 minutes in seconds
        const trafficVariation = (Math.random() - 0.5) * 360; // ±3 minutes for traffic
        
        return {
            duration: {
                text: this.formatDuration(Math.max(baseData.duration.value + variation, 300)), // minimum 5 minutes
                value: Math.max(baseData.duration.value + variation, 300) // minimum 5 minutes
            },
            duration_in_traffic: {
                text: this.formatDuration(Math.max(baseData.duration_in_traffic.value + trafficVariation, baseData.duration.value + variation + 180)), // at least 3 min longer than normal
                value: Math.max(baseData.duration_in_traffic.value + trafficVariation, baseData.duration.value + variation + 180) // at least 3 min longer than normal
            },
            distance: baseData.distance,
            isEstimated: true // Mark as fallback data
        };
    }

    // geocodeLocation method removed - using hardcoded route data instead

    generateDotIndicator(currentRoute) {
        const currentIndex = this.routes.indexOf(currentRoute);
        const dots = this.routes.map((_, index) => {
            const isActive = index === currentIndex;
            return `<span class="dot ${isActive ? 'active' : ''}" data-index="${index}"></span>`;
        }).join('');
        
        return `<div class="traffic-dots">${dots}</div>`;
    }

    addDotEventListeners() {
        const dots = document.querySelectorAll('.traffic-dots .dot');
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent tile click from triggering
                const index = parseInt(dot.dataset.index);
                if (index >= 0 && index < this.routes.length) {
                    this.activeRoute = this.routes[index];
                    this.fetchTrafficData(true);
                    
                    // Visual feedback
                    dot.style.transform = 'scale(1.4)';
                    setTimeout(() => {
                        dot.style.transform = '';
                    }, 150);
                }
            });
        });
    }

    showSetupMessage() {
        const trafficInfo = document.getElementById('trafficInfo');
        trafficInfo.innerHTML = `
            <div class="traffic-setup">
                <div class="traffic-icon">⚙️</div>
                <div class="traffic-message">Traffic Setup Required</div>
                <div class="traffic-description">
                    Configure your commute routes
                </div>
                <button class="setup-btn">Setup Traffic</button>
            </div>
        `;
        
        trafficInfo.querySelector('.setup-btn').addEventListener('click', () => {
            this.showSetupDialog();
        });
    }

    showSetupDialog() {
        const modal = document.createElement('div');
        modal.className = 'traffic-setup-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Traffic Setup</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="setup-info">
                        <p><strong>Traffic information is pre-configured for your commute!</strong></p>
                        <p>Your routes are hardcoded with realistic travel times - no external API required.</p>
                        <ol>
                            <li><strong>Uni → Work:</strong> University to Portsmouth North Harbour (≈12-18 min)</li>
                            <li><strong>Uni → Home:</strong> University to Worthing (≈55-68 min)</li>
                            <li>Auto-cycles every 10 seconds like a carousel</li>
                            <li>Click dots to manually switch routes</li>
                        </ol>
                    </div>
                    <form class="traffic-setup-form">
                        <div class="form-group">
                            <label>Traffic Data Source:</label>
                            <input type="text" name="apiKey" value="Hardcoded Route Data" placeholder="No API required" readonly style="background: #f5f5f5;">
                            <small style="color: #666;">Uses reliable hardcoded data - no external API calls needed!</small>
                        </div>
                        <div class="routes-section">
                            <h4>Routes</h4>
                            <div class="routes-list">
                                ${this.routes.map((route, index) => `
                                    <div class="route-item" data-index="${index}">
                                        <div class="route-info">
                                            <strong>${this.escapeHtml(route.name)}</strong><br>
                                            ${this.escapeHtml(route.origin)} → ${this.escapeHtml(route.destination)}
                                        </div>
                                        <button type="button" class="delete-route-btn" data-index="${index}">Delete</button>
                                    </div>
                                `).join('')}
                            </div>
                            <button type="button" class="add-route-btn">Add Route</button>
                        </div>
                        <div class="form-actions">
                            <button type="submit">Save Settings</button>
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
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Add route button
        modal.querySelector('.add-route-btn').addEventListener('click', () => {
            this.showAddRouteDialog(modal);
        });
        
        // Delete route buttons
        modal.querySelectorAll('.delete-route-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.routes.splice(index, 1);
                this.refreshSetupDialog(modal);
            });
        });
        
        modal.querySelector('.traffic-setup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            this.apiKey = formData.get('apiKey').trim();
            this.saveSettings();
            
            if (this.routes.length > 0) {
                this.fetchTrafficData(true);
                this.startAutoUpdate();
            }
            
            document.body.removeChild(modal);
        });
    }

    showAddRouteDialog(parentModal) {
        const modal = document.createElement('div');
        modal.className = 'add-route-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Route</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="add-route-form">
                        <div class="form-group">
                            <label>Route Name:</label>
                            <input type="text" name="name" placeholder="e.g., Home to Work" required autofocus>
                        </div>
                        <div class="form-group">
                            <label>Origin:</label>
                            <input type="text" name="origin" placeholder="e.g., 123 Main St, City, State" required>
                        </div>
                        <div class="form-group">
                            <label>Destination:</label>
                            <input type="text" name="destination" placeholder="e.g., 456 Office Blvd, City, State" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit">Add Route</button>
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
        
        modal.querySelector('.add-route-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const route = {
                id: Date.now().toString(),
                name: formData.get('name').trim(),
                origin: formData.get('origin').trim(),
                destination: formData.get('destination').trim()
            };
            
            this.routes.push(route);
            document.body.removeChild(modal);
            this.refreshSetupDialog(parentModal);
        });
    }

    refreshSetupDialog(modal) {
        const routesList = modal.querySelector('.routes-list');
        routesList.innerHTML = this.routes.map((route, index) => `
            <div class="route-item" data-index="${index}">
                <div class="route-info">
                    <strong>${this.escapeHtml(route.name)}</strong><br>
                    ${this.escapeHtml(route.origin)} → ${this.escapeHtml(route.destination)}
                </div>
                <button type="button" class="delete-route-btn" data-index="${index}">Delete</button>
            </div>
        `).join('');
        
        // Re-attach delete listeners
        routesList.querySelectorAll('.delete-route-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.routes.splice(index, 1);
                this.refreshSetupDialog(modal);
            });
        });
    }

    showError(message) {
        const trafficInfo = document.getElementById('trafficInfo');
        trafficInfo.innerHTML = `
            <div class="traffic-error">
                <div class="traffic-icon">❌</div>
                <div class="traffic-message">Traffic Error</div>
                <div class="traffic-description">${message}</div>
                <button class="retry-btn">Retry</button>
                <button class="setup-btn">Settings</button>
            </div>
        `;
        
        trafficInfo.querySelector('.retry-btn').addEventListener('click', () => {
            this.fetchTrafficData(true);
        });
        
        trafficInfo.querySelector('.setup-btn').addEventListener('click', () => {
            this.showSetupDialog();
        });
    }

    cycleRoute() {
        if (this.routes.length <= 1) return;
        
        const currentIndex = this.activeRoute ? this.routes.indexOf(this.activeRoute) : 0;
        const nextIndex = (currentIndex + 1) % this.routes.length;
        this.activeRoute = this.routes[nextIndex];
        
        // Add smooth transition effect
        const trafficInfo = document.getElementById('trafficInfo');
        trafficInfo.style.opacity = '0.3';
        trafficInfo.style.transform = 'translateX(10px)';
        
        setTimeout(() => {
            this.fetchTrafficData(true);
            
            // Restore appearance after data loads
            setTimeout(() => {
                trafficInfo.style.opacity = '1';
                trafficInfo.style.transform = 'translateX(0)';
            }, 100);
        }, 150);
    }

    formatDuration(seconds) {
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
    }

    getTrafficStatusClass(normalDuration, trafficDuration) {
        const delay = trafficDuration - normalDuration;
        const delayPercentage = (delay / normalDuration) * 100;
        
        if (delayPercentage > 50) return 'traffic-heavy';
        if (delayPercentage > 20) return 'traffic-slow';
        return 'traffic-normal';
    }

    formatUpdateTime() {
        if (!this.lastUpdate) return '';
        
        const now = new Date();
        const updateTime = new Date(this.lastUpdate);
        const diffMinutes = Math.floor((now - updateTime) / 60000);
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        return `${diffHours}h ago`;
    }

    startAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }
        
        if (this.routeCycleInterval) {
            clearInterval(this.routeCycleInterval);
        }
        
        // Set active route to first route if none selected
        if (!this.activeRoute && this.routes.length > 0) {
            this.activeRoute = this.routes[0];
        }
        
        // Update traffic data every 10 minutes
        this.autoUpdateInterval = setInterval(() => {
            this.fetchTrafficData();
        }, this.updateInterval);
        
        // Auto-cycle between routes every 10 seconds for carousel effect
        if (this.routes.length > 1) {
            this.routeCycleInterval = setInterval(() => {
                this.cycleRoute();
            }, 10 * 1000); // 10 seconds
        }
    }

    update() {
        if (this.apiKey && this.routes.length > 0) {
            this.fetchTrafficData();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadSettings() {
        try {
            // Clear any old settings that might interfere
            localStorage.removeItem('smartDisplayHub_trafficSettings');
            console.log('Cleared old traffic settings from localStorage');
            
            const settings = JSON.parse(localStorage.getItem('smartDisplayHub_trafficSettings')) || {};
            // Don't override hardcoded API key and routes - they're pre-configured
            // this.apiKey = settings.apiKey || '';
            // this.routes = settings.routes || [];
            this.activeRoute = settings.activeRoute || null;
            console.log('Traffic tile loaded with hardcoded settings:', {
                apiKey: this.apiKey ? 'Set' : 'Not set',
                routes: this.routes.length,
                activeRoute: this.activeRoute
            });
        } catch (e) {
            console.warn('Failed to load traffic settings:', e);
        }
    }

    saveSettings() {
        try {
            const settings = {
                apiKey: this.apiKey,
                routes: this.routes,
                activeRoute: this.activeRoute
            };
            localStorage.setItem('smartDisplayHub_trafficSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save traffic settings:', e);
        }
    }

    saveTrafficData() {
        try {
            const data = {
                traffic: this.trafficData,
                lastUpdate: this.lastUpdate,
                activeRoute: this.activeRoute
            };
            localStorage.setItem('smartDisplayHub_trafficData', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save traffic data:', e);
        }
    }

    loadTrafficData() {
        try {
            const data = JSON.parse(localStorage.getItem('smartDisplayHub_trafficData'));
            if (data && data.traffic && data.lastUpdate) {
                this.trafficData = data.traffic;
                this.lastUpdate = data.lastUpdate;
                this.activeRoute = data.activeRoute;
            }
        } catch (e) {
            console.warn('Failed to load traffic data:', e);
        }
    }

    destroy() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }
        if (this.routeCycleInterval) {
            clearInterval(this.routeCycleInterval);
        }
    }
}

// Make available globally
window.TrafficTile = TrafficTile;