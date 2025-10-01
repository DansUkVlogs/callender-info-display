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
        const dashboard = document.querySelector('.dashboard');
        const tiles = document.querySelectorAll('.tile');
        
        if (this.isEditMode) {
            overlay.classList.remove('hidden');
            dashboard.classList.add('edit-mode');
            
            tiles.forEach(tile => {
                tile.classList.add('edit-mode', 'wobble');
                this.makeTileDraggable(tile);
                this.addRemoveButton(tile);
            });
            
            this.addTileButton();
        } else {
            overlay.classList.add('hidden');
            dashboard.classList.remove('edit-mode');
            
            tiles.forEach(tile => {
                tile.classList.remove('edit-mode', 'selected', 'wobble');
                this.makeTileNonDraggable(tile);
                this.removeRemoveButton(tile);
            });
            
            this.removeAddTileButton();
            this.saveLayout();
        }
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

    showAddTileDialog() {
        // This will show a dialog to add tiles back
        alert('Add tile functionality coming soon! For now, refresh the page to restore removed tiles.');
    }

    makeTileDraggable(tile) {
        // Add resize handles and drag handle
        this.addResizeHandles(tile);
        this.addDragHandle(tile);
        
        let isDragging = false;
        let dragStartX, dragStartY;
        let originalIndex;
        
        const handleMouseDown = (e) => {
            // Only allow dragging from the drag handle or tile header
            const isDragHandle = e.target.classList.contains('drag-handle');
            const isHeader = e.target.closest('.tile-header');
            const isInteractive = e.target.closest('button, input, a, .resize-handle');
            
            if (!isDragHandle && !isHeader) return;
            if (isInteractive) return;
            
            isDragging = true;
            
            // Prevent text selection
            e.preventDefault();
            e.stopPropagation();
            
            // Store original position
            const dashboard = document.getElementById('dashboard');
            originalIndex = Array.from(dashboard.children).indexOf(tile);
            
            // Get starting mouse position
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            
            // Get tile position
            const rect = tile.getBoundingClientRect();
            
            // Create a visual clone for dragging
            const clone = tile.cloneNode(true);
            clone.id = 'drag-clone';
            clone.style.position = 'fixed';
            clone.style.left = rect.left + 'px';
            clone.style.top = rect.top + 'px';
            clone.style.width = rect.width + 'px';
            clone.style.height = rect.height + 'px';
            clone.style.zIndex = '10000';
            clone.style.opacity = '0.8';
            clone.style.transform = 'rotate(3deg)';
            clone.style.pointerEvents = 'none';
            clone.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
            document.body.appendChild(clone);
            
            // Make original tile semi-transparent
            tile.style.opacity = '0.3';
            tile.classList.add('dragging-source');
            
            // Show enhanced grid
            this.showEnhancedGrid();
            
            // Add document listeners
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // Disable text selection on body
            document.body.style.userSelect = 'none';
        };
        
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const clone = document.getElementById('drag-clone');
            if (!clone) return;
            
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            
            // Move the clone
            const rect = tile.getBoundingClientRect();
            clone.style.left = (rect.left + deltaX) + 'px';
            clone.style.top = (rect.top + deltaY) + 'px';
            
            // Calculate grid position and show preview
            this.showDropPreview(e.clientX, e.clientY, tile);
        };
        
        const handleMouseUp = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            
            // Remove document listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Remove clone
            const clone = document.getElementById('drag-clone');
            if (clone) clone.remove();
            
            // Reset original tile
            tile.style.opacity = '';
            tile.classList.remove('dragging-source');
            
            // Re-enable text selection
            document.body.style.userSelect = '';
            
            // Calculate drop position and reorder tiles
            this.handleDrop(e.clientX, e.clientY, tile, originalIndex);
            
            // Hide grid overlay
            this.hideEnhancedGrid();
            
            // Save layout
            setTimeout(() => {
                this.saveLayout();
            }, 100);
        };
        
        // Add the main event listener to the tile
        tile.addEventListener('mousedown', handleMouseDown);
        
        // Store for cleanup
        tile._dragHandler = handleMouseDown;
    }

    addDragHandle(tile) {
        // Don't add if already exists
        if (tile.querySelector('.drag-handle')) return;
        
        const header = tile.querySelector('.tile-header');
        if (header) {
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '⋮⋮';
            dragHandle.title = 'Drag to move';
            header.appendChild(dragHandle);
        }
    }

    removeDragHandle(tile) {
        const handle = tile.querySelector('.drag-handle');
        if (handle) {
            handle.remove();
        }
    }

    makeTileNonDraggable(tile) {
        tile.draggable = false;
        
        // Remove resize handles and drag handle
        this.removeResizeHandles(tile);
        this.removeDragHandle(tile);
        
        // Remove drag event listener
        if (tile._dragHandler) {
            tile.removeEventListener('mousedown', tile._dragHandler);
            delete tile._dragHandler;
        }
        
        // Reset styles
        tile.style.userSelect = '';
        tile.style.webkitUserSelect = '';
        tile.style.position = '';
        tile.style.left = '';
        tile.style.top = '';
        tile.style.zIndex = '';
        tile.style.pointerEvents = '';
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

    showEnhancedGrid() {
        const dashboard = document.getElementById('dashboard');
        
        // Remove existing grid overlay
        const existingOverlay = document.querySelector('.enhanced-grid-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        // Create enhanced grid overlay
        const overlay = document.createElement('div');
        overlay.className = 'enhanced-grid-overlay';
        
        // Calculate grid dimensions
        const dashboardRect = dashboard.getBoundingClientRect();
        const gridCols = Math.floor(dashboardRect.width / 250); // 250px per grid unit
        const gridRows = Math.ceil(dashboardRect.height / 200); // 200px per grid unit
        
        // Create grid cells
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.style.left = (col * 250) + 'px';
                cell.style.top = (row * 200) + 'px';
                cell.style.width = '250px';
                cell.style.height = '200px';
                cell.dataset.col = col;
                cell.dataset.row = row;
                overlay.appendChild(cell);
            }
        }
        
        dashboard.appendChild(overlay);
        dashboard.classList.add('showing-grid');
    }

    hideEnhancedGrid() {
        const overlay = document.querySelector('.enhanced-grid-overlay');
        if (overlay) overlay.remove();
        
        const dashboard = document.getElementById('dashboard');
        dashboard.classList.remove('showing-grid');
        
        // Remove all drop previews
        document.querySelectorAll('.drop-preview').forEach(preview => preview.remove());
    }

    showDropPreview(mouseX, mouseY, draggedTile) {
        // Remove existing preview
        const existingPreview = document.querySelector('.drop-preview');
        if (existingPreview) existingPreview.remove();
        
        // Calculate which grid cell the mouse is over
        const dashboard = document.getElementById('dashboard');
        const dashboardRect = dashboard.getBoundingClientRect();
        
        const relativeX = mouseX - dashboardRect.left;
        const relativeY = mouseY - dashboardRect.top;
        
        const col = Math.floor(relativeX / 250);
        const row = Math.floor(relativeY / 200);
        
        // Highlight the target grid cell
        const targetCell = document.querySelector(`.grid-cell[data-col="${col}"][data-row="${row}"]`);
        if (targetCell) {
            targetCell.classList.add('drop-target');
            
            // Remove previous drop targets
            document.querySelectorAll('.grid-cell.drop-target').forEach(cell => {
                if (cell !== targetCell) cell.classList.remove('drop-target');
            });
            
            // Show drop preview
            const preview = document.createElement('div');
            preview.className = 'drop-preview';
            preview.style.left = targetCell.style.left;
            preview.style.top = targetCell.style.top;
            preview.style.width = targetCell.style.width;
            preview.style.height = targetCell.style.height;
            
            document.querySelector('.enhanced-grid-overlay').appendChild(preview);
        }
    }

    handleDrop(mouseX, mouseY, draggedTile, originalIndex) {
        const dashboard = document.getElementById('dashboard');
        const dashboardRect = dashboard.getBoundingClientRect();
        
        const relativeX = mouseX - dashboardRect.left;
        const relativeY = mouseY - dashboardRect.top;
        
        const col = Math.floor(relativeX / 250);
        const row = Math.floor(relativeY / 200);
        
        // Calculate the target index based on grid position
        const gridCols = Math.floor(dashboardRect.width / 250);
        let targetIndex = (row * gridCols) + col;
        
        // Get all tiles (excluding add-tile-btn)
        const allTiles = Array.from(dashboard.children).filter(child => 
            child.classList.contains('tile') && !child.classList.contains('add-tile-btn')
        );
        
        // Clamp target index to valid range
        targetIndex = Math.max(0, Math.min(targetIndex, allTiles.length - 1));
        
        // Only reorder if position actually changed
        if (targetIndex !== originalIndex) {
            this.reorderTiles(draggedTile, targetIndex);
        }
    }

    reorderTiles(draggedTile, targetIndex) {
        const dashboard = document.getElementById('dashboard');
        const allTiles = Array.from(dashboard.children).filter(child => 
            child.classList.contains('tile') && !child.classList.contains('add-tile-btn')
        );
        
        // Remove dragged tile from current position
        draggedTile.remove();
        
        // Insert at new position
        if (targetIndex >= allTiles.length - 1) {
            // Insert at end (before add-tile-btn if it exists)
            const addTileBtn = dashboard.querySelector('.add-tile-btn');
            if (addTileBtn) {
                dashboard.insertBefore(draggedTile, addTileBtn);
            } else {
                dashboard.appendChild(draggedTile);
            }
        } else {
            // Insert before the tile at target index
            const targetTile = allTiles[targetIndex];
            dashboard.insertBefore(draggedTile, targetTile);
        }
        
        // Add animation for smooth repositioning
        draggedTile.style.transform = 'scale(1.05)';
        setTimeout(() => {
            draggedTile.style.transform = '';
        }, 200);
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
        
        // Auto-save layout after swapping tiles
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
        const savedTheme = this.settings.theme || 'auto';
        this.applyTheme(savedTheme);
        
        // Set radio button
        document.querySelector(`input[name="theme"][value="${savedTheme}"]`).checked = true;
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // API settings now hardcoded in tile classes - no inputs to populate
        document.getElementById('layoutProfile').value = this.currentLayout;
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
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
            const tiles = Array.from(dashboard.children)
                .filter(tile => !tile.classList.contains('add-tile-btn'))
                .map(tile => ({
                    id: tile.id,
                    type: tile.dataset.tileType,
                    class: tile.className,
                    hidden: tile.style.display === 'none',
                    order: Array.from(dashboard.children).indexOf(tile)
                }));
            
            this.layouts[this.currentLayout] = tiles;
            localStorage.setItem('smartDisplayHub_layouts', JSON.stringify(this.layouts));
            
            // Show save confirmation
            this.showSaveConfirmation();
            
            console.log('Layout saved successfully:', {
                layout: this.currentLayout,
                tiles: tiles.length,
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