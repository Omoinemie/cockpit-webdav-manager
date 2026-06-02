/**
 * menu.js — 菜单构建模块 (WebDAV Manager)
 * 定义菜单数据、SVG 图标，负责侧边栏和顶部菜单的动态构建
 */
(function() {
    'use strict';

    var $sidebarNav = document.getElementById('sidebarNav');
    var $topMenuBar = document.getElementById('topMenuBar');

    var menuItems = [
        { id: 'server', icon: 'server', labelKey: 'nav_server', section: 'config' },
        { id: 'tls', icon: 'lock', labelKey: 'nav_tls', section: 'config' },
        { id: 'cors', icon: 'globe', labelKey: 'nav_cors', section: 'config' },
        { id: 'logging', icon: 'file-text', labelKey: 'nav_logging', section: 'config' },
        { id: 'divider1', type: 'divider', section: 'config' },
        { id: 'rules', icon: 'check-square', labelKey: 'nav_rules', section: 'access' },
        { id: 'users', icon: 'users', labelKey: 'nav_users', section: 'access' },
        { id: 'divider2', type: 'divider', section: 'access' },
        { id: 'files', icon: 'folder', labelKey: 'nav_files', section: 'tools' },
        { id: 'raw', icon: 'code', labelKey: 'nav_raw', section: 'tools' },
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
        settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    };

    var sectionLabels = {
        config: 'menuSectionConfig',
        access: 'menuSectionAccess',
        tools: 'menuSectionTools',
    };

    function buildMenus() {
        // 侧边栏菜单
        var sidebarHTML = '';
        var currentSection = null;
        menuItems.forEach(function(item) {
            if (item.type === 'divider') {
                sidebarHTML += '<div class="menu-divider"></div>';
                currentSection = null;
                return;
            }
            if (item.section && item.section !== currentSection && sectionLabels[item.section]) {
                sidebarHTML += '<div class="menu-label">' + t(sectionLabels[item.section]) + '</div>';
                currentSection = item.section;
            }
            sidebarHTML +=
                '<div class="menu-item" data-menu-id="' + item.id + '" role="menuitem" tabindex="0">' +
                '<span class="menu-icon">' + (menuIcons[item.icon] || '') + '</span>' +
                '<span>' + t(item.labelKey) + '</span>' +
                '</div>';
        });
        $sidebarNav.innerHTML = sidebarHTML;

        // 顶部菜单栏
        var topHTML = '';
        menuItems.forEach(function(item) {
            if (item.type === 'divider') return;
            topHTML +=
                '<div class="menu-item" data-menu-id="' + item.id + '" role="menuitem" tabindex="0">' +
                '<span class="menu-icon">' + (menuIcons[item.icon] || '') + '</span>' +
                '<span>' + t(item.labelKey) + '</span>' +
                '</div>';
        });
        if ($topMenuBar) $topMenuBar.innerHTML = topHTML;

        bindMenuClicks();
    }

    function bindMenuClicks() {
        document.querySelectorAll('.menu-item[data-menu-id]').forEach(function(el) {
            el.addEventListener('click', function() {
                var menuId = el.getAttribute('data-menu-id');
                setActiveMenu(menuId);
                var layout = window.layoutModule ? window.layoutModule.getEffectiveLayout() : 'side';
                if (window.innerWidth <= 768 && layout === 'side') {
                    if (window.__appFns && window.__appFns.toggleSidebar) window.__appFns.toggleSidebar();
                }
            });
        });
    }

    function setActiveMenu(menuId) {
        document.querySelectorAll('.menu-item[data-menu-id]').forEach(function(el) {
            el.classList.remove('active');
            if (el.getAttribute('data-menu-id') === menuId) el.classList.add('active');
        });
        document.querySelectorAll('.sec').forEach(function(el) { el.classList.remove('on'); });
        var target = document.getElementById('s-' + menuId);
        if (target) target.classList.add('on');

        // Update section title
        var titleEl = document.getElementById('secTitle');
        if (titleEl) titleEl.textContent = t('nav_' + menuId);

        // Trigger section-specific loads
        if (window.__appFns) {
            if (menuId === 'raw' && window.__appFns.loadRaw) window.__appFns.loadRaw();
            if (menuId === 'files' && window.__appFns.loadFiles) window.__appFns.loadFiles();
        }
    }

    function getCurrentSection() {
        var active = document.querySelector('.sec.on');
        if (active) return active.id.replace('s-', '');
        return 'server';
    }

    window.menuModule = {
        menuItems: menuItems,
        menuIcons: menuIcons,
        sectionLabels: sectionLabels,
        buildMenus: buildMenus,
        bindMenuClicks: bindMenuClicks,
        setActiveMenu: setActiveMenu,
        getCurrentSection: getCurrentSection
    };
    window.__appFns = window.__appFns || {};
    window.__appFns.buildMenus = buildMenus;
    window.__appFns.setActiveMenu = setActiveMenu;
})();
