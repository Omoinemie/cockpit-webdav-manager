/**
 * webdav-rules.js — 规则管理模块 (WebDAV Manager)
 * 管理全局访问控制规则
 */
(function() {
    'use strict';

    function renderRules() {
        var rules = window.webdavConfig ? window.webdavConfig.rules() : [];
        var rCntEl = document.getElementById('rCnt');
        if (rCntEl) rCntEl.textContent = rules.length;

        var el = document.getElementById('rulesList');
        if (!el) return;

        if (!rules.length) {
            el.innerHTML = '<div class="empty"><svg class="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 10px;display:block;opacity:.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg><p>' + t('empty_rules') + '</p></div>';
            return;
        }

        var html = '<table class="tbl"><thead><tr><th>#</th><th>' + t('col_type') + '</th><th>' + t('col_match') + '</th><th>' + t('col_perms') + '</th><th>' + t('col_actions') + '</th></tr></thead><tbody>';
        for (var i = 0; i < rules.length; i++) {
            var r = rules[i];
            html += '<tr><td>' + (i + 1) + '</td>';
            html += '<td>' + (r.path ? '<span class="tg bl">' + t('opt_path') + '</span>' : '<span class="tg">' + t('opt_regex') + '</span>') + '</td>';
            html += '<td><code>' + window.webdavConfig.e(r.path || r.regex) + '</code></td>';
            html += '<td>' + window.webdavConfig.permBadges(r.permissions) + '</td>';
            html += '<td><button class="btn btn-o btn-s" onclick="WebDAVRules.editRule(' + i + ')">' + t('btn_edit') + '</button> ';
            html += '<button class="btn btn-d btn-s" onclick="WebDAVRules.delRule(' + i + ')">' + t('btn_delete') + '</button></td></tr>';
        }
        html += '</tbody></table>';
        el.innerHTML = html;
    }

    function openRule(i) {
        var rules = window.webdavConfig.rules();
        document.getElementById('rIdx').value = i !== undefined ? i : -1;
        document.getElementById('rMovTitle').textContent = i !== undefined ? t('modal_edit_rule') : t('modal_add_rule');
        if (i !== undefined && rules[i]) {
            var r = rules[i];
            document.getElementById('mrType').value = r.regex ? 'regex' : 'path';
            window.webdavConfig.v('mrPath', r.path || '');
            window.webdavConfig.v('mrRegex', r.regex || '');
            window.webdavConfig.setPerm('mrP', r.permissions);
        } else {
            window.webdavConfig.v('mrPath', '');
            window.webdavConfig.v('mrRegex', '');
            window.webdavConfig.setPerm('mrP', '');
            document.getElementById('mrType').value = 'path';
        }
        document.getElementById('mrPG').style.display = '';
        document.getElementById('mrRG').style.display = 'none';
        document.getElementById('ruleMov').classList.add('show');
    }

    function saveRule() {
        var rules = window.webdavConfig.rules();
        var idx = +document.getElementById('rIdx').value;
        var tp = document.getElementById('mrType').value;
        var rule = {};
        if (tp === 'path') {
            var p = window.webdavConfig.v('mrPath').trim();
            if (!p) {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_rule_path_empty'), 'error');
                }
                return;
            }
            rule.path = p;
        } else {
            var r = window.webdavConfig.v('mrRegex').trim();
            if (!r) {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_rule_regex_empty'), 'error');
                }
                return;
            }
            try { new RegExp(r); } catch (e) {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_rule_regex_invalid'), 'error');
                }
                return;
            }
            rule.regex = r;
        }
        var pm = window.webdavConfig.getPerm('mrP');
        rule.permissions = pm || 'none';
        if (idx >= 0) rules[idx] = rule; else rules.push(rule);
        window.webdavConfig.setRules(rules);
        renderRules();
        closeM('ruleMov');
        if (window.__appFns && window.__appFns.showToast) {
            window.__appFns.showToast(idx >= 0 ? t('toast_rule_updated') : t('toast_rule_added'), 'success');
        }
    }

    function delRule(i) {
        var rules = window.webdavConfig.rules();
        if (window.__appFns && window.__appFns.confirmShow) {
            window.__appFns.confirmShow(t('confirm_delete_rule'), t('confirm_delete_rule'), t('btn_delete'), true).then(function(ok) {
                if (!ok) return;
                rules.splice(i, 1);
                window.webdavConfig.setRules(rules);
                renderRules();
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_rule_deleted'), 'info');
                }
            });
        }
    }

    // 暴露到全局
    window.WebDAVRules = {
        renderRules: renderRules,
        openRule: openRule,
        saveRule: saveRule,
        editRule: function(i) { openRule(i); },
        delRule: delRule
    };

    window.__appFns = window.__appFns || {};
    window.__appFns.renderRules = renderRules;

    // 暴露给内联onclick
    window.openRule = function(i) { openRule(i); };
    window.saveRule = saveRule;
})();
