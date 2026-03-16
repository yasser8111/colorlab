/**
 * ColorLab Main Application Controller
 * Orchestrates interactions between UI, Generator, Preview, and Storage modules.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- State ---
    let currentPalettes = [];
    
    // --- DOM Elements ---
    const form = document.getElementById('generator-form');
    const colorPicker = document.getElementById('base-color-picker');
    const colorInput = document.getElementById('base-color');
    const typeSelect = document.getElementById('website-type');

    // --- Sidebar Toggle ---
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const toggleSidebarIcon = document.getElementById('toggle-sidebar-icon');
    const startGeneratingBtn = document.getElementById('start-generating-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const appLayout = document.querySelector('.app-layout');
    const backdrop = document.getElementById('sidebar-backdrop');

    function updateToggleIcon(isOpen) {
        if (!toggleSidebarIcon) return;
        toggleSidebarIcon.src = isOpen ? '../icons/x.svg' : '../icons/menu.svg';
        toggleSidebarIcon.alt = isOpen ? 'إغلاق' : 'القائمة';
    }
    
    function openSidebar() {
        sidebar.classList.add('open');
        updateToggleIcon(true);
        if (window.innerWidth <= 991) {
            if (backdrop) backdrop.classList.add('visible');
            document.body.style.overflow = 'hidden';
        } else {
            appLayout.classList.add('sidebar-open');
        }
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        updateToggleIcon(false);
        if (backdrop) backdrop.classList.remove('visible');
        appLayout.classList.remove('sidebar-open');
        document.body.style.overflow = '';
    }

    function toggleSidebar() {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    }

    if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', toggleSidebar);
    if (startGeneratingBtn) startGeneratingBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);

    // Sidebar starts closed on all screen sizes

    // --- Input Synchronization ---

    /**
     * Resolves any valid CSS color string (name, hex, rgb, hsl, etc.)
     * to a 6-digit hex string using an off-screen canvas.
     * Returns null if the color is invalid.
     */
    function resolveColorToHex(cssColor) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000000'; // reset
            ctx.fillStyle = cssColor;
            const resolved = ctx.fillStyle; // browser normalizes to hex or rgb()
            // If the browser couldn't parse it, fillStyle stays as the reset value
            if (resolved === '#000000' && cssColor.trim().toLowerCase() !== 'black' && cssColor.trim().toLowerCase() !== '#000' && cssColor.trim().toLowerCase() !== '#000000') {
                // double check — set white first, try again
                ctx.fillStyle = '#ffffff';
                ctx.fillStyle = cssColor;
                if (ctx.fillStyle === '#ffffff') return null; // still invalid
            }
            // Convert rgb(...) format to hex if needed
            const hex = ctx.fillStyle;
            if (hex.startsWith('#')) return hex.toUpperCase();
            // Handle rgb(r, g, b) format
            const m = hex.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            if (m) {
                return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
            }
            return null;
        } catch {
            return null;
        }
    }

    // When visual picker changes, update text input
    colorPicker.addEventListener('input', (e) => {
        colorInput.value = e.target.value.toUpperCase();
    });

    // When text input changes, resolve any CSS color and sync the picker square
    colorInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (!val) return;
        const hex = resolveColorToHex(val);
        if (hex) {
            colorPicker.value = hex;
        }
    });

    // --- Core Generation Flow ---
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let inputVal = colorInput.value.trim();
        let targetType = typeSelect.value;
        
        if (!inputVal) {
            window.UI.showToast("يرجى إدخال لون أساسي.");
            return;
        }

        // 1. Enter Generating UI State (Fake backend latency for perceived value)
        window.UI.setGeneratingState();
        
        // 2. Perform Generation Asynchronously to unblock UI paint
        setTimeout(() => {
            try {
                // Generate palettes
                currentPalettes = window.ColorGenerator.generate(inputVal, targetType);
                
                // 3. Render Results
                window.UI.renderPalettes(
                    currentPalettes,
                    handlePaletteSelection,
                    handlePaletteSave
                );
                
                // Transition UI
                window.UI.setResultsState();
                
                // Auto-select the top ranked palette to populate the preview
                if (currentPalettes.length > 0) {
                    handlePaletteSelection(currentPalettes[0]);
                }
                
                window.UI.showToast("تم توليد 10 لوحات ألوان إحترافية!");
                
            } catch (err) {
                console.error("Generation failed:", err);
                window.UI.showToast("خطأ في توليد اللوحات. يرجى التحقق من المدخلات.");
                // Reset UI
                document.getElementById('empty-view').style.display = 'block';
                document.getElementById('generating-view').style.display = 'none';
                document.getElementById('generate-btn').disabled = false;
                document.getElementById('generate-btn').innerText = 'توليد الأنظمة';
            }
        },3000);
    });

    // --- Sub-Actions ---

    function handlePaletteSelection(palette) {
        if (window.Preview) {
            window.Preview.update(palette);
        } else {
            console.warn("Preview module not loaded yet.");
        }
    }

    function handlePaletteSave(palette) {
        if (window.Storage) {
            window.Storage.save(palette);
            window.UI.showToast(`تم حفظ ${palette.name}!`);
        } else {
            console.warn("Storage module not loaded yet.");
        }
    }
    
    // Initial Load - Check Storage
    if (window.Storage) {
        window.Storage.init();
    }

});
