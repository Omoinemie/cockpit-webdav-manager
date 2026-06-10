/**
 * app.js — 主入口文件 (WebDAV Manager)
 * 负责初始化所有模块、绑定全局事件、暴露公共 API
 *
 * 加载顺序（必须在本文件之前加载）：
 *   1. i18n.js          — 国际化
 *   2. state.js         — 状态管理
 *   3. theme.js         — 主题切换
 *   4. layout.js        — 布局控制
 *   5. toast.js         — Toast 通知
 *   6. confirm.js       — 确认对话框
 *   7. settings.js      — 设置弹窗
 *   8. menu.js          — 菜单构建
 *   9. api-bridge.js    — Cockpit API桥接
 *  10. webdav-config.js — WebDAV配置管理
 *  11. webdav-users.js  — 用户管理
 *  12. webdav-rules.js  — 规则管理
 *  13. webdav-files.js  — 文件管理
 *  14. app.js           — 本文件（入口）
 */
(function() {
    'use strict';

    var $html = document.documentElement;
    var $body = document.body;
    var $sidebar = document.getElementById('sidebar');
    var $sidebarOverlay = document.getElementById('sidebarOverlay');
    var $statusDot = document.getElementById('statusDot');
    var $settingsOverlay = document.getElementById('settingsOverlay');
    var $langDropdown = document.getElementById('langDropdown');
    var $langBtn = document.getElementById('langBtn');

    // ==================== 服务状态 ====================
    function updateServiceStatus() {
        var statusDot = document.getElementById('statusDot');
        var label = document.getElementById('statusLabel');
        var footerUptime = document.getElementById('footerUptime');

        ApiBridge.getServiceStatus()
            .then(function(data) {
                if (data.state === 'active') {
                    if (statusDot) statusDot.className = 'status-dot active';
                    if (label) {
                        label.textContent = t('status_running');
                        label.style.color = 'var(--success)';
                    }
                    if (footerUptime) footerUptime.textContent = data.uptime || '--';
                } else {
                    if (statusDot) statusDot.className = 'status-dot inactive';
                    if (label) {
                        label.textContent = t('status_stopped');
                        label.style.color = 'var(--danger)';
                    }
                    if (footerUptime) footerUptime.textContent = data.state || '--';
                }
            })
            .catch(function() {
                if (statusDot) statusDot.className = 'status-dot error';
                if (label) {
                    label.textContent = t('status_error');
                    label.style.color = 'var(--warning)';
                }
                if (footerUptime) footerUptime.textContent = 'n/a';
            });
    }

    // ==================== 重启服务 ====================
    function doRestart() {
        closeM('serviceModal');
        if (window.__appFns && window.__appFns.confirmShow) {
        window.__appFns.confirmShow(t('toast_restart_confirm'), 
            t('confirm_restart_msg'), t('btn_restart'), true).then(function(ok) {
                if (!ok) return;
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_restarting'), 'info');
                }
                ApiBridge.restartService()
                    .then(function(d) {
                        if (window.__appFns && window.__appFns.showToast) {
                            window.__appFns.showToast(d.message, 'success');
                        }
                        updateServiceStatus();
                    })
                    .catch(function(err) {
                        if (window.__appFns && window.__appFns.showToast) {
                            window.__appFns.showToast(err.error || t('toast_request_failed'), 'error');
                        }
                    });
            });
        }
    }

    // ==================== 启动服务 ====================
    function doStart() {
        closeM('serviceModal');
        if (window.__appFns && window.__appFns.showToast) {
            window.__appFns.showToast(t('toast_starting'), 'info');
        }
        cockpit.spawn(['sudo', 'systemctl', 'start', 'webdav'], { superuser: 'require', err: 'message' })
            .done(function() {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_start_success'), 'success');
                }
                updateServiceStatus();
            })
            .fail(function(err) {
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_start_failed') + ': ' + (err.message || err), 'error');
                }
            });
    }

    // ==================== 停止服务 ====================
    function doStop() {
        closeM('serviceModal');
        if (window.__appFns && window.__appFns.confirmShow) {
            window.__appFns.confirmShow(t('confirm_stop_title'),
                t('confirm_stop_msg'), t('btn_stop'), true).then(function(ok) {
                if (!ok) return;
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_stopping'), 'info');
                }
                cockpit.spawn(['sudo', 'systemctl', 'stop', 'webdav'], { superuser: 'require', err: 'message' })
                    .done(function() {
                        if (window.__appFns && window.__appFns.showToast) {
                            window.__appFns.showToast(t('toast_stop_success'), 'success');
                        }
                        updateServiceStatus();
                    })
                    .fail(function(err) {
                        if (window.__appFns && window.__appFns.showToast) {
                            window.__appFns.showToast(t('toast_stop_failed') + ': ' + (err.message || err), 'error');
                        }
                    });
            });
        }
    }

    // ==================== 打开服务管理弹窗 ====================
    function openServiceModal() {
        document.getElementById('serviceModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // ==================== 更新WebDAV服务 ====================
    function doUpdate() {
        var toastId = 'update-toast';
        showUpdateToast(t('toast_checking_update'), 'info', toastId);

        // 超时保护：15秒
        var checkTimeout = setTimeout(function() {
            removeToastById(toastId);
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(t('toast_update_timeout'), 'error');
            }
        }, 15000);

        ApiBridge.checkUpdate().then(function(data) {
            clearTimeout(checkTimeout);
            removeToastById(toastId);

            if (!data) {
                // 脚本执行失败，直接执行更新
                doUpdateExecute();
                return;
            }

            if (!data.hasUpdate) {
                updateToastMessage(toastId, t('toast_already_latest') + ' v' + data.current, 'success');
                setTimeout(function() { removeToastById(toastId); }, 2500);
                return;
            }

            var msg = t('confirm_update_msg') + ': v' + data.current + ' → v' + data.latest;
            if (window.__appFns && window.__appFns.confirmShow) {
                window.__appFns.confirmShow(t('confirm_update_title'), msg, t('btn_update'), false)
                    .then(function(ok) { if (ok) doUpdateExecute(); });
            }
        });
    }

    function doUpdateExecute() {
        var toastId = 'update-toast';
        showUpdateToast(t('toast_updating'), 'info', toastId);

        var proc = cockpit.spawn(['sudo', '/usr/local/bin/webdav-manager', 'update'], { superuser: 'try', err: 'out', pty: true });
        var output = '';

        proc.stream(function(data) {
            output += data;
            var lines = data.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line.indexOf('[▸]') >= 0) {
                    updateToastMessage(toastId, line.replace(/\[▸\]\s*/, ''), 'info');
                } else if (line.indexOf('[✔]') >= 0) {
                    updateToastMessage(toastId, line.replace(/\[✔\]\s*/, ''), 'success');
                } else if (line.indexOf('[!]') >= 0) {
                    updateToastMessage(toastId, line.replace(/\[!]\s*/, ''), 'warning');
                }
            }
        });

        proc.done(function() {
            removeToastById(toastId);
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(t('toast_update_success'), 'success');
            }
            updateServiceStatus();
            ApiBridge.getVersion().then(function(ver) {
                var el = document.getElementById('footerWebdavVersion');
                if (el) el.textContent = ver;
            });
        });

        proc.fail(function(err) {
            removeToastById(toastId);
            var errMsg = err.message || err.toString() || 'Unknown error';
            if (output.indexOf('[✘]') >= 0) {
                var match = output.match(/\[✘]\s*(.+)/);
                if (match) errMsg = match[1];
            }
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(t('toast_update_failed') + ': ' + errMsg, 'error');
            }
        });
    }

    // 更新中的toast（可更新内容）
    function showUpdateToast(message, type, toastId) {
        var $toastContainer = document.getElementById('toastContainer');
        var icons = {
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        };
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.id = toastId;
        toast.innerHTML =
            '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
            '<span class="toast-body"></span>' +
            '<div class="toast-spinner"><div class="spinner-small"></div></div>';
        toast.querySelector('.toast-body').textContent = message;
        $toastContainer.appendChild(toast);
    }

    function updateToastMessage(toastId, message, type) {
        var toast = document.getElementById(toastId);
        if (!toast) return;
        var body = toast.querySelector('.toast-body');
        if (body) body.textContent = message;
        if (type) toast.className = 'toast toast-' + type;
    }

    function removeToastById(toastId) {
        var toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.add('removing');
            setTimeout(function() {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 400);
        }
    }

    // ==================== 设置弹窗 ====================
    function openSettingsModal() {
        var state = window.__appState;
        if (!state) return;

        if (window.settingsModule) {
            window.settingsModule.setCustomSelectValue('settingTheme', state.currentTheme);
            window.settingsModule.setCustomSelectValue('settingLang', state.currentLang);
            window.settingsModule.setCustomSelectValue('settingMenuLayout', state.menuLayout);
        }

        document.getElementById('settingToastDuration').value = state.toastDuration;
        document.getElementById('settingPwLength').value = state.pwLength;
        var swatches = document.querySelectorAll('.color-swatch');
        for (var i = 0; i < swatches.length; i++) {
            swatches[i].classList.toggle('active', swatches[i].dataset.color === state.accentColor);
        }
        var picker = document.getElementById('colorCustomPicker');
        var hex = document.getElementById('colorHexInput');
        if (picker) picker.value = state.accentColor;
        if (hex) hex.value = state.accentColor.toUpperCase();

        // Load WebDAV plugin settings from ApiBridge
        ApiBridge.loadSettings().then(function(s) {
            document.getElementById('setFileRoot').value = s.file_root || '';
            if (s.theme && window.settingsModule) window.settingsModule.setCustomSelectValue('settingTheme', s.theme);
            if (s.language && window.settingsModule) window.settingsModule.setCustomSelectValue('settingLang', s.language);
            if (s.menu_layout && window.settingsModule) window.settingsModule.setCustomSelectValue('settingMenuLayout', s.menu_layout);
            if (s.accent_color && window.themeModule) window.themeModule.applyAccentColor(s.accent_color);
            if (s.toast_duration) document.getElementById('settingToastDuration').value = s.toast_duration;
            if (s.pw_length) document.getElementById('settingPwLength').value = s.pw_length;
        }).catch(function() {});

        $settingsOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeSettingsModal() {
        $settingsOverlay.classList.remove('show');
        document.body.style.overflow = '';
        document.querySelectorAll('.custom-select.open').forEach(function(cs) {
            cs.classList.remove('open');
        });
    }

    function saveSettingsFromPanel() {
        var state = window.__appState;
        if (!state) return;

        var newTheme = window.settingsModule ? window.settingsModule.getCustomSelectValue('settingTheme') : state.currentTheme;
        var newLang = window.settingsModule ? window.settingsModule.getCustomSelectValue('settingLang') : state.currentLang;
        var newLayout = window.settingsModule ? window.settingsModule.getCustomSelectValue('settingMenuLayout') : state.menuLayout;
        var newDuration = parseFloat(document.getElementById('settingToastDuration').value) || 4;

        if (newLang !== state.currentLang && window.i18n) {
            window.i18n.switchLang(newLang);
        }
        if (newTheme !== state.currentTheme && window.themeModule) {
            window.themeModule.applyTheme(newTheme);
        }
        if (newLayout !== state.menuLayout && window.layoutModule) {
            window.layoutModule.applyMenuLayout(newLayout);
            if (window.menuModule) window.menuModule.buildMenus();
            if (window.menuModule) window.menuModule.setActiveMenu(window.menuModule.getCurrentSection());
        }
        state.toastDuration = Math.max(1, Math.min(15, newDuration));
        if (window.stateModule) window.stateModule.saveSettings();

        // Save ALL settings to /etc/cockpit/webdav-manager/settings.json
        var webdavSettings = {
            language: state.currentLang,
            theme: state.currentTheme,
            menu_layout: state.menuLayout,
            accent_color: state.accentColor,
            toast_duration: state.toastDuration,
            sidebar_open: state.sidebarOpen,
            pw_length: state.pwLength,
            file_root: document.getElementById('setFileRoot').value
        };
        ApiBridge.saveSettings(webdavSettings).then(function() {
            closeSettingsModal();
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(t('toastSettingsSaved'), 'success');
            }
            if (window.__appFns && window.__appFns.loadCfg) window.__appFns.loadCfg();
        }).catch(function(err) {
            closeSettingsModal();
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(err.error || t('toast_save_failed'), 'error');
            }
        });
    }

    function resetSettings() {
        var state = window.__appState;
        if (!state) return;

        if (window.themeModule) window.themeModule.applyTheme('light');
        if (window.layoutModule) window.layoutModule.applyMenuLayout('side');
        if (window.themeModule) window.themeModule.applyAccentColor('#6c5ce7');
        state.toastDuration = 4;
        state.pwLength = 24;
        if (window.settingsModule) {
            window.settingsModule.setCustomSelectValue('settingTheme', 'light');
            window.settingsModule.setCustomSelectValue('settingLang', 'en');
            window.settingsModule.setCustomSelectValue('settingMenuLayout', 'side');
        }
        document.getElementById('settingToastDuration').value = '4';
        document.getElementById('settingPwLength').value = '24';
        // 重置WebDAV设置 - 从配置文件读取默认值
        ApiBridge.getConfig()
            .then(function(d) {
                var cfg = d.config || {};
                document.getElementById('setFileRoot').value = cfg.directory || '/data';
            })
            .catch(function() {
                document.getElementById('setFileRoot').value = '/data';
            });
        if (window.stateModule) window.stateModule.saveSettings();
        // 保存重置后的设置到 settings.json
        ApiBridge.saveSettings({
            language: 'en',
            theme: 'light',
            menu_layout: 'side',
            accent_color: '#6c5ce7',
            toast_duration: 4,
            pw_length: 24,
            sidebar_open: true,
            file_root: document.getElementById('setFileRoot').value
        }).catch(function() {});
        // 先清除当前语言，强制switchLang重新加载
        state.currentLang = '';
        if (window.i18n) {
            window.i18n.switchLang('en').then(function() {
                if (window.menuModule) window.menuModule.buildMenus();
                if (window.menuModule) window.menuModule.setActiveMenu(window.menuModule.getCurrentSection());
                if (window.__appFns && window.__appFns.renderUsers) window.__appFns.renderUsers();
                if (window.__appFns && window.__appFns.renderRules) window.__appFns.renderRules();
            });
        }
        if (window.__appFns && window.__appFns.showToast) {
            window.__appFns.showToast(t('toastSettingsReset'), 'info');
        }
    }

    // ==================== 权限点击处理 ====================
    function setupPermClick() {
        document.addEventListener('click', function(e) {
            var c = e.target.closest('.pc');
            if (!c || e.target.tagName === 'INPUT') return;
            e.preventDefault();
            var cb = c.querySelector('input');
            if (!cb) return;
            cb.checked = !cb.checked;
            c.classList.toggle('on', cb.checked);
            markDirty(c);
        });
    }

    // ==================== 表单修改检测 ====================
    function setupFormDirty() {
        // 监听input/change事件
        document.addEventListener('input', function(e) {
            var card = e.target.closest('.card');
            if (card) markDirty(card);
        });
        document.addEventListener('change', function(e) {
            var card = e.target.closest('.card');
            if (card) markDirty(card);
        });
    }

    function markDirty(el) {
        var card = el.closest('.card');
        if (card) card.classList.add('dirty');
    }

    function clearDirty() {
        document.querySelectorAll('.card.dirty').forEach(function(card) {
            card.classList.remove('dirty');
        });
    }

    // ==================== 模态框关闭（禁用overlay点击关闭） ====================
    function setupModalClose() {
        // 所有弹窗只能通过按钮关闭，点击overlay不关闭
    }

    // ==================== 关闭模态框 ====================
    function closeM(id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('show');
    }

    // ==================== 初始化 ====================
    async function init() {
        // 加载设置
        if (window.stateModule) window.stateModule.loadSettings();
        var state = window.__appState;

        // 加载语言文件
        if (window.i18n) {
            await window.i18n.loadLang(state.currentLang);
            window.i18n.updateAllI18n();
        }
        $html.lang = state.currentLang;

        // 应用主题和主题色
        if (window.themeModule) window.themeModule.applyTheme(state.currentTheme);
        if (window.themeModule) window.themeModule.applyAccentColor(state.accentColor);

        // 应用布局
        if (window.layoutModule) {
            window.layoutModule.applyEffectiveLayout(window.layoutModule.getEffectiveLayout());
            if (state.menuLayout === 'side' && !state.sidebarOpen) {
                $sidebar.classList.add('collapsed');
            }
            window.layoutModule.syncSidebarBodyClass();
            window.layoutModule.updateLayoutIcons();
        }

        // 移动端初始状态
        if (window.innerWidth <= 768 && window.layoutModule && window.layoutModule.getEffectiveLayout() === 'side') {
            $sidebar.classList.add('collapsed');
            window.layoutModule.syncSidebarBodyClass();
            $sidebar.classList.remove('mobile-open');
            state.sidebarOpen = false;
            state.mobileSidebarOpen = false;
        }

        // 构建菜单并设置默认激活
        if (window.menuModule) {
            window.menuModule.buildMenus();
            window.menuModule.setActiveMenu('server');
        }

        // 初始化ApiBridge
        await ApiBridge.init();

        // 从服务端 settings.json 加载设置并合并到 state（服务端优先）
        try {
            var serverSettings = ApiBridge.getSettings();
            if (serverSettings.theme) state.currentTheme = serverSettings.theme;
            if (serverSettings.language) state.currentLang = serverSettings.language;
            if (serverSettings.menu_layout) state.menuLayout = serverSettings.menu_layout;
            if (serverSettings.accent_color) state.accentColor = serverSettings.accent_color;
            if (serverSettings.toast_duration) state.toastDuration = serverSettings.toast_duration;
            if (serverSettings.pw_length) state.pwLength = serverSettings.pw_length;
            if (serverSettings.sidebar_open !== undefined) state.sidebarOpen = serverSettings.sidebar_open;
            // 重新应用服务端设置
            if (window.themeModule) window.themeModule.applyTheme(state.currentTheme);
            if (window.themeModule) window.themeModule.applyAccentColor(state.accentColor);
            $html.lang = state.currentLang;
            if (window.i18n) {
                await window.i18n.loadLang(state.currentLang);
                window.i18n.updateAllI18n();
            }
            if (window.layoutModule) window.layoutModule.applyMenuLayout(state.menuLayout);
        } catch (e) {
            console.warn('Failed to apply server settings:', e);
        }

        // 初始化事件
        setupPermClick();
        setupModalClose();
        setupFormDirty();
        initCustomSelects();
        bindEvents();
        if (window.FileManager && window.FileManager.initEvents) {
            window.FileManager.initEvents();
        }

        // 加载配置
        if (window.__appFns && window.__appFns.loadCfg) window.__appFns.loadCfg();

        // 更新服务状态
        updateServiceStatus();
        setInterval(updateServiceStatus, 10000);

        // 获取WebDAV版本
        ApiBridge.getVersion().then(function(ver) {
            var el = document.getElementById('footerWebdavVersion');
            if (el) el.textContent = ver;
        });

        // 更新cfg path显示
        var cfgPathEl = document.getElementById('cfgPath');
        if (cfgPathEl) cfgPathEl.textContent = ApiBridge.getConfigPath() || '/etc/webdav/webdav.yml';

        // 欢迎toast
        setTimeout(function() {
            if (window.__appFns && window.__appFns.showToast) {
                window.__appFns.showToast(t('toast_config_loaded'), 'info', 3);
            }
        }, 600);
    }

    // ==================== 自定义下拉框 ====================
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
                    if (window.settingsModule) window.settingsModule.setCustomSelectValue(field, value);
                    cs.classList.remove('open');
                    // 即时预览
                    if (field === 'settingTheme' && window.themeModule) {
                        window.themeModule.applyTheme(value);
                    } else if (field === 'settingLang' && window.i18n) {
                        window.i18n.switchLang(value);
                    } else if (field === 'settingMenuLayout' && window.layoutModule) {
                        window.layoutModule.applyMenuLayout(value);
                        if (window.menuModule) window.menuModule.buildMenus();
                        if (window.menuModule) window.menuModule.setActiveMenu('server');
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

    // ==================== 事件绑定 ====================
    function bindEvents() {
        // 汉堡菜单
        var $hamburgerBtn = document.getElementById('hamburgerBtn');
        if ($hamburgerBtn && window.layoutModule) {
            $hamburgerBtn.addEventListener('click', window.layoutModule.toggleSidebar);
        }

        // 布局切换
        var layoutBtn = document.getElementById('menuLayoutBtn');
        if (layoutBtn && window.layoutModule) {
            layoutBtn.addEventListener('click', window.layoutModule.toggleMenuLayout);
        }

        // 侧边栏遮罩
        if ($sidebarOverlay && window.layoutModule) {
            $sidebarOverlay.addEventListener('click', window.layoutModule.closeMobileSidebar);
        }

        // 主题切换
        var themeBtn = document.getElementById('themeBtn');
        if (themeBtn && window.themeModule) {
            themeBtn.addEventListener('click', window.themeModule.toggleTheme);
        }

        // 语言下拉
        if ($langBtn && $langDropdown) {
            function positionLangDropdown() {
                var rect = $langBtn.getBoundingClientRect();
                $langDropdown.style.top = (rect.bottom + 8) + 'px';
                $langDropdown.style.right = (window.innerWidth - rect.right) + 'px';
            }
            $langBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                var willShow = !$langDropdown.classList.contains('show');
                $langDropdown.classList.toggle('show', willShow);
                if (willShow) positionLangDropdown();
            });
            $langDropdown.querySelectorAll('.lang-dropdown-item').forEach(function(item) {
                item.addEventListener('click', function() {
                    if (window.i18n) window.i18n.switchLang(item.dataset.lang);
                    $langDropdown.classList.remove('show');
                });
            });
            document.addEventListener('click', function(e) {
                if (!$langDropdown.contains(e.target) && !$langBtn.contains(e.target)) {
                    $langDropdown.classList.remove('show');
                }
            });
        }

        // 设置弹窗
        var settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);

        // 设置弹窗事件
        var settingsOverlay = document.getElementById('settingsOverlay');
        if (settingsOverlay) {
            settingsOverlay.addEventListener('click', function(e) {
                if (e.target === this) closeSettingsModal();
            });
        }
        var settingsSave = document.getElementById('settingsSave');
        if (settingsSave) settingsSave.addEventListener('click', saveSettingsFromPanel);
        var settingsReset = document.getElementById('settingsReset');
        if (settingsReset) settingsReset.addEventListener('click', resetSettings);

        // 确认对话框
        if (window.confirmModule) window.confirmModule.initConfirmEvents();

        // 颜色选择器
        document.querySelectorAll('.color-swatch').forEach(function(swatch) {
            swatch.addEventListener('click', function() {
                if (window.themeModule) window.themeModule.applyAccentColor(swatch.dataset.color);
            });
        });
        var customPicker = document.getElementById('colorCustomPicker');
        if (customPicker) {
            customPicker.addEventListener('input', function() {
                if (window.themeModule) window.themeModule.applyAccentColor(this.value);
            });
        }
        var hexInput = document.getElementById('colorHexInput');
        if (hexInput) {
            hexInput.addEventListener('input', function() {
                var val = this.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9a-fA-F]{6}$/.test(val) && window.themeModule) {
                    window.themeModule.applyAccentColor(val.toLowerCase());
                }
            });
            hexInput.addEventListener('blur', function() {
                if (window.__appState) this.value = window.__appState.accentColor.toUpperCase();
            });
        }

        // 键盘快捷键
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                var confirmOv = document.getElementById('confirmOverlay');
                if (confirmOv && confirmOv.classList.contains('show')) {
                    if (window.__appFns) window.__appFns.confirmClose(false);
                }
                if (settingsOverlay.classList.contains('show')) closeSettingsModal();
                if (window.layoutModule && window.__appState && window.__appState.mobileSidebarOpen) {
                    window.layoutModule.closeMobileSidebar();
                }
                $langDropdown.classList.remove('show');
            }
        });

        // 响应式调整
        var resizeDebounce;
        var wasMobile = window.innerWidth <= 768;
        window.addEventListener('resize', function() {
            clearTimeout(resizeDebounce);
            var isMobile = window.innerWidth <= 768;
            if (isMobile !== wasMobile) $sidebar.classList.add('resizing');
            resizeDebounce = setTimeout(function() {
                if (window.layoutModule && window.__appState && window.__appState.menuLayout !== 'side') {
                    wasMobile = isMobile;
                    $sidebar.classList.remove('resizing');
                    return;
                }
                if (!isMobile) {
                    if (window.layoutModule) window.layoutModule.closeMobileSidebar();
                    if (window.__appState && window.__appState.sidebarOpen) $sidebar.classList.remove('collapsed');
                } else {
                    $sidebar.classList.add('collapsed');
                    $sidebar.classList.remove('mobile-open');
                    $sidebarOverlay.classList.remove('show');
                    if (window.__appState) window.__appState.mobileSidebarOpen = false;
                }
                if (window.layoutModule) window.layoutModule.syncSidebarBodyClass();
                wasMobile = isMobile;
                requestAnimationFrame(function() { $sidebar.classList.remove('resizing'); });
            }, 150);
        });

        // 系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
            if (window.__appState && window.__appState.currentTheme === 'system' && window.themeModule) {
                window.themeModule.applyTheme('system');
            }
        });
    }

    // ==================== 暴露全局 API ====================
    window.WebDAVManager = {
        doRestart: doRestart,
        doUpdate: doUpdate,
        openSettingsModal: openSettingsModal,
        closeSettingsModal: closeSettingsModal,
        saveSettingsFromPanel: saveSettingsFromPanel,
        resetSettings: resetSettings,
        closeM: closeM
    };

    // 暴露给内联onclick
    window.doRestart = doRestart;
    window.doUpdate = doUpdate;
    window.doStart = doStart;
    window.doStop = doStop;
    window.openServiceModal = openServiceModal;
    window.closeM = closeM;

    // ==================== 启动 ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
