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
            
            // Load saved layout first
            this.loadSavedLayout();
            
            // Load startup layout
            this.loadStartupLayout();
            
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
                window.timerTileInstance = new TimerTile();
                console.log('Timer tile loaded');
            } else {
                console.warn('TimerTile class not found');
            }
            
            if (window.TrafficTile) {
                window.trafficTileInstance = new TrafficTile();
                console.log('Traffic tile loaded and saved to window.trafficTileInstance');
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
            const layoutEditorBtn = document.getElementById('layoutEditorBtn');
            if (layoutEditorBtn) {
                layoutEditorBtn.addEventListener('click', () => {
                    console.log('Layout editor button clicked');
                    this.openLayoutEditor();
                });
                console.log('Layout editor button listener added');
            } else {
                console.warn('Layout editor button not found');
            }

            const configManagerBtn = document.getElementById('configManagerBtn');
            if (configManagerBtn) {
                configManagerBtn.addEventListener('click', () => {
                    console.log('Config manager button clicked');
                    this.openConfigManager();
                });
                console.log('Config manager button listener added');
            } else {
                console.warn('Config manager button not found');
            }

            const settingsBtn = document.getElementById('settingsBtn');
            console.log('Settings button element:', settingsBtn);
            if (settingsBtn) {
                settingsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Settings button clicked - attempting to open modal');
                    console.log('this context:', this);
                    
                    // Try direct modal manipulation as fallback
                    try {
                        this.openSettings();
                    } catch (error) {
                        console.error('Error calling this.openSettings():', error);
                        // Fallback: directly show modal
                        const modal = document.getElementById('settingsModal');
                        if (modal) {
                            modal.classList.remove('hidden');
                            modal.style.display = 'flex';
                            modal.classList.add('show');
                            console.log('Modal opened via fallback method');
                        }
                    }
                });
                console.log('Settings button listener added successfully');
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

            // Layout editor modal event listeners will be set up when modal opens

            // Settings form handlers - Modern elevated theme selector
            const themeButtons = document.querySelectorAll('.theme-btn');
            
            themeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const selectedTheme = button.getAttribute('data-theme');
                    
                    // Update active state with smooth animation
                    themeButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Apply theme
                    this.setTheme(selectedTheme);
                });
            });
            console.log('Theme button listeners added:', themeButtons.length);

            // Startup Layout handlers
            const startupLayout = document.getElementById('startupLayout');
            const saveStartupLayout = document.getElementById('saveStartupLayout');

            if (startupLayout && saveStartupLayout) {
                saveStartupLayout.addEventListener('click', () => {
                    const selectedLayout = startupLayout.value;
                    this.setStartupLayout(selectedLayout);
                });
            }

            console.log('Startup layout listeners added');

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

    // Layout Editor Functions
    openLayoutEditor() {
        console.log('Opening Layout Editor');
        const modal = document.getElementById('layoutEditorModal');
        modal.classList.remove('hidden');
        
        this.initializeLayoutEditor();
        this.setupLayoutEditorEventListeners();
    }

    closeLayoutEditor() {
        const modal = document.getElementById('layoutEditorModal');
        modal.classList.add('hidden');
        
        this.resetLayoutEditor();
    }

    initializeLayoutEditor() {
        // Reset editor state
        this.selectedTileType = null;
        this.selectedGridArea = null;
        
        // Start with blank layout
        this.editorLayout = [];
        
        // Generate grid squares
        this.generateGridSquares();
        
        // Generate available tiles
        this.generateAvailableTiles();
        
        // Update info displays
        this.updateGridInfo();
        this.updateTileInfo();
        
        // Update button states
        this.updateActionButtons();
    }

    loadCurrentDashboardLayout() {
        const dashboard = document.getElementById('dashboard');
        const tiles = dashboard.querySelectorAll('.tile[data-tile-type]:not(.add-tile-btn)');
        
        this.editorLayout = [];
        
        tiles.forEach(tile => {
            if (tile.style.display === 'none') return; // Skip hidden tiles
            
            const tileType = tile.dataset.tileType;
            if (!tileType) return;
            
            // Extract grid position from style
            const gridColumn = tile.style.gridColumn || '';
            const gridRow = tile.style.gridRow || '';
            
            let col = 0, row = 0, width = 1, height = 1;
            
            // Parse grid-column (format: "2 / span 1" or just "2")
            if (gridColumn) {
                const colMatch = gridColumn.match(/(\d+)(?:\s*\/\s*span\s*(\d+))?/);
                if (colMatch) {
                    col = parseInt(colMatch[1]) - 1; // Convert to 0-based
                    width = parseInt(colMatch[2]) || 1;
                }
            }
            
            // Parse grid-row (format: "1 / span 2" or just "1")
            if (gridRow) {
                const rowMatch = gridRow.match(/(\d+)(?:\s*\/\s*span\s*(\d+))?/);
                if (rowMatch) {
                    row = parseInt(rowMatch[1]) - 1; // Convert to 0-based
                    height = parseInt(rowMatch[2]) || 1;
                }
            }
            
            // Fallback: check CSS classes for size
            if (tile.classList.contains('tile-large')) {
                width = 2; height = 2;
            } else if (tile.classList.contains('tile-medium-large')) {
                width = 2; height = 1;
            }
            
            this.editorLayout.push({
                type: tileType,
                col: col,
                row: row,
                width: width,
                height: height
            });
        });
        
        console.log('Loaded current dashboard layout:', this.editorLayout);
    }

    resetLayoutEditor() {
        this.selectedTileType = null;
        this.selectedGridArea = null;
        this.editorLayout = [];
    }

    openConfigManager() {
        console.log('Opening Configuration Manager');
        const modal = document.getElementById('configManagerModal');
        modal.classList.remove('hidden');
        
        this.loadSavedConfigurations();
    }

    closeConfigManager() {
        const modal = document.getElementById('configManagerModal');
        modal.classList.add('hidden');
    }

    // Layout Editor Core Functions
    generateGridSquares() {
        const layoutGrid = document.getElementById('layoutGrid');
        layoutGrid.innerHTML = '';
        
        // Create occupancy grid
        const occupied = Array(3).fill().map(() => Array(5).fill(false));
        
        // Mark occupied squares based on current layout
        this.editorLayout.forEach(tile => {
            for (let r = tile.row; r < tile.row + tile.height; r++) {
                for (let c = tile.col; c < tile.col + tile.width; c++) {
                    if (r >= 0 && r < 3 && c >= 0 && c < 5) {
                        occupied[r][c] = tile;
                    }
                }
            }
        });
        
        // Generate 5x3 = 15 grid squares
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 5; col++) {
                const square = document.createElement('div');
                square.className = 'grid-square';
                square.dataset.row = row;
                square.dataset.col = col;
                square.dataset.index = row * 5 + col;
                
                if (occupied[row][col]) {
                    square.classList.add('occupied');
                    const tile = occupied[row][col];
                    square.textContent = tile.type;
                    square.title = `${tile.type} (${tile.width}×${tile.height})`;
                } else {
                    square.textContent = `${col + 1},${row + 1}`;
                }
                
                square.addEventListener('click', () => this.selectGridArea(col, row));
                
                layoutGrid.appendChild(square);
            }
        }
    }

    generateAvailableTiles() {
        const availableTiles = document.getElementById('availableTiles');
        availableTiles.innerHTML = '';
        
        const tileTypes = [
            {
                type: 'calendar',
                name: 'Calendar',
                icon: '📅',
                size: { width: 2, height: 2 },
                description: 'View and manage your events'
            },
            {
                type: 'todo',
                name: 'Tasks',
                icon: '✅',
                size: { width: 2, height: 1 },
                description: 'Manage your to-do list'
            },
            {
                type: 'weather',
                name: 'Weather',
                icon: '🌤️',
                size: { width: 1, height: 1 },
                description: 'Current weather conditions'
            },
            {
                type: 'time',
                name: 'Time & Date',
                icon: '🕐',
                size: { width: 1, height: 1 },
                description: 'Current time and date'
            },
            {
                type: 'custom-countdown',
                name: 'Countdown',
                icon: '⏰',
                size: { width: 1, height: 1 },
                description: 'Countdown to events'
            },
            {
                type: 'timer',
                name: 'Timer',
                icon: '⏲️',
                size: { width: 1, height: 1 },
                description: 'Set timers and alarms'
            },
            {
                type: 'traffic',
                name: 'Traffic',
                icon: '🚗',
                size: { width: 1, height: 1 },
                description: 'Traffic conditions'
            },
            {
                type: 'birthday',
                name: 'Birthdays',
                icon: '🎂',
                size: { width: 1, height: 1 },
                description: 'Upcoming birthdays'
            }
        ];
        
        tileTypes.forEach(tile => {
            const option = document.createElement('div');
            option.className = 'tile-option';
            option.dataset.tileType = tile.type;
            
            // Check if this tile is currently in the editor layout
            const isInLayout = this.editorLayout.some(t => t.type === tile.type);
            
            option.innerHTML = `
                <div class="tile-option-icon">${tile.icon}</div>
                <div class="tile-option-info">
                    <div class="tile-option-name">${tile.name} ${isInLayout ? '(in layout)' : ''}</div>
                    <div class="tile-option-size">${tile.size.width} × ${tile.size.height}</div>
                    <div class="tile-option-description">${tile.description}</div>
                </div>
            `;
            
            if (isInLayout) {
                option.style.opacity = '0.6';
                option.style.backgroundColor = 'var(--bg-accent)';
            } else {
                option.style.opacity = '1';
                option.style.backgroundColor = '';
            }
            
            option.addEventListener('click', () => this.selectTileType(tile));
            
            availableTiles.appendChild(option);
        });
    }

    selectGridArea(col, row) {
        // Clear previous selection
        document.querySelectorAll('.grid-square').forEach(square => {
            square.classList.remove('selected', 'preview-area');
        });
        
        this.selectedGridArea = { col, row };
        
        // Highlight selected square
        const square = document.querySelector(`[data-col="${col}"][data-row="${row}"]`);
        square.classList.add('selected');
        
        // If a tile is selected, show preview area
        if (this.selectedTileType) {
            this.showTilePreview(col, row, this.selectedTileType.size);
        }
        
        this.updateGridInfo();
        this.updateActionButtons();
    }

    selectTileType(tileData) {
        // Clear previous tile selection
        document.querySelectorAll('.tile-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Select new tile
        const option = document.querySelector(`[data-tile-type="${tileData.type}"]`);
        option.classList.add('selected');
        
        this.selectedTileType = tileData;
        
        // If grid area is selected, show preview
        if (this.selectedGridArea) {
            this.showTilePreview(this.selectedGridArea.col, this.selectedGridArea.row, tileData.size);
        }
        
        this.updateTileInfo();
        this.updateActionButtons();
    }

    showTilePreview(startCol, startRow, size) {
        // Clear existing preview
        document.querySelectorAll('.grid-square').forEach(square => {
            square.classList.remove('preview-area');
        });
        
        // Show preview area for the tile size
        for (let r = startRow; r < startRow + size.height; r++) {
            for (let c = startCol; c < startCol + size.width; c++) {
                const square = document.querySelector(`[data-col="${c}"][data-row="${r}"]`);
                if (square) {
                    square.classList.add('preview-area');
                }
            }
        }
    }

    updateGridInfo() {
        const info = document.getElementById('selectedGridInfo');
        if (this.selectedGridArea) {
            const { col, row } = this.selectedGridArea;
            info.textContent = `Selected: Column ${col + 1}, Row ${row + 1}`;
        } else {
            info.textContent = 'Click a grid square to select placement area';
        }
    }

    updateTileInfo() {
        const info = document.getElementById('selectedTileInfo');
        if (this.selectedTileType) {
            const tile = this.selectedTileType;
            info.innerHTML = `
                <strong>${tile.name}</strong> (${tile.size.width}×${tile.size.height})<br>
                ${tile.description}
            `;
        } else {
            info.textContent = 'Select a tile to see details';
        }
    }

    updateActionButtons() {
        const placeBtn = document.getElementById('placeTileBtn');
        const removeBtn = document.getElementById('removeTileBtn');
        
        // Place button: enabled if both tile and grid area selected
        placeBtn.disabled = !(this.selectedTileType && this.selectedGridArea);
        
        // Remove button: enabled if grid area selected and has tile
        removeBtn.disabled = !this.selectedGridArea; // TODO: check if area has tile
    }

    setupLayoutEditorEventListeners() {
        // Close button
        const closeBtn = document.getElementById('closeLayoutEditor');
        closeBtn.addEventListener('click', () => this.closeLayoutEditor());
        
        // Action buttons
        const placeBtn = document.getElementById('placeTileBtn');
        const removeBtn = document.getElementById('removeTileBtn');
        
        placeBtn.addEventListener('click', () => this.placeTile());
        removeBtn.addEventListener('click', () => this.removeTile());
        
        // Footer buttons
        const applyBtn = document.getElementById('applyLayout');
        const cancelBtn = document.getElementById('cancelLayout');
        
        applyBtn.addEventListener('click', () => this.applyLayout());
        cancelBtn.addEventListener('click', () => this.closeLayoutEditor());
        
        // Configuration manager listeners
        this.setupConfigManagerListeners();
    }

    setupConfigManagerListeners() {
        const closeBtn = document.getElementById('closeConfigManager');
        const saveBtn = document.getElementById('saveConfig');
        
        closeBtn.addEventListener('click', () => this.closeConfigManager());
        saveBtn.addEventListener('click', () => this.saveCurrentConfiguration());
    }

    placeTile() {
        if (!this.selectedTileType || !this.selectedGridArea) {
            console.warn('Cannot place tile: missing tile type or grid area');
            return;
        }
        
        const { col, row } = this.selectedGridArea;
        const { size, type, name } = this.selectedTileType;
        
        // Check if this tile type is already in the layout
        const existingTile = this.editorLayout.find(t => t.type === type);
        if (existingTile) {
            this.showInvalidPlacement(`${name} is already in the layout`);
            return;
        }
        
        // Check if tile fits within bounds
        if (col + size.width > 5 || row + size.height > 3) {
            this.showInvalidPlacement('Tile extends beyond grid boundaries');
            return;
        }
        
        // Check for overlapping tiles
        const overlapping = this.checkForOverlap(col, row, size.width, size.height);
        if (overlapping.length > 0) {
            this.showInvalidPlacement('Area is occupied by other tiles');
            return;
        }
        
        // Place the tile
        const tileData = {
            type,
            name,
            col,
            row,
            width: size.width,
            height: size.height
        };
        
        this.editorLayout.push(tileData);
        this.updateGridDisplay();
        this.generateAvailableTiles(); // Refresh available tiles to show updated state
        
        console.log(`Placed ${name} at ${col},${row}`);
        
        // Clear selections
        this.clearSelections();
    }

    removeTile() {
        if (!this.selectedGridArea) {
            console.warn('Cannot remove tile: no grid area selected');
            return;
        }
        
        const { col, row } = this.selectedGridArea;
        
        // Find tile at this position
        const tileIndex = this.editorLayout.findIndex(tile => 
            col >= tile.col && col < tile.col + tile.width &&
            row >= tile.row && row < tile.row + tile.height
        );
        
        if (tileIndex === -1) {
            this.showInvalidPlacement('No tile found at selected position');
            return;
        }
        
        // Remove the tile
        const removedTile = this.editorLayout.splice(tileIndex, 1)[0];
        this.updateGridDisplay();
        this.generateAvailableTiles(); // Refresh available tiles to show updated state
        
        console.log(`Removed ${removedTile.type} from ${removedTile.col},${removedTile.row}`);
        
        // Clear selections
        this.clearSelections();
    }

    checkForOverlap(startCol, startRow, width, height) {
        const overlapping = [];
        
        for (const tile of this.editorLayout) {
            // Check if tiles overlap
            if (!(startCol >= tile.col + tile.width || 
                  startCol + width <= tile.col ||
                  startRow >= tile.row + tile.height ||
                  startRow + height <= tile.row)) {
                overlapping.push(tile);
            }
        }
        
        return overlapping;
    }

    updateGridDisplay() {
        // Reset all grid squares
        document.querySelectorAll('.grid-square').forEach(square => {
            square.classList.remove('occupied', 'preview-area');
            square.textContent = `${parseInt(square.dataset.col) + 1},${parseInt(square.dataset.row) + 1}`;
            square.style.background = '';
        });
        
        // Mark occupied squares
        this.editorLayout.forEach(tile => {
            for (let r = tile.row; r < tile.row + tile.height; r++) {
                for (let c = tile.col; c < tile.col + tile.width; c++) {
                    const square = document.querySelector(`[data-col="${c}"][data-row="${r}"]`);
                    if (square) {
                        square.classList.add('occupied');
                        square.textContent = tile.name;
                        
                        // Color code by tile type
                        const colors = {
                            calendar: '#3498db', todo: '#27ae60', weather: '#f39c12',
                            time: '#9b59b6', 'custom-countdown': '#e74c3c', timer: '#34495e',
                            traffic: '#e67e22', birthday: '#e91e63'
                        };
                        square.style.background = colors[tile.type] || '#95a5a6';
                    }
                }
            }
        });
        
        this.updateActionButtons();
    }

    showInvalidPlacement(message) {
        if (this.selectedGridArea) {
            const { col, row } = this.selectedGridArea;
            const square = document.querySelector(`[data-col="${col}"][data-row="${row}"]`);
            
            // Show invalid state
            square.classList.add('invalid');
            
            // Remove after animation
            setTimeout(() => {
                square.classList.remove('invalid');
            }, 1000);
        }
        
        // Show message in grid info
        const info = document.getElementById('selectedGridInfo');
        const originalText = info.textContent;
        info.textContent = `❌ ${message}`;
        info.style.color = '#e74c3c';
        
        setTimeout(() => {
            info.textContent = originalText;
            info.style.color = '';
        }, 3000);
    }

    clearSelections() {
        // Clear tile selection
        this.selectedTileType = null;
        document.querySelectorAll('.tile-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Clear grid selection
        this.selectedGridArea = null;
        document.querySelectorAll('.grid-square').forEach(square => {
            square.classList.remove('selected', 'preview-area');
        });
        
        this.updateGridInfo();
        this.updateTileInfo();
        this.updateActionButtons();
    }

    applyLayout() {
        console.log('Applying layout:', this.editorLayout);
        
        const dashboard = document.getElementById('dashboard');
        
        // Set dashboard to fixed 5×3 grid
        dashboard.style.gridTemplateColumns = 'repeat(5, 1fr)';
        dashboard.style.gridTemplateRows = 'repeat(3, 1fr)';
        dashboard.style.gridAutoRows = 'unset';
        dashboard.classList.add('fixed-grid');
        
        // Hide tiles that aren't in the new layout
        const allTiles = dashboard.querySelectorAll('.tile');
        allTiles.forEach(tile => {
            const tileType = tile.dataset.tileType;
            const layoutTile = this.editorLayout.find(t => t.type === tileType);
            
            if (layoutTile) {
                // Move existing tile to new position
                tile.style.display = 'block';
                tile.style.gridColumn = `${layoutTile.col + 1} / span ${layoutTile.width}`;
                tile.style.gridRow = `${layoutTile.row + 1} / span ${layoutTile.height}`;
                
                // Update size classes if needed
                tile.classList.remove('tile-large', 'tile-medium-large', 'tile-medium');
                if (layoutTile.width === 2 && layoutTile.height === 2) {
                    tile.classList.add('tile-large');
                } else if (layoutTile.width === 2 && layoutTile.height === 1) {
                    tile.classList.add('tile-medium-large');
                } else {
                    tile.classList.add('tile-medium');
                }
            } else {
                // Hide tiles not in layout
                tile.style.display = 'none';
            }
        });
        
        // Close editor
        this.closeLayoutEditor();
        
        // Save the layout
        this.saveLayout();
        
        console.log('Layout applied successfully - tiles moved to new positions');
    }

    createTileFromData(tileData) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.tileType = tileData.type;
        
        // Set size class
        if (tileData.width === 2 && tileData.height === 2) {
            tile.classList.add('tile-large');
        } else if (tileData.width === 2 && tileData.height === 1) {
            tile.classList.add('tile-medium-large');
        } else if (tileData.width === 1 && tileData.height === 1) {
            tile.classList.add('tile-medium');
        }
        
        // Set grid position and span
        tile.style.gridColumn = `${tileData.col + 1} / span ${tileData.width}`;
        tile.style.gridRow = `${tileData.row + 1} / span ${tileData.height}`;
        
        // Set content based on tile type using full templates
        tile.innerHTML = this.getFullTileHTML(tileData.type);
        
        // Initialize tile functionality
        setTimeout(() => {
            this.initializeTile(tileData.type, tile);
        }, 100);
        
        return tile;
    }

    getTileHTML(tileType) {
        const templates = {
            calendar: `
                <div class="tile-header">
                    <h3>Calendar</h3>
                </div>
                <div class="calendar-content">
                    <div class="calendar-nav">
                        <button class="nav-btn">&lt;</button>
                        <span class="month-year">October 2025</span>
                        <button class="nav-btn">&gt;</button>
                    </div>
                    <div class="calendar-grid">
                        <!-- Calendar will be populated -->
                    </div>
                </div>
            `,
            todo: `
                <div class="tile-header">
                    <h3>Tasks</h3>
                </div>
                <div class="todo-content">
                    <div class="todo-header">Ready to get organized?</div>
                    <div class="todo-list"></div>
                    <button class="add-first-task">✨ Create your first task</button>
                </div>
            `,
            weather: `
                <div class="tile-header">
                    <h3>Weather</h3>
                </div>
                <div class="weather-content">
                    <div class="weather-main">
                        <div class="weather-temp">12°C</div>
                        <div class="weather-condition">Overcast clouds</div>
                    </div>
                    <div class="weather-details">
                        <div>Feels like 11°C</div>
                        <div>Humidity 58%</div>
                    </div>
                </div>
            `,
            time: `
                <div class="tile-header">
                    <h3>Time & Date</h3>
                </div>
                <div class="time-content">
                    <div class="time-display">10:01 PM</div>
                    <div class="date-display">Wednesday, October 1, 2025</div>
                </div>
            `,
            'custom-countdown': `
                <div class="tile-header">
                    <h3>Countdown</h3>
                </div>
                <div class="countdown-content">
                    <div class="countdown-event">Christmas 2025</div>
                    <div class="countdown-time">84d 1h</div>
                    <button class="add-countdown-btn">Add Countdown</button>
                </div>
            `,
            timer: `
                <div class="tile-header">
                    <h3>Timer</h3>
                </div>
                <div class="timer-content">
                    <div class="timer-display">00:00</div>
                    <div class="timer-presets">
                        <button class="preset-btn">Pomodoro</button>
                        <button class="preset-btn">Short Break</button>
                        <button class="preset-btn">Long Break</button>
                    </div>
                </div>
            `,
            traffic: `
                <div class="tile-header">
                    <h3>Traffic</h3>
                </div>
                <div class="traffic-content">
                    <div class="traffic-route">Add Route</div>
                    <div class="traffic-time">-- min</div>
                    <div class="traffic-status">Configure your route</div>
                </div>
            `,
            birthday: `
                <div class="tile-header">
                    <h3>Birthdays</h3>
                </div>
                <div class="birthday-content">
                    <div class="no-birthdays">
                        <div>No birthdays added</div>
                        <button class="add-birthday-btn">Add birthdays</button>
                    </div>
                </div>
            `
        };
        
        return templates[tileType] || '<div class="tile-header"><h3>Unknown Tile</h3></div>';
    }

    getFullTileHTML(tileType) {
        const templates = {
            calendar: `
                <div class="tile-header">
                    <h3>Calendar</h3>
                    <button class="tile-settings" title="Calendar Settings">⚙️</button>
                </div>
                <div class="calendar-content">
                    <div class="calendar-nav">
                        <button class="nav-btn" id="prevMonth">&lt;</button>
                        <span class="month-year">October 2025</span>
                        <button class="nav-btn" id="nextMonth">&gt;</button>
                    </div>
                    <div class="calendar-grid">
                        <!-- Calendar will be populated by CalendarTile -->
                    </div>
                </div>
            `,
            todo: `
                <div class="tile-header">
                    <h3>Tasks</h3>
                    <button class="tile-settings" title="Task Settings">⚙️</button>
                </div>
                <div class="todo-content">
                    <div class="todo-header">Ready to get organized?</div>
                    <div class="todo-list"></div>
                    <button class="add-first-task">✨ Create your first task</button>
                </div>
            `,
            weather: `
                <div class="tile-header">
                    <h3>Weather</h3>
                    <button class="tile-settings" title="Weather Settings">⚙️</button>
                </div>
                <div class="weather-content">
                    <div class="weather-main">
                        <div class="weather-temp">--°</div>
                        <div class="weather-condition">Loading weather...</div>
                    </div>
                    <div class="weather-details">
                        <div>Feels like --°</div>
                        <div>Humidity --%</div>
                    </div>
                </div>
            `,
            time: `
                <div class="tile-header">
                    <h3>Time & Date</h3>
                    <button class="tile-settings" title="Time Settings">⚙️</button>
                </div>
                <div class="time-content">
                    <div class="time-display">--:--</div>
                    <div class="date-display">Loading...</div>
                </div>
            `,
            'custom-countdown': `
                <div class="tile-header">
                    <h3>Countdown</h3>
                    <button class="edit-countdown-btn">⚙</button>
                </div>
                <div class="tile-content">
                    <div class="countdown-display">
                        <div class="countdown-event">Christmas 2025</div>
                        <div class="countdown-time">84d 1h</div>
                        <div class="countdown-units">in 84 days</div>
                        <div class="countdown-dots"><span class="countdown-dot active" data-index="0"></span><span class="countdown-dot " data-index="1"></span></div>
                    </div>
                </div>
            `,
            timer: `
                <div class="tile-header">
                    <h3>Timer</h3>
                    <button class="tile-settings" title="Timer Settings">⚙️</button>
                </div>
                <div class="timer-content">
                    <div class="timer-display">00:00</div>
                    <div class="timer-controls">
                        <button class="timer-btn start-btn">Start</button>
                        <button class="timer-btn pause-btn">Pause</button>
                        <button class="timer-btn reset-btn">Reset</button>
                    </div>
                    <div class="timer-presets">
                        <button class="preset-btn" data-minutes="25">Pomodoro</button>
                        <button class="preset-btn" data-minutes="5">Short Break</button>
                        <button class="preset-btn" data-minutes="15">Long Break</button>
                    </div>
                </div>
            `,
            traffic: `
                <div class="tile-header">
                    <h3>Traffic</h3>
                    <button class="tile-settings" title="Traffic Settings">⚙️</button>
                </div>
                <div class="traffic-content">
                    <div class="traffic-route">Configure route</div>
                    <div class="traffic-time">-- min</div>
                    <div class="traffic-status">Add your daily commute</div>
                    <button class="configure-route-btn">Set Route</button>
                </div>
            `,
            birthday: `
                <div class="tile-header">
                    <h3>Birthdays</h3>
                    <button class="tile-settings" title="Birthday Settings">⚙️</button>
                </div>
                <div class="birthday-content">
                    <div class="no-birthdays">
                        <div>No birthdays added</div>
                        <button class="add-birthday-btn">Add birthdays</button>
                    </div>
                </div>
            `
        };
        
        return templates[tileType] || '<div class="tile-header"><h3>Unknown Tile</h3></div>';
    }

    initializeTile(tileType, tile) {
        switch (tileType) {
            case 'calendar':
                if (window.CalendarTile) new CalendarTile(tile);
                break;
            case 'todo':
                if (window.TodoTile) new TodoTile(tile);
                break;
            case 'weather':
                if (window.WeatherTile) new WeatherTile(tile);
                break;
            case 'time':
                if (window.TimeTile) new TimeTile(tile);
                break;
            case 'custom-countdown':
                if (window.CountdownTile) new CountdownTile(tile);
                break;
            case 'timer':
                if (window.TimerTile) new TimerTile(tile);
                break;
            case 'traffic':
                if (window.TrafficTile) new TrafficTile(tile);
                break;
            case 'birthday':
                if (window.BirthdayTile) new BirthdayTile(tile);
                break;
        }
    }

    // Configuration Management
    saveCurrentConfiguration() {
        const nameInput = document.getElementById('configName');
        const configName = nameInput.value.trim();
        
        if (!configName) {
            alert('Please enter a configuration name');
            return;
        }
        
        // Get current dashboard layout
        const dashboard = document.getElementById('dashboard');
        const tiles = Array.from(dashboard.querySelectorAll('.tile')).map(tile => {
            const gridColumn = tile.style.gridColumn || '1';
            const gridRow = tile.style.gridRow || '1';
            
            return {
                type: tile.dataset.tileType,
                col: parseInt(gridColumn) - 1,
                row: parseInt(gridRow) - 1,
                width: tile.classList.contains('tile-large') ? 2 : 
                       tile.classList.contains('tile-medium-large') ? 2 : 1,
                height: tile.classList.contains('tile-large') ? 2 : 1
            };
        });
        
        const config = {
            name: configName,
            layout: tiles,
            saved: new Date().toISOString()
        };
        
        // Save to localStorage
        const savedConfigs = JSON.parse(localStorage.getItem('layoutConfigurations') || '[]');
        savedConfigs.push(config);
        localStorage.setItem('layoutConfigurations', JSON.stringify(savedConfigs));
        
        // Clear input and refresh list
        nameInput.value = '';
        this.loadSavedConfigurations();
        
        console.log('Configuration saved:', config);
    }

    loadSavedConfigurations() {
        const container = document.getElementById('savedConfigs');
        const savedConfigs = JSON.parse(localStorage.getItem('layoutConfigurations') || '[]');
        
        container.innerHTML = '';
        
        if (savedConfigs.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No saved configurations</div>';
            return;
        }
        
        savedConfigs.forEach((config, index) => {
            const item = document.createElement('div');
            item.className = 'config-item';
            
            const saveDate = new Date(config.saved).toLocaleDateString();
            
            item.innerHTML = `
                <div class="config-info">
                    <div class="config-name">${config.name}</div>
                    <div class="config-date">Saved: ${saveDate} • ${config.layout.length} tiles</div>
                </div>
                <div class="config-actions">
                    <button class="load-config-btn" data-index="${index}">Load</button>
                    <button class="delete-config-btn" data-index="${index}">Delete</button>
                </div>
            `;
            
            container.appendChild(item);
        });
        
        // Add event listeners
        container.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            if (e.target.classList.contains('load-config-btn')) {
                this.loadConfiguration(savedConfigs[index]);
            } else if (e.target.classList.contains('delete-config-btn')) {
                this.deleteConfiguration(index);
            }
        });
    }

    loadConfiguration(config) {
        if (!confirm(`Load "${config.name}" configuration? This will replace the current layout.`)) {
            return;
        }
        
        console.log('Loading configuration:', config);
        
        const dashboard = document.getElementById('dashboard');
        
        // Set dashboard to fixed 5×3 grid
        dashboard.style.gridTemplateColumns = 'repeat(5, 1fr)';
        dashboard.style.gridTemplateRows = 'repeat(3, 1fr)';
        dashboard.style.gridAutoRows = 'unset';
        dashboard.classList.add('fixed-grid');
        
        // Move existing tiles to match the configuration
        const allTiles = dashboard.querySelectorAll('.tile');
        allTiles.forEach(tile => {
            const tileType = tile.dataset.tileType;
            const configTile = config.layout.find(t => t.type === tileType);
            
            if (configTile) {
                // Move existing tile to new position
                tile.style.display = 'block';
                tile.style.gridColumn = `${configTile.col + 1} / span ${configTile.width}`;
                tile.style.gridRow = `${configTile.row + 1} / span ${configTile.height}`;
                
                // Update size classes if needed
                tile.classList.remove('tile-large', 'tile-medium-large', 'tile-medium');
                if (configTile.width === 2 && configTile.height === 2) {
                    tile.classList.add('tile-large');
                } else if (configTile.width === 2 && configTile.height === 1) {
                    tile.classList.add('tile-medium-large');
                } else {
                    tile.classList.add('tile-medium');
                }
            } else {
                // Hide tiles not in configuration
                tile.style.display = 'none';
            }
        });
        
        this.closeConfigManager();
        console.log('Configuration loaded successfully - existing tiles repositioned');
    }

    deleteConfiguration(index) {
        const savedConfigs = JSON.parse(localStorage.getItem('layoutConfigurations') || '[]');
        const config = savedConfigs[index];
        
        if (!confirm(`Delete "${config.name}" configuration?`)) {
            return;
        }
        
        savedConfigs.splice(index, 1);
        localStorage.setItem('layoutConfigurations', JSON.stringify(savedConfigs));
        
        this.loadSavedConfigurations();
        console.log('Configuration deleted:', config.name);
    }

    makeEditControlsMovable() {
        const editControls = document.querySelector('.edit-controls');
        if (!editControls || editControls._movableInitialized) return;

        let isDragging = false;
        let startX, startY, initialX, initialY;

        const handleMouseDown = (e) => {
            // Only drag if clicking on the controls container, not the buttons
            if (e.target.tagName === 'BUTTON') return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = editControls.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            editControls.style.transition = 'none';
            editControls.style.cursor = 'grabbing';
            
            e.preventDefault();
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newX = initialX + deltaX;
            const newY = initialY + deltaY;
            
            // Keep within viewport bounds
            const maxX = window.innerWidth - editControls.offsetWidth - 20;
            const maxY = window.innerHeight - editControls.offsetHeight - 20;
            
            const boundedX = Math.max(20, Math.min(newX, maxX));
            const boundedY = Math.max(20, Math.min(newY, maxY));
            
            editControls.style.left = boundedX + 'px';
            editControls.style.top = boundedY + 'px';
            editControls.style.right = 'auto';
        };

        const handleMouseUp = () => {
            isDragging = false;
            editControls.style.transition = '';
            editControls.style.cursor = 'move';
        };

        editControls.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        editControls._movableInitialized = true;
    }

    addRemoveButton(tile) {
        // Don't add remove button if one already exists
        if (tile.querySelector('.tile-remove-btn')) return;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'tile-remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remove tile';
        
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.removeTile(tile);
        });
        
        tile.appendChild(removeBtn);
    }

    removeRemoveButton(tile) {
        const removeBtn = tile.querySelector('.tile-remove-btn');
        if (removeBtn) {
            removeBtn.remove();
        }
    }

    addTileButton() {
        // Don't add if already exists
        if (document.querySelector('.add-tile-btn')) return;
        
        const dashboard = document.querySelector('.dashboard');
        const addTileBtn = document.createElement('div');
        addTileBtn.className = 'tile add-tile-btn';
        addTileBtn.innerHTML = `
            <div class="add-tile-content">
                <div class="add-tile-icon">+</div>
                <div class="add-tile-text">Add Tile</div>
            </div>
        `;
        
        addTileBtn.addEventListener('click', () => {
            this.showAddTileDialog();
        });
        
        dashboard.appendChild(addTileBtn);
    }

    removeAddTileButton() {
        const addTileBtn = document.querySelector('.add-tile-btn');
        if (addTileBtn) {
            addTileBtn.remove();
        }
    }

    removeTile(tile) {
        const tileType = tile.dataset.tileType;
        const tileName = tile.querySelector('h3')?.textContent || tileType;
        
        if (confirm(`Remove "${tileName}" tile? This will hide it from your dashboard.`)) {
            // Add removal animation
            tile.style.transition = 'all 0.3s ease';
            tile.style.opacity = '0';
            tile.style.transform = 'scale(0.5)';
            
            setTimeout(() => {
                tile.remove();
                // Auto-save layout after removal
                this.saveLayout();
            }, 300);
        }
    }

    cleanupDragStyles(tile) {
        // Remove all drag-related styles
        tile.style.position = '';
        tile.style.left = '';
        tile.style.top = '';
        tile.style.zIndex = '';
        tile.style.transform = '';
        tile.classList.remove('dragging');
    }

    // Get tile size information
    getTileSize(tile) {
        if (tile.classList.contains('tile-large')) return { width: 2, height: 2 };
        if (tile.classList.contains('tile-medium-large')) return { width: 2, height: 1 };
        if (tile.classList.contains('tile-medium')) return { width: 1, height: 1 };
        return { width: 1, height: 1 }; // tile-small
    }

    // Get tile grid position
    getGridPosition(tile) {
        const colStyle = tile.style.gridColumn || '1';
        const rowStyle = tile.style.gridRow || '1';
        
        const col = parseInt(colStyle.split('/')[0]) || 1;
        const row = parseInt(rowStyle.split('/')[0]) || 1;
        
        return { col, row };
    }

    // Set tile grid position
    setGridPosition(tile, col, row) {
        const size = this.getTileSize(tile);
        tile.style.gridColumn = size.width > 1 ? `${col} / span ${size.width}` : col;
        tile.style.gridRow = size.height > 1 ? `${row} / span ${size.height}` : row;
    }

    // Check if position is within grid bounds
    isWithinBounds(col, row, width, height) {
        return col >= 1 && row >= 1 && 
               (col + width - 1) <= 5 && 
               (row + height - 1) <= 3;
    }

    // Get all tiles occupying a specific grid area
    getTilesInArea(startCol, startRow, width, height, excludeTile = null) {
        const dashboard = document.getElementById('dashboard');
        const tiles = Array.from(dashboard.querySelectorAll('.tile:not(.add-tile-btn)'))
            .filter(tile => tile !== excludeTile);
        
        const occupiedTiles = [];
        
        for (const tile of tiles) {
            const pos = this.getGridPosition(tile);
            const size = this.getTileSize(tile);
            
            // Check if this tile overlaps with the specified area
            const tileEndCol = pos.col + size.width - 1;
            const tileEndRow = pos.row + size.height - 1;
            const areaEndCol = startCol + width - 1;
            const areaEndRow = startRow + height - 1;
            
            if (!(pos.col > areaEndCol || tileEndCol < startCol || 
                  pos.row > areaEndRow || tileEndRow < startRow)) {
                occupiedTiles.push(tile);
            }
        }
        
        return occupiedTiles;
    }

    // Find nearest free position for a tile
    findNearestFreePosition(width, height, preferredCol = 1, preferredRow = 1) {
        const positions = [];
        
        // Generate all valid positions, sorted by distance from preferred position
        for (let row = 1; row <= 3; row++) {
            for (let col = 1; col <= 5; col++) {
                if (this.isWithinBounds(col, row, width, height)) {
                    const occupiedTiles = this.getTilesInArea(col, row, width, height);
                    if (occupiedTiles.length === 0) {
                        const distance = Math.abs(col - preferredCol) + Math.abs(row - preferredRow);
                        positions.push({ col, row, distance });
                    }
                }
            }
        }
        
        positions.sort((a, b) => a.distance - b.distance);
        return positions.length > 0 ? positions[0] : null;
    }

    // Core intelligent tile placement logic
    intelligentTilePlacement(draggedTile, targetCol, targetRow) {
        const draggedSize = this.getTileSize(draggedTile);
        const draggedPos = this.getGridPosition(draggedTile);
        
        console.log(`Attempting to place ${draggedSize.width}×${draggedSize.height} tile at ${targetCol},${targetRow}`);
        
        // Check if target position is within bounds
        if (!this.isWithinBounds(targetCol, targetRow, draggedSize.width, draggedSize.height)) {
            console.log('Target position is out of bounds');
            return { success: false, action: 'out-of-bounds' };
        }
        
        // Get tiles that would be overlapped by this placement
        const overlappingTiles = this.getTilesInArea(targetCol, targetRow, draggedSize.width, draggedSize.height, draggedTile);
        
        if (overlappingTiles.length === 0) {
            // Empty area - simple placement
            console.log('Target area is empty, placing tile directly');
            this.setGridPosition(draggedTile, targetCol, targetRow);
            return { success: true, action: 'direct-placement' };
        }
        
        // Try swap logic first
        const swapResult = this.attemptSwapPlacement(draggedTile, overlappingTiles, targetCol, targetRow);
        if (swapResult.success) {
            return swapResult;
        }
        
        // Try push logic
        const pushResult = this.attemptPushPlacement(draggedTile, overlappingTiles, targetCol, targetRow, draggedPos);
        if (pushResult.success) {
            return pushResult;
        }
        
        console.log('All placement strategies failed');
        return { success: false, action: 'placement-failed' };
    }

    // Attempt to swap tiles based on size compatibility
    attemptSwapPlacement(draggedTile, overlappingTiles, targetCol, targetRow) {
        const draggedSize = this.getTileSize(draggedTile);
        const draggedPos = this.getGridPosition(draggedTile);
        
        console.log(`Attempting swap with ${overlappingTiles.length} overlapping tiles`);
        
        // Case 1: Single overlapping tile - try direct swap
        if (overlappingTiles.length === 1) {
            const targetTile = overlappingTiles[0];
            const targetSize = this.getTileSize(targetTile);
            const targetPos = this.getGridPosition(targetTile);
            
            console.log(`Attempting swap: ${draggedSize.width}×${draggedSize.height} ↔ ${targetSize.width}×${targetSize.height}`);
            
            // Check if both tiles can fit in each other's positions
            const canDraggedFitInTarget = this.canTileFitAtPosition(draggedTile, targetPos.col, targetPos.row, [targetTile]);
            const canTargetFitInDragged = this.canTileFitAtPosition(targetTile, draggedPos.col, draggedPos.row, [draggedTile]);
            
            if (canDraggedFitInTarget && canTargetFitInDragged) {
                // Perfect swap
                console.log('Perfect swap possible');
                this.setGridPosition(draggedTile, targetPos.col, targetPos.row);
                this.setGridPosition(targetTile, draggedPos.col, draggedPos.row);
                return { success: true, action: 'direct-swap' };
            }
            
            // If dragged is 1×1 and target is bigger, try placing 1×1 in target's original area
            if (draggedSize.width === 1 && draggedSize.height === 1 && 
                (targetSize.width > 1 || targetSize.height > 1)) {
                
                const freePos = this.findNearestFreePosition(1, 1, draggedPos.col, draggedPos.row);
                if (freePos) {
                    console.log('Moving 1×1 tile to free position, placing larger tile');
                    this.setGridPosition(draggedTile, targetCol, targetRow);
                    this.setGridPosition(targetTile, freePos.col, freePos.row);
                    return { success: true, action: 'size-adjusted-swap' };
                }
            }
        }
        
        return { success: false, action: 'swap-not-possible' };
    }

    // Check if a tile can fit at a specific position
    canTileFitAtPosition(tile, col, row, excludeTiles = []) {
        const size = this.getTileSize(tile);
        
        if (!this.isWithinBounds(col, row, size.width, size.height)) {
            return false;
        }
        
        const overlapping = this.getTilesInArea(col, row, size.width, size.height, tile)
            .filter(t => !excludeTiles.includes(t));
        
        return overlapping.length === 0;
    }

    // Attempt to push overlapping tiles away
    attemptPushPlacement(draggedTile, overlappingTiles, targetCol, targetRow, draggedOriginalPos) {
        const draggedSize = this.getTileSize(draggedTile);
        
        console.log(`Attempting push placement for ${overlappingTiles.length} overlapping tiles`);
        
        // Calculate push direction (from original to target position)
        const pushDirCol = Math.sign(targetCol - draggedOriginalPos.col);
        const pushDirRow = Math.sign(targetRow - draggedOriginalPos.row);
        
        // Try to find new positions for all overlapping tiles
        const repositionPlan = [];
        
        for (const tile of overlappingTiles) {
            const tileSize = this.getTileSize(tile);
            const tilePos = this.getGridPosition(tile);
            
            // Try pushing in the same direction first
            let newPos = this.findPushPosition(tile, tilePos.col + pushDirCol, tilePos.row + pushDirRow, overlappingTiles.concat([draggedTile]));
            
            if (!newPos) {
                // Try other directions
                const directions = [
                    { col: 1, row: 0 },   // right
                    { col: -1, row: 0 },  // left  
                    { col: 0, row: 1 },   // down
                    { col: 0, row: -1 },  // up
                ];
                
                for (const dir of directions) {
                    newPos = this.findPushPosition(tile, tilePos.col + dir.col, tilePos.row + dir.row, overlappingTiles.concat([draggedTile]));
                    if (newPos) break;
                }
            }
            
            if (!newPos) {
                // Try finding any free position
                newPos = this.findNearestFreePosition(tileSize.width, tileSize.height, tilePos.col, tilePos.row);
            }
            
            if (!newPos) {
                console.log('Could not find position for pushed tile');
                return { success: false, action: 'push-failed' };
            }
            
            repositionPlan.push({ tile, newPos });
        }
        
        // Execute the repositioning plan
        console.log(`Executing push plan for ${repositionPlan.length} tiles`);
        for (const { tile, newPos } of repositionPlan) {
            this.setGridPosition(tile, newPos.col, newPos.row);
        }
        
        // Place the dragged tile
        this.setGridPosition(draggedTile, targetCol, targetRow);
        
        // Run auto-pack to clean up any gaps
        this.autoPackTiles();
        
        return { success: true, action: 'push-placement' };
    }

    // Find a valid position to push a tile to
    findPushPosition(tile, startCol, startRow, excludeTiles) {
        const size = this.getTileSize(tile);
        
        // Check the direct push position first
        if (this.canTileFitAtPosition(tile, startCol, startRow, excludeTiles)) {
            return { col: startCol, row: startRow };
        }
        
        return null;
    }

    // Auto-pack tiles to fill gaps (left-to-right, top-to-bottom)
    autoPackTiles() {
        console.log('Running auto-pack to fill gaps');
        
        const dashboard = document.getElementById('dashboard');
        const tiles = Array.from(dashboard.querySelectorAll('.tile:not(.add-tile-btn)'));
        
        // Sort tiles by current position (top-to-bottom, left-to-right)
        tiles.sort((a, b) => {
            const posA = this.getGridPosition(a);
            const posB = this.getGridPosition(b);
            if (posA.row !== posB.row) return posA.row - posB.row;
            return posA.col - posB.col;
        });
        
        // Try to move each tile to the earliest available position
        for (const tile of tiles) {
            const size = this.getTileSize(tile);
            const bestPos = this.findNearestFreePosition(size.width, size.height, 1, 1);
            
            if (bestPos) {
                const currentPos = this.getGridPosition(tile);
                if (bestPos.col < currentPos.col || bestPos.row < currentPos.row) {
                    console.log(`Auto-packing tile from ${currentPos.col},${currentPos.row} to ${bestPos.col},${bestPos.row}`);
                    this.setGridPosition(tile, bestPos.col, bestPos.row);
                }
            }
        }
    }

    showAddTileDialog() {
        const modal = document.getElementById('addTileModal');
        const tileSelect = document.getElementById('tileTypeSelect');
        const tileDescription = document.getElementById('tileDescription');
        const tilePreview = document.getElementById('tilePreview');
        const confirmBtn = document.getElementById('confirmAddTile');
        const cancelBtn = document.getElementById('cancelAddTile');
        const closeBtn = document.getElementById('closeAddTileModal');
        const overlay = modal.querySelector('.modal-overlay');
        
        // Tile information
        const tileInfo = {
            calendar: {
                name: 'Calendar',
                description: 'Display a monthly calendar view with navigation. Shows the current month with clickable dates and navigation arrows.',
                icon: '📅',
                preview: `
                    <div style="background: #3498db; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.8rem; margin-bottom: 0.5rem;">October 2025</div>
                        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; font-size: 0.6rem;">
                            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                            <div style="background: rgba(255,255,255,0.3); padding: 2px;">1</div>
                            <div style="background: rgba(255,255,255,0.3); padding: 2px;">2</div>
                            <div style="background: rgba(255,255,255,0.3); padding: 2px;">3</div>
                            <div>4</div><div>5</div><div>6</div><div>7</div>
                        </div>
                    </div>
                `
            },
            todo: {
                name: 'Tasks',
                description: 'Manage your todo list with add, edit, and complete functionality. Keep track of your daily tasks and mark them as completed.',
                icon: '✅',
                preview: `
                    <div style="background: #9b59b6; color: white; padding: 1rem; border-radius: 8px;">
                        <div style="font-size: 0.8rem; margin-bottom: 0.5rem; font-weight: bold;">Tasks</div>
                        <div style="font-size: 0.7rem; line-height: 1.4;">
                            <div>✓ Complete project</div>
                            <div>○ Review code</div>
                            <div>○ Update docs</div>
                        </div>
                        <div style="margin-top: 0.5rem; background: rgba(255,255,255,0.2); padding: 0.3rem; border-radius: 4px; font-size: 0.6rem;">
                            + Add new task
                        </div>
                    </div>
                `
            },
            weather: {
                name: 'Weather',
                description: 'Current weather conditions with temperature, description, and forecast. Shows real-time weather data for your location.',
                icon: '🌤️',
                preview: `
                    <div style="background: #f39c12; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.2rem; margin-bottom: 0.3rem;">☁️</div>
                        <div style="font-size: 1rem; font-weight: bold;">12°C</div>
                        <div style="font-size: 0.7rem;">Overcast clouds</div>
                        <div style="font-size: 0.6rem; margin-top: 0.3rem;">Humidity 58%</div>
                    </div>
                `
            },
            time: {
                name: 'Time & Date',
                description: 'Display current time and date in a clean, readable format. Updates automatically to show the current time.',
                icon: '🕙',
                preview: `
                    <div style="background: #27ae60; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 0.3rem;">10:01 PM</div>
                        <div style="font-size: 0.7rem;">Wednesday, October 1, 2025</div>
                    </div>
                `
            },
            'custom-countdown': {
                name: 'Countdown',
                description: 'Count down to important events and deadlines. Set custom countdown timers for special occasions.',
                icon: '⏰',
                preview: `
                    <div style="background: #e91e63; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.8rem; margin-bottom: 0.3rem;">Christmas 2025</div>
                        <div style="font-size: 1rem; font-weight: bold;">84d 2h</div>
                        <div style="font-size: 0.6rem; margin-top: 0.3rem;">●</div>
                    </div>
                `
            },
            timer: {
                name: 'Timer',
                description: 'Pomodoro timer with work and break sessions. Includes preset timers for productivity and custom timer options.',
                icon: '⏲️',
                preview: `
                    <div style="background: #d68910; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem;">00:00</div>
                        <div style="display: flex; gap: 4px; justify-content: center; margin-bottom: 0.3rem;">
                            <div style="background: rgba(255,255,255,0.3); padding: 2px 4px; border-radius: 3px; font-size: 0.5rem;">Pomodoro</div>
                            <div style="background: rgba(255,255,255,0.3); padding: 2px 4px; border-radius: 3px; font-size: 0.5rem;">Break</div>
                        </div>
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <div style="background: rgba(255,255,255,0.3); padding: 2px 4px; border-radius: 3px; font-size: 0.5rem;">Tea</div>
                            <div style="background: rgba(255,255,255,0.3); padding: 2px 4px; border-radius: 3px; font-size: 0.5rem;">Coffee</div>
                        </div>
                    </div>
                `
            },
            traffic: {
                name: 'Traffic',
                description: 'Real-time traffic information and route planning. Shows travel times and traffic conditions for your commute.',
                icon: '🚗',
                preview: `
                    <div style="background: #16a085; color: white; padding: 1rem; border-radius: 8px;">
                        <div style="font-size: 0.8rem; margin-bottom: 0.3rem;">Uni → Work</div>
                        <div style="font-size: 1rem; font-weight: bold; color: #2ecc71;">14 min</div>
                        <div style="font-size: 0.6rem; margin-top: 0.3rem;">Live traffic: Clear roads</div>
                        <div style="font-size: 0.6rem;">9.4 km • ●</div>
                    </div>
                `
            },
            birthday: {
                name: 'Birthdays',
                description: 'Keep track of upcoming birthdays and important dates. Never miss a celebration with reminder notifications.',
                icon: '🎂',
                preview: `
                    <div style="background: #e67e22; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.8rem; margin-bottom: 0.5rem; font-weight: bold;">Birthdays</div>
                        <div style="font-size: 0.7rem; line-height: 1.4;">
                            <div>No birthdays added</div>
                            <div style="margin-top: 0.3rem; font-size: 0.6rem;">Click to add birthdays</div>
                        </div>
                    </div>
                `
            }
        };
        
        // Handle tile selection
        tileSelect.addEventListener('change', () => {
            const selectedType = tileSelect.value;
            if (selectedType && tileInfo[selectedType]) {
                const info = tileInfo[selectedType];
                
                tileDescription.innerHTML = `
                    <h3>${info.icon} ${info.name}</h3>
                    <p>${info.description}</p>
                `;
                
                tilePreview.innerHTML = info.preview;
                confirmBtn.disabled = false;
            } else {
                tileDescription.innerHTML = `
                    <h3>Select a tile to see details</h3>
                    <p>Choose a tile type from the dropdown above to see its description and preview.</p>
                `;
                tilePreview.innerHTML = `
                    <div class="preview-placeholder">
                        <div class="preview-icon">🎯</div>
                        <div class="preview-text">Preview</div>
                    </div>
                `;
                confirmBtn.disabled = true;
            }
        });
        
        // Handle confirm
        confirmBtn.onclick = () => {
            const selectedType = tileSelect.value;
            if (selectedType) {
                this.addNewTile(selectedType);
                this.closeModal();
            }
        };
        
        // Handle cancel/close
        const closeModal = () => {
            modal.classList.add('hidden');
            tileSelect.value = '';
            tileSelect.dispatchEvent(new Event('change'));
            confirmBtn.disabled = true;
        };
        
        this.closeModal = closeModal;
        
        cancelBtn.onclick = closeModal;
        closeBtn.onclick = closeModal;
        overlay.onclick = closeModal;
        
        // Show modal
        modal.classList.remove('hidden');
    }

    addNewTile(tileType) {
        console.log(`Adding new ${tileType} tile with intelligent placement system`);
        
        const dashboard = document.getElementById('dashboard');
        const addTileBtn = document.querySelector('.add-tile-btn');
        
        // Create the new tile element
        const newTile = document.createElement('div');
        newTile.className = 'tile';
        newTile.dataset.tileType = tileType;
        
        // Set tile content based on type
        switch (tileType) {
            case 'calendar':
                newTile.className = 'tile tile-large';  // 2x2 tile
                newTile.innerHTML = `
                    <div class="tile-header">
                        <h3>Calendar</h3>
                        <button class="tile-settings" title="Calendar Settings">⚙️</button>
                    </div>
                    <div class="calendar-content">
                        <div class="calendar-nav">
                            <button class="nav-btn" id="prevMonth">&lt;</button>
                            <span class="month-year">October 2025</span>
                            <button class="nav-btn" id="nextMonth">&gt;</button>
                        </div>
                        <div class="calendar-grid">
                            <!-- Calendar will be populated by CalendarTile -->
                        </div>
                    </div>
                `;
                break;
                
            case 'todo':
                newTile.className = 'tile tile-large';  // 2x2 tile
                newTile.innerHTML = `
                    <div class="tile-header">
                        <h3>Tasks</h3>
                        <button class="tile-settings" title="Task Settings">⚙️</button>
                    </div>
                    <div class="todo-content">
                        <div class="todo-header">Ready to get organized?</div>
                        <div class="todo-list"></div>
                        <button class="add-first-task">✨ Create your first task</button>
                    </div>
                `;
                break;
                
            case 'weather':
                newTile.className = 'tile tile-medium-large';  // 2x1 tile
                newTile.innerHTML = `
                    <div class="tile-header">
                        <h3>Weather</h3>
                        <button class="tile-settings" title="Weather Settings">⚙️</button>
                    </div>
                    <div class="weather-content">
                        <div class="weather-main">
                            <div class="weather-temp">12°C</div>
                            <div class="weather-condition">Overcast clouds</div>
                        </div>
                        <div class="weather-details">
                            <div>Feels like 11°C</div>
                            <div>Humidity 58%</div>
                        </div>
                    </div>
                `;
                break;
                
            case 'time':
                newTile.className = 'tile tile-medium';  // 1x1 tile
                newTile.innerHTML = `
                    <div class="tile-header">
                        <h3>Time & Date</h3>
                        <button class="tile-settings" title="Time Settings">⚙️</button>
                    </div>
                    <div class="time-content">
                        <div class="time-display">10:01 PM</div>
                        <div class="date-display">Wednesday, October 1, 2025</div>
                    </div>
                `;
                break;
                
            case 'custom-countdown':
                newTile.className = 'tile tile-small countdown-tile';  // 1x1 tile
                newTile.innerHTML = `
                    <div class="tile-header">
                        <h3>Countdown</h3>
                        <button class="edit-countdown-btn">⚙</button>
                    </div>
                    <div class="tile-content">
                        <div class="countdown-display">
                            <div class="countdown-event">Christmas 2025</div>
                            <div class="countdown-time">84d 1h</div>
                            <div class="countdown-units">in 84 days</div>
                            <div class="countdown-dots"><span class="countdown-dot active" data-index="0"></span><span class="countdown-dot " data-index="1"></span></div>
                        </div>
                    </div>
                `;
                break;
                
            case 'timer':
                newTile.className = 'tile tile-medium';  // 1x1 tile
                newTile.innerHTML = `
                    <div class="tile-header">
                        <h3>Timer</h3>
                        <button class="tile-settings" title="Timer Settings">⚙️</button>
                    </div>
                    <div class="timer-content">
                        <div class="timer-display">00:00</div>
                        <div class="timer-presets">
                            <button class="preset-btn">Pomodoro</button>
                            <button class="preset-btn">Short Break</button>
                            <button class="preset-btn">Long Break</button>
                        </div>
                        <div class="timer-custom">
                            <button class="custom-btn">Tea</button>
                            <button class="custom-btn">Coffee</button>
                            <button class="custom-btn">Custom</button>
                        </div>
                    </div>
                `;
                break;
                
            case 'traffic':
                newTile.className = 'tile tile-medium';  // 1x1 tile
                newTile.innerHTML = `
                    <div class="tile-header">
                        <h3>Traffic</h3>
                        <button class="tile-settings" title="Traffic Settings">⚙️</button>
                    </div>
                    <div class="traffic-content">
                        <div class="traffic-route">Add Route</div>
                        <div class="traffic-time">-- min</div>
                        <div class="traffic-status">Configure your route</div>
                        <button class="setup-traffic-btn">Setup Traffic</button>
                    </div>
                `;
                break;
                
            case 'birthday':
                newTile.className = 'tile tile-small';  // 1x1 tile
                newTile.innerHTML = `
                    <div class="tile-header">
                        <h3>Birthdays</h3>
                        <button class="tile-settings" title="Birthday Settings">⚙️</button>
                    </div>
                    <div class="birthday-content">
                        <div class="no-birthdays">
                            <div>No birthdays added</div>
                            <button class="add-birthday-btn">Click to add birthdays</button>
                        </div>
                    </div>
                `;
                break;
        }
        
        // Insert before the add tile button
        if (addTileBtn) {
            dashboard.insertBefore(newTile, addTileBtn);
        } else {
            dashboard.appendChild(newTile);
        }
        
        // Initialize the appropriate tile class if available
        setTimeout(() => {
            switch (tileType) {
                case 'calendar':
                    if (window.CalendarTile) new CalendarTile(newTile);
                    break;
                case 'todo':
                    if (window.TodoTile) new TodoTile(newTile);
                    break;
                case 'weather':
                    if (window.WeatherTile) new WeatherTile(newTile);
                    break;
                case 'time':
                    if (window.TimeTile) new TimeTile(newTile);
                    break;
                case 'custom-countdown':
                    if (window.CountdownTile) new CountdownTile(newTile);
                    break;
                case 'timer':
                    if (window.TimerTile) new TimerTile(newTile);
                    break;
                case 'traffic':
                    if (window.TrafficTile) new TrafficTile(newTile);
                    break;
                case 'birthday':
                    if (window.BirthdayTile) new BirthdayTile(newTile);
                    break;
            }
            
            // Add drag functionality if in edit mode
            if (this.isEditMode) {
                newTile.classList.add('edit-mode', 'wobble');
                this.makeTileDraggable(newTile);
                this.addRemoveButton(newTile);
            }
            
            // Save the layout
            this.saveLayout();
            
            console.log(`${tileType} tile added successfully`);
        }, 100);
    }

    makeTileDraggable(tile) {
        let isDragging = false;
        let dragClone = null;
        let startX, startY;
        
        const onMouseDown = (e) => {
            // Don't start drag on interactive elements
            if (e.target.closest('button, input, a, select, textarea')) return;
            
            startX = e.clientX;
            startY = e.clientY;
            
            e.preventDefault();
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) {
                const deltaX = Math.abs(e.clientX - startX);
                const deltaY = Math.abs(e.clientY - startY);
                
                if (deltaX > 10 || deltaY > 10) {
                    startDragging(e);
                }
                return;
            }
            
            if (dragClone) {
                dragClone.style.left = (e.clientX - 150) + 'px';
                dragClone.style.top = (e.clientY - 100) + 'px';
                
                this.updateDropTarget(e.clientX, e.clientY);
            }
        };
        
        const startDragging = (e) => {
            isDragging = true;
            
            console.log('Starting drag');
            
            // Show visual feedback
            tile.style.opacity = '0.3';
            tile.classList.add('dragging-source');
            
            // Create clone
            const rect = tile.getBoundingClientRect();
            dragClone = tile.cloneNode(true);
            dragClone.style.cssText = `
                position: fixed;
                left: ${e.clientX - 150}px;
                top: ${e.clientY - 100}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                z-index: 10000;
                pointer-events: none;
                opacity: 0.9;
                transform: rotate(5deg) scale(1.1);
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(dragClone);
            
            // Show grid
            this.showDragGrid();
            
            document.body.style.userSelect = 'none';
        };
        
        const onMouseUp = (e) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (isDragging) {
                // Clean up first
                if (dragClone) {
                    dragClone.remove();
                    dragClone = null;
                }
                
                tile.style.opacity = '';
                tile.style.transform = '';
                tile.style.position = '';
                tile.style.left = '';
                tile.style.top = '';
                tile.style.zIndex = '';
                tile.classList.remove('dragging-source');
                
                // Then handle the drop
                this.finishDrag(tile, e.clientX, e.clientY);
                
                this.hideDragGrid();
                document.body.style.userSelect = '';
                
                isDragging = false;
            }
        };
        
        tile.addEventListener('mousedown', onMouseDown);
        tile._dragHandler = onMouseDown;
    }



    makeTileNonDraggable(tile) {
        // Remove drag event listener
        if (tile._dragHandler) {
            tile.removeEventListener('mousedown', tile._dragHandler);
            delete tile._dragHandler;
        }
        
        // Reset styles
        tile.style.opacity = '';
        tile.classList.remove('dragging-source', 'drop-target');
    }

    addResizeHandles(tile) {
        // Don't add if already exists
        if (tile.querySelector('.resize-handles')) return;
        
        const handles = document.createElement('div');
        handles.className = 'resize-handles';
        handles.innerHTML = `
            <div class="resize-handle resize-se" data-direction="se" title="Resize"></div>
            <div class="resize-handle resize-s" data-direction="s" title="Resize height"></div>
            <div class="resize-handle resize-e" data-direction="e" title="Resize width"></div>
        `;
        
        tile.appendChild(handles);
        
        // Add resize functionality
        handles.querySelectorAll('.resize-handle').forEach(handle => {
            this.makeHandleResizable(handle, tile);
        });
    }

    removeResizeHandles(tile) {
        const handles = tile.querySelector('.resize-handles');
        if (handles) {
            handles.remove();
        }
    }

    makeHandleResizable(handle, tile) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        const handleStart = (e) => {
            isResizing = true;
            
            const rect = tile.getBoundingClientRect();
            startWidth = rect.width;
            startHeight = rect.height;
            
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            startX = clientX;
            startY = clientY;
            
            tile.classList.add('resizing');
            this.showGridOverlay();
            
            e.stopPropagation();
            e.preventDefault();
        };
        
        const handleMove = (e) => {
            if (!isResizing) return;
            
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            const direction = handle.dataset.direction;
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            
            if (direction.includes('e')) newWidth = startWidth + deltaX;
            if (direction.includes('s')) newHeight = startHeight + deltaY;
            
            // Minimum sizes
            newWidth = Math.max(200, newWidth);
            newHeight = Math.max(150, newHeight);
            
            // Snap to grid units (approximate)
            const gridUnitWidth = 250;
            const gridUnitHeight = 200;
            
            const gridWidth = Math.round(newWidth / gridUnitWidth);
            const gridHeight = Math.round(newHeight / gridUnitHeight);
            
            tile.style.width = (gridWidth * gridUnitWidth) + 'px';
            tile.style.height = (gridHeight * gridUnitHeight) + 'px';
            
            // Update grid classes
            this.updateTileGridClass(tile, gridWidth, gridHeight);
            
            e.preventDefault();
        };
        
        const handleEnd = (e) => {
            if (!isResizing) return;
            
            isResizing = false;
            tile.classList.remove('resizing');
            
            this.hideGridOverlay();
            
            // Reset inline styles and rely on grid classes
            tile.style.width = '';
            tile.style.height = '';
            
            setTimeout(() => {
                this.saveLayout();
            }, 100);
        };
        
        handle.addEventListener('mousedown', handleStart);
        handle.addEventListener('touchstart', handleStart, { passive: false });
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false });
        
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
    }

    updateTileGridClass(tile, width, height) {
        // Remove existing size classes
        tile.classList.remove('tile-small', 'tile-medium', 'tile-medium-large', 'tile-large');
        
        // Add appropriate size class
        if (width >= 2 && height >= 2) {
            tile.classList.add('tile-large');
        } else if (width >= 2) {
            tile.classList.add('tile-medium-large');
        } else if (height >= 1) {
            tile.classList.add('tile-medium');
        } else {
            tile.classList.add('tile-small');
        }
    }

    showGrid() {
        const dashboard = document.getElementById('dashboard');
        if (dashboard.querySelector('.grid-overlay')) return;
        
        console.log('Showing grid overlay');
        
        const overlay = document.createElement('div');
        overlay.className = 'grid-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 1000;
            background-image: 
                linear-gradient(to right, rgba(52, 152, 219, 0.8) 2px, transparent 2px),
                linear-gradient(to bottom, rgba(52, 152, 219, 0.8) 2px, transparent 2px);
            background-size: 250px 200px;
            opacity: 1;
            border: 2px solid rgba(52, 152, 219, 0.5);
        `;
        
        dashboard.appendChild(overlay);
        dashboard.classList.add('showing-grid');
        
        // Force a repaint
        overlay.offsetHeight;
    }

    hideGrid() {
        const overlay = document.querySelector('.grid-overlay');
        if (overlay) overlay.remove();
        
        const dashboard = document.getElementById('dashboard');
        dashboard.classList.remove('showing-grid');
        
        // Remove all drop previews
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
        document.querySelectorAll('.drop-zone').forEach(el => el.remove());
    }

    showDragGrid() {
        console.log('Showing 5x3 drag grid');
        const dashboard = document.getElementById('dashboard');
        
        // Remove existing grid
        const existingGrid = dashboard.querySelector('.drag-grid-overlay');
        if (existingGrid) existingGrid.remove();
        
        // Fixed 5x3 grid layout
        const columnCount = 5;
        const rowCount = 3;
        
        const dashboardStyle = window.getComputedStyle(dashboard);
        const dashboardRect = dashboard.getBoundingClientRect();
        const gridGap = parseFloat(dashboardStyle.gap) || 16;
        const padding = parseFloat(dashboardStyle.paddingLeft) || 16;
        
        // Calculate actual dimensions for 5x3 grid
        const availableWidth = dashboardRect.width - (2 * padding);
        const availableHeight = dashboardRect.height - (2 * padding);
        
        const columnWidth = (availableWidth - ((columnCount - 1) * gridGap)) / columnCount;
        const rowHeight = (availableHeight - ((rowCount - 1) * gridGap)) / rowCount;
        
        console.log('5x3 Grid calculations:', {
            columnCount,
            rowCount,
            columnWidth,
            rowHeight,
            gridGap,
            availableWidth,
            availableHeight
        });
        
        const overlay = document.createElement('div');
        overlay.className = 'drag-grid-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                linear-gradient(to right, #e74c3c 3px, transparent 3px),
                linear-gradient(to bottom, #e74c3c 3px, transparent 3px);
            background-size: ${columnWidth + gridGap}px ${rowHeight + gridGap}px;
            opacity: 0.8;
            pointer-events: none;
            z-index: 1000;
        `;
        
        dashboard.appendChild(overlay);
        dashboard.classList.add('showing-drag-grid');
        
        // Create drop zones for 5x3 grid
        this.createGridDropZones(columnWidth, rowHeight, gridGap, columnCount, rowCount);
    }

    createGridDropZones(columnWidth, rowHeight, gap, columnCount, rowCount) {
        const dashboard = document.getElementById('dashboard');
        
        console.log('Creating 5x3 drop zones:', { columnCount, rowCount, columnWidth, rowHeight, gap });
        
        // Remove existing drop zones
        document.querySelectorAll('.grid-drop-zone').forEach(el => el.remove());
        
        // Create exactly 5x3 = 15 drop zones
        for (let row = 0; row < rowCount; row++) {
            for (let col = 0; col < columnCount; col++) {
                const dropZone = document.createElement('div');
                dropZone.className = 'grid-drop-zone';
                dropZone.dataset.row = row;
                dropZone.dataset.col = col;
                dropZone.dataset.index = (row * columnCount) + col; // Linear index for positioning
                
                const leftPos = col * (columnWidth + gap);
                const topPos = row * (rowHeight + gap);
                
                dropZone.style.cssText = `
                    position: absolute;
                    left: ${leftPos}px;
                    top: ${topPos}px;
                    width: ${columnWidth}px;
                    height: ${rowHeight}px;
                    background: rgba(231, 76, 60, 0.1);
                    border: 2px dashed rgba(231, 76, 60, 0.4);
                    border-radius: 8px;
                    pointer-events: auto;
                    z-index: 999;
                    opacity: 0;
                    transition: all 0.2s ease;
                `;
                
                dashboard.appendChild(dropZone);
                
                // Debug: Add zone number for visual reference
                const label = document.createElement('div');
                label.textContent = `${row},${col}`;
                label.style.cssText = `
                    position: absolute;
                    top: 5px;
                    left: 5px;
                    font-size: 12px;
                    color: #e74c3c;
                    font-weight: bold;
                    pointer-events: none;
                `;
                dropZone.appendChild(label);
            }
        }
    }

    hideDragGrid() {
        const overlay = document.querySelector('.drag-grid-overlay');
        if (overlay) overlay.remove();
        
        // Remove grid drop zones
        document.querySelectorAll('.grid-drop-zone').forEach(el => el.remove());
        
        const dashboard = document.getElementById('dashboard');
        dashboard.classList.remove('showing-drag-grid');
        
        // Clear drop targets
        document.querySelectorAll('.tile.drop-target').forEach(tile => {
            tile.classList.remove('drop-target');
        });
    }

    updateDropTarget(mouseX, mouseY) {
        const dashboard = document.getElementById('dashboard');
        const tiles = Array.from(dashboard.querySelectorAll('.tile:not(.add-tile-btn):not(.dragging-source)'));
        const gridZones = Array.from(dashboard.querySelectorAll('.grid-drop-zone'));
        
        // Clear existing drop targets
        tiles.forEach(tile => tile.classList.remove('drop-target'));
        gridZones.forEach(zone => {
            zone.style.opacity = '0';
            zone.classList.remove('active-drop-zone');
        });
        
        // Check grid zones first
        const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
        const gridZone = elementUnderMouse?.closest('.grid-drop-zone');
        
        if (gridZone) {
            gridZone.style.opacity = '0.7';
            gridZone.classList.add('active-drop-zone');
            console.log(`Over grid zone: row ${gridZone.dataset.row}, col ${gridZone.dataset.col}`);
            return;
        }
        
        // If no grid zone, check tiles
        let closestTile = null;
        let minDistance = Infinity;
        
        tiles.forEach(tile => {
            const rect = tile.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.sqrt(
                Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestTile = tile;
            }
        });
        
        if (closestTile && minDistance < 200) {
            closestTile.classList.add('drop-target');
            console.log('Over tile:', closestTile.dataset.tileType);
        }
    }

    finishDrag(draggedTile, mouseX, mouseY) {
        const dashboard = draggedTile.parentNode;
        const rect = dashboard.getBoundingClientRect();
        
        // Calculate drop position in grid coordinates
        const relativeX = mouseX - rect.left;
        const relativeY = mouseY - rect.top;
        
        // Calculate grid position (5×3 grid, 1-based indexing)
        const columnWidth = 320;
        const rowHeight = 220;
        
        const targetCol = Math.max(1, Math.min(5, Math.round(relativeX / columnWidth) + 1));
        const targetRow = Math.max(1, Math.min(3, Math.round(relativeY / rowHeight) + 1));
        
        const draggedSize = this.getTileSize(draggedTile);
        console.log('🎯 INTELLIGENT DRAG & DROP', {
            tile: draggedTile.dataset.tileType,
            size: `${draggedSize.width}×${draggedSize.height}`,
            targetGrid: `${targetCol},${targetRow}`,
            mousePos: `${mouseX},${mouseY}`
        });
        
        // Store original position in case we need to revert
        const originalPos = this.getGridPosition(draggedTile);
        const originalCol = originalPos.col;
        const originalRow = originalPos.row;
        
        // Attempt intelligent placement
        const placementResult = this.intelligentTilePlacement(draggedTile, targetCol, targetRow);
        
        if (placementResult.success) {
            console.log('Tile placement successful:', placementResult.action);
            
            // Clean up drag styles
            this.cleanupDragStyles(draggedTile);
            
            // Visual feedback for successful move
            draggedTile.style.transform = 'scale(1.05)';
            setTimeout(() => {
                draggedTile.style.transform = '';
            }, 300);
            
            // Auto-save layout
            setTimeout(() => {
                this.saveLayout();
            }, 150);
        } else {
            console.log('Tile placement failed, reverting to original position');
            // Revert to original position
            draggedTile.style.gridColumn = originalCol;
            draggedTile.style.gridRow = originalRow;
            
            this.cleanupDragStyles(draggedTile);
            
            // Show feedback that move was rejected
            draggedTile.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                draggedTile.style.animation = '';
            }, 500);
        }
    }

    highlightDropTarget(mouseX, mouseY) {
        const dashboard = document.getElementById('dashboard');
        const tiles = dashboard.querySelectorAll('.tile:not(.add-tile-btn):not(.dragging-source)');
        
        // Remove all existing drop targets
        tiles.forEach(tile => tile.classList.remove('drop-target'));
        
        // Find tile under mouse using elementFromPoint
        const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
        let targetTile = null;
        
        if (elementUnderMouse) {
            // Find the closest parent tile
            targetTile = elementUnderMouse.closest('.tile:not(.add-tile-btn):not(.dragging-source)');
            
            // If no direct tile found, check nearby tiles
            if (!targetTile) {
                tiles.forEach(tile => {
                    const rect = tile.getBoundingClientRect();
                    if (mouseX >= rect.left - 50 && mouseX <= rect.right + 50 && 
                        mouseY >= rect.top - 50 && mouseY <= rect.bottom + 50) {
                        targetTile = tile;
                    }
                });
            }
        }
        
        if (targetTile) {
            targetTile.classList.add('drop-target');
            console.log('Drop target highlighted:', targetTile.dataset.tileType || 'unknown');
        }
    }

    handleTileDrop(draggedTile, mouseX, mouseY) {
        const dashboard = document.getElementById('dashboard');
        const allTiles = Array.from(dashboard.querySelectorAll('.tile:not(.add-tile-btn)'));
        const targetTile = document.querySelector('.tile.drop-target');
        
        console.log('Handling drop...', {
            draggedTile: draggedTile.dataset.tileType || draggedTile.className,
            targetTile: targetTile ? (targetTile.dataset.tileType || targetTile.className) : 'none',
            totalTiles: allTiles.length
        });
        
        if (!targetTile || targetTile === draggedTile) {
            console.log('No valid drop target or dropping on self');
            return;
        }
        
        // Get current positions
        const draggedIndex = allTiles.indexOf(draggedTile);
        const targetIndex = allTiles.indexOf(targetTile);
        
        console.log(`Moving from index ${draggedIndex} to ${targetIndex}`);
        
        if (draggedIndex === -1 || targetIndex === -1) {
            console.error('Invalid tile indices:', { draggedIndex, targetIndex });
            return;
        }
        
        // Remove the dragged tile from its current position
        draggedTile.remove();
        
        // Insert at the new position
        if (draggedIndex < targetIndex) {
            // Moving forward - insert after target
            dashboard.insertBefore(draggedTile, targetTile.nextSibling);
        } else {
            // Moving backward - insert before target
            dashboard.insertBefore(draggedTile, targetTile);
        }
        
        // Add visual feedback for successful move
        draggedTile.style.transform = 'scale(1.1)';
        setTimeout(() => {
            draggedTile.style.transform = '';
        }, 300);
        
        console.log('Tile moved successfully');
        
        // Save the new layout
        setTimeout(() => {
            this.saveLayout();
        }, 100);
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
        const savedTheme = this.settings.theme || 'light';
        this.applyTheme(savedTheme);
        
        // No radio buttons to set - using button-based theme selector now
        console.log('Theme initialized:', savedTheme);
    }

    openSettings() {
        console.log('openSettings() method called');
        const modal = document.getElementById('settingsModal');
        console.log('Settings modal element:', modal);
        
        if (modal) {
            console.log('Modal classes before:', modal.className);
            console.log('Modal display before:', modal.style.display);
            
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.classList.add('show');
            
            console.log('Modal classes after:', modal.className);
            console.log('Modal display after:', modal.style.display);
            
            // Set active theme button based on current theme - FIXED getCurrentTheme error
            const currentTheme = this.settings.theme || 'light';
            const themeButtons = document.querySelectorAll('.theme-btn');
            
            themeButtons.forEach(btn => {
                const btnTheme = btn.getAttribute('data-theme');
                if (btnTheme === currentTheme) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Populate and set current startup layout in dropdown
            this.populateStartupLayoutDropdown();
        } else {
            console.error('Settings modal not found!');
        }
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }, 300);
        
        // API settings now hardcoded in tile classes - nothing to save
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
            // Close any open modals
            this.closeSettings();
            this.closeLayoutEditor();
            this.closeConfigManager();
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
            const settings = JSON.parse(localStorage.getItem('smartDisplayHub_settings')) || {};
            // Set default values for new settings
            if (!settings.startupLayout) {
                settings.startupLayout = 'default';
            }
            return settings;
        } catch (e) {
            console.warn('Failed to load settings:', e);
            return { startupLayout: 'default' };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('smartDisplayHub_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    // Startup Layout Methods
    populateStartupLayoutDropdown() {
        const select = document.getElementById('startupLayout');
        if (!select) {
            console.error('Startup layout dropdown not found!');
            return;
        }
        
        // Debug: Check raw localStorage content
        const rawData = localStorage.getItem('layoutConfigurations');
        console.log('Raw localStorage data for layoutConfigurations:', rawData);
        
        // Get saved configurations from Layout Configurations
        const savedConfigs = JSON.parse(localStorage.getItem('layoutConfigurations') || '[]');
        console.log('Parsed saved configurations:', savedConfigs);
        console.log('Number of configurations:', savedConfigs.length);
        
        // Clear and rebuild options
        select.innerHTML = '<option value="default">Default</option>';
        console.log('Dropdown cleared, default option added');
        
        // Add each saved configuration
        savedConfigs.forEach((config, index) => {
            console.log(`Adding config ${index}:`, config.name);
            const option = document.createElement('option');
            option.value = index.toString(); // Use index as value
            option.textContent = config.name;
            select.appendChild(option);
            console.log('Option added to dropdown:', option.textContent, 'with value:', option.value);
        });
        
        // Set current startup layout
        const currentStartupLayout = this.settings.startupLayout || 'default';
        select.value = currentStartupLayout;
        
        console.log('Dropdown populated with', savedConfigs.length, 'saved configurations');
        console.log('Final dropdown HTML:', select.innerHTML);
    }

    setStartupLayout(layoutValue) {
        this.settings.startupLayout = layoutValue;
        this.saveSettings();
        console.log('Startup layout set to:', layoutValue);
        
        // Show confirmation
        const button = document.getElementById('saveStartupLayout');
        const originalText = button.textContent;
        button.textContent = '✅ Saved!';
        button.style.background = '#4caf50';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }

    loadStartupLayout() {
        const startupLayoutValue = this.settings.startupLayout || 'default';
        
        console.log('Loading startup layout:', startupLayoutValue);
        
        if (startupLayoutValue === 'default') {
            console.log('Using default layout');
            return;
        }
        
        // Load saved configuration by index
        const savedConfigs = JSON.parse(localStorage.getItem('layoutConfigurations') || '[]');
        const configIndex = parseInt(startupLayoutValue);
        
        if (savedConfigs[configIndex]) {
            console.log('Loading saved configuration:', savedConfigs[configIndex].name);
            this.loadConfiguration(savedConfigs[configIndex]);
        } else {
            console.warn('Startup layout configuration not found, using default');
        }
    }

    loadConfiguration(config) {
        try {
            console.log('Loading configuration:', config.name);
            
            // Clear current layout
            const dashboard = document.getElementById('dashboard');
            const tiles = dashboard.querySelectorAll('.tile:not(.add-tile-btn)');
            tiles.forEach(tile => tile.remove());
            
            // Apply the saved layout
            config.layout.forEach(tileData => {
                this.createTileFromData(tileData);
            });
            
            // Save as current layout
            this.saveLayout();
            
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    }

    createTileFromData(tileData) {
        // This method should create a tile based on the saved tile data
        // For now, let's use a simpler approach by updating the layout directly
        const dashboard = document.getElementById('dashboard');
        
        // Find existing tile or create placeholder
        let tile = document.getElementById(tileData.id);
        if (!tile) {
            // Create a basic tile structure if it doesn't exist
            console.log('Creating tile for:', tileData.type);
            
            // This is a simplified version - you might need to adjust based on your tile creation logic
            tile = document.createElement('div');
            tile.id = tileData.id;
            tile.className = tileData.class;
            tile.setAttribute('data-tile-type', tileData.type);
            
            // Add basic content based on tile type
            tile.innerHTML = `<div class="tile-content">Loading ${tileData.type}...</div>`;
            
            dashboard.appendChild(tile);
        }
        
        // Apply styles
        tile.style.gridColumn = tileData.gridColumn;
        tile.style.gridRow = tileData.gridRow;
        tile.style.display = tileData.hidden ? 'none' : '';
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

    loadSavedLayout() {
        try {
            console.log('Loading saved layout...');
            const savedLayout = localStorage.getItem('smartDisplayHub_currentLayout');
            const savedTiles = localStorage.getItem('smartDisplayHub_tileOrder');
            
            if (savedTiles) {
                const tileOrder = JSON.parse(savedTiles);
                const dashboard = document.getElementById('dashboard');
                
                console.log('Restoring tile order:', tileOrder);
                
                // Reorder existing tiles based on saved order
                tileOrder.forEach(tileData => {
                    const existingTile = dashboard.querySelector(`[data-tile-type="${tileData.type}"]`);
                    if (existingTile) {
                        // Move to end (before add button if it exists)
                        const addBtn = dashboard.querySelector('.add-tile-btn');
                        if (addBtn) {
                            dashboard.insertBefore(existingTile, addBtn);
                        } else {
                            dashboard.appendChild(existingTile);
                        }
                    } else if (tileData.type && tileData.type !== 'add-tile-btn') {
                        // Create missing tile
                        console.log(`Creating missing tile: ${tileData.type}`);
                        this.addNewTile(tileData.type);
                    }
                });
            }
            
            if (savedLayout) {
                this.currentLayout = savedLayout;
            }
            
            console.log('Layout loaded successfully');
        } catch (e) {
            console.warn('Failed to load saved layout:', e);
        }
    }

    saveLayout() {
        try {
            const dashboard = document.getElementById('dashboard');
            const tiles = Array.from(dashboard.children)
                .filter(tile => tile.classList.contains('tile') && !tile.classList.contains('add-tile-btn'))
                .map((tile, index) => ({
                    id: tile.id || `tile-${tile.dataset.tileType}-${index}`,
                    type: tile.dataset.tileType,
                    class: tile.className,
                    hidden: tile.style.display === 'none',
                    order: index,
                    gridColumn: tile.style.gridColumn || '',
                    gridRow: tile.style.gridRow || ''
                }));
            
            // Save both to the layouts system and as current configuration
            this.layouts[this.currentLayout] = tiles;
            localStorage.setItem('smartDisplayHub_layouts', JSON.stringify(this.layouts));
            localStorage.setItem('smartDisplayHub_currentLayout', this.currentLayout);
            localStorage.setItem('smartDisplayHub_tileOrder', JSON.stringify(tiles));
            
            // Show save confirmation
            this.showSaveConfirmation();
            
            console.log('Layout saved successfully:', {
                layout: this.currentLayout,
                tiles: tiles.length,
                tileTypes: tiles.map(t => t.type),
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.warn('Failed to save layout:', e);
            this.showSaveError();
        }
    }

    showSaveConfirmation() {
        // Remove any existing notification
        const existingNotification = document.querySelector('.save-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'save-notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✓</span>
                <span class="notification-text">Layout saved successfully!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    showSaveError() {
        const notification = document.createElement('div');
        notification.className = 'save-notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✗</span>
                <span class="notification-text">Failed to save layout</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
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
        'layoutEditorBtn', 'configManagerBtn', 'settingsBtn', 'themeToggle', 
        'settingsModal', 'closeSettings'
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

// Service Worker registration temporarily disabled for debugging
// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('sw.js').then(() => {
//         console.log('Service Worker registered');
//     }).catch(err => {
//         console.warn('Service Worker registration failed:', err);
//     });
// }
console.log('Service Worker registration temporarily disabled');