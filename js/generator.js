/**
 * ColorLab Generator Module
 * Pure Vanilla JavaScript implementation of color science algorithms.
 */

window.ColorGenerator = (function() {
    
    // --- 1. Parsing & Conversion Utilities ---
    
    function parseToHex(input) {
        // Create a temporary element to let the browser parse color names or rgb()
        const div = document.createElement('div');
        div.style.color = input;
        document.body.appendChild(div);
        
        // Get the computed RGB color
        const computed = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        
        // Convert computed "rgb(r, g, b)" back to Hex
        const rgb = computed.match(/\d+/g);
        if (!rgb) return '#1A56FF'; // Fallback
        
        const r = parseInt(rgb[0]).toString(16).padStart(2, '0');
        const g = parseInt(rgb[1]).toString(16).padStart(2, '0');
        const b = parseInt(rgb[2]).toString(16).padStart(2, '0');
        
        return `#${r}${g}${b}`.toUpperCase();
    }

    function hexToHsl(hex) {
        let r = parseInt(hex.substring(1, 3), 16) / 255;
        let g = parseInt(hex.substring(3, 5), 16) / 255;
        let b = parseInt(hex.substring(5, 7), 16) / 255;

        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; 
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
    }

    // --- 2. Contrast & WCAG Checking ---
    
    function getLuminance(hex) {
        const rgb = parseInt(hex.substring(1), 16);
        let r = (rgb >> 16) & 0xff;
        let g = (rgb >>  8) & 0xff;
        let b = (rgb >>  0) & 0xff;

        const a = [r, g, b].map(function (v) {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function getContrastRatio(hex1, hex2) {
        const lum1 = getLuminance(hex1);
        const lum2 = getLuminance(hex2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    // --- 3. Harmony Strategies ---
    
    function getHarmony(h, s, l, offsetBase, attemptIndex) {
        // Jitter the offset slightly for permutation generation
        let jitter = (attemptIndex - 4) * 5; 
        let newH = (h + offsetBase + jitter) % 360;
        if (newH < 0) newH += 360;
        
        // Prevent mud by assuring minimum saturation for brand
        let newS = Math.min(100, Math.max(30, s + (attemptIndex % 3 === 0 ? 10 : -10)));
        return { h: newH, s: newS, l };
    }

    // --- 4. Semantic Role Generation ---
    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function generateRoles(baseHsl, secondaryHsl, accentHsl, isDark) {
        const p = {...baseHsl};
        const s = {...secondaryHsl};
        const a = {...accentHsl};

        const palette = {};

        // 1. Primary Colors
        palette.primary = hslToHex(p.h, p.s, p.l);
        palette.secondary = hslToHex(s.h, s.s, s.l);
        palette.accent = hslToHex(a.h, a.s, a.l);

        // 2. Backgrounds & Surfaces (Tinted by primary hue to feel cohesive)
        if (isDark) {
            // Very dark, tinted
            palette.background = hslToHex(p.h, Math.min(p.s, 15), 5); // Near black
            palette.surface = hslToHex(p.h, Math.min(p.s, 15), 9);    // Slightly lighter
            palette.card = hslToHex(p.h, Math.min(p.s, 15), 14);      // Elevated
            palette.border = hslToHex(p.h, Math.min(p.s, 15), 25);    // Visible edges
            
            // Text values
            palette.textPrimary = hslToHex(p.h, 10, 95);              // Almost white
            palette.textSecondary = hslToHex(p.h, 15, 65);            // Muted gray
        } else {
            // Very light, tinted
            palette.background = hslToHex(p.h, Math.min(p.s, 10), 98); // Near white
            palette.surface = hslToHex(p.h, Math.min(p.s, 10), 96);    // Slightly darker for contrast against bg? No, typically bg is darkest light color
            palette.card = hslToHex(p.h, Math.min(p.s, 10), 100);      // Pure white card
            palette.border = hslToHex(p.h, Math.min(p.s, 15), 90);     // Light gray
            
            // Text values
            palette.textPrimary = hslToHex(p.h, 15, 10);              // Almost black
            palette.textSecondary = hslToHex(p.h, 15, 40);            // Middle gray
        }

        // 3. System States (Fixed hues, adjusted saturation/lightness)
        // Success: Green (~120deg)
        palette.success = hslToHex(140, 65, isDark ? 40 : 45);
        // Warning: Yellow/Orange (~35deg)
        palette.warning = hslToHex(35, 80, isDark ? 45 : 50);
        // Error: Red (~0deg)
        palette.error = hslToHex(0, 75, isDark ? 55 : 50);

        // Calculate contrast scores to warn UI if ratio falls below WCAG 2.1 AA (4.5)
        palette.warnings = [];
        if (getContrastRatio(palette.textPrimary, palette.background) < 4.5) {
            palette.warnings.push('textPrimary');
        }
        if (getContrastRatio(palette.textSecondary, palette.background) < 4.5) {
            palette.warnings.push('textSecondary');
        }
        // White text on primary button assumption check
        if (getContrastRatio("#FFFFFF", palette.primary) < 4.5) {
            palette.warnings.push('primary'); // Note: button background might need dark text
        }

        // Typography Recommendations
        palette.fontHeadings = "'Inter', sans-serif";
        palette.fontBody = "'Inter', sans-serif";

        return palette;
    }

    // --- 5. Main API Payload Generator ---
    
    function generateSystems(baseHexInput, websiteType) {
        const hex = parseToHex(baseHexInput);
        const baseHsl = hexToHsl(hex);
        
        let palettes = [];
        
        // Define exact angle strategies we want to try (Complementary, Split, Analogous, Triadic, Tetradic)
        // 10 attempts
        const strategies = [
            { name: "تركيز المكمل", angle1: 180, angle2: 180, dark: false },
            { name: "مماثل بارد", angle1: 30, angle2: 60, dark: false },
            { name: "مماثل دافئ", angle1: -30, angle2: -60, dark: false },
            { name: "انفجار ثلاثي", angle1: 120, angle2: 240, dark: false },
            { name: "مكمل منقسم", angle1: 150, angle2: 210, dark: false },
            // Dark mode equivalents
            { name: "منتصف الليل المكمل", angle1: 180, angle2: 180, dark: true },
            { name: "مماثل داكن", angle1: 30, angle2: 60, dark: true },
            { name: "ثلاثي نيون", angle1: 120, angle2: 240, dark: true },
            { name: "أحادي اللون فاتح", angle1: 0, angle2: 0, dark: false }, // Monochromatic adjustments purely on saturation/lightness
            { name: "أحادي اللون عميق", angle1: 0, angle2: 0, dark: true }
        ];

        // Tweak heuristics based on websiteType
        let saturationMod = 0;
        if (websiteType === "corporate" || websiteType === "dashboard") {
            saturationMod = -15; // More muted
        } else if (websiteType === "saas" || websiteType === "mobileapp") {
            saturationMod = 10; // Vibrant
        }

        strategies.forEach((strat, index) => {
            let workingHsl = { ...baseHsl };
            workingHsl.s = clamp(workingHsl.s + saturationMod, 10, 100);

            // Calculate secondary & accent based on angled strategies
            let secHsl = getHarmony(workingHsl.h, workingHsl.s, workingHsl.l, strat.angle1, index);
            let accHsl = getHarmony(workingHsl.h, workingHsl.s, workingHsl.l, strat.angle2, index);

            // For Monochromatic, aggressively alter lightness instead of hue
            if (strat.angle1 === 0 && strat.angle2 === 0) {
                secHsl.l = clamp(secHsl.l + 30, 20, 80);
                secHsl.s = clamp(secHsl.s - 20, 10, 80);
                accHsl.l = clamp(accHsl.l - 20, 20, 80);
            }

            // Generate full role map
            const roles = generateRoles(workingHsl, secHsl, accHsl, strat.dark);
            
            // Artificial Ranking Value (Sort highest contrast combos to the top)
            const contrastScore = getContrastRatio(roles.textPrimary, roles.background) + getContrastRatio(roles.primary, roles.background);

            palettes.push({
                id: crypto.randomUUID(),
                name: strat.name,
                isDark: strat.dark,
                colors: roles,
                baseColor: hex,
                websiteType: websiteType,
                score: contrastScore,
                warnings: roles.warnings
            });
        });

        // Sort by score descending (most balanced first)
        palettes.sort((a, b) => b.score - a.score);

        return palettes;
    }

    return {
        generate: generateSystems,
        parseInput: parseToHex,
        checkContrast: getContrastRatio
    };

})();
