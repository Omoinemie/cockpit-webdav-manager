/**
 * confirm.js — 确认对话框模块 (WebDAV Manager)
 * 提供确认/取消对话框功能
 */
(function() {
    'use strict';

    var _confirmResolve = null;

    function confirmShow(title, message, btnText, isDanger) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMsg').textContent = message;
        var okBtn = document.getElementById('confirmOk');
        okBtn.textContent = btnText || t('btn_confirm');
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

    // 初始化确认对话框事件
    function initConfirmEvents() {
        var cancelBtn = document.getElementById('confirmCancel');
        var okBtn = document.getElementById('confirmOk');
        var overlay = document.getElementById('confirmOverlay');
        if (cancelBtn) cancelBtn.addEventListener('click', function() { confirmClose(false); });
        if (okBtn) okBtn.addEventListener('click', function() { confirmClose(true); });
        if (overlay) overlay.addEventListener('click', function(e) {
            if (e.target === this) confirmClose(false);
        });
    }

    window.confirmModule = {
        confirmShow: confirmShow,
        confirmClose: confirmClose,
        initConfirmEvents: initConfirmEvents
    };
    window.__appFns = window.__appFns || {};
    window.__appFns.confirmShow = confirmShow;
    window.__appFns.confirmClose = confirmClose;
})();
