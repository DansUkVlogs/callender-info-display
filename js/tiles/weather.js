// Weather Tile
class WeatherTile {
    constructor() {
        this.apiKey = '';
        this.location = '';
        this.units = 'metric'; // metric, imperial, kelvin
        this.weatherData = null;
        this.lastUpdate = null;
        this.updateInterval = 10 * 60 * 1000; // 10 minutes
        this.init();
    }

    init() {
        this.loadSettings();
        this.render();
        this.setupEventListeners();
        
        if (this.apiKey && this.location) {
            this.fetchWeather();
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
        const weatherTile = document.getElementById('weatherTile');
        
        // Click to refresh
        weatherTile.addEventListener('click', () => {
            if (this.apiKey && this.location) {
                this.fetchWeather(true);
            } else {
                this.showSetupDialog();
            }
        });
        
        // Settings update listener
        window.addEventListener('settingsUpdated', (e) => {
            if (e.detail.weatherApiKey !== undefined || e.detail.location !== undefined) {
                this.loadSettings();
                if (this.apiKey && this.location) {
                    this.fetchWeather();
                    this.startAutoUpdate();
                } else {
                    this.showSetupMessage();
                }
            }
        });
    }

    render() {
        const weatherInfo = document.getElementById('weatherInfo');
        
        if (!this.weatherData) {
            weatherInfo.innerHTML = `
                <div class="weather-loading">
                    <div class="weather-icon">☁️</div>
                    <div class="weather-temp">--°</div>
                    <div class="weather-condition">Loading...</div>
                </div>
            `;
            return;
        }
        
        const weather = this.weatherData;
        const temp = Math.round(weather.main.temp);
        const condition = weather.weather[0].description;
        const icon = this.getWeatherIcon(weather.weather[0].icon);
        
        weatherInfo.innerHTML = `
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${temp}°${this.getTemperatureUnit()}</div>
            <div class="weather-condition">${this.capitalize(condition)}</div>
            <div class="weather-details">
                <div class="weather-detail">
                    <span>Feels like</span>
                    <span>${Math.round(weather.main.feels_like)}°</span>
                </div>
                <div class="weather-detail">
                    <span>Humidity</span>
                    <span>${weather.main.humidity}%</span>
                </div>
                <div class="weather-detail">
                    <span>Wind</span>
                    <span>${this.formatWindSpeed(weather.wind.speed)}</span>
                </div>
            </div>
            <div class="weather-location">${weather.name}</div>
            <div class="weather-updated">Updated: ${this.formatUpdateTime()}</div>
        `;
    }

    async fetchWeather(force = false) {
        if (!this.apiKey || !this.location) {
            console.warn('Weather API key or location not set');
            return;
        }
        
        // Check if we need to update (unless forced)
        if (!force && this.lastUpdate && (Date.now() - this.lastUpdate < this.updateInterval)) {
            return;
        }
        
        try {
            // Show loading state
            const weatherInfo = document.getElementById('weatherInfo');
            const currentContent = weatherInfo.innerHTML;
            weatherInfo.classList.add('loading');
            
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(this.location)}&appid=${this.apiKey}&units=${this.units}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            this.weatherData = data;
            this.lastUpdate = Date.now();
            this.saveWeatherData();
            this.render();
            
            weatherInfo.classList.remove('loading');
            
        } catch (error) {
            console.error('Failed to fetch weather:', error);
            
            // Remove loading state
            document.getElementById('weatherInfo').classList.remove('loading');
            
            // Show error message
            this.showError(error.message);
        }
    }

    showSetupMessage() {
        const weatherInfo = document.getElementById('weatherInfo');
        weatherInfo.innerHTML = `
            <div class="weather-setup">
                <div class="weather-icon">⚙️</div>
                <div class="weather-message">Weather Setup Required</div>
                <div class="weather-description">
                    Click here to configure your weather settings
                </div>
                <button class="setup-btn">Setup Weather</button>
            </div>
        `;
        
        weatherInfo.querySelector('.setup-btn').addEventListener('click', () => {
            this.showSetupDialog();
        });
    }

    showSetupDialog() {
        const modal = document.createElement('div');
        modal.className = 'weather-setup-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Weather Setup</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="setup-info">
                        <p>To display weather information, you need a free API key from OpenWeatherMap.</p>
                        <ol>
                            <li>Visit <a href="https://openweathermap.org/api" target="_blank">openweathermap.org/api</a></li>
                            <li>Sign up for a free account</li>
                            <li>Get your API key from the dashboard</li>
                            <li>Enter it below along with your location</li>
                        </ol>
                    </div>
                    <form class="weather-setup-form">
                        <div class="form-group">
                            <label>API Key:</label>
                            <input type="text" name="apiKey" value="${this.apiKey}" placeholder="Your OpenWeatherMap API key" required>
                        </div>
                        <div class="form-group">
                            <label>Location:</label>
                            <input type="text" name="location" value="${this.location}" placeholder="e.g., London, UK or New York, NY" required>
                        </div>
                        <div class="form-group">
                            <label>Units:</label>
                            <select name="units">
                                <option value="metric" ${this.units === 'metric' ? 'selected' : ''}>Celsius (°C)</option>
                                <option value="imperial" ${this.units === 'imperial' ? 'selected' : ''}>Fahrenheit (°F)</option>
                                <option value="kelvin" ${this.units === 'kelvin' ? 'selected' : ''}>Kelvin (K)</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit">Save & Test</button>
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
        
        modal.querySelector('.weather-setup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            this.apiKey = formData.get('apiKey').trim();
            this.location = formData.get('location').trim();
            this.units = formData.get('units');
            
            this.saveSettings();
            
            // Test the configuration
            const submitBtn = modal.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Testing...';
            submitBtn.disabled = true;
            
            try {
                await this.fetchWeather(true);
                document.body.removeChild(modal);
                this.startAutoUpdate();
            } catch (error) {
                alert('Failed to fetch weather. Please check your API key and location.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    showError(message) {
        const weatherInfo = document.getElementById('weatherInfo');
        weatherInfo.innerHTML = `
            <div class="weather-error">
                <div class="weather-icon">❌</div>
                <div class="weather-message">Weather Error</div>
                <div class="weather-description">${message}</div>
                <button class="retry-btn">Retry</button>
                <button class="setup-btn">Settings</button>
            </div>
        `;
        
        weatherInfo.querySelector('.retry-btn').addEventListener('click', () => {
            this.fetchWeather(true);
        });
        
        weatherInfo.querySelector('.setup-btn').addEventListener('click', () => {
            this.showSetupDialog();
        });
    }

    getWeatherIcon(iconCode) {
        const iconMap = {
            '01d': '☀️', // clear sky day
            '01n': '🌙', // clear sky night
            '02d': '⛅', // few clouds day
            '02n': '☁️', // few clouds night
            '03d': '☁️', // scattered clouds
            '03n': '☁️',
            '04d': '☁️', // broken clouds
            '04n': '☁️',
            '09d': '🌧️', // shower rain
            '09n': '🌧️',
            '10d': '🌦️', // rain day
            '10n': '🌧️', // rain night
            '11d': '⛈️', // thunderstorm
            '11n': '⛈️',
            '13d': '❄️', // snow
            '13n': '❄️',
            '50d': '🌫️', // mist
            '50n': '🌫️'
        };
        
        return iconMap[iconCode] || '🌤️';
    }

    getTemperatureUnit() {
        switch (this.units) {
            case 'imperial': return 'F';
            case 'kelvin': return 'K';
            default: return 'C';
        }
    }

    formatWindSpeed(speed) {
        const unit = this.units === 'imperial' ? 'mph' : 'm/s';
        return `${Math.round(speed)} ${unit}`;
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

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    startAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }
        
        this.autoUpdateInterval = setInterval(() => {
            this.fetchWeather();
        }, this.updateInterval);
    }

    update() {
        // Check if we should fetch new weather data
        if (this.apiKey && this.location) {
            this.fetchWeather();
        }
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('smartDisplayHub_weatherSettings')) || {};
            this.apiKey = settings.apiKey || '';
            this.location = settings.location || '';
            this.units = settings.units || 'metric';
        } catch (e) {
            console.warn('Failed to load weather settings:', e);
        }
    }

    saveSettings() {
        try {
            const settings = {
                apiKey: this.apiKey,
                location: this.location,
                units: this.units
            };
            localStorage.setItem('smartDisplayHub_weatherSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save weather settings:', e);
        }
    }

    saveWeatherData() {
        try {
            const data = {
                weather: this.weatherData,
                lastUpdate: this.lastUpdate
            };
            localStorage.setItem('smartDisplayHub_weatherData', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save weather data:', e);
        }
    }

    loadWeatherData() {
        try {
            const data = JSON.parse(localStorage.getItem('smartDisplayHub_weatherData'));
            if (data && data.weather && data.lastUpdate) {
                this.weatherData = data.weather;
                this.lastUpdate = data.lastUpdate;
            }
        } catch (e) {
            console.warn('Failed to load weather data:', e);
        }
    }

    destroy() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }
    }
}

// Make available globally
window.WeatherTile = WeatherTile;