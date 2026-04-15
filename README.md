# Cockpit WebDAV Manager

将 [WebDAV-Server-Manager](https://github.com/Omoinemie/WebDAV-Server-Manager) 改造为 Cockpit 原生插件，完全去除 Python/Flask 依赖。

## 安装

### 从 .deb 安装

```bash
sudo dpkg -i cockpit-webdav-manager_*.deb
sudo systemctl restart cockpit
```

访问：`https://your-server:9090/webdav-manager`

### 手动安装

```bash
sudo cp -r . /usr/share/cockpit/webdav-manager
sudo systemctl restart cockpit
```

## 构建 .deb

### 本地构建

```bash
./build-deb.sh
```

### GitHub Actions

仓库包含手动触发的 Action：**Actions → Build .deb → Run workflow**

- 自动从 `manifest.json` 读取版本号
- 构建 `.deb` 包
- 创建 GitHub Release 并上传

版本号定义在 `manifest.json` 的 `package_version` 字段。

## API 映射

| Flask (已移除) | Cockpit |
|---|---|
| `fetch('/api/settings')` | `cockpit.file()` |
| `fetch('/api/config')` | `cockpit.file()` + `jsyaml` |
| `subprocess systemctl` | `cockpit.spawn()` |
| `yaml` Python 模块 | `js-yaml` (纯 JS) |
| `secret_key` + HMAC | Cockpit 内置认证 |

## 文件结构

```
├── manifest.json              Cockpit 插件清单
├── index.html                 主页面
├── css/style.css              样式
├── js/
│   ├── api-bridge.js          Cockpit API 桥接层
│   ├── app.js                 主逻辑
│   ├── file-manager.js        文件管理
│   ├── file-preview.js        文件预览
│   ├── i18n.js                国际化
│   ├── js-yaml.min.js         YAML 解析
│   └── utils.js               工具函数
├── lang/
│   ├── en.json                English
│   └── zh-CN.json             简体中文
└── .github/workflows/
    └── build-deb.yml          GitHub Actions 构建
```

## License

同原始项目。
