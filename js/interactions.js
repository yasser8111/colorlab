/* ==========================================================================
   ColorLab — Interactions & UX JavaScript
   Premium micro-interactions, motion, and UX enhancement.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ------------------------------------------------------------------
       1. FAQ ACCORDION — CSS grid-row animation with chevron rotation
       ------------------------------------------------------------------ */
    const faqCards = document.querySelectorAll('.faq-card');

    faqCards.forEach((card, i) => {
        const header = card.querySelector('.faq-header');
        const wrapper = card.querySelector('.faq-content-wrapper');

        if (!header || !wrapper) return;

        // Accessibility attributes
        const answerId = `faq-answer-${i}`;
        wrapper.id = answerId;
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');
        header.setAttribute('aria-controls', answerId);

        const toggle = () => {
            const isOpen = card.classList.contains('open');

            // Close all others (accordion behavior)
            faqCards.forEach(other => {
                if (other !== card) {
                    other.classList.remove('open');
                    const otherWrapper = other.querySelector('.faq-content-wrapper');
                    const otherHeader  = other.querySelector('.faq-header');
                    if (otherWrapper) otherWrapper.classList.remove('open');
                    if (otherHeader)  otherHeader.setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle this one
            card.classList.toggle('open', !isOpen);
            wrapper.classList.toggle('open', !isOpen);
            header.setAttribute('aria-expanded', String(!isOpen));
        };

        header.addEventListener('click', toggle);
        header.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
    });


    /* ------------------------------------------------------------------
       2. SMOOTH SCROLL — Offset for sticky navbar
       ------------------------------------------------------------------ */
    const NAVBAR_HEIGHT = 78;

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const href = anchor.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
                window.scrollTo({ top, behavior: 'smooth' });
                closeMobileNav();
            }
        });
    });


    /* ------------------------------------------------------------------
       3. SCROLL REVEAL — IntersectionObserver entrance animations
       ------------------------------------------------------------------ */
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
        revealObserver.observe(el);
    });


    /* ------------------------------------------------------------------
       4. NAVBAR — Shadow on scroll + active section link tracking
       ------------------------------------------------------------------ */
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');

    const updateNavbar = () => {
        if (!navbar) return;
        if (window.scrollY > 12) {
            navbar.classList.add('scrolled');
            navbar.style.boxShadow = '0 1px 0 rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)';
            navbar.style.backgroundColor = 'rgba(255,255,255,0.97)';
        } else {
            navbar.classList.remove('scrolled');
            navbar.style.boxShadow = 'none';
            navbar.style.backgroundColor = 'rgba(255,255,255,0.88)';
        }
    };

    // Active section tracking via IntersectionObserver
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { rootMargin: '-35% 0px -60% 0px' });

    sections.forEach(s => sectionObserver.observe(s));

    window.addEventListener('scroll', () => {
        updateNavbar();
        updateScrollProgress();
        updateBackToTop();
    }, { passive: true });

    updateNavbar();


    /* ------------------------------------------------------------------
       5. SCROLL PROGRESS BAR
       ------------------------------------------------------------------ */
    const progressBar = document.getElementById('scroll-progress');

    const updateScrollProgress = () => {
        if (!progressBar) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollTop / docHeight : 0;
        progressBar.style.transform = `scaleX(${progress})`;
    };


    /* ------------------------------------------------------------------
       6. BACK TO TOP BUTTON
       ------------------------------------------------------------------ */
    const backToTopBtn = document.getElementById('back-to-top');

    const updateBackToTop = () => {
        if (!backToTopBtn) return;
        backToTopBtn.classList.toggle('visible', window.scrollY > 400);
    };

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    /* ------------------------------------------------------------------
       7. MOBILE NAVIGATION — Hamburger toggle
       ------------------------------------------------------------------ */
    const hamburger = document.getElementById('nav-hamburger');
    const mobileNav  = document.getElementById('mobile-nav');

    const closeMobileNav = () => {
        if (!hamburger || !mobileNav) return;
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.contains('open');
            hamburger.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', String(!isOpen));
            mobileNav.classList.toggle('open');
            mobileNav.setAttribute('aria-hidden', String(isOpen));
            document.body.style.overflow = isOpen ? '' : 'hidden';
        });

        // Close on outside click
        document.addEventListener('click', e => {
            if (!navbar?.contains(e.target) && !mobileNav.contains(e.target)) {
                closeMobileNav();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeMobileNav();
        });

        // Close when a nav link inside drawer is clicked
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileNav);
        });
    }


    /* ------------------------------------------------------------------
       8. HERO COLOR PICKER — Dynamic CSS variable updates
       NOTE: The inline <script> in index.html was removed.
             This is now the single, canonical handler.
       ------------------------------------------------------------------ */
    const heroSection = document.getElementById('hero-preview');
    const colorBtns   = document.querySelectorAll('#hero-color-picker .color-btn');

    // Extended presets with more detail for a richer live preview
    const colorPresets = {
        '#1A56FF': {
            secondary:   '#0ea5e9',
            accent:      '#f43f5e',
            surface:     '#ffffff',
            card:        '#f0f6ff',
            textPrimary: '#0f172a',
            textSecondary:'#475569',
            border:      '#dbeafe',
            bg:          '#f0f6ff'
        },
        '#10B981': {
            secondary:   '#34d399',
            accent:      '#f97316',
            surface:     '#ffffff',
            card:        '#f0fdf4',
            textPrimary: '#052e16',
            textSecondary:'#4b7c5f',
            border:      '#a7f3d0',
            bg:          '#f0fdf4'
        },
        '#F59E0B': {
            secondary:   '#fbbf24',
            accent:      '#8b5cf6',
            surface:     '#ffffff',
            card:        '#fffbeb',
            textPrimary: '#1c1917',
            textSecondary:'#78716c',
            border:      '#fde68a',
            bg:          '#fffbeb'
        },
        '#8B5CF6': {
            secondary:   '#a78bfa',
            accent:      '#f43f5e',
            surface:     '#ffffff',
            card:        '#f5f3ff',
            textPrimary: '#1e1b4b',
            textSecondary:'#6d6a99',
            border:      '#ddd6fe',
            bg:          '#f5f3ff'
        },
        '#EC4899': {
            secondary:   '#f9a8d4',
            accent:      '#3b82f6',
            surface:     '#ffffff',
            card:        '#fdf2f8',
            textPrimary: '#1a0010',
            textSecondary:'#9d6080',
            border:      '#fbcfe8',
            bg:          '#fdf2f8'
        },
    };

    const updateHeroPreview = (color) => {
        if (!heroSection) return;

        const preset = colorPresets[color] || {};

        heroSection.style.setProperty('--preview-primary',      color);
        heroSection.style.setProperty('--preview-secondary',    preset.secondary    || '#94a3b8');
        heroSection.style.setProperty('--preview-accent',       preset.accent       || '#f43f5e');
        heroSection.style.setProperty('--preview-surface',      preset.surface      || '#ffffff');
        heroSection.style.setProperty('--preview-card',         preset.card         || '#f8fafc');
        heroSection.style.setProperty('--preview-text-pri',     preset.textPrimary  || '#0f172a');
        heroSection.style.setProperty('--preview-text-sec',     preset.textSecondary|| '#64748b');
        heroSection.style.setProperty('--preview-border',       preset.border       || '#e8eaed');
        heroSection.style.setProperty('--preview-bg',           preset.bg           || '#f1f5f9');
    };

    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.color;

            // Update active indicator ring
            colorBtns.forEach(b => {
                b.style.boxShadow = '0 0 0 2px transparent';
                b.classList.remove('active');
            });
            btn.style.boxShadow = `0 0 0 3px #fff, 0 0 0 5px ${color}`;
            btn.classList.add('active');

            updateHeroPreview(color);

            // Also attempt generator-based update if available
            if (window.ColorGenerator) {
                try {
                    const palettes = window.ColorGenerator.generate(color, 'saas');
                    if (palettes && palettes.length > 0) {
                        const colors = palettes[0].colors;
                        heroSection.style.setProperty('--preview-primary',   colors.primary   || color);
                        heroSection.style.setProperty('--preview-secondary', colors.secondary  || '');
                        heroSection.style.setProperty('--preview-accent',    colors.accent     || '');
                        heroSection.style.setProperty('--preview-surface',   colors.surface    || '');
                        heroSection.style.setProperty('--preview-card',      colors.card       || '');
                        heroSection.style.setProperty('--preview-text-pri',  colors.textPrimary|| '');
                        heroSection.style.setProperty('--preview-text-sec',  colors.textSecondary || '');
                        heroSection.style.setProperty('--preview-border',    colors.border     || '');
                        heroSection.style.setProperty('--preview-bg',        colors.background || '');
                    }
                } catch (err) {
                    // Generator not available; preset fallback already applied above
                }
            }
        });
    });

    // Initialize first color button as active
    const firstBtn = colorBtns[0];
    if (firstBtn) {
        const color = firstBtn.dataset.color;
        firstBtn.classList.add('active');
        firstBtn.style.boxShadow = `0 0 0 3px #fff, 0 0 0 5px ${color}`;
        // Delay to allow generator to load
        setTimeout(() => updateHeroPreview(color), 80);
    }


    /* ------------------------------------------------------------------
       9. CONTACT FORM — Submit feedback
       ------------------------------------------------------------------ */
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', e => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const original = btn.innerHTML;

            btn.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Message Sent!
            `;
            btn.style.backgroundColor = '#10b981';
            btn.style.borderColor = '#10b981';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = original;
                btn.style.backgroundColor = '';
                btn.style.borderColor = '';
                btn.disabled = false;
                contactForm.reset();
            }, 4000);
        });
    }


    /* ------------------------------------------------------------------
       10. MAP PLACEHOLDER — Lazy-load on click
       ------------------------------------------------------------------ */
    const mapPlaceholder = document.querySelector('.map-placeholder');
    if (mapPlaceholder) {
        mapPlaceholder.addEventListener('click', () => {
            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100939.98555098464!2d-122.50764017948551!3d37.75781499657757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80859a6d00690021%3A0x4a501367f076adff!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1678000000000!5m2!1sen!2sus';
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '12px';
            iframe.loading = 'lazy';
            iframe.allowFullscreen = true;
            mapPlaceholder.innerHTML = '';
            mapPlaceholder.style.padding = '0';
            mapPlaceholder.style.cursor = 'default';
            mapPlaceholder.appendChild(iframe);
        }, { once: true });
    }


    /* ------------------------------------------------------------------
       11. PREMIUM CARD INTERACTIONS — Spotlight Effect + Modern Parallax
       ------------------------------------------------------------------ */
    const spotlightCards = document.querySelectorAll('.card');

    const handleMouseMove = (e, card) => {
        const rect = card.getBoundingClientRect();
        
        // Spotlight position
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        // Subtle Parallax (only if not a popular pricing card which has constant animation)
        if (!card.classList.contains('popular')) {
            const tiltX = (y / rect.height - 0.5) * -4; // Max 4deg
            const tiltY = (x / rect.width - 0.5) * 4;
            card.style.transform = `translateY(-8px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        }
    };

    const resetCard = (card) => {
        card.style.transform = '';
    };

    if (!isTouch) {
        spotlightCards.forEach(card => {
            card.addEventListener('mousemove', e => handleMouseMove(e, card));
            card.addEventListener('mouseleave', () => resetCard(card));
        });
    }

});
