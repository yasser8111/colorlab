/**
 * ColorLab UI Module
 * Handles DOM manipulations, state transitions, and toast notifications.
 */

window.UI = (function() {
    
    // DOM Elements
    const emptyView = document.getElementById('empty-view');
    const generatingView = document.getElementById('generating-view');
    const resultsView = document.getElementById('results-view');
    const paletteGrid = document.getElementById('palette-grid');
    const toastContainer = document.getElementById('toast-container');
    const livePreview = document.getElementById('live-preview');
    const generateBtn = document.getElementById('generate-btn');

    // --- 1. State Transitions ---
    
    function setGeneratingState() {
        emptyView.style.display = 'none';
        resultsView.style.display = 'none';
        generatingView.style.display = 'block';
        livePreview.style.display = 'none';
        
        // Lock inputs
        generateBtn.disabled = true;
        generateBtn.innerText = 'جاري التحليل...';
    }

    function setResultsState() {
        generatingView.style.display = 'none';
        emptyView.style.display = 'none';
        resultsView.style.display = 'block';
        
        // Show BOTH Grid Cards and Live Preview
        livePreview.style.display = 'block';
        paletteGrid.style.display = 'grid';
        
        // Reset state for generation button
        generateBtn.disabled = false;
        generateBtn.innerText = 'توليد الأنظمة';
    }

    // --- 2. Notification Engine ---

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = message;
        
        toastContainer.appendChild(toast);
        
        // Trigger reflow for animation
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300); // Wait for transition
        }, 3000);
    }

    function copyToClipboard(text, message) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(message || `تم نسخ ${text}`);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showToast('فشل النسخ إلى الحافظة.');
        });
    }

    // --- 3. Grid Rendering ---
    
    // Helper to order swatches visually in the card grid
    const visibleSwatchOrder = [
        { key: 'primary', label: 'أساسي' },
        { key: 'secondary', label: 'ثانوي' },
        { key: 'accent', label: 'مميز' },
        { key: 'background', label: 'خلفية' },
        { key: 'surface', label: 'سطح' },
        { key: 'card', label: 'بطاقة' },
        { key: 'border', label: 'إطار' },
        { key: 'textPrimary', label: 'نص أساسي' },
        { key: 'textSecondary', label: 'نص ثانوي' }
    ];

    const fullSwatchOrder = [
        ...visibleSwatchOrder,
        { key: 'success', label: 'نجاح' },
        { key: 'warning', label: 'تحذير' },
        { key: 'error', label: 'خطأ' }
    ];

    function createSwatchHTML(role, hex, warnings) {
        const hasWarning = warnings.includes(role.key);
        const warningIndicator = hasWarning ? `<div class="contrast-warning" title="تباين منخفض مقابل الخلفية">!</div>` : '';
        
        // Calculate a safe text color for the internal label
        const lum = window.ColorGenerator ? window.ColorGenerator.checkContrast(hex, '#FFFFFF') : 5;
        const textColor = lum > 2.2 ? '#FFFFFF' : '#000000';

        return `
            <div class="swatch-item" style="background-color: ${hex}; color: ${textColor};" data-hex="${hex}" data-action="copy">
                ${warningIndicator}
                <div class="swatch-info">
                    <span class="swatch-name">${role.label}</span>
                    <span class="swatch-hex">${hex}</span>
                </div>
            </div>
        `;
    }

    function renderPalettes(palettes, onSelectCallback, onSaveCallback) {
        paletteGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        palettes.forEach((palette, index) => {
            const card = document.createElement('div');
            card.className = `card palette-card ${index === 0 ? 'active' : ''}`;
            card.dataset.id = palette.id;

            let swatchesHTML = visibleSwatchOrder.map(role => {
                return createSwatchHTML(role, palette.colors[role.key], palette.warnings);
            }).join('');

            card.innerHTML = `
                <div class="palette-header" style="align-items: flex-start;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">${palette.name}</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-secondary copy-all-btn" data-id="${palette.id}">نسخ الكل</button>
                        <button class="btn btn-sm btn-primary save-btn" data-id="${palette.id}">حفظ</button>
                    </div>
                </div>
                <div class="swatch-grid">
                    ${swatchesHTML}
                </div>
            `;

            // Event Delegation within card
            card.addEventListener('click', (e) => {
                
                // Handle sub-action clicks (Copy/Save)
                if (e.target.closest('[data-action="copy"]')) {
                    e.stopPropagation();
                    const hexToCopy = e.target.closest('[data-action="copy"]').dataset.hex;
                    copyToClipboard(hexToCopy, `تم نسخ ${hexToCopy}`);
                    return;
                }
                
                if (e.target.classList.contains('save-btn')) {
                    e.stopPropagation();
                    if (onSaveCallback) onSaveCallback(palette);
                    return;
                }
                
                if (e.target.classList.contains('copy-all-btn')) {
                    e.stopPropagation();
                    copyAllCSSVars(palette);
                    return;
                }

                // Handle Card Selection (Updating Preview)
                document.querySelectorAll('.palette-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                if (onSelectCallback) onSelectCallback(palette);
            });

            fragment.appendChild(card);
        });

        paletteGrid.appendChild(fragment);
    }

    function copyAllCSSVars(palette) {
        let rootVars = `/* ${palette.name} Theme */\n:root {\n`;
        fullSwatchOrder.forEach(role => {
            const label = role.label === 'نص أساسي' ? 'text-primary' : 
                          role.label === 'نص ثانوي' ? 'text-secondary' : 
                          role.label === 'أساسي' ? 'primary' :
                          role.label === 'ثانوي' ? 'secondary' :
                          role.label === 'مميز' ? 'accent' :
                          role.label === 'خلفية' ? 'background' :
                          role.label === 'سطح' ? 'surface' :
                          role.label === 'بطاقة' ? 'card' :
                          role.label === 'إطار' ? 'border' :
                          role.label === 'نجاح' ? 'success' :
                          role.label === 'تحذير' ? 'warning' :
                          role.label === 'خطأ' ? 'error' : 
                          role.label.toLowerCase().replace(' ', '-');
            rootVars += `    --color-${label}: ${palette.colors[role.key]};\n`;
        });
        rootVars += `}\n`;
        copyToClipboard(rootVars, 'تم نسخ متغيرات CSS!');
    }

    return {
        setGeneratingState,
        setResultsState,
        showToast,
        copyToClipboard,
        renderPalettes
    };

})();
