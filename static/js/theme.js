/**
 * theme.js — 主题切换模块
 * 管理亮/暗/系统主题切换、主题色应用
 */
(function() {
    'use strict';

    const $html = document.documentElement;
    const $themeIconSun = document.getElementById('themeIconSun');
    const $themeIconMoon = document.getElementById('themeIconMoon');

    const presetColors = [
        '#4f6ef7', '#8b5cf6', '#ec4899', '#ef4444',
        '#f59e0b', '#10b981', '#06b6d4'
    ];

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    function applyAccentColor(color) {
        const state = window.__appState;
        if (state) state.accentColor = color;
        const rgb = hexToRgb(color);
        const hoverR = Math.max(0, rgb.r - 20);
        const hoverG = Math.max(0, rgb.g - 20);
        const hoverB = Math.max(0, rgb.b - 20);
        const hoverColor = `#${hoverR.toString(16).padStart(2,'0')}${hoverG.toString(16).padStart(2,'0')}${hoverB.toString(16).padStart(2,'0')}`;

        $html.style.setProperty('--accent', color);
        $html.style.setProperty('--accent-hover', hoverColor);
        $html.style.setProperty('--accent-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
        $html.style.setProperty('--accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);

        if ($html.getAttribute('data-theme') === 'dark') {
            const lightR = Math.min(255, rgb.r + 30);
            const lightG = Math.min(255, rgb.g + 30);
            const lightB = Math.min(255, rgb.b + 30);
            $html.style.setProperty('--accent-hover', `#${lightR.toString(16).padStart(2,'0')}${lightG.toString(16).padStart(2,'0')}${lightB.toString(16).padStart(2,'0')}`);
            $html.style.setProperty('--accent-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
            $html.style.setProperty('--accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        }

        document.querySelectorAll('.logo-icon').forEach(el => {
            el.style.background = `linear-gradient(135deg, ${color}, #8b5cf6)`;
        });
        document.querySelectorAll('.color-swatch').forEach(el => {
            el.classList.toggle('active', el.dataset.color === color);
        });
        const customPicker = document.getElementById('colorCustomPicker');
        const hexInput = document.getElementById('colorHexInput');
        if (customPicker) customPicker.value = color;
        if (hexInput) hexInput.value = color.toUpperCase();
    }

    function updateThemeIcons() {
        const isDark = $html.getAttribute('data-theme') === 'dark';
        if ($themeIconSun) $themeIconSun.style.display = isDark ? 'none' : '';
        if ($themeIconMoon) $themeIconMoon.style.display = isDark ? '' : 'none';
    }

    function applyTheme(theme) {
        const state = window.__appState;
        if (state) state.currentTheme = theme;
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            $html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            $html.setAttribute('data-theme', theme);
        }
        updateThemeIcons();
        applyAccentColor(state ? state.accentColor : '#4f6ef7');
        if (window.__appFns && window.__appFns.saveSettings) window.__appFns.saveSettings();
    }

    function toggleTheme() {
        const state = window.__appState;
        const currentActual = $html.getAttribute('data-theme');
        const next = currentActual === 'dark' ? 'light' : 'dark';
        if (state) state.currentTheme = next;
        $html.setAttribute('data-theme', next);
        updateThemeIcons();
        applyAccentColor(state ? state.accentColor : '#4f6ef7');
        if (window.__appFns && window.__appFns.saveSettings) window.__appFns.saveSettings();
        if (window.__appFns && window.__appFns.showToast) {
            window.__appFns.showToast(t('toastThemeChanged'), 'success', 2.5);
        }
    }

    window.themeModule = {
        presetColors,
        hexToRgb,
        applyAccentColor,
        updateThemeIcons,
        applyTheme,
        toggleTheme
    };
    window.__appFns = window.__appFns || {};
    window.__appFns.applyAccentColor = applyAccentColor;
    window.__appFns.applyTheme = applyTheme;
})();
