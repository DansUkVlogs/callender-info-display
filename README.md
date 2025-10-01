# Smart Display Hub

A customizable smart display dashboard designed for touchscreen laptops that acts as a dynamic information center. Perfect for always-on displays showing calendar events, tasks, weather, traffic, countdowns, and more.

## ✨ Features

### 🗓️ Core Tiles
- **Large Calendar Tile** - Full month view with event integration
- **Todo List Tile** - Task management with priorities and due dates  
- **Weather Tile** - Current conditions and forecast (OpenWeatherMap API)
- **Time & Date Tile** - Multiple formats and timezone support
- **Countdown Tiles** - Next event countdown and custom countdowns
- **Timer Tile** - Pomodoro timer, custom timers with notifications
- **Traffic Tile** - Commute times with live traffic data (Google Maps API)
- **Birthday Tile** - Track birthdays with celebration animations

### 🎨 Customization
- **Tile-based Interface** - Drag & drop tile arrangement in edit mode
- **Multiple Layouts** - Save and switch between layout profiles (workday, weekend, night mode)
- **Theme System** - Auto, light, dark, and night modes with smooth transitions
- **Responsive Design** - Adapts to portrait/landscape orientation automatically
- **Touch Optimized** - Large touch targets and gesture support

### 🔧 Smart Features
- **Edit Mode** - Drag to rearrange, resize, hide/show tiles
- **Settings Management** - Centralized configuration for all features
- **PWA Support** - Installable as a desktop/mobile app
- **Offline Support** - Works without internet for cached data
- **Keyboard Shortcuts** - Quick access to common functions
- **Auto Updates** - Intelligent refresh cycles for dynamic content

## 🚀 Quick Start

1. **Clone or download** this repository to your local machine
2. **Open `index.html`** in a modern web browser
3. **Configure your APIs** (optional but recommended):
   - Weather: Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
   - Traffic: Enable Distance Matrix API in [Google Cloud Console](https://console.cloud.google.com/)
4. **Start customizing** your tiles and layout!

## 📱 Installation as PWA

### Desktop (Chrome/Edge):
1. Click the install icon in the address bar, or
2. Menu → Install Smart Display Hub

### Mobile:
1. Open in browser → Menu → "Add to Home Screen"
2. The app will appear as a native app icon

## ⚙️ Configuration

### Weather Setup
1. Sign up for a free account at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your API key from the dashboard
3. In Smart Display Hub: Settings → Enter API key and location
4. Weather tile will automatically update every 10 minutes

### Traffic Setup  
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Distance Matrix API
3. Create an API key with appropriate restrictions
4. In Smart Display Hub: Traffic tile → Setup → Add your routes

### Calendar Integration
Currently supports local events. External calendar sync (Google Calendar, Outlook) coming in future updates.

### Todo Integration  
Currently supports local tasks. External service sync (Todoist, Microsoft To Do) coming in future updates.

## 🎮 Usage Guide

### Basic Navigation
- **Single tap/click** - Focus tile or perform primary action
- **Double tap/click** - Expand tile to full view
- **Long press** - Enter edit mode for that tile (or use Edit button)

### Edit Mode
- **Toggle Edit Mode** - Click edit button in header or press `Ctrl+E`
- **Drag tiles** to rearrange layout
- **Click tiles** to select/configure
- **Exit Edit Mode** - Click exit button or press `Escape`

### Keyboard Shortcuts
- `Ctrl/Cmd + E` - Toggle edit mode
- `Ctrl/Cmd + ,` - Open settings  
- `Ctrl/Cmd + T` - Cycle theme
- `Escape` - Exit edit mode or close modals

### Layout Management
1. Arrange tiles in your preferred layout
2. Enter edit mode and click "Save Layout"
3. Name your layout (e.g., "Morning", "Work", "Evening")
4. Switch between layouts using the dropdown in settings

## 🔧 Customization Options

### Themes
- **Auto** - Follows system preference
- **Light** - Clean, bright interface  
- **Dark** - Easy on the eyes
- **Night** - Ultra-low brightness for nighttime

### Tile Sizes
- **Large** - Calendar (2x2 grid spaces)
- **Medium-Large** - Todo list (2x1 grid spaces)  
- **Medium** - Weather, Time (1x1 grid spaces)
- **Small** - Countdowns, Timer (1x1 grid spaces)

### Layout Profiles
Create different arrangements for:
- **Workday** - Focus on calendar and tasks
- **Weekend** - Emphasize weather and personal countdowns
- **Night Mode** - Minimal, essential tiles only

## 📂 File Structure

```
smart-display-hub/
├── index.html                 # Main application file
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker for offline support
├── styles/
│   ├── main.css             # Core styles and layout
│   ├── tiles.css            # Tile-specific styling  
│   └── themes.css           # Theme system and variables
├── js/
│   ├── app.js               # Main application logic
│   ├── layout.js            # Layout management system
│   ├── settings.js          # Settings and configuration
│   ├── themes.js            # Theme switching logic
│   └── tiles/               # Individual tile implementations
│       ├── calendar.js      # Calendar functionality
│       ├── todo.js          # Task management
│       ├── weather.js       # Weather integration  
│       ├── time.js          # Time and date display
│       ├── countdown.js     # Countdown timers
│       ├── timer.js         # Timer functionality
│       ├── traffic.js       # Traffic information
│       └── birthday.js      # Birthday tracking
└── .github/
    └── copilot-instructions.md
```

## 🌐 API Requirements

### Weather (Optional)
- **Service**: OpenWeatherMap
- **Cost**: Free tier available (60 calls/minute)
- **Setup**: Sign up → Get API key → Enter in settings

### Traffic (Optional)  
- **Service**: Google Maps Distance Matrix API
- **Cost**: Free tier available (limited calls)
- **Setup**: Google Cloud Console → Enable API → Create key → Configure routes

## 💡 Tips for Optimal Experience

### For Touchscreen Laptops
- Use in landscape orientation for best layout
- Enable "Keep screen on" in power settings
- Consider adjusting screen brightness for always-on use
- Use night mode during evening hours

### Performance
- Weather updates every 10 minutes to conserve API calls
- Traffic updates every 5 minutes during active hours
- Calendar and tasks update in real-time
- Offline mode preserves last known data

### Accessibility
- High contrast mode supported
- Large touch targets (minimum 44px)
- Keyboard navigation available
- Screen reader compatible

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core tile functionality
- ✅ Layout management  
- ✅ Theme system
- ✅ PWA support

### Phase 2 (Planned)
- 📅 External calendar sync (Google, Outlook)
- ✅ External todo sync (Todoist, Microsoft To Do)  
- 🔔 Advanced notifications
- 📱 Phone companion app

### Phase 3 (Future)
- 🎵 Music/podcast control tile
- 📰 News/RSS feed tile
- 🏠 Smart home device integration
- 📊 Analytics and insights

## 🐛 Troubleshooting

### Weather Not Loading
1. Check API key is entered correctly
2. Verify location format (e.g., "London, UK" or "New York, NY")
3. Ensure internet connection
4. Check browser console for error messages

### Traffic Not Working
1. Confirm Google Maps API key has Distance Matrix API enabled
2. Check route addresses are valid
3. Verify API key restrictions allow your domain
4. Monitor API quota in Google Cloud Console

### Layout Not Saving
1. Ensure browser allows localStorage
2. Check available storage space
3. Try refreshing the page
4. Clear browser cache and reconfigure

### Touch Issues
1. Ensure browser supports touch events
2. Check if browser zoom is at 100%
3. Try using Chrome/Edge for best compatibility
4. Disable browser extensions that might interfere

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to:
- Report bugs or suggest features in the Issues section
- Submit pull requests for improvements
- Share your custom tile implementations
- Contribute to documentation

## 🆘 Support

For support, please:
1. Check this README for common solutions
2. Search existing GitHub Issues
3. Create a new Issue with detailed information
4. Include browser version, OS, and error messages

---

**Made with ❤️ for the smart display community**

Transform your old laptop into a powerful information dashboard! 🚀