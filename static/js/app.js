/* ================================================================
   WebDAV Manager — Main Application (Template Integration)
   Combines template architecture (sidebar, toast, theme, i18n)
   with WebDAV plugin functionality (config, users, rules, files)
   ================================================================ */
(function() {
    'use strict';

    // ─── State ───
    var cfg = {};
    var rules = [];
    var users = [];
    var currentLang = 'en';
    var currentTheme = 'light';
    var menuLayout = 'side';
    var accentColor = '#6c5ce7';
    var sidebarOpen = true;
    var mobileSidebarOpen = false;
    var toastDuration = 4;

    // ─── DOM refs ───
    var $html = document.documentElement;
    var $body = document.body;
    var $sidebar = document.getElementById('sidebar');
    var $sidebarOverlay = document.getElementById('sidebarOverlay');
    var $sidebarNav = document.getElementById('sidebarNav');
    var $hamburgerBtn = document.getElementById('hamburgerBtn');
    var $toastContainer = document.getElementById('toastContainer');
    var $themeIconSun = document.getElementById('themeIconSun');
    var $themeIconMoon = document.getElementById('themeIconMoon');
    var $statusDot = document.getElementById('statusDot');

    // ─── Menu Items ───
    var menuItems = [
        { id: 'server',   icon: 'server',   labelKey: 'nav_server',   section: 'config' },
        { id: 'tls',      icon: 'lock',     labelKey: 'nav_tls',      section: 'config' },
        { id: 'cors',     icon: 'globe',    labelKey: 'nav_cors',     section: 'config' },
        { id: 'logging',  icon: 'file-text',labelKey: 'nav_logging',  section: 'config' },
        { id: 'divider1', type: 'divider',  section: 'config' },
        { id: 'rules',    icon: 'check-square', labelKey: 'nav_rules', section: 'access' },
        { id: 'users',    icon: 'users',    labelKey: 'nav_users',    section: 'access' },
        { id: 'divider2', type: 'divider',  section: 'access' },
        { id: 'files',    icon: 'folder',   labelKey: 'nav_files',    section: 'tools' },
        { id: 'raw',      icon: 'code',     labelKey: 'nav_raw',      section: 'tools' },
    ];

    var menuIcons = {
        server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="5" rx="1"/><circle cx="6" cy="5.5" r=".5" fill="currentColor"/><rect x="2" y="11" width="20" height="5" rx="1"/><circle cx="6" cy="13.5" r=".5" fill="currentColor"/><rect x="2" y="19" width="20" height="2" rx="1"/></svg>',
        lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
        globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z"/></svg>',
        'file-text': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        'check-square': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
        folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
        code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
        settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    };

    var sectionLabels = {
        config: 'menuSectionConfig',
        access: 'menuSectionAccess',
        tools: 'menuSectionTools',
    };

    // ─── Settings persistence ───
    var STORAGE_KEY = 'webdav_manager_settings';

    function saveAppSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                theme: currentTheme,
                lang: currentLang,
                menuLayout: menuLayout,
                accentColor: accentColor,
                sidebarOpen: sidebarOpen,
                toastDuration: toastDuration,
            }));
        } catch(e) {}
    }

    function loadAppSettings() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var s = JSON.parse(raw);
                currentTheme = s.theme || 'light';
                currentLang = s.lang || 'en';
                menuLayout = s.menuLayout || 'side';
                accentColor = s.accentColor || '#6c5ce7';
                sidebarOpen = s.sidebarOpen !== false;
                toastDuration = s.toastDuration || 4;
            }
        } catch(e) {}
    }

    // Load settings from ApiBridge (overrides localStorage)
    function loadSettingsFromBridge() {
        return ApiBridge.loadSettings().then(function(s) {
            if (s.language) currentLang = s.language;
            if (s.theme) currentTheme = s.theme;
            if (s.menu_layout) menuLayout = s.menu_layout;
            if (s.accent_color) accentColor = s.accent_color;
            if (s.toast_duration) toastDuration = s.toast_duration;
            if (s.sidebar_open !== undefined) sidebarOpen = s.sidebar_open;
            localStorage.setItem('lang', currentLang);
            saveAppSettings();
        }).catch(function() {});
    }

    // ─── Toast System (Template) ───
    function showToast(message, type, duration) {
        var dur = duration || toastDuration;
        var icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        };
        type = type || 'info';
        // Map old plugin types
        if (type === 'ok') type = 'success';
        if (type === 'err') type = 'error';
        if (type === 'inf') type = 'info';

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML =
            '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
            '<span class="toast-body">' + message + '</span>' +
            '<button class="toast-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
        toast.querySelector('.toast-close').addEventListener('click', function() { removeToast(toast); });
        toast.addEventListener('click', function(e) {
            if (e.target === toast || e.target.classList.contains('toast-body')) removeToast(toast);
        });
        $toastContainer.appendChild(toast);
        var toasts = $toastContainer.querySelectorAll('.toast');
        if (toasts.length > 5) removeToast(toasts[0]);
        var timer = setTimeout(function() { removeToast(toast); }, dur * 1000);
        toast._timer = timer;
    }

    function removeToast(toast) {
        if (toast._removing) return;
        toast._removing = true;
        clearTimeout(toast._timer);
        toast.classList.add('removing');
        toast.addEventListener('animationend', function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, { once: true });
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
    }

    // ─── Theme ───
    function applyTheme(theme) {
        currentTheme = theme;
        if (theme === 'system') {
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            $html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            $html.setAttribute('data-theme', theme);
        }
        updateThemeIcons();
        applyAccentColor(accentColor);
        saveAppSettings();
    }

    function toggleTheme() {
        var current = $html.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        currentTheme = next;
        $html.setAttribute('data-theme', next);
        updateThemeIcons();
        applyAccentColor(accentColor);
        saveAppSettings();
        showToast(I18n.t('toastThemeChanged') || 'Theme updated', 'success', 2.5);
    }

    function updateThemeIcons() {
        var isDark = $html.getAttribute('data-theme') === 'dark';
        if ($themeIconSun) $themeIconSun.style.display = isDark ? 'none' : '';
        if ($themeIconMoon) $themeIconMoon.style.display = isDark ? '' : 'none';
    }

    // ─── Accent Color ───
    function hexToRgb(hex) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return { r: r, g: g, b: b };
    }

    function applyAccentColor(color) {
        accentColor = color;
        var rgb = hexToRgb(color);
        var hoverR = Math.max(0, rgb.r - 20);
        var hoverG = Math.max(0, rgb.g - 20);
        var hoverB = Math.max(0, rgb.b - 20);
        var hoverColor = '#' + hoverR.toString(16).padStart(2,'0') + hoverG.toString(16).padStart(2,'0') + hoverB.toString(16).padStart(2,'0');

        $html.style.setProperty('--accent', color);
        $html.style.setProperty('--accent-hover', hoverColor);
        $html.style.setProperty('--accent-light', 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.1)');
        $html.style.setProperty('--accent-glow', 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.25)');

        if ($html.getAttribute('data-theme') === 'dark') {
            var lightR = Math.min(255, rgb.r + 30);
            var lightG = Math.min(255, rgb.g + 30);
            var lightB = Math.min(255, rgb.b + 30);
            $html.style.setProperty('--accent-hover', '#' + lightR.toString(16).padStart(2,'0') + lightG.toString(16).padStart(2,'0') + lightB.toString(16).padStart(2,'0'));
            $html.style.setProperty('--accent-light', 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.15)');
            $html.style.setProperty('--accent-glow', 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.3)');
        }

        // Update logo gradient
        var logos = document.querySelectorAll('.logo-icon');
        for (var i = 0; i < logos.length; i++) {
            logos[i].style.background = 'linear-gradient(135deg, ' + color + ', #8b5cf6)';
        }

        // Update color picker UI
        var swatches = document.querySelectorAll('.color-swatch');
        for (var j = 0; j < swatches.length; j++) {
            swatches[j].classList.toggle('active', swatches[j].dataset.color === color);
        }
        var picker = document.getElementById('colorCustomPicker');
        var hexInput = document.getElementById('colorHexInput');
        if (picker) picker.value = color;
        if (hexInput) hexInput.value = color.toUpperCase();
    }

    // ─── Menu Layout ───
    function applyEffectiveLayout(effective) {
        var $topIcon = document.getElementById('layoutIconTop');
        var $sideIcon = document.getElementById('layoutIconSide');
        if (effective === 'top') {
            $body.classList.add('menu-top');
            $body.classList.remove('menu-side', 'sidebar-collapsed');
            $sidebar.classList.add('collapsed');
            $sidebar.classList.remove('mobile-open');
            $sidebarOverlay.classList.remove('show');
            mobileSidebarOpen = false;
            $hamburgerBtn.style.display = 'none';
            // Show "switch to side" icon
            if ($topIcon) $topIcon.style.display = 'none';
            if ($sideIcon) $sideIcon.style.display = '';
        } else {
            $body.classList.remove('menu-top');
            $body.classList.add('menu-side');
            $sidebar.classList.remove('collapsed');
            sidebarOpen = true;
            $hamburgerBtn.style.display = 'flex';
            // Show "switch to top" icon
            if ($topIcon) $topIcon.style.display = '';
            if ($sideIcon) $sideIcon.style.display = 'none';
            if (window.innerWidth <= 768) {
                $sidebar.classList.remove('mobile-open');
                $sidebar.classList.add('collapsed');
                sidebarOpen = false;
            }
            syncSidebarBodyClass();
        }
    }

    function syncSidebarBodyClass() {
        $body.classList.toggle('sidebar-collapsed', $sidebar.classList.contains('collapsed'));
    }

    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            if (mobileSidebarOpen) closeMobileSidebar();
            else openMobileSidebar();
        } else {
            sidebarOpen = !sidebarOpen;
            if (sidebarOpen) $sidebar.classList.remove('collapsed');
            else $sidebar.classList.add('collapsed');
            syncSidebarBodyClass();
            saveAppSettings();
        }
    }

    function openMobileSidebar() {
        mobileSidebarOpen = true;
        $sidebar.classList.add('mobile-open');
        $sidebar.classList.remove('collapsed');
        $sidebarOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileSidebar() {
        mobileSidebarOpen = false;
        $sidebar.classList.remove('mobile-open');
        $sidebar.classList.add('collapsed');
        $sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    // ─── Build Menus ───
    var $topMenuBar = document.getElementById('topMenuBar');

    function buildMenus() {
        // Sidebar menu
        var html = '';
        var currentSection = null;
        for (var i = 0; i < menuItems.length; i++) {
            var item = menuItems[i];
            if (item.type === 'divider') {
                html += '<div class="menu-divider"></div>';
                currentSection = null;
                continue;
            }
            if (item.section && item.section !== currentSection && sectionLabels[item.section]) {
                html += '<div class="menu-label">' + I18n.t(sectionLabels[item.section]) + '</div>';
                currentSection = item.section;
            }
            html += '<div class="menu-item" data-menu-id="' + item.id + '" role="menuitem" tabindex="0">' +
                '<span class="menu-icon">' + (menuIcons[item.icon] || '') + '</span>' +
                '<span>' + I18n.t(item.labelKey) + '</span></div>';
        }
        $sidebarNav.innerHTML = html;

        // Top menu bar (horizontal mode)
        if ($topMenuBar) {
            var topHtml = '';
            for (var j = 0; j < menuItems.length; j++) {
                var ti = menuItems[j];
                if (ti.type === 'divider') continue;
                topHtml += '<div class="menu-item" data-menu-id="' + ti.id + '" role="menuitem" tabindex="0">' +
                    '<span class="menu-icon">' + (menuIcons[ti.icon] || '') + '</span>' +
                    '<span>' + I18n.t(ti.labelKey) + '</span></div>';
            }
            $topMenuBar.innerHTML = topHtml;
        }

        bindMenuClicks();
    }

    function bindMenuClicks() {
        var items = document.querySelectorAll('.menu-item[data-menu-id]');
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener('click', function() {
                setActiveMenu(this.getAttribute('data-menu-id'));
                if (window.innerWidth <= 768 && menuLayout === 'side') closeMobileSidebar();
            });
        }
    }

    function setActiveMenu(menuId) {
        // Settings menu opens the settings modal instead of switching section
        if (menuId === 'settings') {
            openSettingsModal();
            return;
        }
        var items = document.querySelectorAll('.menu-item[data-menu-id]');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle('active', items[i].getAttribute('data-menu-id') === menuId);
        }
        // Toggle sections
        var secs = document.querySelectorAll('.sec');
        for (var j = 0; j < secs.length; j++) secs[j].classList.remove('on');
        var target = document.getElementById('s-' + menuId);
        if (target) target.classList.add('on');

        // Update section title
        var titleEl = document.getElementById('secTitle');
        if (titleEl) titleEl.textContent = I18n.t('nav_' + menuId);

        // Trigger section-specific loads
        if (menuId === 'raw') loadRaw();
        if (menuId === 'files') FM.go();
    }

    // ─── Language ───
    function updateLangDropdown() {
        var items = document.querySelectorAll('.lang-dropdown-item');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle('active', items[i].dataset.lang === currentLang);
        }
    }

    function switchLang(lang, force) {
        if (lang === currentLang && !force) return;
        currentLang = lang;
        $html.lang = currentLang;
        localStorage.setItem('lang', currentLang);
        I18n.switchLang(lang).then(function() {
            updateAllI18n();
            renderUsers();
            renderRules();
            buildMenus();
            setActiveMenu(getCurrentSection());
            saveAppSettings();
            updateLangDropdown();
            if (!force) showToast(I18n.t('toastLangChanged') || 'Language switched', 'success', 2.5);
        }).catch(function(err) {
            console.error('[switchLang] error:', err);
        });
    }

    function getCurrentSection() {
        var active = document.querySelector('.sec.on');
        if (active) return active.id.replace('s-', '');
        return 'server';
    }

    function updateAllI18n() {
        I18n.applyToDOM();
        // Re-apply custom select displayed values (they use data-i18n on options)
        var selects = document.querySelectorAll('#settingsModal .custom-select');
        for (var i = 0; i < selects.length; i++) {
            var cs = selects[i];
            var selected = cs.querySelector('.custom-select-option.selected');
            if (selected) {
                // Re-read translated text
                var key = selected.getAttribute('data-i18n');
                if (key) selected.textContent = I18n.t(key);
                cs.querySelector('.custom-select-value').textContent = selected.textContent;
            }
        }
        // Update cfg path
        var cfgEl = document.getElementById('cfgPath');
        if (cfgEl) cfgEl.textContent = ApiBridge.getConfigPath() || I18n.t('hint_set_config_path');
        // Update footer version
        var fvEl = document.getElementById('footerVersion');
        if (fvEl) fvEl.textContent = '0.2.3';
    }

    // ─── Custom Selects (Settings Modal) ───
    function getCustomSelectValue(field) {
        var el = document.querySelector('.custom-select[data-field="' + field + '"]');
        if (!el) return '';
        var selected = el.querySelector('.custom-select-option.selected');
        return selected ? selected.dataset.value : '';
    }

    function setCustomSelectValue(field, value) {
        var el = document.querySelector('.custom-select[data-field="' + field + '"]');
        if (!el) return;
        var opts = el.querySelectorAll('.custom-select-option');
        for (var i = 0; i < opts.length; i++) {
            var isSelected = opts[i].dataset.value === value;
            opts[i].classList.toggle('selected', isSelected);
            if (isSelected) el.querySelector('.custom-select-value').textContent = opts[i].textContent;
        }
    }

    function initCustomSelects() {
        var selects = document.querySelectorAll('.custom-select');
        for (var s = 0; s < selects.length; s++) {
            (function(cs) {
                var trigger = cs.querySelector('.custom-select-trigger');
                var options = cs.querySelectorAll('.custom-select-option');
                trigger.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var allOpen = document.querySelectorAll('.custom-select.open');
                    for (var i = 0; i < allOpen.length; i++) {
                        if (allOpen[i] !== cs) allOpen[i].classList.remove('open');
                    }
                    cs.classList.toggle('open');
                });
                for (var o = 0; o < options.length; o++) {
                    options[o].addEventListener('click', function() {
                        var field = cs.dataset.field;
                        var value = this.dataset.value;
                        setCustomSelectValue(field, value);
                        cs.classList.remove('open');
                        // Live preview
                        if (field === 'settingTheme') {
                            applyTheme(value);
                        } else if (field === 'settingLang') {
                            switchLang(value);
                        } else if (field === 'settingMenuLayout') {
                            menuLayout = value;
                            applyEffectiveLayout(value === 'top' ? 'top' : 'side');
                            buildMenus();
                            setActiveMenu(getCurrentSection());
                            saveAppSettings();
                        }
                    });
                }
            })(selects[s]);
        }
        document.addEventListener('click', function() {
            var open = document.querySelectorAll('.custom-select.open');
            for (var i = 0; i < open.length; i++) open[i].classList.remove('open');
        });
    }

    // ─── Settings Modal ───
    function openSettingsModal() {
        setCustomSelectValue('settingTheme', currentTheme);
        setCustomSelectValue('settingLang', currentLang);
        setCustomSelectValue('settingMenuLayout', menuLayout);
        document.getElementById('settingToastDuration').value = toastDuration;
        var swatches = document.querySelectorAll('.color-swatch');
        for (var i = 0; i < swatches.length; i++) {
            swatches[i].classList.toggle('active', swatches[i].dataset.color === accentColor);
        }
        var picker = document.getElementById('colorCustomPicker');
        var hex = document.getElementById('colorHexInput');
        if (picker) picker.value = accentColor;
        if (hex) hex.value = accentColor.toUpperCase();
        // Load WebDAV plugin settings from ApiBridge
        ApiBridge.loadSettings().then(function(s) {
            document.getElementById('setConfigPath').value = s.config_path || '';
            document.getElementById('setServiceName').value = s.service_name || 'webdav';
            document.getElementById('setFileRoot').value = s.file_root || '';
            // Also sync UI settings from bridge if present
            if (s.theme) setCustomSelectValue('settingTheme', s.theme);
            if (s.language) setCustomSelectValue('settingLang', s.language);
            if (s.menu_layout) setCustomSelectValue('settingMenuLayout', s.menu_layout);
            if (s.accent_color) {
                applyAccentColor(s.accent_color);
            }
            if (s.toast_duration) document.getElementById('settingToastDuration').value = s.toast_duration;
        }).catch(function() {});
        document.getElementById('settingsOverlay').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeSettingsModal() {
        document.getElementById('settingsOverlay').classList.remove('show');
        document.body.style.overflow = '';
        var open = document.querySelectorAll('.custom-select.open');
        for (var i = 0; i < open.length; i++) open[i].classList.remove('open');
    }

    function saveSettingsFromPanel() {
        var newTheme = getCustomSelectValue('settingTheme');
        var newLang = getCustomSelectValue('settingLang');
        var newLayout = getCustomSelectValue('settingMenuLayout');
        var newDuration = parseFloat(document.getElementById('settingToastDuration').value) || 4;

        if (newLang !== currentLang) switchLang(newLang, true);
        if (newTheme !== currentTheme) applyTheme(newTheme);
        if (newLayout !== menuLayout) {
            menuLayout = newLayout;
            applyEffectiveLayout(newLayout === 'top' ? 'top' : 'side');
            buildMenus();
            setActiveMenu(getCurrentSection());
        }
        toastDuration = Math.max(1, Math.min(15, newDuration));
        saveAppSettings();

        // Save ALL settings to /etc/cockpit/webdav-manager/settings.json
        var webdavSettings = {
            language: currentLang,
            theme: currentTheme,
            menu_layout: menuLayout,
            accent_color: accentColor,
            toast_duration: toastDuration,
            sidebar_open: sidebarOpen,
            config_path: document.getElementById('setConfigPath').value,
            service_name: document.getElementById('setServiceName').value,
            file_root: document.getElementById('setFileRoot').value
        };
        ApiBridge.saveSettings(webdavSettings).then(function() {
            closeSettingsModal();
            showToast(I18n.t('toastSettingsSaved') || 'Settings saved', 'success');
            // Reload config with potentially new path
            loadCfg();
        }).catch(function(err) {
            closeSettingsModal();
            showToast(err.error || I18n.t('toast_save_failed'), 'error');
        });
    }

    function resetSettings() {
        currentLang = 'en';
        $html.lang = 'en';
        applyTheme('light');
        menuLayout = 'side';
        applyEffectiveLayout('side');
        applyAccentColor('#6c5ce7');
        toastDuration = 4;
        setCustomSelectValue('settingTheme', 'light');
        setCustomSelectValue('settingLang', 'en');
        setCustomSelectValue('settingMenuLayout', 'side');
        document.getElementById('settingToastDuration').value = '4';
        saveAppSettings();
        I18n.switchLang('en').then(function() {
            updateAllI18n();
            buildMenus();
            setActiveMenu(getCurrentSection());
            renderUsers();
            renderRules();
        });
        showToast(I18n.t('toastSettingsReset') || 'Settings reset', 'info');
    }

    // ─── Config Load/Save ───
    function loadCfg() {
        ApiBridge.getConfig()
            .then(function(d) {
                cfg = d.config || {};
                var _cp = document.getElementById('cfgPath'); if (_cp) _cp.textContent = d.path;
                fillForm();
                showToast(I18n.t('toast_config_loaded'), 'success');
                st(I18n.t('toast_config_loaded'));
            })
            .catch(function(err) {
                if (err.error === 'no_config_path') {
                    var _cp2 = document.getElementById('cfgPath'); if (_cp2) _cp2.textContent = '\u26a0 ' + I18n.t('hint_set_config_path');
                    st(I18n.t('hint_set_config_path'));
                    setActiveMenu('settings');
                    showToast(I18n.t('hint_set_config_path'), 'info');
                } else {
                    showToast(err.error || I18n.t('toast_load_failed'), 'error');
                    var _cp3 = document.getElementById('cfgPath'); if (_cp3) _cp3.textContent = err.path || 'error';
                }
            });
    }

    function fillForm() {
        v('address', cfg.address);
        v('port', cfg.port);
        v('prefix', cfg.prefix);
        v('directory', cfg.directory);
        ckd('debug', cfg.debug);
        ckd('noSniff', cfg.noSniff);
        ckd('behindProxy', cfg.behindProxy);
        ckd('noPassword', cfg.noPassword);
        setPerm('defPerms', cfg.permissions);
        v('rulesBehavior', cfg.rulesBehavior);
        ckd('tls', cfg.tls);
        v('cert', cfg.cert);
        v('key', cfg.key);
        var co = cfg.cors || {};
        ckd('corsOn', co.enabled);
        ckd('corsCred', co.credentials);
        a2t('corsHosts', co.allowed_hosts);
        a2t('corsHdrs', co.allowed_headers);
        a2t('corsMtds', co.allowed_methods);
        a2t('corsExp', co.exposed_headers);
        var lg = cfg.log || {};
        v('logFmt', lg.format);
        ckd('logClr', lg.colors);
        fillOuts(lg.outputs);
        rules = cfg.rules || [];
        renderRules();
        renderUsers();
    }

    function saveCfg() {
        var c = buildCfg();
        var d = validateCfg(c);
        if (!d.valid) { showToast(I18n.t('toast_validate_failed') + ': ' + d.errors.join('; '), 'error'); return; }
        ApiBridge.saveConfig(c)
            .then(function() {
                showToast(I18n.t('toast_saved'), 'success');
                st(I18n.t('toast_saved'));
                cfg = c;
            })
            .catch(function(err) {
                showToast(err.error || I18n.t('toast_save_failed'), 'error');
            });
    }

    function buildCfg() {
        var c = {};
        var a = v('address'); if (a) c.address = a;
        var p = parseInt(v('port')); if (p) c.port = p;
        var pr = v('prefix'); if (pr) c.prefix = pr;
        var dir = v('directory'); if (dir) c.directory = dir;
        if (ckd('debug')) c.debug = true;
        if (ckd('noSniff')) c.noSniff = true;
        if (ckd('behindProxy')) c.behindProxy = true;
        if (ckd('noPassword')) c.noPassword = true;
        var pm = getPerm('defPerms'); if (pm) c.permissions = pm;
        var rb = v('rulesBehavior'); if (rb) c.rulesBehavior = rb;
        c.tls = !!ckd('tls');
        if (c.tls) {
            var ce = v('cert'); if (ce) c.cert = ce;
            var k = v('key'); if (k) c.key = k;
        }
        var co = {};
        if (ckd('corsOn')) co.enabled = true;
        if (ckd('corsCred')) co.credentials = true;
        var h = t2a('corsHosts'); if (h.length) co.allowed_hosts = h;
        var hd = t2a('corsHdrs'); if (hd.length) co.allowed_headers = hd;
        var m = t2a('corsMtds'); if (m.length) co.allowed_methods = m;
        var ex = t2a('corsExp'); if (ex.length) co.exposed_headers = ex;
        if (Object.keys(co).length) c.cors = co;
        var lg = {};
        var f = v('logFmt'); if (f) lg.format = f;
        if (ckd('logClr')) lg.colors = true;
        var outs = getOuts(); if (outs.length) lg.outputs = outs;
        if (Object.keys(lg).length) c.log = lg;
        if (rules.length) c.rules = rules;
        if (users.length) c.users = users;
        return c;
    }

    // ─── Users ───
    function renderUsers() {
        users = cfg.users || [];
        document.getElementById('uCnt').textContent = users.length;
        var el = document.getElementById('userList');
        if (!users.length) {
            el.innerHTML = '<div class="empty"><svg class="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 10px;display:block;opacity:.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg><p>' + I18n.t('empty_users') + '</p></div>';
            return;
        }
        var html = '';
        for (var i = 0; i < users.length; i++) {
            var u = users[i];
            var p = permBadges(u.permissions);
            var d = u.directory ? '<span class="tg bl">' + I18n.t('dir_tag') + ': ' + e(u.directory) + '</span>' : '';
            var rc = (u.rules || []).length;
            var rh = rc ? '<span class="tg">' + I18n.t('rules_tag') + ': ' + rc + '</span>' : '';
            var pt = (u.password || '').indexOf('{bcrypt}') === 0 ? 'bcrypt' : (u.password || '').indexOf('{env}') === 0 ? 'env' : I18n.t('password_plaintext');
            var pt2 = pt === I18n.t('password_plaintext') ? '<span class="tg rd">' + pt + '</span>' : '<span class="tg gr">' + pt + '</span>';
            html += '<div class="ucard">';
            html += '<div class="uinfo"><div class="uname"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' + e(u.username) + ' ' + p + '</div>';
            html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">' + pt2 + ' ' + d + ' ' + rh + '</div></div>';
            html += '<div class="uacts">';
            html += '<button class="btn btn-o btn-s" onclick="WebDAVManager.editUser(' + i + ')">' + I18n.t('btn_edit') + '</button>';
            html += '<button class="btn btn-d btn-s" onclick="WebDAVManager.delUser(' + i + ')">' + I18n.t('btn_delete') + '</button>';
            html += '</div></div>';
        }
        el.innerHTML = html;
    }

    function openUser(i) {
        document.getElementById('uIdx').value = i !== undefined ? i : -1;
        document.getElementById('uMovTitle').textContent = i !== undefined ? I18n.t('modal_edit_user') : I18n.t('modal_add_user');
        document.getElementById('muR').innerHTML = '';
        if (i !== undefined && users[i]) {
            var u = users[i];
            v('muUser', u.username);
            v('muPass', u.password);
            v('muDir', u.directory);
            setPerm('muP', u.permissions);
            var ur = u.rules || [];
            for (var j = 0; j < ur.length; j++) addMuR(ur[j]);
        } else {
            v('muUser', '');
            v('muPass', '');
            v('muDir', '');
            setPerm('muP', '');
        }
        document.getElementById('userMov').classList.add('show');
    }

    function saveUser() {
        var idx = +document.getElementById('uIdx').value;
        var un = v('muUser').trim();
        var pw = v('muPass').trim();
        if (!un || !pw) { showToast(I18n.t('toast_user_required'), 'error'); return; }
        var o = { username: un, password: pw };
        var d = v('muDir').trim(); if (d) o.directory = d;
        var pm = getPerm('muP'); if (pm) o.permissions = pm;
        var ur = [];
        var murItems = document.querySelectorAll('#muR .mur');
        for (var i = 0; i < murItems.length; i++) {
            var r = murItems[i];
            var tp = r.querySelector('.mur-t').value;
            var vl = r.querySelector('.mur-v').value.trim();
            var rp = [];
            var rpCbs = r.querySelectorAll('.pc');
            for (var j = 0; j < rpCbs.length; j++) {
                if (rpCbs[j].querySelector('input').checked) rp.push(rpCbs[j].dataset.p);
            }
            if (!vl) continue;
            var rule = tp === 'path' ? { path: vl } : { regex: vl };
            rule.permissions = rp.length ? rp.join('') : 'none';
            ur.push(rule);
        }
        if (ur.length) o.rules = ur;
        if (idx >= 0) users[idx] = o; else users.push(o);
        cfg.users = users;
        renderUsers();
        closeM('userMov');
        showToast(idx >= 0 ? I18n.t('toast_user_updated') : I18n.t('toast_user_added'), 'success');
    }

    function delUser(i) {
        confirmShow(I18n.t('confirm_delete_user'), I18n.t('confirm_delete_user') + ' "' + users[i].username + '"?', I18n.t('btn_delete'), true).then(function(ok) {
            if (!ok) return;
            users.splice(i, 1);
            cfg.users = users;
            renderUsers();
            showToast(I18n.t('toast_user_deleted'), 'info');
        });
    }

    function addMuR(rule) {
        var d = document.createElement('div');
        d.className = 'mur';
        var ir = rule && rule.regex;
        var vl = rule ? (rule.path || rule.regex || '') : '';
        var rp = rule ? (rule.permissions || '') : '';
        var html = '<select class="mur-t"><option value="path"' + (ir ? '' : ' selected') + '>Path</option><option value="regex"' + (ir ? ' selected' : '') + '>Regex</option></select>';
        html += '<input class="mur-v" value="' + e(vl) + '" placeholder="' + (ir ? 'regex' : '/path') + '" style="flex:1;min-width:100px">';
        html += '<div class="pcs" style="gap:3px">';
        var permArr = ['C', 'R', 'U', 'D'];
        for (var i = 0; i < permArr.length; i++) {
            var pp = permArr[i];
            var isOn = rp.indexOf(pp) >= 0;
            html += '<label class="pc' + (isOn ? ' on' : '') + '" data-p="' + pp + '" style="padding:3px 7px;font-size:10px"><input type="checkbox"' + (isOn ? ' checked' : '') + '>' + pp + '</label>';
        }
        html += '</div><button class="btn btn-d btn-s" onclick="this.parentElement.remove()">X</button>';
        d.innerHTML = html;
        document.getElementById('muR').appendChild(d);
    }

    // ─── Rules ───
    function renderRules() {
        document.getElementById('rCnt').textContent = rules.length;
        var el = document.getElementById('rulesList');
        if (!rules.length) {
            el.innerHTML = '<div class="empty"><svg class="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 10px;display:block;opacity:.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg><p>' + I18n.t('empty_rules') + '</p></div>';
            return;
        }
        var html = '<table class="tbl"><thead><tr><th>#</th><th>' + I18n.t('col_type') + '</th><th>' + I18n.t('col_match') + '</th><th>' + I18n.t('col_perms') + '</th><th>' + I18n.t('col_actions') + '</th></tr></thead><tbody>';
        for (var i = 0; i < rules.length; i++) {
            var r = rules[i];
            html += '<tr><td>' + (i + 1) + '</td>';
            html += '<td>' + (r.path ? '<span class="tg bl">path</span>' : '<span class="tg">regex</span>') + '</td>';
            html += '<td><code>' + e(r.path || r.regex) + '</code></td>';
            html += '<td>' + permBadges(r.permissions) + '</td>';
            html += '<td><button class="btn btn-o btn-s" onclick="WebDAVManager.editRule(' + i + ')">' + I18n.t('btn_edit') + '</button> ';
            html += '<button class="btn btn-d btn-s" onclick="WebDAVManager.delRule(' + i + ')">' + I18n.t('btn_delete') + '</button></td></tr>';
        }
        html += '</tbody></table>';
        el.innerHTML = html;
    }

    function openRule(i) {
        document.getElementById('rIdx').value = i !== undefined ? i : -1;
        document.getElementById('rMovTitle').textContent = i !== undefined ? I18n.t('modal_edit_rule') : I18n.t('modal_add_rule');
        if (i !== undefined && rules[i]) {
            var r = rules[i];
            document.getElementById('mrType').value = r.regex ? 'regex' : 'path';
            v('mrPath', r.path || '');
            v('mrRegex', r.regex || '');
            setPerm('mrP', r.permissions);
        } else {
            v('mrPath', '');
            v('mrRegex', '');
            setPerm('mrP', '');
            document.getElementById('mrType').value = 'path';
        }
        document.getElementById('mrPG').style.display = '';
        document.getElementById('mrRG').style.display = 'none';
        document.getElementById('ruleMov').classList.add('show');
    }

    function saveRule() {
        var idx = +document.getElementById('rIdx').value;
        var tp = document.getElementById('mrType').value;
        var rule = {};
        if (tp === 'path') {
            var p = v('mrPath').trim();
            if (!p) { showToast(I18n.t('toast_rule_path_empty'), 'error'); return; }
            rule.path = p;
        } else {
            var r = v('mrRegex').trim();
            if (!r) { showToast(I18n.t('toast_rule_regex_empty'), 'error'); return; }
            try { new RegExp(r); } catch (e) { showToast(I18n.t('toast_rule_regex_invalid'), 'error'); return; }
            rule.regex = r;
        }
        var pm = getPerm('mrP');
        rule.permissions = pm || 'none';
        if (idx >= 0) rules[idx] = rule; else rules.push(rule);
        cfg.rules = rules;
        renderRules();
        closeM('ruleMov');
        showToast(idx >= 0 ? I18n.t('toast_rule_updated') : I18n.t('toast_rule_added'), 'success');
    }

    function delRule(i) {
        confirmShow(I18n.t('confirm_delete_rule'), I18n.t('confirm_delete_rule'), I18n.t('btn_delete'), true).then(function(ok) {
            if (!ok) return;
            rules.splice(i, 1);
            cfg.rules = rules;
            renderRules();
            showToast(I18n.t('toast_rule_deleted'), 'info');
        });
    }

    // ─── Raw YAML ───
    function loadRaw() {
        ApiBridge.getRawConfig()
            .then(function(content) {
                document.getElementById('rawEd').value = content;
                st(I18n.t('toast_yaml_loaded'));
            })
            .catch(function(err) {
                if (err.error === 'no_config_path') showToast(I18n.t('hint_set_config_path'), 'info');
                else showToast(err.error || I18n.t('toast_load_failed'), 'error');
            });
    }

    function saveRaw() {
        var c = document.getElementById('rawEd').value;
        ApiBridge.saveRawConfig(c)
            .then(function() {
                showToast(I18n.t('toast_yaml_saved'), 'success');
                loadCfg();
            })
            .catch(function(err) {
                showToast((err.error ? I18n.t('toast_yaml_error') + ': ' + err.error : I18n.t('toast_error')), 'error');
            });
    }

    // ─── Log Outputs ───
    function fillOuts(outs) {
        var el = document.getElementById('logOuts');
        el.innerHTML = '';
        var arr = outs || ['stderr'];
        for (var i = 0; i < arr.length; i++) {
            var d = document.createElement('div');
            d.className = 'oi';
            d.innerHTML = '<span class="dot"></span> ' + e(arr[i]) + ' <button class="btn btn-d btn-s" style="margin-left:auto" onclick="this.parentElement.remove()">X</button>';
            el.appendChild(d);
        }
    }

    function getOuts() {
        var o = [];
        var items = document.querySelectorAll('#logOuts .oi');
        for (var i = 0; i < items.length; i++) {
            var t = items[i].textContent.replace('X', '').trim();
            if (t) o.push(t);
        }
        return o;
    }

    // ─── Service Status (inline in statusBtn, background color) ───
    function updateServiceStatus() {
        var btn = document.getElementById('statusBtn');
        var label = document.getElementById('statusLabel');
        var uptime = document.getElementById('statusUptime');

        ApiBridge.getServiceStatus()
            .then(function(data) {
                if (data.state === 'active') {
                    btn.className = 'icon-btn status-btn status-active';
                    label.textContent = I18n.t('status_running');
                    uptime.textContent = data.uptime || '--';
                } else {
                    btn.className = 'icon-btn status-btn status-inactive';
                    label.textContent = I18n.t('status_stopped');
                    uptime.textContent = data.state || '--';
                }
            })
            .catch(function() {
                btn.className = 'icon-btn status-btn status-inactive';
                label.textContent = I18n.t('status_error');
                uptime.textContent = 'n/a';
            });
    }

    // ─── Restart ───
    function doRestart() {
        confirmShow(I18n.t('toast_restart_confirm'), I18n.t('toast_restart_confirm'), I18n.t('btn_restart'), true).then(function(ok) {
            if (!ok) return;
            showToast(I18n.t('toast_restarting'), 'info');
            ApiBridge.restartService()
                .then(function(d) { showToast(d.message, 'success'); })
                .catch(function(err) { showToast(err.error || I18n.t('toast_request_failed'), 'error'); });
        });
    }

    // ─── Settings Form (removed - now in settings modal) ───

    // ─── Confirm Dialog ───
    var _confirmResolve = null;

    function confirmShow(title, message, btnText, isDanger) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMsg').textContent = message;
        var okBtn = document.getElementById('confirmOk');
        okBtn.textContent = btnText || I18n.t('btn_confirm');
        okBtn.className = isDanger !== false ? 'btn btn-d' : 'btn btn-p';
        document.getElementById('confirmOverlay').classList.add('show');
        document.body.style.overflow = 'hidden';
        return new Promise(function(resolve) { _confirmResolve = resolve; });
    }

    function confirmClose(confirmed) {
        document.getElementById('confirmOverlay').classList.remove('show');
        document.body.style.overflow = '';
        if (_confirmResolve) { _confirmResolve(confirmed); _confirmResolve = null; }
    }

    // ─── Status Bar ───
    function st(t) {
        // Status bar text (no-op if element removed)
    }

    function tick() {
        // Clock tick (no-op if element removed)
    }

    // ─── Perm click handler ───
    function setupPermClick() {
        document.addEventListener('click', function(e) {
            var c = e.target.closest('.pc');
            if (!c || e.target.tagName === 'INPUT') return;
            e.preventDefault();
            var cb = c.querySelector('input');
            if (!cb) return;
            cb.checked = !cb.checked;
            c.classList.toggle('on', cb.checked);
        });
    }

    // ─── Modal close ───
    function setupModalClose() {
        var allMov = document.querySelectorAll('.modal-overlay');
        for (var i = 0; i < allMov.length; i++) {
            allMov[i].addEventListener('click', function(e) {
                if (e.target === this) this.classList.remove('show');
            });
        }
    }

    // ─── Password helpers ───
    function genPw(id) {
        var c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var a = new Uint32Array(24);
        crypto.getRandomValues(a);
        var p = '';
        for (var i = 0; i < 24; i++) p += c.charAt(a[i] % c.length);
        document.getElementById(id).value = p;
        showToast(I18n.t('toast_pw_generated'), 'success');
    }

    function togPw(id) {
        var el = document.getElementById(id);
        el.type = el.type === 'password' ? 'text' : 'password';
    }

    // ─── Init ───
    function init() {
        // Load saved settings (localStorage first for fast render, then ApiBridge overrides)
        loadAppSettings();
        var cachedLang = localStorage.getItem('lang') || currentLang;
        currentLang = cachedLang;

        // Apply theme for fast initial paint
        $html.setAttribute('data-theme', currentTheme === 'system' ?
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') :
            currentTheme);
        updateThemeIcons();

        // Init ApiBridge, then load settings from file, then i18n, then app
        ApiBridge.init().then(function() {
            return loadSettingsFromBridge();
        }).then(function() {
            cachedLang = currentLang;
            return I18n.load(cachedLang);
        }).then(function() {
            I18n.applyToDOM();
            $body.classList.add('i18n-ready');

            applyAccentColor(accentColor);
            applyEffectiveLayout(menuLayout === 'top' ? 'top' : 'side');
            if (menuLayout === 'side' && !sidebarOpen) {
                $sidebar.classList.add('collapsed');
                syncSidebarBodyClass();
            }

            buildMenus();
            setActiveMenu('server');
            setupPermClick();
            setupModalClose();
            initCustomSelects();
            bindEvents();
            FM.initEvents();
            Preview.initEvents();
            loadCfg();
            tick();
            setInterval(tick, 1000);
            updateServiceStatus();
            setInterval(updateServiceStatus, 10000);

            // Update cfg path display
            var _cp4 = document.getElementById('cfgPath'); if (_cp4) _cp4.textContent = ApiBridge.getConfigPath() || I18n.t('hint_set_config_path');

            // Welcome toast
            setTimeout(function() {
                showToast(I18n.t('toast_config_loaded') || 'WebDAV Manager ready', 'info', 3);
            }, 600);
        }).catch(function() {
            $body.classList.add('i18n-ready');
        });
    }

    // ─── Event Bindings ───
    function bindEvents() {
        // Hamburger
        $hamburgerBtn.addEventListener('click', toggleSidebar);

        // Layout toggle
        var layoutBtn = document.getElementById('menuLayoutBtn');
        if (layoutBtn) {
            layoutBtn.addEventListener('click', function() {
                var newLayout = menuLayout === 'side' ? 'top' : 'side';
                menuLayout = newLayout;
                applyEffectiveLayout(newLayout === 'top' ? 'top' : 'side');
                buildMenus();
                setActiveMenu(getCurrentSection());
                saveAppSettings();
                showToast(I18n.t('toastMenuLayoutChanged') || 'Layout switched', 'success', 2.5);
            });
        }

        // Sidebar overlay
        $sidebarOverlay.addEventListener('click', closeMobileSidebar);

        // Theme toggle
        document.getElementById('themeBtn').addEventListener('click', toggleTheme);

        // Language dropdown
        var langBtn = document.getElementById('langBtn');
        var langDropdown = document.getElementById('langDropdown');
        function positionLangDropdown() {
            var rect = langBtn.getBoundingClientRect();
            langDropdown.style.top = (rect.bottom + 8) + 'px';
            langDropdown.style.right = (window.innerWidth - rect.right) + 'px';
        }
        langBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var willShow = !langDropdown.classList.contains('show');
            langDropdown.classList.toggle('show', willShow);
            if (willShow) positionLangDropdown();
        });
        var langItems = langDropdown.querySelectorAll('.lang-dropdown-item');
        for (var i = 0; i < langItems.length; i++) {
            langItems[i].addEventListener('click', function() {
                switchLang(this.dataset.lang);
                langDropdown.classList.remove('show');
            });
        }
        document.addEventListener('click', function(e) {
            if (!langDropdown.contains(e.target) && !langBtn.contains(e.target)) {
                langDropdown.classList.remove('show');
            }
        });

        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);

        // Confirm dialog
        document.getElementById('confirmCancel').addEventListener('click', function() { confirmClose(false); });
        document.getElementById('confirmOk').addEventListener('click', function() { confirmClose(true); });
        document.getElementById('confirmOverlay').addEventListener('click', function(e) {
            if (e.target === this) confirmClose(false);
        });
        document.getElementById('settingsOverlay').addEventListener('click', function(e) {
            if (e.target === this) closeSettingsModal();
        });
        document.getElementById('settingsSave').addEventListener('click', saveSettingsFromPanel);
        document.getElementById('settingsReset').addEventListener('click', resetSettings);

        // Color picker
        var swatches = document.querySelectorAll('.color-swatch');
        for (var s = 0; s < swatches.length; s++) {
            swatches[s].addEventListener('click', function() {
                applyAccentColor(this.dataset.color);
            });
        }
        var customPicker = document.getElementById('colorCustomPicker');
        if (customPicker) {
            customPicker.addEventListener('input', function() { applyAccentColor(this.value); });
        }
        var hexInput = document.getElementById('colorHexInput');
        if (hexInput) {
            hexInput.addEventListener('input', function() {
                var val = this.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9a-fA-F]{6}$/.test(val)) applyAccentColor(val.toLowerCase());
            });
            hexInput.addEventListener('blur', function() { this.value = accentColor.toUpperCase(); });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (document.getElementById('confirmOverlay').classList.contains('show')) confirmClose(false);
                if (document.getElementById('settingsOverlay').classList.contains('show')) closeSettingsModal();
                if (mobileSidebarOpen) closeMobileSidebar();
                langDropdown.classList.remove('show');
            }
        });

        // Responsive resize
        var resizeDebounce;
        var wasMobile = window.innerWidth <= 768;
        window.addEventListener('resize', function() {
            clearTimeout(resizeDebounce);
            var isMobile = window.innerWidth <= 768;
            if (isMobile !== wasMobile) $sidebar.classList.add('resizing');
            resizeDebounce = setTimeout(function() {
                if (menuLayout !== 'side') { wasMobile = isMobile; $sidebar.classList.remove('resizing'); return; }
                if (!isMobile) {
                    closeMobileSidebar();
                    if (sidebarOpen) $sidebar.classList.remove('collapsed');
                } else {
                    $sidebar.classList.add('collapsed');
                    $sidebar.classList.remove('mobile-open');
                    $sidebarOverlay.classList.remove('show');
                    mobileSidebarOpen = false;
                }
                syncSidebarBodyClass();
                wasMobile = isMobile;
                requestAnimationFrame(function() { $sidebar.classList.remove('resizing'); });
            }, 150);
        });

        // System theme change
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
            if (currentTheme === 'system') applyTheme('system');
        });
    }

    // ─── Expose global API ───
    window.WebDAVManager = {
        showToast: showToast,
        toggleTheme: toggleTheme,
        toggleSidebar: toggleSidebar,
        openSettingsModal: openSettingsModal,
        closeSettingsModal: closeSettingsModal,
        doRestart: doRestart,
        saveCfg: saveCfg,
        loadCfg: loadCfg,
        saveRaw: saveRaw,
        loadRaw: loadRaw,
        openUser: openUser,
        saveUser: saveUser,
        editUser: function(i) { openUser(i); },
        delUser: delUser,
        openRule: openRule,
        saveRule: saveRule,
        editRule: function(i) { openRule(i); },
        delRule: delRule,
        addMuR: addMuR,
        confirmShow: confirmShow,
        confirmClose: confirmClose,
        setActiveMenu: setActiveMenu,
        genPw: genPw,
        togPw: togPw,
    };

    // Expose functions for inline onclick handlers
    window.doRestart = doRestart;
    window.saveCfg = saveCfg;
    window.loadCfg = loadCfg;
    window.saveRaw = saveRaw;
    window.loadRaw = loadRaw;
    window.openUser = function(i) { openUser(i); };
    window.saveUser = saveUser;
    window.openRule = function(i) { openRule(i); };
    window.saveRule = saveRule;
    window.addMuR = addMuR;
    window.closeM = closeM;
    window.genPw = genPw;
    window.togPw = togPw;
    window.toggleTheme = toggleTheme;

    // ─── Start ───
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
