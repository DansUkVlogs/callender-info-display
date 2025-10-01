// Smart Display Hub - Main Application
class SmartDisplayHub {
    constructor() {
        this.isEditMode = false;
        this.settings = this.loadSettings();
        this.layouts = this.loadLayouts();
        this.currentLayout = 'default';
        
        this.init();
    }

    init() {
        try {
            console.log('Initializing Smart Display Hub...');
            this.setupEventListeners();
            this.initializeTheme();
            this.startUpdateCycle();
            
            // Initialize all tiles with error handling
            console.log('Loading tiles...');
            if (window.CalendarTile) {
                new CalendarTile();
                console.log('Calendar tile loaded');
            } else {
                console.warn('CalendarTile class not found');
            }
            
            if (window.TodoTile) {
                new TodoTile();
                console.log('Todo tile loaded');
            } else {
                console.warn('TodoTile class not found');
            }
            
            if (window.WeatherTile) {
                new WeatherTile();
                console.log('Weather tile loaded');
            } else {
                console.warn('WeatherTile class not found');
            }
            
            if (window.TimeTile) {
                new TimeTile();
                console.log('Time tile loaded');
            } else {
                console.warn('TimeTile class not found');
            }
            
            if (window.CountdownTile) {
                new CountdownTile();
                console.log('Countdown tile loaded');
            } else {
                console.warn('CountdownTile class not found');
            }
            
            if (window.TimerTile) {
                new TimerTile();
                console.log('Timer tile loaded');
            } else {
                console.warn('TimerTile class not found');
            }
            
            if (window.TrafficTile) {
                new TrafficTile();
                console.log('Traffic tile loaded');
            } else {
                console.warn('TrafficTile class not found');
            }
            
            if (window.BirthdayTile) {
                new BirthdayTile();
                console.log('Birthday tile loaded');
            } else {
                console.warn('BirthdayTile class not found');
            }
            
            console.log('Smart Display Hub initialized successfully');
        } catch (error) {
            console.error('Error initializing Smart Display Hub:', error);
        }
    }

    setupEventListeners() {
        try {
            console.log('Setting up event listeners...');
            
            // Header controls
            const editModeBtn = document.getElementById('editModeBtn');
            if (editModeBtn) {
                editModeBtn.addEventListener('click', () => {
                    console.log('Edit mode button clicked');
                    this.toggleEditMode();
                });
                console.log('Edit mode button listener added');
            } else {
                console.warn('Edit mode button not found');
            }

            const settingsBtn = document.getElementById('settingsBtn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    console.log('Settings button clicked');
                    this.openSettings();
                });
                console.log('Settings button listener added');
            } else {
                console.warn('Settings button not found');
            }

            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    console.log('Theme toggle clicked');
                    this.cycleTheme();
                });
                console.log('Theme toggle listener added');
            } else {
                console.warn('Theme toggle button not found');
            }

            // Settings modal
            const closeSettings = document.getElementById('closeSettings');
            if (closeSettings) {
                closeSettings.addEventListener('click', () => {
                    this.closeSettings();
                });
                console.log('Close settings listener added');
            }

            // Click outside modal to close
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) {
                settingsModal.addEventListener('click', (e) => {
                    if (e.target.id === 'settingsModal') {
                        this.closeSettings();
                    }
                });
                console.log('Modal click outside listener added');
            }

            // Edit mode controls
            const exitEditMode = document.getElementById('exitEditMode');
            if (exitEditMode) {
                exitEditMode.addEventListener('click', () => {
                    this.toggleEditMode();
                });
                console.log('Exit edit mode listener added');
            }

            const addTile = document.getElementById('addTile');
            if (addTile) {
                addTile.addEventListener('click', () => {
                    this.showAddTileDialog();
                });
                console.log('Add tile listener added');
            }

            const resetLayout = document.getElementById('resetLayout');
            if (resetLayout) {
                resetLayout.addEventListener('click', () => {
                    this.resetLayout();
                });
                console.log('Reset layout listener added');
            }

            // Settings form handlers
            const themeRadios = document.querySelectorAll('input[name="theme"]');
            themeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.setTheme(e.target.value);
                });
            });
            console.log('Theme radio listeners added:', themeRadios.length);

            const layoutProfile = document.getElementById('layoutProfile');
            if (layoutProfile) {
                layoutProfile.addEventListener('change', (e) => {
                    this.loadLayout(e.target.value);
                });
                console.log('Layout profile listener added');
            }

            const saveLayout = document.getElementById('saveLayout');
            if (saveLayout) {
                saveLayout.addEventListener('click', () => {
                    this.saveCurrentLayout();
                });
                console.log('Save layout listener added');
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                this.handleKeyboardShortcuts(e);
            });
            console.log('Keyboard shortcuts listener added');

            // Touch and click handlers for tiles
            this.setupTileInteractions();

            // Orientation change
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.handleOrientationChange();
                }, 100);
            });

            // Visibility change (for power management)
            document.addEventListener('visibilitychange', () => {
                this.handleVisibilityChange();
            });
            
            console.log('All event listeners set up successfully');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    setupTileInteractions() {
        const tiles = document.querySelectorAll('.tile');
        
        tiles.forEach(tile => {
            // Expand on double tap/click
            let tapCount = 0;
            let tapTimer;
            
            tile.addEventListener('click', () => {
                tapCount++;
                
                if (tapCount === 1) {
                    tapTimer = setTimeout(() => {
                        tapCount = 0;
                        // Single tap action
                        this.handleTileSingleTap(tile);
                    }, 300);
                } else if (tapCount === 2) {
                    clearTimeout(tapTimer);
                    tapCount = 0;
                    // Double tap action
                    this.handleTileDoubleTap(tile);
                }
            });

            // Long press for context menu (edit mode)
            let longPressTimer;
            
            tile.addEventListener('touchstart', (e) => {
                longPressTimer = setTimeout(() => {
                    if (!this.isEditMode) {
                        this.enterEditModeForTile(tile);
                    }
                }, 800);
            });

            tile.addEventListener('touchend', () => {
                clearTimeout(longPressTimer);
            });

            tile.addEventListener('touchmove', () => {
                clearTimeout(longPressTimer);
            });
        });
    }

    handleTileSingleTap(tile) {
        if (this.isEditMode) {
            this.selectTileForEdit(tile);
        } else {
            const tileType = tile.dataset.tileType;
            this.focusTile(tile, tileType);
        }
    }

    handleTileDoubleTap(tile) {
        if (!this.isEditMode) {
            this.expandTile(tile);
        }
    }

    focusTile(tile, tileType) {
        // Add visual focus indicator
        document.querySelectorAll('.tile').forEach(t => t.classList.remove('focused'));
        tile.classList.add('focused');
        
        // Tile-specific focus actions
        switch (tileType) {
            case 'calendar':
                // Show today's events
                break;
            case 'todo':
                // Focus on add task input
                break;
            case 'timer':
                // Show timer controls
                break;
        }
    }

    expandTile(tile) {
        // Create expanded view modal
        const modal = document.createElement('div');
        modal.className = 'tile-modal';
        modal.innerHTML = `
            <div class="tile-modal-content">
                <div class="tile-modal-header">
                    <h2>${tile.querySelector('h3').textContent}</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="tile-modal-body">
                    ${tile.querySelector('.tile-content').innerHTML}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal handlers
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        
        const overlay = document.getElementById('editModeOverlay');
        const tiles = document.querySelectorAll('.tile');
        
        if (this.isEditMode) {
            overlay.classList.remove('hidden');
            tiles.forEach(tile => {
                tile.classList.add('edit-mode');
                this.makeTileDraggable(tile);
            });
        } else {
            overlay.classList.add('hidden');
            tiles.forEach(tile => {
                tile.classList.remove('edit-mode', 'selected');
                this.makeTileNonDraggable(tile);
            });
            this.saveLayout();
        }
    }

    makeTileDraggable(tile) {
        tile.draggable = true;
        
        tile.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', tile.id);
            tile.classList.add('dragging');
        });
        
        tile.addEventListener('dragend', () => {
            tile.classList.remove('dragging');
        });
        
        tile.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        tile.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggedElement = document.getElementById(draggedId);
            
            if (draggedElement !== tile) {
                this.swapTiles(draggedElement, tile);
            }
        });
    }

    makeTileNonDraggable(tile) {
        tile.draggable = false;
        // Remove event listeners (would need to track them to remove properly)
    }

    swapTiles(tile1, tile2) {
        const dashboard = document.getElementById('dashboard');
        const tile1Next = tile1.nextElementSibling;
        const tile1Parent = tile1.parentNode;
        const tile2Next = tile2.nextElementSibling;
        const tile2Parent = tile2.parentNode;
        
        if (tile1Next === tile2) {
            tile1Parent.insertBefore(tile2, tile1);
        } else if (tile2Next === tile1) {
            tile2Parent.insertBefore(tile1, tile2);
        } else {
            tile1Parent.insertBefore(tile2, tile1Next);
            tile2Parent.insertBefore(tile1, tile2Next);
        }
    }

    cycleTheme() {
        const themes = ['auto', 'light', 'dark', 'night'];
        const currentTheme = this.settings.theme || 'auto';
        const currentIndex = themes.indexOf(currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        
        this.setTheme(nextTheme);
    }

    setTheme(theme) {
        this.settings.theme = theme;
        this.applyTheme(theme);
        this.saveSettings();
        
        // Update radio buttons
        document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
    }

    applyTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'auto') {
            html.removeAttribute('data-theme');
        } else {
            html.setAttribute('data-theme', theme);
        }
    }

    initializeTheme() {
        const savedTheme = this.settings.theme || 'auto';
        this.applyTheme(savedTheme);
        
        // Set radio button
        document.querySelector(`input[name="theme"][value="${savedTheme}"]`).checked = true;
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Populate current settings
        document.getElementById('weatherApiKey').value = this.settings.weatherApiKey || '';
        document.getElementById('location').value = this.settings.location || '';
        document.getElementById('trafficApiKey').value = this.settings.trafficApiKey || '';
        document.getElementById('layoutProfile').value = this.currentLayout;
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Save settings
        this.settings.weatherApiKey = document.getElementById('weatherApiKey').value;
        this.settings.location = document.getElementById('location').value;
        this.settings.trafficApiKey = document.getElementById('trafficApiKey').value;
        
        this.saveSettings();
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + E: Toggle edit mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.toggleEditMode();
        }
        
        // Ctrl/Cmd + S: Open settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            this.openSettings();
        }
        
        // Ctrl/Cmd + T: Cycle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            this.cycleTheme();
        }
        
        // Escape: Exit edit mode or close modals
        if (e.key === 'Escape') {
            if (this.isEditMode) {
                this.toggleEditMode();
            } else {
                this.closeSettings();
            }
        }
    }

    handleOrientationChange() {
        // Adjust layout for orientation
        const dashboard = document.getElementById('dashboard');
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            dashboard.classList.add('landscape');
        } else {
            dashboard.classList.remove('landscape');
        }
        
        // Trigger resize on tiles
        window.dispatchEvent(new Event('resize'));
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Reduce update frequency when not visible
            this.pauseUpdates();
        } else {
            // Resume normal updates
            this.resumeUpdates();
        }
    }

    startUpdateCycle() {
        // Update every minute
        this.updateInterval = setInterval(() => {
            this.updateAllTiles();
        }, 60000);
        
        // Initial update
        this.updateAllTiles();
    }

    pauseUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    resumeUpdates() {
        this.startUpdateCycle();
    }

    updateAllTiles() {
        // Trigger update event for all tiles
        window.dispatchEvent(new CustomEvent('tileUpdate'));
    }

    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem('smartDisplayHub_settings')) || {};
        } catch (e) {
            console.warn('Failed to load settings:', e);
            return {};
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('smartDisplayHub_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    loadLayouts() {
        try {
            return JSON.parse(localStorage.getItem('smartDisplayHub_layouts')) || {
                default: null,
                workday: null,
                weekend: null,
                night: null
            };
        } catch (e) {
            console.warn('Failed to load layouts:', e);
            return {};
        }
    }

    saveLayout() {
        try {
            const dashboard = document.getElementById('dashboard');
            const tiles = Array.from(dashboard.children).map(tile => ({
                id: tile.id,
                type: tile.dataset.tileType,
                class: tile.className,
                hidden: tile.style.display === 'none'
            }));
            
            this.layouts[this.currentLayout] = tiles;
            localStorage.setItem('smartDisplayHub_layouts', JSON.stringify(this.layouts));
        } catch (e) {
            console.warn('Failed to save layout:', e);
        }
    }

    loadLayout(layoutName) {
        const layout = this.layouts[layoutName];
        if (!layout) return;
        
        const dashboard = document.getElementById('dashboard');
        this.currentLayout = layoutName;
        
        // Reorder tiles based on saved layout
        layout.forEach((tileData, index) => {
            const tile = document.getElementById(tileData.id);
            if (tile) {
                dashboard.appendChild(tile);
                tile.style.display = tileData.hidden ? 'none' : '';
            }
        });
    }

    saveCurrentLayout() {
        const profileSelect = document.getElementById('layoutProfile');
        const profileName = prompt('Enter layout name:', profileSelect.value);
        
        if (profileName) {
            this.currentLayout = profileName;
            this.saveLayout();
            
            // Add to select options if new
            if (!document.querySelector(`option[value="${profileName}"]`)) {
                const option = document.createElement('option');
                option.value = profileName;
                option.textContent = profileName.charAt(0).toUpperCase() + profileName.slice(1);
                profileSelect.appendChild(option);
            }
            
            profileSelect.value = profileName;
        }
    }

    resetLayout() {
        if (confirm('Reset current layout to default?')) {
            delete this.layouts[this.currentLayout];
            localStorage.setItem('smartDisplayHub_layouts', JSON.stringify(this.layouts));
            location.reload();
        }
    }

    showAddTileDialog() {
        // This would show a dialog to add new tile types
        // For now, just show an alert
        alert('Add Tile feature coming soon! You can customize existing tiles for now.');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Smart Display Hub...');
    
    // Test if all required elements exist
    const requiredElements = [
        'editModeBtn', 'settingsBtn', 'themeToggle', 'settingsModal',
        'closeSettings', 'exitEditMode', 'addTile', 'resetLayout'
    ];
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✓ Element found: ${id}`);
        } else {
            console.error(`✗ Element missing: ${id}`);
        }
    });
    
    window.smartDisplayHub = new SmartDisplayHub();
});

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => {
        console.log('Service Worker registered');
    }).catch(err => {
        console.warn('Service Worker registration failed:', err);
    });
}