/**
 * state.js — 状态管理模块
 * 管理全局状态和持久化（localStorage + settings.json）
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
        serviceStatus: 'online',
        pwLength: 24
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
            pwLength: state.pwLength,
        };
        // 保存到 localStorage（快速缓存，用于页面加载时的主题闪烁修复）
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
        // 同时保存到服务端 settings.json
        if (window.ApiBridge && ApiBridge.saveSettings) {
            ApiBridge.saveSettings({
                language: state.currentLang,
                theme: state.currentTheme,
                menu_layout: state.menuLayout,
                accent_color: state.accentColor,
                sidebar_open: state.sidebarOpen,
                toast_duration: state.toastDuration,
                pw_length: state.pwLength,
                file_root: (ApiBridge.getFileRoot && ApiBridge.getFileRoot()) || '/data'
            }).catch(function(e) {
                console.warn('Failed to save settings to settings.json:', e);
            });
        }
    }

    function loadSettings() {
        // 从 localStorage 快速加载（同步，用于页面初始化）
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
                state.pwLength = settings.pwLength || 24;
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
