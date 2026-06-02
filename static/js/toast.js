/**
 * toast.js — Toast 通知系统
 * 提供 success/error/warning/info 四种类型的浮层提示
 */
(function() {
    'use strict';

    const $toastContainer = document.getElementById('toastContainer');

    function showToast(message, type, duration) {
        type = type || 'info';
        const state = window.__appState;
        const dur = duration || (state ? state.toastDuration : 4);
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        };
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
            '<span class="toast-body"></span>' +
            '<button class="toast-close" aria-label="关闭"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
        toast.querySelector('.toast-body').textContent = message;
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

    window.toastModule = { showToast, removeToast };
    window.__appFns = window.__appFns || {};
    window.__appFns.showToast = showToast;
    window.showToast = showToast;
})();
