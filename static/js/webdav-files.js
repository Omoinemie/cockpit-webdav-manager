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

    // 文件预览 - 使用 Cockpit fsread1 channel API 流式传输
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

        if (cat === 'code' || cat === 'text' || cat === 'unknown') {
            // 文本/代码预览 - 使用 cockpit.file API
            var file = cockpit.file(fullPath, { superuser: 'try' });
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
            // 图片预览 - 使用 fsread1 channel 流式传输
            var ext = name.split('.').pop().toLowerCase();
            var mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp', ico: 'image/x-icon', avif: 'image/avif' };
            var mime = mimeMap[ext] || 'image/png';
            var streamUrl = createCockpitStreamUrl(fullPath, mime, size);
            body.innerHTML = '<div style="text-align:center;padding:20px"><img src="' + streamUrl + '" style="max-width:100%;max-height:70vh;border-radius:8px" alt="' + e(name) + '"></div>';
        } else if (cat === 'video') {
            // 视频预览 - 使用 fsread1 channel 流式传输 + DPlayer
            var ext = name.split('.').pop().toLowerCase();
            var mimeMap = { mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg', mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska', m4v: 'video/mp4', '3gp': 'video/3gpp' };
            var mime = mimeMap[ext] || 'video/mp4';
            var streamUrl = createCockpitStreamUrl(fullPath, mime, size);
            body.innerHTML = '<div id="dplayer-container" style="width:100%;height:100%;min-height:400px;"></div>';
            try {
                _dplayerInstance = new DPlayer({
                    container: document.getElementById('dplayer-container'),
                    video: {
                        url: streamUrl,
                        type: 'auto'
                    },
                    theme: '#6c5ce7'
                });
            } catch (err) {
                body.innerHTML = '<div style="text-align:center;padding:20px"><video controls style="max-width:100%;max-height:70vh;border-radius:8px"><source src="' + streamUrl + '" type="' + mime + '"></video></div>';
            }
        } else if (cat === 'audio') {
            // 音频预览 - 使用 APlayer 播放列表 + 歌词 + 悬浮播放器
            initAudioPlayer(fullPath, name, path);
        } else if (cat === 'pdf') {
            // PDF预览 - 使用 fsread1 channel 流式传输
            var streamUrl = createCockpitStreamUrl(fullPath, 'application/pdf', size);
            body.innerHTML = '<iframe src="' + streamUrl + '" style="width:100%;height:100%;min-height:500px;border:none;"></iframe>';
        } else {
            renderInfoBox(body, name, size, path);
        }
    }

    // 创建 Cockpit fsread1 channel URL 用于流式传输文件
    function createCockpitStreamUrl(path, mimeType, size) {
        var payload = JSON.stringify({
            payload: 'fsread1',
            binary: 'raw',
            path: path,
            superuser: 'try',
            max_read_size: size || 0,
            external: {
                'content-type': mimeType
            }
        });
        // 使用 encodeURIComponent 处理 Unicode 字符后再 base64 编码
        var query = window.btoa(encodeURIComponent(payload).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
        var prefix = (new URL(cockpit.transport.uri('channel/' + cockpit.transport.csrf_token))).pathname;
        return prefix + '?' + query;
    }

    function renderTextPreview(container, text) {
        var lines = text.split('\n');
        var MAX_LINES = 5000;
        var displayLines = lines.length > MAX_LINES ? lines.slice(0, MAX_LINES) : lines;
        var truncated = lines.length > MAX_LINES;

        var content = e(displayLines.join('\n'));
        var truncMsg = truncated ? '<div style="padding:10px 16px;background:var(--bg-tertiary);color:var(--warning);font-size:12px;text-align:center;border-top:1px solid var(--border-color)">' + t('err_file_too_large') + '</div>' : '';

        // 根据行数位数动态计算行号列宽度，避免行号列过宽
        var lnDigits = String(displayLines.length).length;
        var lnWidth = (lnDigits * 0.65 + 1.8) + 'em';

        // 使用table布局确保行号与内容对齐
        var rows = '';
        for (var i = 0; i < displayLines.length; i++) {
            rows += '<tr><td class="ln" style="width:' + lnWidth + ';min-width:' + lnWidth + ';max-width:' + lnWidth + '">' + (i + 1) + '</td><td class="code">' + e(displayLines[i]) + '</td></tr>';
        }
        container.innerHTML = '<div class="preview-text-wrap"><table class="preview-table"><colgroup><col style="width:' + lnWidth + '"><col></colgroup><tbody>' + rows + '</tbody></table>' + truncMsg + '</div>';
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

    // 存储播放器实例，关闭时销毁
    var _dplayerInstance = null;
    var _aplayerInstance = null;
    var _audioPlaylist = []; // 播放列表
    var _audioCurrentIndex = 0; // 当前播放索引
    var _miniPlayerExpanded = false; // 悬浮播放器是否展开
    var _miniPlayerMinimized = true; // 悬浮播放器是否收纳（小条状态）

    // 初始化音频播放器 - 直接显示悬浮播放器，无预览弹窗
    function initAudioPlayer(fullPath, name, path) {
        var dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
        var fileName = name;

        // 关闭预览窗口
        document.getElementById('previewOv').classList.remove('show');

        // 扫描同目录音频文件构建播放列表
        buildAudioPlaylist(dirPath, fileName, function(playlist, currentIndex) {
            _audioPlaylist = playlist;
            _audioCurrentIndex = currentIndex;

            // 创建悬浮播放器（左下角，可收纳）
            createMiniPlayer();
        });
    }

    // 创建悬浮播放器（左下角，可收纳展开）
    function createMiniPlayer() {
        // 移除旧的
        var oldMini = document.getElementById('mini-player');
        if (oldMini) oldMini.remove();

        // 构建音频列表（含封面 - 使用矢量图）
        var audioList = _audioPlaylist.map(function(item) {
            return {
                name: item.name,
                artist: 'WebDAV',
                url: item.url,
                type: 'auto',
                lrc: item.lrc || '',
                cover: '' // APlayer 会自动显示默认封面
            };
        });

        // 创建收纳状态的小条
        var miniBar = document.createElement('div');
        miniBar.id = 'mini-player-bar';
        miniBar.className = 'mini-player-bar';
        miniBar.innerHTML = 
            '<div class="mini-bar-info">' +
                '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="color:var(--accent)"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
                '<span class="mini-bar-title">' + e(audioList[_audioCurrentIndex].name) + '</span>' +
            '</div>' +
            '<div class="mini-bar-controls">' +
                '<button class="mini-btn" id="mini-prev" title="' + t('btn_prev') + '"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>' +
                '<button class="mini-btn mini-btn-play" id="mini-play" title="' + t('btn_play_pause') + '"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg></button>' +
                '<button class="mini-btn" id="mini-next" title="' + t('btn_next') + '"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6z"/></svg></button>' +
                '<button class="mini-btn mini-btn-expand" id="mini-expand" title="' + t('btn_expand') + '"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>' +
                '<button class="mini-btn mini-btn-close" id="mini-close" title="' + t('btn_close') + '"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>' +
            '</div>';
        document.body.appendChild(miniBar);

        // 创建展开状态的完整播放器
        var miniPlayer = document.createElement('div');
        miniPlayer.id = 'mini-player';
        miniPlayer.className = 'mini-player';
        miniPlayer.style.display = 'none';
        miniPlayer.innerHTML = 
            '<div class="mini-player-header">' +
                '<span>' + t('music_player') + '</span>' +
                '<button class="mini-btn" id="mini-collapse" title="' + t('btn_collapse') + '"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>' +
                '<button class="mini-btn" id="mini-close-expanded" title="' + t('btn_close') + '"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>' +
            '</div>' +
            '<div id="mini-aplayer-container"></div>';
        document.body.appendChild(miniPlayer);

        // 创建 APlayer
        try {
            if (_aplayerInstance) {
                try { _aplayerInstance.destroy(); } catch (e) {}
            }
            _aplayerInstance = new APlayer({
                container: document.getElementById('mini-aplayer-container'),
                audio: audioList,
                theme: '#6c5ce7',
                loop: 'all',
                order: 'list',
                preload: 'auto',
                autoplay: true,
                mutex: true,
                listFolded: false,
                listMaxHeight: '180px',
                lrcType: audioList.some(function(a) { return a.lrc; }) ? 1 : 0
            });
            _aplayerInstance.list.switch(_audioCurrentIndex);
            _miniPlayerMinimized = true;
            _miniPlayerExpanded = false;
        } catch (err) {
            console.error('APlayer init failed:', err);
        }

        // 绑定事件
        bindMiniPlayerEvents();

        // 点击展开播放器外部自动收纳
        document.addEventListener('click', handleMiniPlayerOutsideClick);
    }

    // 绑定迷你播放器事件
    function bindMiniPlayerEvents() {
        // 收纳状态按钮
        document.getElementById('mini-play').onclick = function(e) {
            e.stopPropagation();
            if (_aplayerInstance) {
                if (_aplayerInstance.audio.paused) {
                    _aplayerInstance.play();
                } else {
                    _aplayerInstance.pause();
                }
                updateMiniPlayButton();
            }
        };

        document.getElementById('mini-prev').onclick = function(e) {
            e.stopPropagation();
            if (_aplayerInstance) _aplayerInstance.skipBack();
        };

        document.getElementById('mini-next').onclick = function(e) {
            e.stopPropagation();
            if (_aplayerInstance) _aplayerInstance.skipForward();
        };

        document.getElementById('mini-expand').onclick = function(e) {
            e.stopPropagation();
            expandMiniPlayer();
        };

        document.getElementById('mini-close').onclick = function(e) {
            e.stopPropagation();
            closeMiniPlayer();
        };

        // 展开状态按钮
        document.getElementById('mini-collapse').onclick = function(e) {
            e.stopPropagation();
            collapseMiniPlayer();
        };

        document.getElementById('mini-close-expanded').onclick = function(e) {
            e.stopPropagation();
            closeMiniPlayer();
        };

        // 点击收纳条展开
        document.getElementById('mini-player-bar').onclick = function(e) {
            if (!e.target.closest('.mini-btn')) {
                expandMiniPlayer();
            }
        };

        // 阻止播放器内滚轮事件冒泡和默认行为（让音量调节正常工作）
        var miniPlayer = document.getElementById('mini-player');
        if (miniPlayer) {
            miniPlayer.addEventListener('wheel', function(e) {
                e.stopPropagation();
                e.preventDefault();
            }, { passive: false });
        }

        // 监听歌曲切换更新标题
        if (_aplayerInstance) {
            _aplayerInstance.on('switch', function() {
                updateMiniBarTitle();
            });
            _aplayerInstance.on('play', function() {
                updateMiniPlayButton();
            });
            _aplayerInstance.on('pause', function() {
                updateMiniPlayButton();
            });
        }
    }

    // 处理点击外部收纳
    function handleMiniPlayerOutsideClick(e) {
        if (_miniPlayerExpanded) {
            var player = document.getElementById('mini-player');
            var bar = document.getElementById('mini-player-bar');
            // 如果点击的是播放器或收纳条内部，不触发收纳
            if (player && player.contains(e.target)) return;
            if (bar && bar.contains(e.target)) return;
            collapseMiniPlayer();
        }
    }

    // 展开播放器
    function expandMiniPlayer() {
        var player = document.getElementById('mini-player');
        var bar = document.getElementById('mini-player-bar');
        if (player) {
            player.style.display = '';
            _miniPlayerExpanded = true;
            // 确保滚轮事件不冒泡、不触发页面滚动
            player.addEventListener('wheel', function(e) {
                e.stopPropagation();
                e.preventDefault();
            }, { passive: false });
        }
        if (bar) bar.style.display = 'none';
        _miniPlayerMinimized = false;
    }

    // 收纳播放器（显示小条）
    function collapseMiniPlayer() {
        var player = document.getElementById('mini-player');
        var bar = document.getElementById('mini-player-bar');
        if (player) {
            player.style.display = 'none';
            _miniPlayerExpanded = false;
        }
        if (bar) bar.style.display = '';
        _miniPlayerMinimized = true;
    }

    // 更新收纳条标题
    function updateMiniBarTitle() {
        var titleEl = document.querySelector('.mini-bar-title');
        if (titleEl && _aplayerInstance) {
            var index = _aplayerInstance.list.index;
            if (_audioPlaylist[index]) {
                titleEl.textContent = _audioPlaylist[index].name;
            }
        }
    }

    // 更新播放按钮图标
    function updateMiniPlayButton() {
        var btn = document.getElementById('mini-play');
        if (btn && _aplayerInstance) {
            if (_aplayerInstance.audio.paused) {
                btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>';
            } else {
                btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
            }
        }
    }

    // 关闭悬浮播放器
    function closeMiniPlayer() {
        var mini = document.getElementById('mini-player');
        var bar = document.getElementById('mini-player-bar');
        if (mini) mini.remove();
        if (bar) bar.remove();
        _miniPlayerExpanded = false;
        _miniPlayerMinimized = true;
        document.removeEventListener('click', handleMiniPlayerOutsideClick);
        if (_aplayerInstance) {
            try { _aplayerInstance.pause(); _aplayerInstance.destroy(); } catch (e) {}
            _aplayerInstance = null;
        }
        _audioPlaylist = [];
    }

    // 构建音频播放列表 - 扫描同目录所有音频文件
    function buildAudioPlaylist(dirPath, currentFile, callback) {
        var audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'weba'];
        var mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4', wma: 'audio/x-ms-wma', opus: 'audio/opus', weba: 'audio/webm' };

        cockpit.spawn(['ls', '-laL', '--time-style=+%s', dirPath], { superuser: 'try', err: 'message' })
            .done(function(output) {
                var lines = output.split('\n').filter(function(line) { return line.trim() && !line.startsWith('total'); });
                var playlist = [];
                var currentIndex = 0;

                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (!line) continue;
                    var match = line.match(/^([d\-l])([\w\-]+)\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\d+)\s+(.+)$/);
                    if (!match || match[1] === 'd') continue;
                    var fileName = match[5].trim();
                    var ext = fileName.split('.').pop().toLowerCase();
                    if (audioExts.indexOf(ext) === -1) continue;

                    var mime = mimeMap[ext] || 'audio/mpeg';
                    var filePath = dirPath + '/' + fileName;
                    var streamUrl = createCockpitStreamUrl(filePath, mime, parseInt(match[3]) || 0);

                    playlist.push({
                        name: fileName.replace(/\.[^.]+$/, ''),
                        url: streamUrl,
                        path: filePath,
                        lrc: null
                    });

                    if (fileName === currentFile) currentIndex = playlist.length - 1;
                }

                // 异步加载每个音频的歌词
                loadAllLyrics(playlist, function(playlistWithLrc) {
                    callback(playlistWithLrc, currentIndex);
                });
            })
            .fail(function(err) {
                // 失败时只播放当前文件
                var ext = currentFile.split('.').pop().toLowerCase();
                var mime = mimeMap[ext] || 'audio/mpeg';
                var streamUrl = createCockpitStreamUrl(dirPath + '/' + currentFile, mime, 0);
                callback([{
                    name: currentFile.replace(/\.[^.]+$/, ''),
                    url: streamUrl,
                    path: dirPath + '/' + currentFile,
                    lrc: null
                }], 0);
            });
    }

    // 加载所有音频的歌词
    function loadAllLyrics(playlist, callback) {
        var pending = playlist.length;
        playlist.forEach(function(item, idx) {
            var lrcPath = item.path.replace(/\.[^.]+$/, '.lrc');
            loadLyrics(lrcPath, function(lrc) {
                if (lrc) item.lrc = lrc;
                pending--;
                if (pending === 0) callback(playlist);
            });
        });
    }

    // 加载歌词文件
    function loadLyrics(lrcPath, callback) {
        cockpit.file(lrcPath, { superuser: 'try' }).read()
            .then(function(content) {
                callback(content);
            })
            .catch(function() {
                callback(null);
            });
    }

    function closePreview() {
        var body = document.getElementById('pvBody');

        // 销毁 DPlayer 实例
        if (_dplayerInstance) {
            try {
                _dplayerInstance.destroy();
            } catch (e) {}
            _dplayerInstance = null;
        }

        // APlayer 悬浮播放器独立于预览窗口，关闭预览不影响播放
        // 只清理预览窗口内的媒体元素

        // 暂停并清理预览窗口内的媒体元素
        var mediaEls = body.querySelectorAll('video, audio');
        for (var i = 0; i < mediaEls.length; i++) {
            try {
                mediaEls[i].pause();
                mediaEls[i].currentTime = 0;
                mediaEls[i].src = '';
                mediaEls[i].load();
            } catch (e) {}
        }

        // 清空预览内容
        body.innerHTML = '';
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
        closeMiniPlayer: closeMiniPlayer,
        expandMiniPlayer: expandMiniPlayer,
        collapseMiniPlayer: collapseMiniPlayer,
        editPath: editPath,
        viewPath: viewPath,
        copyPreviewContent: copyPreviewContent,
        filterFiles: filterFiles,
        initEvents: initEvents
    };

    window.__appFns = window.__appFns || {};
    window.__appFns.loadFiles = go;
})();
