// Layout Management System
class LayoutManager {
    constructor() {
        this.layouts = {};
        this.currentLayout = 'default';
        this.gridSettings = {
            columns: 'auto-fit',
            minColumnWidth: 300,
            gap: '1rem',
            autoRows: 'minmax(200px, auto)'
        };
        this.init();
    }

    init() {
        this.loadLayouts();
        this.setupGridObserver();
    }

    setupGridObserver() {
        // Observe grid changes for responsive layout
        if (window.ResizeObserver) {
            const dashboard = document.getElementById('dashboard');
            const resizeObserver = new ResizeObserver(entries => {
                this.handleDashboardResize(entries[0]);
            });
            
            if (dashboard) {
                resizeObserver.observe(dashboard);
            }
        }

        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustLayoutForOrientation();
            }, 100);
        });
    }

    handleDashboardResize(entry) {
        const width = entry.contentRect.width;
        const dashboard = document.getElementById('dashboard');
        
        // Adjust grid based on available width
        if (width < 600) {
            // Mobile: single column
            dashboard.style.gridTemplateColumns = '1fr';
            this.adjustTileSizesForMobile();
        } else if (width < 900) {
            // Tablet: 2 columns
            dashboard.style.gridTemplateColumns = 'repeat(2, 1fr)';
            this.adjustTileSizesForTablet();
        } else if (width < 1200) {
            // Small desktop: 3 columns
            dashboard.style.gridTemplateColumns = 'repeat(3, 1fr)';
            this.adjustTileSizesForDesktop();
        } else {
            // Large desktop: auto-fit
            dashboard.style.gridTemplateColumns = `repeat(auto-fit, minmax(${this.gridSettings.minColumnWidth}px, 1fr))`;
            this.restoreOriginalTileSizes();
        }
    }

    adjustTileSizesForMobile() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.style.gridColumn = '1';
            tile.style.minHeight = '180px';
        });
    }

    adjustTileSizesForTablet() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            if (tile.classList.contains('tile-large')) {
                tile.style.gridColumn = 'span 2';
            } else {
                tile.style.gridColumn = 'span 1';
            }
        });
    }

    adjustTileSizesForDesktop() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            if (tile.classList.contains('tile-large')) {
                tile.style.gridColumn = 'span 2';
            } else if (tile.classList.contains('tile-medium-large')) {
                tile.style.gridColumn = 'span 2';
            } else {
                tile.style.gridColumn = 'span 1';
            }
        });
    }

    restoreOriginalTileSizes() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.style.gridColumn = '';
            tile.style.minHeight = '';
        });
    }

    adjustLayoutForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const dashboard = document.getElementById('dashboard');
        
        if (isLandscape && window.innerHeight < 600) {
            // Landscape mode on small screens
            dashboard.classList.add('landscape-mode');
            this.compactLayout();
        } else {
            dashboard.classList.remove('landscape-mode');
            this.expandLayout();
        }
    }

    compactLayout() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.style.minHeight = '140px';
            tile.style.padding = '0.5rem';
        });
        
        // Reduce font sizes
        document.querySelectorAll('.tile-header h3').forEach(h3 => {
            h3.style.fontSize = '0.9rem';
        });
    }

    expandLayout() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.style.minHeight = '';
            tile.style.padding = '';
        });
        
        // Reset font sizes
        document.querySelectorAll('.tile-header h3').forEach(h3 => {
            h3.style.fontSize = '';
        });
    }

    saveLayout(layoutName = null) {
        const name = layoutName || this.currentLayout;
        const dashboard = document.getElementById('dashboard');
        const tiles = Array.from(dashboard.children);
        
        const layout = {
            name: name,
            tiles: tiles.map((tile, index) => ({
                id: tile.id,
                type: tile.dataset.tileType,
                order: index,
                size: this.getTileSize(tile),
                position: {
                    gridColumn: tile.style.gridColumn || '',
                    gridRow: tile.style.gridRow || ''
                },
                visible: tile.style.display !== 'none',
                customStyles: this.getCustomStyles(tile)
            })),
            gridSettings: { ...this.gridSettings },
            timestamp: new Date().toISOString()
        };
        
        this.layouts[name] = layout;
        this.saveLayoutsToStorage();
        
        return layout;
    }

    loadLayout(layoutName) {
        const layout = this.layouts[layoutName];
        if (!layout) {
            console.warn(`Layout '${layoutName}' not found`);
            return false;
        }
        
        const dashboard = document.getElementById('dashboard');
        
        // Sort tiles according to layout order
        layout.tiles
            .sort((a, b) => a.order - b.order)
            .forEach(tileConfig => {
                const tile = document.getElementById(tileConfig.id);
                if (tile) {
                    // Apply position and size
                    if (tileConfig.position.gridColumn) {
                        tile.style.gridColumn = tileConfig.position.gridColumn;
                    }
                    if (tileConfig.position.gridRow) {
                        tile.style.gridRow = tileConfig.position.gridRow;
                    }
                    
                    // Apply visibility
                    tile.style.display = tileConfig.visible ? '' : 'none';
                    
                    // Apply custom styles
                    if (tileConfig.customStyles) {
                        Object.assign(tile.style, tileConfig.customStyles);
                    }
                    
                    // Reorder in DOM
                    dashboard.appendChild(tile);
                }
            });
        
        // Apply grid settings
        if (layout.gridSettings) {
            this.applyGridSettings(layout.gridSettings);
        }
        
        this.currentLayout = layoutName;
        return true;
    }

    createLayout(layoutName, basedOn = null) {
        if (basedOn && this.layouts[basedOn]) {
            // Clone existing layout
            this.layouts[layoutName] = JSON.parse(JSON.stringify(this.layouts[basedOn]));
            this.layouts[layoutName].name = layoutName;
            this.layouts[layoutName].timestamp = new Date().toISOString();
        } else {
            // Create new layout from current state
            this.saveLayout(layoutName);
        }
        
        this.saveLayoutsToStorage();
        return this.layouts[layoutName];
    }

    deleteLayout(layoutName) {
        if (layoutName === 'default') {
            console.warn('Cannot delete default layout');
            return false;
        }
        
        if (this.layouts[layoutName]) {
            delete this.layouts[layoutName];
            this.saveLayoutsToStorage();
            
            // Switch to default if current layout was deleted
            if (this.currentLayout === layoutName) {
                this.loadLayout('default');
            }
            
            return true;
        }
        
        return false;
    }

    getAvailableLayouts() {
        return Object.keys(this.layouts).map(name => ({
            name: name,
            displayName: this.formatLayoutName(name),
            timestamp: this.layouts[name].timestamp,
            isActive: name === this.currentLayout
        }));
    }

    getTileSize(tile) {
        if (tile.classList.contains('tile-large')) return 'large';
        if (tile.classList.contains('tile-medium-large')) return 'medium-large';
        if (tile.classList.contains('tile-medium')) return 'medium';
        return 'small';
    }

    getCustomStyles(tile) {
        const computedStyle = window.getComputedStyle(tile);
        const customStyles = {};
        
        // Only save styles that differ from defaults
        const relevantProperties = [
            'backgroundColor', 'color', 'borderRadius', 
            'boxShadow', 'transform', 'opacity'
        ];
        
        relevantProperties.forEach(prop => {
            if (tile.style[prop]) {
                customStyles[prop] = tile.style[prop];
            }
        });
        
        return Object.keys(customStyles).length > 0 ? customStyles : null;
    }

    applyGridSettings(settings) {
        const dashboard = document.getElementById('dashboard');
        
        if (settings.columns === 'auto-fit') {
            dashboard.style.gridTemplateColumns = 
                `repeat(auto-fit, minmax(${settings.minColumnWidth}px, 1fr))`;
        } else {
            dashboard.style.gridTemplateColumns = settings.columns;
        }
        
        dashboard.style.gap = settings.gap;
        dashboard.style.gridAutoRows = settings.autoRows;
        
        this.gridSettings = { ...settings };
    }

    formatLayoutName(name) {
        return name.charAt(0).toUpperCase() + 
               name.slice(1).replace(/[-_]/g, ' ');
    }

    resetToDefault() {
        // Remove all custom positioning and styles
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.style.gridColumn = '';
            tile.style.gridRow = '';
            tile.style.display = '';
            
            // Remove custom styles
            ['backgroundColor', 'color', 'borderRadius', 'boxShadow', 
             'transform', 'opacity'].forEach(prop => {
                tile.style[prop] = '';
            });
        });
        
        // Reset grid to default
        const dashboard = document.getElementById('dashboard');
        dashboard.style.gridTemplateColumns = '';
        dashboard.style.gap = '';
        dashboard.style.gridAutoRows = '';
        
        this.currentLayout = 'default';
    }

    exportLayout(layoutName) {
        const layout = this.layouts[layoutName];
        if (!layout) return null;
        
        return {
            version: '1.0',
            layout: layout,
            exported: new Date().toISOString()
        };
    }

    importLayout(layoutData, newName = null) {
        try {
            if (!layoutData.layout || !layoutData.version) {
                throw new Error('Invalid layout format');
            }
            
            const name = newName || layoutData.layout.name || 'imported';
            
            // Ensure unique name
            let finalName = name;
            let counter = 1;
            while (this.layouts[finalName]) {
                finalName = `${name}_${counter}`;
                counter++;
            }
            
            this.layouts[finalName] = {
                ...layoutData.layout,
                name: finalName,
                timestamp: new Date().toISOString()
            };
            
            this.saveLayoutsToStorage();
            return finalName;
            
        } catch (error) {
            console.error('Failed to import layout:', error);
            return null;
        }
    }

    // Profile-specific layouts
    createProfile(profileName, layouts = []) {
        const profile = {
            name: profileName,
            layouts: layouts,
            activeLayout: layouts[0] || 'default',
            settings: {
                autoSwitch: false,
                schedule: null
            },
            created: new Date().toISOString()
        };
        
        const profiles = this.loadProfiles();
        profiles[profileName] = profile;
        localStorage.setItem('smartDisplayHub_profiles', JSON.stringify(profiles));
        
        return profile;
    }

    loadProfiles() {
        try {
            return JSON.parse(localStorage.getItem('smartDisplayHub_profiles')) || {};
        } catch (e) {
            return {};
        }
    }

    loadLayoutsFromStorage() {
        try {
            const stored = localStorage.getItem('smartDisplayHub_layouts');
            if (stored) {
                this.layouts = JSON.parse(stored);
            } else {
                // Create default layout
                this.layouts = {
                    default: this.createDefaultLayout()
                };
            }
        } catch (e) {
            console.warn('Failed to load layouts:', e);
            this.layouts = {
                default: this.createDefaultLayout()
            };
        }
    }

    saveLayoutsToStorage() {
        try {
            localStorage.setItem('smartDisplayHub_layouts', JSON.stringify(this.layouts));
        } catch (e) {
            console.warn('Failed to save layouts:', e);
        }
    }

    createDefaultLayout() {
        return {
            name: 'default',
            tiles: [],
            gridSettings: { ...this.gridSettings },
            timestamp: new Date().toISOString()
        };
    }

    // Animation utilities for layout transitions
    animateLayoutChange(callback) {
        const dashboard = document.getElementById('dashboard');
        const tiles = document.querySelectorAll('.tile');
        
        // Fade out
        dashboard.style.transition = 'opacity 0.3s ease';
        dashboard.style.opacity = '0';
        
        setTimeout(() => {
            // Apply changes
            if (callback) callback();
            
            // Fade in
            dashboard.style.opacity = '1';
            
            // Remove transition after animation
            setTimeout(() => {
                dashboard.style.transition = '';
            }, 300);
        }, 150);
    }
}

// Make available globally
window.LayoutManager = LayoutManager;