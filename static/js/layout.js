/**
 * layout.js — 布局切换模块
 * 管理侧边栏/顶部菜单布局、侧边栏折叠/展开、移动端控制
 */
(function() {
    'use strict';

    const $body = document.body;
    const $sidebar = document.getElementById('sidebar');
    const $sidebarOverlay = document.getElementById('sidebarOverlay');
    const $hamburgerBtn = document.getElementById('hamburgerBtn');
    const $topNav = document.getElementById('topNav');

    function getEffectiveLayout() {
        const state = window.__appState;
        if (!state || state.menuLayout === 'auto') return 'top';
        return state.menuLayout;
    }

    function updateLayoutIcons() {
        const $topIcon = document.getElementById('layoutIconTop');
        const $sideIcon = document.getElementById('layoutIconSide');
        const effectiveLayout = getEffectiveLayout();
        if ($topIcon) $topIcon.style.display = effectiveLayout === 'top' ? '' : 'none';
        if ($sideIcon) $sideIcon.style.display = effectiveLayout === 'top' ? 'none' : '';
    }

    function syncSidebarBodyClass() {
        $body.classList.toggle('sidebar-collapsed', $sidebar.classList.contains('collapsed'));
    }

    function applyEffectiveLayout(effective) {
        const state = window.__appState;
        if (effective === 'top') {
            $body.classList.add('menu-top');
            $body.classList.remove('menu-side', 'sidebar-collapsed');
            $sidebar.classList.add('collapsed');
            $sidebar.classList.remove('mobile-open');
            $sidebarOverlay.classList.remove('show');
            if (state) state.mobileSidebarOpen = false;
            $hamburgerBtn.style.display = 'none';
        } else {
            $body.classList.remove('menu-top');
            $body.classList.add('menu-side');
            $sidebar.classList.remove('collapsed');
            if (state) state.sidebarOpen = true;
            $hamburgerBtn.style.display = 'flex';
            if (window.innerWidth <= 768) {
                $sidebar.classList.remove('mobile-open');
                $sidebar.classList.add('collapsed');
                if (state) state.sidebarOpen = false;
            }
            syncSidebarBodyClass();
        }
    }

    function applyMenuLayout(layout) {
        const state = window.__appState;
        if (state) state.menuLayout = layout;
        applyEffectiveLayout(getEffectiveLayout());
        updateLayoutIcons();
        if (window.__appFns && window.__appFns.saveSettings) window.__appFns.saveSettings();
    }

    function toggleMenuLayout() {
        const state = window.__appState;
        const effective = getEffectiveLayout();
        const newLayout = effective === 'side' ? 'top' : 'side';
        if (state) state.menuLayout = newLayout;
        applyMenuLayout(newLayout);
        if (window.__appFns && window.__appFns.setCustomSelectValue) {
            window.__appFns.setCustomSelectValue('settingMenuLayout', state ? state.menuLayout : newLayout);
        }
        if (window.__appFns && window.__appFns.showToast) {
            window.__appFns.showToast(t('toastMenuLayoutChanged'), 'success', 2.5);
        }
    }

    function openMobileSidebar() {
        const state = window.__appState;
        if (state) state.mobileSidebarOpen = true;
        $sidebar.classList.add('mobile-open');
        $sidebar.classList.remove('collapsed');
        $sidebarOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileSidebar() {
        const state = window.__appState;
        if (state) state.mobileSidebarOpen = false;
        $sidebar.classList.remove('mobile-open');
        $sidebar.classList.add('collapsed');
        $sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    function toggleSidebar() {
        const state = window.__appState;
        if (window.innerWidth <= 768) {
            if (state && state.mobileSidebarOpen) closeMobileSidebar();
            else openMobileSidebar();
        } else {
            if (state) state.sidebarOpen = !state.sidebarOpen;
            if (state && state.sidebarOpen) {
                $sidebar.classList.remove('collapsed');
            } else {
                $sidebar.classList.add('collapsed');
            }
            syncSidebarBodyClass();
            if (window.__appFns && window.__appFns.saveSettings) window.__appFns.saveSettings();
        }
    }

    window.layoutModule = {
        getEffectiveLayout,
        updateLayoutIcons,
        syncSidebarBodyClass,
        applyEffectiveLayout,
        applyMenuLayout,
        toggleMenuLayout,
        openMobileSidebar,
        closeMobileSidebar,
        toggleSidebar
    };
    window.__appFns = window.__appFns || {};
    window.__appFns.toggleSidebar = toggleSidebar;
    window.__appFns.applyMenuLayout = applyMenuLayout;
})();
