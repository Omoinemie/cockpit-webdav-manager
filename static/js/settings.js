/**
 * settings.js — 设置弹窗模块
 * 管理设置面板的打开/关闭/保存/重置，以及自定义下拉选择框
 */
(function() {
    'use strict';

    const $settingsOverlay = document.getElementById('settingsOverlay');

    function getCustomSelectValue(field) {
        var el = document.querySelector('.custom-select[data-field="' + field + '"]');
        if (!el) return '';
        var selected = el.querySelector('.custom-select-option.selected');
        return selected ? selected.dataset.value : '';
    }

    function setCustomSelectValue(field, value) {
        var el = document.querySelector('.custom-select[data-field="' + field + '"]');
        if (!el) return;
        el.querySelectorAll('.custom-select-option').forEach(function(opt) {
            var isSelected = opt.dataset.value === value;
            opt.classList.toggle('selected', isSelected);
            if (isSelected) {
                el.querySelector('.custom-select-value').textContent = opt.textContent;
            }
        });
    }

    function initCustomSelects() {
        document.querySelectorAll('.custom-select').forEach(function(cs) {
            var trigger = cs.querySelector('.custom-select-trigger');
            var options = cs.querySelectorAll('.custom-select-option');
            trigger.addEventListener('click', function(e) {
                e.stopPropagation();
                document.querySelectorAll('.custom-select.open').forEach(function(other) {
                    if (other !== cs) other.classList.remove('open');
                });
                cs.classList.toggle('open');
            });
            options.forEach(function(opt) {
                opt.addEventListener('click', function() {
                    var field = cs.dataset.field;
                    var value = opt.dataset.value;
                    setCustomSelectValue(field, value);
                    cs.classList.remove('open');
                    // 即时预览
                    if (field === 'settingTheme') {
                        if (window.__appFns && window.__appFns.applyTheme) window.__appFns.applyTheme(value);
                    } else if (field === 'settingLang') {
                        if (window.i18n) window.i18n.switchLang(value);
                    } else if (field === 'settingMenuLayout') {
                        if (window.__appFns && window.__appFns.applyMenuLayout) {
                            window.__appFns.applyMenuLayout(value);
                            if (window.__appFns.buildMenus) window.__appFns.buildMenus();
                            if (window.__appFns.setActiveMenu) window.__appFns.setActiveMenu('server');
                        }
                    }
                });
            });
        });
        document.addEventListener('click', function() {
            document.querySelectorAll('.custom-select.open').forEach(function(cs) {
                cs.classList.remove('open');
            });
        });
    }

    function openSettings() {
        var state = window.__appState;
        if (!state) return;
        setCustomSelectValue('settingTheme', state.currentTheme);
        setCustomSelectValue('settingLang', state.currentLang);
        setCustomSelectValue('settingMenuLayout', state.menuLayout);
        setCustomSelectValue('settingNotifSound', state.notifSound ? 'on' : 'off');
        document.getElementById('settingToastDuration').value = state.toastDuration;
        document.getElementById('settingPwLength').value = state.pwLength;
        document.querySelectorAll('.color-swatch').forEach(function(el) {
            el.classList.toggle('active', el.dataset.color === state.accentColor);
        });
        document.getElementById('colorCustomPicker').value = state.accentColor;
        document.getElementById('colorHexInput').value = state.accentColor.toUpperCase();
        $settingsOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeSettings() {
        $settingsOverlay.classList.remove('show');
        document.body.style.overflow = '';
        document.querySelectorAll('.custom-select.open').forEach(function(cs) {
            cs.classList.remove('open');
        });
    }

    function saveSettingsFromPanel() {
        var state = window.__appState;
        if (!state) return;
        var newTheme = getCustomSelectValue('settingTheme');
        var newLang = getCustomSelectValue('settingLang');
        var newLayout = getCustomSelectValue('settingMenuLayout');
        var newNotifSound = getCustomSelectValue('settingNotifSound') === 'on';
        var newToastDuration = parseFloat(document.getElementById('settingToastDuration').value) || 4;
        var newPwLength = parseInt(document.getElementById('settingPwLength').value) || 24;

        var needI18nUpdate = false;
        if (newLang !== state.currentLang) {
            state.currentLang = newLang;
            document.documentElement.lang = state.currentLang;
            needI18nUpdate = true;
        }
        if (newTheme !== state.currentTheme && window.__appFns.applyTheme) window.__appFns.applyTheme(newTheme);
        if (newLayout !== state.menuLayout && window.__appFns.applyMenuLayout) window.__appFns.applyMenuLayout(newLayout);
        state.notifSound = newNotifSound;
        state.toastDuration = Math.max(1, Math.min(15, newToastDuration));
        state.pwLength = Math.max(8, Math.min(64, newPwLength));
        if (window.__appFns.saveSettings) window.__appFns.saveSettings();
        if (needI18nUpdate && window.i18n) window.i18n.updateAllI18n();
        closeSettings();
        if (window.__appFns.showToast) window.__appFns.showToast(t('toastSettingsSaved'), 'success');
    }

    function resetSettings() {
        var state = window.__appState;
        if (!state) return;
        state.currentLang = 'zh-CN';
        document.documentElement.lang = 'zh-CN';
        if (window.__appFns.applyTheme) window.__appFns.applyTheme('light');
        if (window.__appFns.applyMenuLayout) window.__appFns.applyMenuLayout('side');
        if (window.__appFns.applyAccentColor) window.__appFns.applyAccentColor('#4f6ef7');
        state.notifSound = true;
        state.toastDuration = 4;
        state.pwLength = 24;
        setCustomSelectValue('settingTheme', 'light');
        setCustomSelectValue('settingLang', 'zh-CN');
        setCustomSelectValue('settingMenuLayout', 'side');
        setCustomSelectValue('settingNotifSound', 'on');
        document.getElementById('settingToastDuration').value = '4';
        document.getElementById('settingPwLength').value = '24';
        if (window.__appFns.saveSettings) window.__appFns.saveSettings();
        if (window.i18n) window.i18n.updateAllI18n();
        if (window.__appFns.showToast) window.__appFns.showToast(t('toastSettingsReset'), 'info');
    }

    window.settingsModule = {
        getCustomSelectValue,
        setCustomSelectValue,
        initCustomSelects,
        openSettings,
        closeSettings,
        saveSettingsFromPanel,
        resetSettings
    };
    window.__appFns = window.__appFns || {};
    window.__appFns.setCustomSelectValue = setCustomSelectValue;
    window.__appFns.openSettings = openSettings;
    window.__appFns.closeSettings = closeSettings;
    window.__appFns.updateCustomSelectTexts = window.i18n ? window.i18n.updateCustomSelectTexts : function(){};
})();
