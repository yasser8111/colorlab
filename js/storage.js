/**
 * ColorLab Storage Module
 * Manages LocalStorage persistence for user-saved palettes.
 */

window.Storage = (function() {
    
    const STORAGE_KEY = 'colorlab_saved_palettes';
    const container = document.getElementById('saved-palettes-container');
    
    let savedPalettes = [];

    function init() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            try {
                savedPalettes = JSON.parse(data);
            } catch (e) {
                console.error("Failed to parse local storage", e);
                savedPalettes = [];
            }
        }
        render();
    }

    function savePalette(palette) {
        // Prevent exact duplicates by ID
        if (savedPalettes.find(p => p.id === palette.id)) {
            if (window.UI) window.UI.showToast("Palette already saved.");
            return;
        }
        
        savedPalettes.unshift(palette);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPalettes));
        render();
    }

    function removePalette(id) {
        savedPalettes = savedPalettes.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPalettes));
        render();
        if (window.UI) window.UI.showToast("Palette removed.");
    }

    function render() {
        if (!container) return;
        
        if (savedPalettes.length === 0) {
            container.innerHTML = '<div class="text-sm text-muted mt-4">No palettes saved yet.</div>';
            return;
        }

        container.innerHTML = '';
        savedPalettes.forEach(palette => {
            const item = document.createElement('div');
            item.className = 'saved-item';
            
            // Build a mini swatch row of the most important colors
            const c = palette.colors;
            const importantHexes = [c.primary, c.secondary, c.background, c.surface];
            const swatchDivs = importantHexes.map(hex => `<div style="background-color: ${hex};"></div>`).join('');

            item.innerHTML = `
                <div style="flex:1; overflow:hidden;">
                    <div style="font-size:0.8rem; font-weight:600; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" title="${palette.name} (${palette.websiteType})">${palette.name}</div>
                    <div class="saved-item-colors mt-1">
                        ${swatchDivs}
                    </div>
                </div>
                <div style="display:flex; gap: 0.25rem;">
                    <button class="btn-icon load-btn" data-id="${palette.id}" title="Load to Preview"><img src="../icons/eye.svg" width="16" height="16" alt="Preview"></button>
                    <button class="btn-icon copy-btn" data-id="${palette.id}" title="Copy CSS"><img src="../icons/copy.svg" width="16" height="16" alt="Copy"></button>
                    <button class="btn-icon del-btn" data-id="${palette.id}" title="Delete"><img src="../icons/trash.svg" width="16" height="16" alt="Delete"></button>
                </div>
            `;

            // Setup events
            item.querySelector('.del-btn').addEventListener('click', () => removePalette(palette.id));
            
            item.querySelector('.load-btn').addEventListener('click', () => {
                if (window.Preview) window.Preview.update(palette);
            });
            
            item.querySelector('.copy-btn').addEventListener('click', () => {
                if (window.UI) {
                    let rootVars = `/* ${palette.name} Theme (Saved) */\n:root {\n`;
                    for (const [key, value] of Object.entries(palette.colors)) {
                        if (key === 'warnings' || key.startsWith('font')) continue;
                        // snake-case the key roughly
                        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
                        rootVars += `    --color-${cssKey}: ${value};\n`;
                    }
                    rootVars += `}\n`;
                    window.UI.copyToClipboard(rootVars, 'Copied Saved Palette CSS!');
                }
            });

            container.appendChild(item);
        });
    }

    return {
        init,
        save: savePalette,
        remove: removePalette
    };

})();
