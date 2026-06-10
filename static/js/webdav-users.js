/**
 * webdav-users.js — 用户管理模块 (WebDAV Manager)
 * 管理WebDAV用户的增删改查
 */
(function() {
    'use strict';

    function renderUsers() {
        var users = window.webdavConfig ? window.webdavConfig.users() : [];
        var uCntEl = document.getElementById('uCnt');
        if (uCntEl) uCntEl.textContent = users.length;

        var el = document.getElementById('userList');
        if (!el) return;

        if (!users.length) {
            el.innerHTML = '<div class="empty"><svg class="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 10px;display:block;opacity:.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg><p>' + t('empty_users') + '</p></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < users.length; i++) {
            var u = users[i];
            var p = window.webdavConfig.permBadges(u.permissions);
            var d = u.directory ? '<span class="tg bl">' + t('dir_tag') + ': ' + window.webdavConfig.e(u.directory) + '</span>' : '';
            var rc = (u.rules || []).length;
            var rh = rc ? '<span class="tg">' + t('rules_tag') + ': ' + rc + '</span>' : '';
            var pt = (u.password || '').indexOf('{bcrypt}') === 0 ? 'bcrypt' : (u.password || '').indexOf('{env}') === 0 ? 'env' : t('password_plaintext');
            var pt2 = pt === t('password_plaintext') ? '<span class="tg rd">' + pt + '</span>' : '<span class="tg gr">' + pt + '</span>';
            html += '<div class="ucard">';
            html += '<div class="uinfo">';
            html += '<div class="uname"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' + window.webdavConfig.e(u.username) + ' ' + p + ' ' + pt2 + ' ' + d + ' ' + rh + '</div>';
            html += '</div>';
            html += '<div class="uacts">';
            html += '<button class="btn btn-o btn-s" onclick="WebDAVUsers.copyPassword(\'' + window.webdavConfig.e(u.username) + '\', \'' + window.webdavConfig.e(u.password) + '\')" title="' + t('btn_copy_password') + '">🔑</button>';
            html += '<button class="btn btn-o btn-s" onclick="WebDAVUsers.editUser(' + i + ')">' + t('btn_edit') + '</button>';
            html += '<button class="btn btn-d btn-s" onclick="WebDAVUsers.delUser(' + i + ')">' + t('btn_delete') + '</button>';
            html += '</div></div>';
        }
        el.innerHTML = html;
    }

    function openUser(i) {
        var users = window.webdavConfig.users();
        document.getElementById('uIdx').value = i !== undefined ? i : -1;
        document.getElementById('uMovTitle').textContent = i !== undefined ? t('modal_edit_user') : t('modal_add_user');
        document.getElementById('muR').innerHTML = '';
        if (i !== undefined && users[i]) {
            var u = users[i];
            window.webdavConfig.v('muUser', u.username);
            window.webdavConfig.v('muPass', u.password);
            window.webdavConfig.v('muDir', u.directory);
            window.webdavConfig.setPerm('muP', u.permissions);
            var ur = u.rules || [];
            for (var j = 0; j < ur.length; j++) addMuR(ur[j]);
        } else {
            window.webdavConfig.v('muUser', '');
            window.webdavConfig.v('muPass', '');
            window.webdavConfig.v('muDir', '');
            window.webdavConfig.setPerm('muP', '');
        }
        document.getElementById('userMov').classList.add('show');
    }

    function saveUser() {
        var users = window.webdavConfig.users();
        var idx = +document.getElementById('uIdx').value;
        var un = window.webdavConfig.v('muUser').trim();
        var pw = window.webdavConfig.v('muPass').trim();
        if (!un || !pw) {
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(t('toast_user_required'), 'error');
            }
            return;
        }
        var isNewUser = idx < 0;
        var o = { username: un, password: pw };
        // 目录为空时自动设置为 webdav根目录/用户名
        var d = window.webdavConfig.v('muDir').trim();
        if (!d) {
            var fileRoot = ApiBridge.getFileRoot() || '/data';
            d = fileRoot + '/' + un;
        }
        o.directory = d;
        var pm = window.webdavConfig.getPerm('muP'); if (pm) o.permissions = pm;
        var ur = [];
        var murItems = document.querySelectorAll('#muR .mur');
        for (var i = 0; i < murItems.length; i++) {
            var r = murItems[i];
            var tp = r.querySelector('.mur-t').value;
            var vl = r.querySelector('.mur-v').value.trim();
            var rp = [];
            var rpCbs = r.querySelectorAll('.pc');
            for (var j = 0; j < rpCbs.length; j++) {
                if (rpCbs[j].querySelector('input').checked) rp.push(rpCbs[j].dataset.p);
            }
            if (!vl) continue;
            var rule = tp === 'path' ? { path: vl } : { regex: vl };
            rule.permissions = rp.length ? rp.join('') : 'none';
            ur.push(rule);
        }
        if (ur.length) o.rules = ur;
        if (idx >= 0) users[idx] = o; else users.push(o);
        window.webdavConfig.setUsers(users);
        renderUsers();
        closeM('userMov');
        if (window.__appFns && window.__appFns.showToast) {
            window.__appFns.showToast(idx >= 0 ? t('toast_user_updated') : t('toast_user_added'), 'success');
        }
        // 自动保存到配置文件
        if (window.__appFns && window.__appFns.saveCfg) {
            window.__appFns.saveCfg();
        }
        // 仅新建用户且目录为空时，创建用户文件夹
        if (isNewUser && !window.webdavConfig.v('muDir').trim()) {
            cockpit.spawn(['mkdir', '-p', o.directory], { superuser: 'require', err: 'ignore' });
        }
    }

    function delUser(i) {
        var users = window.webdavConfig.users();
        if (window.__appFns && window.__appFns.confirmShow) {
            window.__appFns.confirmShow(t('confirm_delete_user'), t('confirm_delete_user') + ' "' + users[i].username + '"?', t('btn_delete'), true).then(function(ok) {
                if (!ok) return;
                users.splice(i, 1);
                window.webdavConfig.setUsers(users);
                renderUsers();
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_user_deleted'), 'info');
                }
                // 自动保存到配置文件
                if (window.__appFns && window.__appFns.saveCfg) {
                    window.__appFns.saveCfg();
                }
            });
        }
    }

    function addMuR(rule) {
        var d = document.createElement('div');
        d.className = 'mur';
        var ir = rule && rule.regex;
        var vl = rule ? (rule.path || rule.regex || '') : '';
        var rp = rule ? (rule.permissions || '') : '';
        // 第一行：类型选择 + 路径输入
        var html = '<div style="display:flex;gap:6px;align-items:center;width:100%;">';
        html += '<select class="mur-t" onchange="var inp=this.nextElementSibling;inp.placeholder=this.value===\'regex\'?\'^.*\\\\.js$\':\'/path\'">';
        html += '<option value="path"' + (ir ? '' : ' selected') + '>' + t('opt_path') + '</option>';
        html += '<option value="regex"' + (ir ? ' selected' : '') + '>' + t('opt_regex') + '</option></select>';
        html += '<input class="mur-v" value="' + window.webdavConfig.e(vl) + '" placeholder="' + (ir ? '^.*\\.js$' : '/path') + '">';
        html += '</div>';
        // 第二行：CRUD权限 + 删除按钮
        html += '<div style="display:flex;align-items:center;width:100%;margin-top:4px;">';
        html += '<div class="pcs">';
        var permArr = ['C', 'R', 'U', 'D'];
        for (var i = 0; i < permArr.length; i++) {
            var pp = permArr[i];
            var isOn = rp.indexOf(pp) >= 0;
            html += '<label class="pc' + (isOn ? ' on' : '') + '" data-p="' + pp + '"><input type="checkbox"' + (isOn ? ' checked' : '') + '><b>' + pp + '</b></label>';
        }
        html += '</div>';
        html += '<button class="btn btn-d btn-s" onclick="this.closest(\'.mur\').remove()" title="' + t('btn_delete') + '" style="margin-left:auto;padding:3px 8px;font-size:0.75rem;">✕</button>';
        html += '</div>';
        d.innerHTML = html;
        document.getElementById('muR').appendChild(d);
    }

    // 密码帮助函数
    function genPw(id) {
        var state = window.__appState;
        var len = (state && state.pwLength) ? Math.max(8, Math.min(64, state.pwLength)) : 24;
        var c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var a = new Uint32Array(len);
        crypto.getRandomValues(a);
        var p = '';
        for (var i = 0; i < len; i++) p += c.charAt(a[i] % c.length);
        document.getElementById(id).value = p;
        if (window.__appFns && window.__appFns.showToast) {
            window.__appFns.showToast(t('toast_pw_generated') + ' (' + len + ')', 'success');
        }
    }

    function togPw(id) {
        var el = document.getElementById(id);
        el.type = el.type === 'password' ? 'text' : 'password';
    }

    // 复制密码到剪贴板
    function copyPassword(username, password) {
        if (!password) {
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(t('toast_no_password'), 'warning');
            }
            return;
        }
        navigator.clipboard.writeText(password).then(function() {
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(t('toast_password_copied') + ': ' + username, 'success');
            }
        }).catch(function() {
            // fallback
            var ta = document.createElement('textarea');
            ta.value = password;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(t('toast_password_copied') + ': ' + username, 'success');
            }
        });
    }

    // 暴露到全局
    window.WebDAVUsers = {
        renderUsers: renderUsers,
        openUser: openUser,
        saveUser: saveUser,
        editUser: function(i) { openUser(i); },
        delUser: delUser,
        copyPassword: copyPassword,
        addMuR: addMuR,
        genPw: genPw,
        togPw: togPw
    };

    window.__appFns = window.__appFns || {};
    window.__appFns.renderUsers = renderUsers;

    // 暴露给内联onclick
    window.openUser = function(i) { openUser(i); };
    window.saveUser = saveUser;
    window.addMuR = addMuR;
    window.genPw = genPw;
    window.togPw = togPw;
})();
