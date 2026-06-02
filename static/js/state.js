/**
 * state.js — 状态管理模块
 * 管理全局状态和 localStorage 持久化
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'unified_dashboard_settings';

    const state = {
        currentLang: 'zh-CN',
        currentTheme: 'light',
        menuLayout: 'side',
        accentColor: '#4f6ef7',
        sidebarOpen: true,
        mobileSidebarOpen: false,
        notifSound: true,
        toastDuration: 4,
        notifCount: 4,
        notifItems: [],
        serviceStatus: 'online'
    };

    // 暴露到全局，供其他模块读写
    window.__appState = state;

    function saveSettings() {
        const settings = {
            theme: state.currentTheme,
            lang: state.currentLang,
            menuLayout: state.menuLayout,
            accentColor: state.accentColor,
            sidebarOpen: state.sidebarOpen,
            toastDuration: state.toastDuration,
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
    }

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const settings = JSON.parse(raw);
                state.currentTheme = settings.theme || 'light';
                state.currentLang = settings.lang || 'zh-CN';
                state.menuLayout = settings.menuLayout || 'side';
                state.accentColor = settings.accentColor || '#4f6ef7';
                state.sidebarOpen = settings.sidebarOpen !== false;
                state.toastDuration = settings.toastDuration || 4;
            }
        } catch (e) {
            console.warn('Failed to load settings from localStorage:', e);
        }
    }

    window.stateModule = {
        saveSettings,
        loadSettings,
        STORAGE_KEY
    };
    window.__appFns = window.__appFns || {};
    window.__appFns.saveSettings = saveSettings;
    window.__appFns.loadSettings = loadSettings;
})();
