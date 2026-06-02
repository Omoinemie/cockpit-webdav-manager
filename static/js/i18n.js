/**
 * i18n.js — 国际化模块 (WebDAV Manager)
 * 负责语言文件的加载、翻译函数 t()、以及 DOM 文本更新
 */
(function() {
    'use strict';

    const i18nData = {};

    async function loadLang(lang) {
        if (i18nData[lang]) return;
        try {
            const resp = await fetch(`static/lang/${lang}.json`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            i18nData[lang] = await resp.json();
        } catch (e) {
            console.warn(`[i18n] Failed to load lang/${lang}.json:`, e);
            if (lang !== 'en') {
                i18nData[lang] = {};
            }
        }
    }

    function t(key) {
        const lang = window.__appState ? window.__appState.currentLang : 'en';
        return (i18nData[lang] && i18nData[lang][key]) || key;
    }

    function updateAllI18n() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (el.tagName === 'OPTION') {
                el.textContent = t(key);
            } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t(key);
            } else {
                el.textContent = t(key);
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.getAttribute('data-i18n-title'));
        });
        // 依赖其他模块的更新
        if (window.__appFns) {
            if (window.__appFns.updateFooterStatus) window.__appFns.updateFooterStatus();
            if (window.__appFns.buildMenus) window.__appFns.buildMenus();
            if (window.__appFns.updateCustomSelectTexts) window.__appFns.updateCustomSelectTexts();
            if (window.__appFns.renderUsers) window.__appFns.renderUsers();
            if (window.__appFns.renderRules) window.__appFns.renderRules();
        }
    }

    function updateCustomSelectTexts() {
        document.querySelectorAll('#settingsModal .custom-select-option[data-i18n]').forEach(opt => {
            const key = opt.getAttribute('data-i18n');
            if (key) opt.textContent = t(key);
        });
        document.querySelectorAll('#settingsModal .custom-select').forEach(cs => {
            const selected = cs.querySelector('.custom-select-option.selected');
            if (selected) {
                cs.querySelector('.custom-select-value').textContent = selected.textContent;
            }
        });
        const titleEl = document.getElementById('settingsTitle');
        if (titleEl) titleEl.textContent = t('settings');
        document.querySelectorAll('#settingsModal label[data-i18n]').forEach(label => {
            label.textContent = t(label.getAttribute('data-i18n'));
        });
        const resetBtn = document.getElementById('settingsReset');
        const saveBtn = document.getElementById('settingsSave');
        if (resetBtn) resetBtn.textContent = t('resetDefaults');
        if (saveBtn) saveBtn.textContent = t('saveSettings');
    }

    function updateLangDropdown() {
        const currentLang = window.__appState ? window.__appState.currentLang : 'en';
        document.querySelectorAll('.lang-dropdown-item').forEach(el => {
            el.classList.toggle('active', el.dataset.lang === currentLang);
        });
    }

    async function switchLang(lang) {
        const state = window.__appState;
        if (!state || lang === state.currentLang) return;
        await loadLang(lang);
        state.currentLang = lang;
        document.documentElement.lang = state.currentLang;
        updateLangDropdown();
        if (window.__appFns && window.__appFns.setCustomSelectValue) {
            window.__appFns.setCustomSelectValue('settingLang', state.currentLang);
        }
        updateAllI18n();
        if (window.__appFns && window.__appFns.saveSettings) window.__appFns.saveSettings();
        if (window.__appFns && window.__appFns.showToast) window.__appFns.showToast(t('toastLangChanged'), 'success', 2.5);
    }

    // 暴露
    window.i18n = {
        loadLang,
        t,
        updateAllI18n,
        updateCustomSelectTexts,
        updateLangDropdown,
        switchLang,
        getData: () => i18nData
    };
    window.t = t;
})();
