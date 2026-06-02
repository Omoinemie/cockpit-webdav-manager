/**
 * webdav-files.js — 文件管理模块 (WebDAV Manager)
 * 使用Cockpit API实现文件浏览、预览和下载
 */
(function() {
    'use strict';

    var fmCur = '/';

    function getFileRoot() {
        return ApiBridge.getFileRoot() || '/data';
    }

    // 文件类型分类
    function getFileCategory(name) {
        var ext = (name || '').split('.').pop().toLowerCase();
        var cats = {
            image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'],
            video: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v', '3gp'],
            audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'weba'],
            code: ['js', 'ts', 'jsx', 'tsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'rb', 'php', 'lua', 'swift', 'kt', 'scala', 'dart', 'r', 'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd', 'sql', 'html', 'htm', 'css', 'scss', 'sass', 'less', 'json', 'jsonc', 'yaml', 'yml', 'toml', 'xml', 'ini', 'cfg', 'conf', 'env', 'diff', 'patch'],
            text: ['txt', 'md', 'markdown', 'rst', 'log', 'csv', 'tsv', 'nfo', 'readme', 'license', 'changelog'],
            pdf: ['pdf'],
            archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz', 'iso', 'dmg']
        };
        var keys = Object.keys(cats);
        for (var i = 0; i < keys.length; i++) {
            var exts = cats[keys[i]];
            for (var j = 0; j < exts.length; j++) {
                if (exts[j] === ext) return keys[i];
            }
        }
        return 'unknown';
    }

    // 文件图标
    function getIcon(name, isDir) {
        if (isDir) {
            return '<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" width="18" height="18"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>';
        }
        var cat = getFileCategory(name);
        var colorMap = { image: 'var(--success)', video: 'var(--info)', audio: 'var(--warning)' };
        var stroke = colorMap[cat] || 'var(--text-secondary)';
        var icons = {
            image: '<svg viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
            video: '<svg viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="2" width="18" height="18"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
            audio: '<svg viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="2" width="18" height="18"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
            code: '<svg viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="2" width="18" height="18"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
            pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
            archive: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" width="18" height="18"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
            file: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
        };
        return icons[cat] || icons.file;
    }

    function sz(b) {
        if (!b) return '0 B';
        var u = ['B', 'KB', 'MB', 'GB', 'TB'];
        var i = Math.floor(Math.log(b) / Math.log(1024));
        return (b / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + u[i];
    }

    function e(s) {
        var div = document.createElement('div');
        div.textContent = s || '';
        return div.innerHTML;
    }

    function getFileTypeLabel(name) {
        var ext = (name || '').split('.').pop().toLowerCase();
        var types = {
            'txt': t('type_text'), 'md': 'Markdown', 'log': t('type_log'),
            'json': 'JSON', 'yaml': 'YAML', 'yml': 'YAML', 'xml': 'XML',
            'js': 'JavaScript', 'ts': 'TypeScript', 'py': 'Python', 'sh': 'Shell',
            'html': 'HTML', 'htm': 'HTML', 'css': 'CSS',
            'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'gif': 'GIF', 'svg': 'SVG', 'webp': 'WebP',
            'mp4': 'MP4', 'webm': 'WebM', 'avi': 'AVI', 'mkv': 'MKV', 'mov': 'MOV',
            'mp3': 'MP3', 'wav': 'WAV', 'flac': 'FLAC', 'aac': 'AAC', 'ogg': 'OGG',
            'pdf': 'PDF', 'doc': 'Word', 'docx': 'Word',
            'zip': 'ZIP', 'tar': 'TAR', 'gz': 'GZIP', '7z': '7Z', 'rar': 'RAR',
            'conf': t('type_config'), 'cfg': t('type_config'), 'ini': t('type_config')
        };
        return types[ext] || ext.toUpperCase() || t('type_file');
    }

function formatDate(epoch) {
        if (!epoch) return '-';
        var d = new Date(epoch * 1000);
        var year = d.getFullYear();
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        var day = ('0' + d.getDate()).slice(-2);
        var hour = ('0' + d.getHours()).slice(-2);
        var min = ('0' + d.getMinutes()).slice(-2);
        return year + '-' + month + '-' + day + ' ' + hour + ':' + min;
    }

    // 切换到编辑模式
    function editPath() {
        var bc = document.getElementById('fmBc');
        var inp = document.getElementById('fmP');
        if (bc && inp) {
            bc.style.display = 'none';
            inp.style.display = 'block';
            inp.value = fmCur;
            inp.focus();
            inp.select();
        }
    }

    // 切换回面包屑模式
    function viewPath() {
        var bc = document.getElementById('fmBc');
        var inp = document.getElementById('fmP');
        if (bc && inp) {
            inp.style.display = 'none';
            bc.style.display = 'flex';
        }
    }

    // 加载文件列表
    function go() {
        var inp = document.getElementById('fmP');
        var d = inp.value.trim() || '/';
        if (d.charAt(0) !== '/') d = '/' + d;
        fmCur = d;
        inp.value = d;

        var el = document.getElementById('fmC');
        el.innerHTML = '<div class="empty"><div class="spinner"></div><p>' + t('loading') + '</p></div>';

        // 更新面包屑
        var bc = document.getElementById('fmBc');
        if (bc) {
            var ps = d.split('/').filter(Boolean);
    var bh = '<span class="bc-item" data-action="nav-home">' + (t('breadcrumb_root') || '/') + '</span>';
        var cp = '';
        for (var bi = 0; bi < ps.length; bi++) {
            cp += '/' + ps[bi];
            bh += '<span class="bc-sep">/</span><span class="bc-item" data-action="nav-to" data-path="' + e(cp) + '">' + e(ps[bi]) + '</span>';
        }
            bc.innerHTML = bh;
        }
        viewPath();

        var safePath = d.replace(/^\/+/, '');
        var fullPath = getFileRoot() + '/' + safePath;

        // 使用cockpit.spawn获取文件列表
        cockpit.spawn(['ls', '-laL', '--time-style=+%s', fullPath], { superuser: 'try', err: 'message' })
            .done(function(output) {
                var items = parseLsOutput(output, d);
                renderFileList(items, d);
            })
            .fail(function(err) {
                el.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><p>' + e(err.message || t('err_load')) + '</p></div>';
            });
    }

    function parseLsOutput(output, currentPath) {
        var lines = output.split('\n').filter(function(line) {
            return line.trim() && !line.startsWith('total');
        });

        var items = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;

            // ls -la --time-style=+%s 格式: permissions links owner group size epoch name
            var match = line.match(/^([d\-l])([\w\-]+)\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\d+)\s+(.+)$/);
            if (!match) continue;

            var isDir = match[1] === 'd';
            var name = match[5].trim();
            var size = parseInt(match[3]) || 0;
            var modTime = parseInt(match[4]) || 0;

            // 跳过 . 和 ..
            if (name === '.' || name === '..') continue;

            items.push({
                name: name,
                is_dir: isDir,
                size: size,
                mod_time: modTime
            });
        }

        // 排序：目录在前，然后按名称
        items.sort(function(a, b) {
            if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        return items;
    }

    function renderFileList(items, currentPath) {
        var el = document.getElementById('fmC');

        if (!items.length) {
            el.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg><p>' + t('empty_dir') + '</p></div>';
            return;
        }

        var h = '<div class="file-table"><table class="tbl"><thead><tr><th style="width:32px"></th><th>' + t('col_name') + '</th><th style="width:70px">' + t('col_type') + '</th><th style="width:80px">' + t('col_size') + '</th><th style="width:140px;white-space:nowrap">' + t('col_modified') + '</th><th style="width:100px">' + t('col_actions') + '</th></tr></thead><tbody>';

        // 返回上级目录
        if (currentPath !== '/') {
            var par = currentPath.split('/').slice(0, -1).join('/') || '/';
            h += '<tr class="file-item" data-name=".."><td>' + getIcon('', true) + '</td><td><span class="file-link" data-action="nav" data-path="' + e(par) + '">..</span></td><td>-</td><td>-</td><td>-</td><td></td></tr>';
        }

        for (var idx = 0; idx < items.length; idx++) {
            var it = items[idx];
            var fp = currentPath === '/' ? '/' + it.name : currentPath + '/' + it.name;
            var sz_val = it.is_dir ? '-' : sz(it.size);
            var type_val = it.is_dir ? t('type_dir') : getFileTypeLabel(it.name);
            var date_val = it.mod_time ? formatDate(it.mod_time) : '-';

            h += '<tr class="file-item" data-name="' + e(it.name) + '" data-path="' + e(fp) + '">';
            h += '<td>' + getIcon(it.name, it.is_dir) + '</td>';

            if (it.is_dir) {
                h += '<td><span class="file-link" data-action="nav" data-path="' + e(fp) + '">' + e(it.name) + '</span></td>';
            } else {
                h += '<td><span class="file-link" data-action="preview" data-path="' + e(fp) + '" data-name="' + e(it.name) + '" data-size="' + (it.size || 0) + '">' + e(it.name) + '</span></td>';
            }

            h += '<td style="color:var(--text-tertiary);font-size:0.82rem">' + type_val + '</td>';
            h += '<td style="color:var(--text-tertiary);font-size:0.82rem">' + sz_val + '</td>';
            h += '<td style="color:var(--text-tertiary);font-size:0.82rem">' + date_val + '</td>';
            h += '<td>';

            if (!it.is_dir) {
                h += '<button class="btn btn-o btn-s" data-action="preview" data-path="' + e(fp) + '" data-name="' + e(it.name) + '" data-size="' + (it.size || 0) + '" title="' + t('btn_preview') + '">';
                h += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button> ';
                h += '<button class="btn btn-o btn-s" data-action="download" data-path="' + e(fp) + '" data-name="' + e(it.name) + '" title="' + t('btn_download') + '">';
                h += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>';
            }

            h += '</td></tr>';
        }

        h += '</tbody></table></div>';
        el.innerHTML = h;
    }

    function nav(p) {
        document.getElementById('fmP').value = p;
        go();
    }

    // 文件预览
    function showPreview(path, name, size) {
        var ov = document.getElementById('previewOv');
        var body = document.getElementById('pvBody');
        var title = document.getElementById('pvTitle');
        var meta = document.getElementById('pvMeta');

        var cat = getFileCategory(name);
        title.textContent = name;
        meta.textContent = sz(size);

        body.innerHTML = '<div class="preview-loading"><div class="spinner"></div><p style="color:var(--text-tertiary);font-size:13px">' + t('loading') + '</p></div>';
        ov.classList.add('show');

        var safePath = path.replace(/^\/+/, '');
        var fullPath = getFileRoot() + '/' + safePath;

        // 使用cockpit.file读取文件
        var file = cockpit.file(fullPath, { superuser: 'try' });

        if (cat === 'code' || cat === 'text' || cat === 'unknown') {
            // 文本/代码预览
            file.read()
                .then(function(content) {
                    file.close();
                    if (content.indexOf('\0') !== -1) {
                        renderInfoBox(body, name, size, path);
                    } else {
                        renderTextPreview(body, content);
                    }
                })
                .catch(function(err) {
                    file.close();
                    body.innerHTML = '<div class="empty"><p>' + t('err_load') + ': ' + e(err.toString()) + '</p></div>';
                });
        } else if (cat === 'image') {
            // 图片预览 - 使用binary模式读取后转base64
            var imgFile = cockpit.file(fullPath, { superuser: 'try', binary: true });
            imgFile.read()
                .then(function(data) {
                    imgFile.close();
                    var ext = name.split('.').pop().toLowerCase();
                    var mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp' };
                    var mime = mimeMap[ext] || 'image/png';
                    // 转换为base64
                    var bytes = new Uint8Array(data);
                    var binary = '';
                    for (var i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    var b64 = btoa(binary);
                    body.innerHTML = '<div style="text-align:center;padding:20px"><img src="data:' + mime + ';base64,' + b64 + '" style="max-width:100%;max-height:70vh;border-radius:8px" alt="' + e(name) + '"></div>';
                })
                .catch(function(err) {
                    imgFile.close();
                    renderInfoBox(body, name, size, path);
                });
} else if (cat === 'video') {
            // 视频预览 - 使用DPlayer
            var vidFile = cockpit.file(fullPath, { superuser: 'try', binary: true });
            vidFile.read()
                .then(function(data) {
                    vidFile.close();
                    var ext = name.split('.').pop().toLowerCase();
                    var mimeMap = { mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg', mov: 'video/quicktime' };
                    var mime = mimeMap[ext] || 'video/mp4';
                    var bytes = new Uint8Array(data);
                    var binary = '';
                    for (var i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    var b64 = btoa(binary);
                    body.innerHTML = '<div id="dplayer-container" style="width:100%;height:100%;min-height:400px;"></div>';
                    try {
                        new DPlayer({
                            container: document.getElementById('dplayer-container'),
                            video: {
                                url: 'data:' + mime + ';base64,' + b64,
                                type: 'auto'
                            },
                            theme: '#6c5ce7'
                        });
                    } catch (err) {
                        body.innerHTML = '<div style="text-align:center;padding:20px"><video controls style="max-width:100%;max-height:70vh;border-radius:8px"><source src="data:' + mime + ';base64,' + b64 + '" type="' + mime + '"></video></div>';
                    }
                })
                .catch(function(err) {
                    vidFile.close();
                    renderInfoBox(body, name, size, path);
                });
        } else if (cat === 'audio') {
            // 音频预览 - 使用APlayer
            var audFile = cockpit.file(fullPath, { superuser: 'try', binary: true });
            audFile.read()
                .then(function(data) {
                    audFile.close();
                    var ext = name.split('.').pop().toLowerCase();
                    var mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4' };
                    var mime = mimeMap[ext] || 'audio/mpeg';
                    var bytes = new Uint8Array(data);
                    var binary = '';
                    for (var i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    var b64 = btoa(binary);
                    body.innerHTML = '<div id="aplayer-container" style="padding:20px;"></div>';
                    try {
                        new APlayer({
                            container: document.getElementById('aplayer-container'),
                            audio: [{
                                name: name,
                                artist: 'WebDAV',
                                url: 'data:' + mime + ';base64,' + b64,
                                type: 'auto'
                            }],
                            theme: '#6c5ce7'
                        });
                    } catch (err) {
                        body.innerHTML = '<div style="text-align:center;padding:40px"><div style="font-size:14px;font-weight:600;margin-bottom:16px">' + e(name) + '</div><audio controls style="width:100%;max-width:500px"><source src="data:' + mime + ';base64,' + b64 + '" type="' + mime + '"></audio></div>';
                    }
                })
                .catch(function(err) {
                    audFile.close();
                    renderInfoBox(body, name, size, path);
                });
        } else if (cat === 'audio') {
            var audFile = cockpit.file(fullPath, { superuser: 'try', binary: true });
            audFile.read()
                .then(function(data) {
                    audFile.close();
                    var ext = name.split('.').pop().toLowerCase();
                    var mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4' };
                    var mime = mimeMap[ext] || 'audio/mpeg';
                    var bytes = new Uint8Array(data);
                    var binary = '';
                    for (var i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    var b64 = btoa(binary);
                    body.innerHTML = '<div style="text-align:center;padding:40px"><svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="1.5" style="width:64px;height:64px;margin:0 auto 20px;display:block;opacity:.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><div style="font-size:14px;font-weight:600;margin-bottom:16px">' + e(name) + '</div><audio controls style="width:100%;max-width:500px"><source src="data:' + mime + ';base64,' + b64 + '" type="' + mime + '"></audio></div>';
                })
                .catch(function(err) {
                    audFile.close();
                    renderInfoBox(body, name, size, path);
                });
        } else {
            file.close();
            renderInfoBox(body, name, size, path);
        }
    }

    function renderTextPreview(container, text) {
        var lines = text.split('\n');
        var MAX_LINES = 5000;
        var displayLines = lines.length > MAX_LINES ? lines.slice(0, MAX_LINES) : lines;
        var truncated = lines.length > MAX_LINES;

        var content = e(displayLines.join('\n'));
        var truncMsg = truncated ? '<div style="padding:10px 16px;background:var(--bg-tertiary);color:var(--warning);font-size:12px;text-align:center;border-top:1px solid var(--border-color)">' + t('err_file_too_large') + '</div>' : '';

        // 使用table布局确保行号与内容对齐
        var rows = '';
        for (var i = 0; i < displayLines.length; i++) {
            rows += '<tr><td class="ln">' + (i + 1) + '</td><td class="code">' + e(displayLines[i]) + '</td></tr>';
        }
        container.innerHTML = '<div class="preview-text-wrap"><table class="preview-table"><tbody>' + rows + '</tbody></table>' + truncMsg + '</div>';
    }

    // 复制预览内容
    function copyPreviewContent() {
        var el = document.getElementById('pvBody');
        if (!el) return;
        var text = el.innerText || el.textContent;
        navigator.clipboard.writeText(text).then(function() {
            if (window.__appFns && window.__appFns.showToast) {
            window.__appFns.showToast(t('toast_content_copied'), 'success');
        }
    }).catch(function() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        if (window.__appFns && window.__appFns.showToast) {
            window.__appFns.showToast(t('toast_content_copied'), 'success');
            }
        });
    }

    // 搜索过滤文件（支持子目录）
    var searchCache = [];
    var searchTimer = null;

    function filterFiles(keyword) {
        var el = document.getElementById('fmC');
        if (!el) return;
        var kw = keyword.toLowerCase().trim();

        // 如果搜索框为空，显示当前目录
        if (!kw) {
            var rows = el.querySelectorAll('.file-item');
            for (var i = 0; i < rows.length; i++) {
                rows[i].style.display = '';
            }
            return;
        }

        // 先显示当前目录匹配的
        var rows = el.querySelectorAll('.file-item');
        for (var i = 0; i < rows.length; i++) {
            var name = rows[i].getAttribute('data-name') || '';
            rows[i].style.display = name.toLowerCase().indexOf(kw) >= 0 ? '' : 'none';
        }

        // 延迟搜索子目录
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function() {
            searchSubdirs(kw);
        }, 500);
    }

    function searchSubdirs(keyword) {
        var safePath = fmCur.replace(/^\/+/, '');
        var fullPath = getFileRoot() + '/' + safePath;

        cockpit.spawn(['find', fullPath, '-maxdepth', '2', '-name', '*' + keyword + '*'], { superuser: 'try', err: 'ignore' })
            .done(function(output) {
                var el = document.getElementById('fmC');
                if (!el) return;
                var lines = output.split('\n').filter(Boolean);
                var fileRoot = getFileRoot();
                var html = '';

                for (var i = 0; i < lines.length; i++) {
                    var fullPath2 = lines[i].trim();
                    if (!fullPath2 || fullPath2 === fullPath) continue;
                    var relPath = fullPath2.replace(fileRoot, '').replace(/^\//, '/');
                    var name = fullPath2.split('/').pop();
                    var isDir = fullPath2.indexOf('.') === fullPath2.length - 1 || !name.indexOf('.');

                    html += '<tr class="file-item search-result" data-name="' + e(name) + '" data-path="' + e(relPath) + '">';
                    html += '<td>' + getIcon(name, false) + '</td>';
                    html += '<td><span class="file-link" data-action="preview" data-path="' + e(relPath) + '" data-name="' + e(name) + '">' + e(name) + '</span></td>';
                    html += '<td style="color:var(--text-tertiary);font-size:0.82rem">' + getFileTypeLabel(name) + '</td>';
                    html += '<td style="color:var(--text-tertiary);font-size:0.82rem">-</td>';
                    html += '<td style="color:var(--text-tertiary);font-size:0.82rem">-</td>';
                    html += '<td>';
                    html += '<button class="btn btn-o btn-s" data-action="preview" data-path="' + e(relPath) + '" data-name="' + e(name) + '" title="' + t('btn_preview') + '">';
                    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button> ';
                    html += '<button class="btn btn-o btn-s" data-action="download" data-path="' + e(relPath) + '" data-name="' + e(name) + '" title="' + t('btn_download') + '">';
                    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>';
                    html += '</td></tr>';
                }

                if (html) {
                    // 添加搜索结果分隔线
                    var existing = el.innerHTML;
                    var tbody = el.querySelector('tbody');
                    if (tbody) {
                        tbody.insertAdjacentHTML('beforeend', '<tr class="file-item" style="pointer-events:none;"><td colspan="6" style="padding:8px;color:var(--text-tertiary);font-size:0.82rem;border-top:1px solid var(--border-light);">' + t('search_results') + '</td></tr>' + html);
                    }
                }
            });
    }

    function renderInfoBox(container, name, size, path) {
        container.innerHTML = '<div style="text-align:center;padding:40px">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="1.5" style="width:64px;height:64px;margin:0 auto 16px;display:block;opacity:.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
            '<div style="font-weight:600;margin-bottom:8px">' + e(name) + '</div>' +
            '<div style="color:var(--text-tertiary);font-size:0.85rem;margin-bottom:16px">' + sz(size) + '</div>' +
            '<button class="btn btn-p" data-action="download" data-path="' + e(path) + '" data-name="' + e(name) + '">' + t('btn_download') + '</button>' +
            '</div>';
    }

    function closePreview() {
        var body = document.getElementById('pvBody');
        var mediaEls = body.querySelectorAll('video, audio');
        for (var i = 0; i < mediaEls.length; i++) {
            mediaEls[i].pause();
            mediaEls[i].src = '';
        }
        document.getElementById('previewOv').classList.remove('show');
    }

    // 文件下载 - 使用cockpit.file API
    function download(path, name) {
        var safePath = path.replace(/^\/+/, '');
        var fullPath = getFileRoot() + '/' + safePath;

        var file = cockpit.file(fullPath, { superuser: 'try', binary: true });
        file.read()
            .then(function(data) {
                file.close();
                var blob = new Blob([data]);
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = name || path.split('/').pop();
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_downloaded'), 'success');
                }
            })
            .catch(function(err) {
                file.close();
                if (window.__appFns && window.__appFns.showToast) {
                    window.__appFns.showToast(t('toast_download_failed') + ': ' + (err.toString() || err), 'error');
                }
            });
    }

    function initEvents() {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                var ov = document.getElementById('previewOv');
                if (ov && ov.classList.contains('show')) {
                    closePreview();
                }
            }
        });
        var ov = document.getElementById('previewOv');
        if (ov) {
            ov.addEventListener('click', function(e) {
                if (e.target.id === 'previewOv') {
                    closePreview();
                }
            });
        }
        // 事件委托处理 data-action
        document.addEventListener('click', function(e) {
            var el = e.target.closest('[data-action]');
            if (!el) return;
            var action = el.getAttribute('data-action');
            var path = el.getAttribute('data-path');
            var name = el.getAttribute('data-name');
            var size = parseInt(el.getAttribute('data-size')) || 0;

            switch (action) {
                case 'nav':
                    FileManager.nav(path);
                    break;
                case 'nav-home':
                    FileManager.nav('/');
                    break;
                case 'nav-to':
                    FileManager.nav(path);
                    break;
                case 'preview':
                    if (path && name) FileManager.preview(path, name, size);
                    break;
                case 'download':
                    if (path && name) FileManager.download(path, name);
                    break;
            }
        });
    }

    // 暴露到全局
    window.FileManager = {
        go: go,
        nav: nav,
        preview: showPreview,
        download: download,
        closePreview: closePreview,
        editPath: editPath,
        viewPath: viewPath,
        copyPreviewContent: copyPreviewContent,
        filterFiles: filterFiles,
        initEvents: initEvents
    };

    window.__appFns = window.__appFns || {};
    window.__appFns.loadFiles = go;
})();
