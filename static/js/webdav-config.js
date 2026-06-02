/**
 * webdav-config.js — WebDAV配置管理模块
 * 管理服务器配置、TLS、CORS、日志等设置
 */
(function() {
    'use strict';

    var cfg = {};
    var rules = [];
    var users = [];

    // ─── Config Load/Save ───
    function loadCfg() {
        ApiBridge.getConfig()
            .then(function(d) {
                cfg = d.config || {};
                var cfgPathEl = document.getElementById('cfgPath');
                if (cfgPathEl) cfgPathEl.textContent = d.path;
                fillForm();
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_config_loaded'), 'success');
                }
            })
            .catch(function(err) {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(err.error || t('toast_load_failed'), 'error');
                }
                var cfgPathEl = document.getElementById('cfgPath');
                if (cfgPathEl) cfgPathEl.textContent = err.path || 'error';
            });
    }

    function fillForm() {
        v('address', cfg.address);
        v('port', cfg.port);
        v('prefix', cfg.prefix);
        v('directory', cfg.directory);
        ckd('debug', cfg.debug);
        ckd('noSniff', cfg.noSniff);
        ckd('behindProxy', cfg.behindProxy);
        ckd('noPassword', cfg.noPassword);
        setPerm('defPerms', cfg.permissions);
        v('rulesBehavior', cfg.rulesBehavior);
        ckd('tls', cfg.tls);
        v('cert', cfg.cert);
        v('key', cfg.key);
        var co = cfg.cors || {};
        ckd('corsOn', co.enabled);
        ckd('corsCred', co.credentials);
        a2t('corsHosts', co.allowed_hosts);
        a2t('corsHdrs', co.allowed_headers);
        a2t('corsMtds', co.allowed_methods);
        a2t('corsExp', co.exposed_headers);
        var lg = cfg.log || {};
        v('logFmt', lg.format);
        ckd('logClr', lg.colors);
        fillOuts(lg.outputs);
        rules = cfg.rules || [];
        users = cfg.users || [];
        if (window.__appFns) {
            if (window.__appFns.renderRules) window.__appFns.renderRules();
            if (window.__appFns.renderUsers) window.__appFns.renderUsers();
        }
    }

    function saveCfg() {
        var c = buildCfg();
        var d = validateCfg(c);
        if (!d.valid) {
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(t('toast_validate_failed') + ': ' + d.errors.join('; '), 'error');
            }
            return;
        }
        ApiBridge.saveConfig(c)
            .then(function() {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_saved'), 'success');
                }
                cfg = c;
                // 清除所有dirty状态
                document.querySelectorAll('.card.dirty').forEach(function(card) {
                    card.classList.remove('dirty');
                });
            })
            .catch(function(err) {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(err.error || t('toast_save_failed'), 'error');
                }
            });
    }

    function buildCfg() {
        var c = {};
        // 基本设置
        c.address = v('address') || '0.0.0.0';
        c.port = parseInt(v('port')) || 6065;
        c.prefix = v('prefix') || '/';
        c.directory = v('directory') || '/data';
        c.debug = !!ckd('debug');
        c.noSniff = !!ckd('noSniff');
        c.behindProxy = !!ckd('behindProxy');
        c.noPassword = !!ckd('noPassword');
        var pm = getPerm('defPerms');
        c.permissions = pm || 'R';
        c.rulesBehavior = v('rulesBehavior') || 'overwrite';
        c.tls = !!ckd('tls');
        c.cert = v('cert') || 'cert.pem';
        c.key = v('key') || 'key.pem';
        // CORS
        c.cors = {
            enabled: !!ckd('corsOn'),
            credentials: !!ckd('corsCred'),
            allowed_hosts: t2a('corsHosts').length ? t2a('corsHosts') : ['*'],
            allowed_headers: t2a('corsHdrs').length ? t2a('corsHdrs') : ['Authorization', 'Content-Type', 'Depth', 'Destination', 'If', 'Lock-Token', 'Overwrite', 'TimeOut', 'Translate'],
            allowed_methods: t2a('corsMtds').length ? t2a('corsMtds') : ['COPY', 'DELETE', 'GET', 'HEAD', 'LOCK', 'UNLOCK', 'MKCOL', 'MOVE', 'OPTIONS', 'POST', 'PROPFIND', 'PROPPATCH', 'PUT'],
            exposed_headers: t2a('corsExp')
        };
        // 日志
        c.log = {
            format: v('logFmt') || 'console',
            colors: !!ckd('logClr'),
            outputs: getOuts().length ? getOuts() : ['stderr']
        };
        // 规则和用户
        c.rules = rules || [];
        c.users = users || [];
        return c;
    }

    function validateCfg(c) {
        var errors = [];
        if (c.port && (c.port < 1 || c.port > 65535)) errors.push(t('err_port_range'));
        if (c.tls && !c.cert) errors.push(t('err_tls_no_cert'));
        if (c.tls && !c.key) errors.push(t('err_tls_no_key'));
        return { valid: errors.length === 0, errors: errors };
    }

    // ─── Raw YAML ───
    function loadRaw() {
        ApiBridge.getRawConfig()
            .then(function(content) {
                document.getElementById('rawEd').value = content;
            })
            .catch(function(err) {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(err.error || t('toast_load_failed'), 'error');
                }
            });
    }

    function saveRaw() {
        var c = document.getElementById('rawEd').value;
        ApiBridge.saveRawConfig(c)
            .then(function() {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_yaml_saved'), 'success');
                }
                loadCfg();
            })
            .catch(function(err) {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast((err.error ? t('toast_yaml_error') + ': ' + err.error : t('toast_error')), 'error');
                }
            });
    }

    // ─── Log Outputs ───
    function fillOuts(outs) {
        var el = document.getElementById('logOuts');
        if (!el) return;
        el.innerHTML = '';
        var arr = outs || ['stderr'];
        for (var i = 0; i < arr.length; i++) {
            addLogOutputItem(arr[i]);
        }
    }

    function addLogOutputItem(value) {
        var el = document.getElementById('logOuts');
        if (!el) return;
        var d = document.createElement('div');
        d.className = 'oi';
        d.innerHTML = '<span class="dot"></span> <input class="oi-input" value="' + e(value || '') + '" placeholder="stdout, stderr, /path/to/file"> <button class="btn btn-d btn-s" onclick="this.parentElement.remove()" title="' + t('btn_delete') + '">✕</button>';
        el.appendChild(d);
    }

    function addLogOutput() {
        addLogOutputItem('');
        // 聚焦新添加的输入框
        var inputs = document.querySelectorAll('#logOuts .oi-input');
        if (inputs.length) inputs[inputs.length - 1].focus();
    }

    function getOuts() {
        var o = [];
        var inputs = document.querySelectorAll('#logOuts .oi-input');
        for (var i = 0; i < inputs.length; i++) {
            var val = inputs[i].value.trim();
            if (val) o.push(val);
        }
        return o;
    }

    // ─── Helpers ───
    function v(id, val) {
        var el = document.getElementById(id);
        if (!el) return val !== undefined ? undefined : '';
        if (val !== undefined) { el.value = val; return val; }
        return el.value;
    }

    function ckd(id, val) {
        var el = document.getElementById(id);
        if (!el) return val !== undefined ? false : false;
        if (val !== undefined) { el.checked = !!val; return !!val; }
        return el.checked;
    }

    function a2t(id, arr) {
        var el = document.getElementById(id);
        if (el) el.value = (arr || []).join('\n');
    }

    function t2a(id) {
        var el = document.getElementById(id);
        if (!el) return [];
        return el.value.split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
    }

    function e(s) {
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function setPerm(containerId, perms) {
        var el = document.getElementById(containerId);
        if (!el) return;
        var pcs = el.querySelectorAll('.pc');
        for (var i = 0; i < pcs.length; i++) {
            var p = pcs[i].dataset.p;
            var isOn = (perms || '').indexOf(p) >= 0;
            pcs[i].classList.toggle('on', isOn);
            var cb = pcs[i].querySelector('input');
            if (cb) cb.checked = isOn;
        }
    }

    function getPerm(containerId) {
        var el = document.getElementById(containerId);
        if (!el) return '';
        var result = '';
        var pcs = el.querySelectorAll('.pc');
        for (var i = 0; i < pcs.length; i++) {
            if (pcs[i].querySelector('input').checked) result += pcs[i].dataset.p;
        }
        return result;
    }

    function permBadges(perms) {
        if (!perms) return '<span class="tg rd">' + t('perm_none') + '</span>';
        var html = '';
        var colors = { C: 'bl', R: 'gr', U: 'or', D: 'rd' };
        for (var i = 0; i < perms.length; i++) {
            var p = perms[i];
            html += '<span class="tg ' + (colors[p] || '') + '">' + p + '</span>';
        }
        return html;
    }

    // 暴露到全局
    window.webdavConfig = {
        cfg: function() { return cfg; },
        rules: function() { return rules; },
        users: function() { return users; },
        setRules: function(r) { rules = r; cfg.rules = r; },
        setUsers: function(u) { users = u; cfg.users = u; },
        loadCfg: loadCfg,
        saveCfg: saveCfg,
        loadRaw: loadRaw,
        saveRaw: saveRaw,
        fillForm: fillForm,
        buildCfg: buildCfg,
        v: v,
        ckd: ckd,
        e: e,
        setPerm: setPerm,
        getPerm: getPerm,
        permBadges: permBadges
    };

    window.__appFns = window.__appFns || {};
    window.__appFns.loadCfg = loadCfg;
    window.__appFns.saveCfg = saveCfg;
    window.__appFns.loadRaw = loadRaw;
    window.__appFns.saveRaw = saveRaw;

    // 全局函数暴露（供onclick使用）
    window.loadCfg = loadCfg;
    window.saveCfg = saveCfg;
    window.loadRaw = loadRaw;
    window.saveRaw = saveRaw;
    window.addLogOutput = addLogOutput;
})();
