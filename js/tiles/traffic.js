// Traffic Tile
class TrafficTile {
    constructor() {
        this.apiKey = '';
        this.routes = [];
        this.activeRoute = null;
        this.trafficData = null;
        this.lastUpdate = null;
        this.updateInterval = 5 * 60 * 1000; // 5 minutes
        this.init();
    }

    init() {
        this.loadSettings();
        this.render();
        this.setupEventListeners();
        
        if (this.apiKey && this.routes.length > 0) {
            this.fetchTrafficData();
            this.startAutoUpdate();
        } else {
            this.showSetupMessage();
        }
        
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
        
        if (this.routes.length === 0) {
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
        
        trafficInfo.innerHTML = `
            <div class="traffic-route">
                <div class="traffic-route-name">${this.escapeHtml(route.name)}</div>
                <div class="traffic-route-desc">${this.escapeHtml(route.origin)} → ${this.escapeHtml(route.destination)}</div>
            </div>
            <div class="traffic-duration ${statusClass}">${durationInTraffic}</div>
            <div class="traffic-status">
                ${data.duration.value === data.duration_in_traffic.value ? 
                    'Normal traffic' : 
                    `+${Math.round((data.duration_in_traffic.value - data.duration.value) / 60)} min in traffic`
                }
            </div>
            <div class="traffic-distance">${data.distance.text}</div>
            ${this.routes.length > 1 ? `<div class="traffic-indicator">${this.routes.indexOf(route) + 1}/${this.routes.length}</div>` : ''}
            <div class="traffic-updated">Updated: ${this.formatUpdateTime()}</div>
        `;
    }

    async fetchTrafficData(force = false) {
        if (!this.apiKey || this.routes.length === 0) {
            console.warn('Traffic API key or routes not configured');
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
            
            // Use Google Maps Distance Matrix API
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
                `origins=${encodeURIComponent(route.origin)}` +
                `&destinations=${encodeURIComponent(route.destination)}` +
                `&departure_time=now` +
                `&traffic_model=best_guess` +
                `&key=${this.apiKey}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status !== 'OK') {
                throw new Error(`API Error: ${data.status}`);
            }
            
            const element = data.rows[0].elements[0];
            
            if (element.status !== 'OK') {
                throw new Error(`Route Error: ${element.status}`);
            }
            
            this.trafficData = element;
            this.lastUpdate = Date.now();
            this.saveTrafficData();
            this.render();
            
            trafficInfo.classList.remove('loading');
            
        } catch (error) {
            console.error('Failed to fetch traffic data:', error);
            
            // Remove loading state
            document.getElementById('trafficInfo').classList.remove('loading');
            
            // Show error message
            this.trafficData = { error: error.message };
            this.render();
        }
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
                        <p>To display traffic information, you need a Google Maps API key with Distance Matrix API enabled.</p>
                        <ol>
                            <li>Visit <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                            <li>Create a project and enable the Distance Matrix API</li>
                            <li>Create an API key with appropriate restrictions</li>
                            <li>Enter the API key and configure your routes below</li>
                        </ol>
                    </div>
                    <form class="traffic-setup-form">
                        <div class="form-group">
                            <label>Google Maps API Key:</label>
                            <input type="text" name="apiKey" value="${this.apiKey}" placeholder="Your Google Maps API key" required>
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
        
        this.fetchTrafficData(true);
        
        // Visual feedback
        const trafficTile = document.getElementById('trafficTile');
        trafficTile.style.transform = 'scale(0.95)';
        setTimeout(() => {
            trafficTile.style.transform = '';
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
        
        this.autoUpdateInterval = setInterval(() => {
            this.fetchTrafficData();
        }, this.updateInterval);
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
            const settings = JSON.parse(localStorage.getItem('smartDisplayHub_trafficSettings')) || {};
            this.apiKey = settings.apiKey || '';
            this.routes = settings.routes || [];
            this.activeRoute = settings.activeRoute || null;
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
    }
}

// Make available globally
window.TrafficTile = TrafficTile;