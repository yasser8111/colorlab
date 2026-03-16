/**
 * ColorLab Preview Module
 * Binds generated palette data to the Live UI Mockup via CSS Variables.
 */

window.Preview = (function() {
    
    const previewContainer = document.getElementById('live-preview');

    function updatePreviewVariables(palette) {
        if (!previewContainer) return;
        
        const c = palette.colors;
        
        // Map abstract roles to concrete CSS properties scoped to the mock UI
        previewContainer.style.setProperty('--preview-primary', c.primary);
        previewContainer.style.setProperty('--preview-secondary', c.secondary);
        previewContainer.style.setProperty('--preview-accent', c.accent);
        
        previewContainer.style.setProperty('--preview-bg', c.background);
        previewContainer.style.setProperty('--preview-surface', c.surface);
        previewContainer.style.setProperty('--preview-card', c.card);
        previewContainer.style.setProperty('--preview-border', c.border);
        
        previewContainer.style.setProperty('--preview-text-pri', c.textPrimary);
        previewContainer.style.setProperty('--preview-text-sec', c.textSecondary);
        
        previewContainer.style.setProperty('--preview-success', c.success);
        previewContainer.style.setProperty('--preview-warning', c.warning);
        previewContainer.style.setProperty('--preview-error', c.error);
        
        // Optionally bind fonts if we wanted to dynamically change typography
        previewContainer.style.setProperty('--preview-font', c.fontBody);
    }

    return {
        update: updatePreviewVariables
    };

})();
