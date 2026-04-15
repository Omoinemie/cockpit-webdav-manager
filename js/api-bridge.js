/* api-bridge.js
 * Replaces all Python/Flask API calls with Cockpit native APIs.
 * Uses cockpit.file(), cockpit.spawn(), and cockpit.dbus() instead of fetch().
 */

var ApiBridge = (function() {
    'use strict';

    // ─── Settings file path ───
    var SETTINGS_FILE = '/etc/cockpit/webdav-manager/settings.json';
    var CONFIG_BACKUP_EXT = '.bak';

    // ─── Service name and config path (overridden by settings) ───
    var _serviceName = 'webdav';
    var _configPath = '/etc/webdav/config.yaml';
    var _fileRoot = '/var/lib/webdav';

    // ─── Load settings on init ───
    var _settings = null;
    var _settingsReady = null;

    function init() {
        _settingsReady = loadSettings().then(function(s) {
            _settings = s;
            _serviceName = s.service_name || 'webdav';
            _configPath = s.config_path || '';
            _fileRoot = s.file_root || '/var/lib/webdav';
            return s;
        }).catch(function() {
            _settings = defaultSettings();
            _configPath = '';
            return _settings;
        });
        return _settingsReady;
    }

    function defaultSettings() {
        return {
            language: 'en',
            config_path: '',
            service_name: 'webdav',
            file_root: '/var/lib/webdav'
        };
    }

    // ─── Settings ───
    function loadSettings() {
        return new Promise(function(resolve, reject) {
            var file = cockpit.file(SETTINGS_FILE, { superuser: 'try' });
            file.read()
                .then(function(content) {
                    file.close();
                    if (!content) {
                        resolve(defaultSettings());
                        return;
                    }
                    try {
                        var s = JSON.parse(content);
                        var d = defaultSettings();
                        for (var k in s) d[k] = s[k];
                        resolve(d);
                    } catch (e) {
                        resolve(defaultSettings());
                    }
                })
                .catch(function() {
                    file.close();
                    resolve(defaultSettings());
                });
        });
    }

    function saveSettings(settings) {
        return new Promise(function(resolve, reject) {
            _settings = settings;
            _serviceName = settings.service_name || _serviceName;
            _configPath = settings.config_path || _configPath;
            _fileRoot = settings.file_root || _fileRoot;

            // Ensure parent directory exists
            var dir = SETTINGS_FILE.substring(0, SETTINGS_FILE.lastIndexOf('/'));
            cockpit.spawn(['mkdir', '-p', dir], { superuser: 'try', err: 'ignore' })
                .always(function() {
                    var file = cockpit.file(SETTINGS_FILE, { superuser: 'try' });
                    file.replace(JSON.stringify(settings, null, 2))
                        .then(function() {
                            file.close();
                            resolve({ success: true, settings: settings });
                        })
                        .catch(function(err) {
                            file.close();
                            reject({ error: err.toString() });
                        });
                });
        });
    }

    function getSettings() {
        return _settings || defaultSettings();
    }

    // ─── Config (YAML) ───
    function getConfig() {
        return new Promise(function(resolve, reject) {
            if (!_configPath) {
                reject({ error: 'no_config_path' });
                return;
            }
            var file = cockpit.file(_configPath, { superuser: 'try' });
            file.read()
                .then(function(content) {
                    file.close();
                    if (!content) {
                        reject({ error: 'Config file not found: ' + _configPath, path: _configPath });
                        return;
                    }
                    try {
                        var parsed = jsyaml.load(content);
                        resolve({ config: parsed, path: _configPath, raw: content });
                    } catch (e) {
                        reject({ error: 'YAML parse error: ' + e.message, path: _configPath });
                    }
                })
                .catch(function(err) {
                    file.close();
                    reject({ error: err.toString(), path: _configPath });
                });
        });
    }

    function saveConfig(config) {
        return new Promise(function(resolve, reject) {
            // Backup existing file
            cockpit.spawn(['cp', '-f', _configPath, _configPath + CONFIG_BACKUP_EXT], { superuser: 'try', err: 'ignore' })
                .always(function() {
                    var yamlStr = jsyaml.dump(config, {
                        lineWidth: 120,
                        noRefs: true,
                        sortKeys: false
                    });
                    var file = cockpit.file(_configPath, { superuser: 'try' });
                    file.replace(yamlStr)
                        .then(function() {
                            file.close();
                            resolve({ success: true, message: 'Config saved successfully' });
                        })
                        .catch(function(err) {
                            file.close();
                            reject({ error: err.toString() });
                        });
                });
        });
    }

    function getRawConfig() {
        return new Promise(function(resolve, reject) {
            if (!_configPath) {
                reject({ error: 'no_config_path' });
                return;
            }
            var file = cockpit.file(_configPath, { superuser: 'try' });
            file.read()
                .then(function(content) {
                    file.close();
                    resolve(content || '');
                })
                .catch(function(err) {
                    file.close();
                    reject({ error: err.toString() });
                });
        });
    }

    function saveRawConfig(content) {
        return new Promise(function(resolve, reject) {
            // Validate YAML first
            try {
                jsyaml.load(content);
            } catch (e) {
                reject({ error: 'Invalid YAML: ' + e.message });
                return;
            }
            // Backup
            cockpit.spawn(['cp', '-f', _configPath, _configPath + CONFIG_BACKUP_EXT], { superuser: 'try', err: 'ignore' })
                .always(function() {
                    var file = cockpit.file(_configPath, { superuser: 'try' });
                    file.replace(content)
                        .then(function() {
                            file.close();
                            resolve({ success: true });
                        })
                        .catch(function(err) {
                            file.close();
                            reject({ error: err.toString() });
                        });
                });
        });
    }

    // ─── Service Status ───
    function getServiceStatus() {
        return new Promise(function(resolve) {
            cockpit.spawn(['systemctl', 'status', _serviceName + '.service'], { superuser: 'try', err: 'ignore' })
                .done(function(output) {
                    var state = 'unknown';
                    var uptime = '';
                    var lines = (output || '').split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        var line = lines[i].trim();
                        if (line.indexOf('Active:') === 0) {
                            if (line.indexOf('active (running)') >= 0) {
                                state = 'active';
                                // Extract "since ... ; X ago" part: "active (running) since Wed 2026-04-15 21:48:16 CST; 12min ago"
                                var semi = line.indexOf(';');
                                if (semi >= 0) {
                                    uptime = line.substring(semi + 1).trim().replace(' ago', '');
                                }
                            } else if (line.indexOf('inactive') >= 0) {
                                state = 'inactive';
                            } else if (line.indexOf('failed') >= 0) {
                                state = 'failed';
                            }
                            break;
                        }
                    }
                    resolve({ state: state, uptime: uptime || state });
                })
                .fail(function() {
                    resolve({ state: 'error', uptime: 'n/a' });
                });
        });
    }

    function restartService() {
        return new Promise(function(resolve, reject) {
            cockpit.spawn(['systemctl', 'restart', _serviceName], { superuser: 'require', err: 'message' })
                .done(function() {
                    resolve({ success: true, message: _serviceName + ' service restarted' });
                })
                .fail(function(err) {
                    reject({ success: false, error: err.message || err.toString() || 'Restart failed' });
                });
        });
    }

    // ─── File Management ───
    function safePath(userPath) {
        var normalized = (userPath || '/').replace(/^\/+/, '');
        // Resolve against fileRoot
        var fullPath = _fileRoot + '/' + normalized;
        // Simple path traversal check
        var resolved = fullPath.replace(/\/+/g, '/');
        var rootNorm = _fileRoot.replace(/\/+$/, '');
        if (!resolved.startsWith(rootNorm + '/') && resolved !== rootNorm) {
            return null;
        }
        return resolved;
    }

    function listFiles(relPath) {
        return new Promise(function(resolve, reject) {
            var target = safePath(relPath);
            if (!target) {
                reject({ error: 'Invalid path' });
                return;
            }

            // Use find + stat for efficient listing
            cockpit.spawn([
                'sh', '-c',
                'cd ' + shellEscape(target) + ' 2>/dev/null && ' +
                'ls -1 --group-directories-first 2>/dev/null | head -5000 | while read f; do ' +
                '  if [ -e "$f" ]; then ' +
                '    if [ -d "$f" ]; then echo "d|$f|0|$(stat -c %Y "$f" 2>/dev/null || echo 0)"; ' +
                '    else echo "f|$f|$(stat -c %s "$f" 2>/dev/null || echo 0)|$(stat -c %Y "$f" 2>/dev/null || echo 0)"; fi; ' +
                '  fi; ' +
                'done'
            ], { superuser: 'try', err: 'message' })
                .done(function(output) {
                    var items = [];
                    var lines = (output || '').split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        var parts = lines[i].split('|');
                        if (parts.length >= 4) {
                            items.push({
                                name: parts[1],
                                is_dir: parts[0] === 'd',
                                size: parseInt(parts[2]) || 0,
                                mod_time: parseInt(parts[3]) || 0
                            });
                        }
                    }
                    resolve({ items: items, path: relPath, truncated: items.length >= 5000 });
                })
                .fail(function(err) {
                    reject({ error: err.message || err.toString() });
                });
        });
    }

    function downloadFile(relPath) {
        return new Promise(function(resolve, reject) {
            var target = safePath(relPath);
            if (!target) {
                reject({ error: 'Invalid path' });
                return;
            }

            // Read file as base64
            cockpit.spawn(['base64', '-w0', target], { superuser: 'try', err: 'message', binary: true })
                .done(function(output) {
                    var b64 = typeof output === 'string' ? output : cockpit.utf8_decoder().decode(output);
                    resolve({ data: b64, name: target.split('/').pop() });
                })
                .fail(function(err) {
                    reject({ error: err.message || err.toString() });
                });
        });
    }

    // ─── Helpers ───
    function shellEscape(s) {
        return "'" + (s || '').replace(/'/g, "'\\''") + "'";
    }

    // ─── Public API ───
    return {
        init: init,
        // Settings
        getSettings: getSettings,
        loadSettings: loadSettings,
        saveSettings: saveSettings,
        // Config
        getConfig: getConfig,
        saveConfig: saveConfig,
        getRawConfig: getRawConfig,
        saveRawConfig: saveRawConfig,
        // Service
        getServiceStatus: getServiceStatus,
        restartService: restartService,
        // Files
        listFiles: listFiles,
        downloadFile: downloadFile,
        // Config
        getConfigPath: function() { return _configPath; },
        getFileRoot: function() { return _fileRoot; },
        getServiceName: function() { return _serviceName; }
    };
})();
