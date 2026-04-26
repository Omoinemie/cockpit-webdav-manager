<div align="center">

# 🌐 Cockpit WebDAV Manager

**A WebDAV server configuration manager plugin for [Cockpit](https://cockpit-project.org/)**

Manage users, rules, TLS, CORS, and file browsing through the Cockpit web console.

**[English](#english)** · **[中文](#中文)**

![License](https://img.shields.io/github/license/Omoinemie/cockpit-webdav-manager)
![Release](https://img.shields.io/github/v/release/Omoinemie/cockpit-webdav-manager)
![Cockpit](https://img.shields.io/badge/Cockpit-%3E%3D270-blue)

</div>

---

<a id="english"></a>

## 🇬🇧 English

### Features

- 🖥️ **Server Settings** — Configure listen address, port, root directory, path prefix
- 🔐 **TLS / SSL** — Enable HTTPS with certificate and key files
- 🌍 **CORS** — Fine-grained control over allowed origins, headers, and methods
- 📋 **Logging** — Log format, colored output, and output targets
- 📏 **Global Rules** — Path and regex-based access control rules (CRUD permissions)
- 👥 **User Management** — Add/remove users with per-user directories and permissions
- 📂 **File Browser** — Browse and preview files served by WebDAV directly in the UI
- 📝 **Raw YAML** — Directly view and edit the underlying YAML configuration
- 🌙 **Dark Mode** — Light / Dark / System theme with customizable accent colors
- 🌐 **i18n** — English and 简体中文 interface

### Screenshots

<img width="1964" height="1362" alt="image" src="https://github.com/user-attachments/assets/1296270f-5aaa-4aa6-874a-d5595afe8db5" />
<img width="1972" height="1373" alt="image" src="https://github.com/user-attachments/assets/bda7ebac-5c31-4233-ac4e-d4587b6cd6f0" />
<img width="1972" height="1372" alt="image" src="https://github.com/user-attachments/assets/a52118e9-ee51-4b35-86e1-5b98d5df8453" />
<img width="1970" height="1372" alt="image" src="https://github.com/user-attachments/assets/8a594471-1dd4-4018-bad4-c6cf45cfc8c0" />
<img width="1971" height="1369" alt="image" src="https://github.com/user-attachments/assets/da8907b3-de80-413d-b4cb-66c36a4735c6" />


### Requirements

- [Cockpit](https://cockpit-project.org/) ≥ 270
- A WebDAV server (e.g. [go-webdav](https://github.com/hacdias/webdav))

### Install

#### From Release (recommended)

```bash
# Download the latest .deb from GitHub Releases
sudo dpkg -i cockpit-webdav-manager_x.x.x_all.deb
sudo systemctl restart cockpit
```

#### Build locally

```bash
git clone https://github.com/Omoinemie/cockpit-webdav-manager.git
cd cockpit-webdav-manager

# Edit VERSION file to set your version
echo "0.3.0" > VERSION

# Build
chmod +x build-deb.sh
./build-deb.sh

# Install
sudo dpkg -i cockpit-webdav-manager_*.deb
sudo systemctl restart cockpit
```

### Usage

1. Open Cockpit in your browser (usually `https://your-server:9090`)
2. Log in and find **WebDAV Manager** in the left sidebar
3. Configure your WebDAV server through the intuitive UI

### Configuration

The plugin manages a YAML configuration file (default: `/etc/webdav/config.yaml`). You can set a custom path in **Settings → WebDAV Config Path**.

### Build & Release (CI/CD)

The GitHub Actions workflow supports:

| Input | Description |
|-------|-------------|
| `version` | Version number (e.g. `0.3.0`). Leave empty to read from `VERSION` file |
| `changelog` | Release notes (optional, supports multiple lines) |
| `create_release` | Whether to publish a GitHub Release (Yes/No) |

**Version priority:** Manual input > `VERSION` file > `manifest.json`

### Contributing

Contributions are welcome! Feel free to open issues and pull requests.

### License

[MIT License](LICENSE)

---

<a id="中文"></a>

## 🇨🇳 中文

### 功能特性

- 🖥️ **服务器设置** — 配置监听地址、端口、根目录、路径前缀
- 🔐 **TLS / SSL** — 启用 HTTPS，配置证书和密钥文件
- 🌍 **CORS** — 细粒度控制允许的来源、请求头和方法
- 📋 **日志** — 日志格式、彩色输出、输出目标配置
- 📏 **全局规则** — 基于路径和正则的访问控制规则（CRUD 权限）
- 👥 **用户管理** — 添加/删除用户，支持独立目录和权限配置
- 📂 **文件浏览** — 直接在界面中浏览和预览 WebDAV 服务的文件
- 📝 **原始 YAML** — 直接查看和编辑底层 YAML 配置文件
- 🌙 **暗色模式** — 亮色/暗色/跟随系统主题，支持自定义强调色
- 🌐 **国际化** — English 和简体中文界面

### 截图

> _在这里添加截图_

### 环境要求

- [Cockpit](https://cockpit-project.org/) ≥ 270
- WebDAV 服务端（如 [go-webdav](https://github.com/hacdias/webdav)）

### 安装

#### 从 Release 安装（推荐）

```bash
# 从 GitHub Releases 下载最新的 .deb 包
sudo dpkg -i cockpit-webdav-manager_x.x.x_all.deb
sudo systemctl restart cockpit
```

#### 本地构建

```bash
git clone https://github.com/Omoinemie/cockpit-webdav-manager.git
cd cockpit-webdav-manager

# 修改 VERSION 文件设置版本号
echo "0.3.0" > VERSION

# 构建
chmod +x build-deb.sh
./build-deb.sh

# 安装
sudo dpkg -i cockpit-webdav-manager_*.deb
sudo systemctl restart cockpit
```

### 使用方法

1. 在浏览器中打开 Cockpit（通常是 `https://your-server:9090`）
2. 登录后在左侧菜单找到 **WebDAV Manager**
3. 通过直观的界面配置你的 WebDAV 服务器

### 配置说明

插件管理一个 YAML 配置文件（默认：`etc/webdav/config.yaml`），可在 **设置 → WebDAV 配置路径** 中自定义。

### 构建与发布（CI/CD）

GitHub Actions 工作流支持：

| 输入项 | 说明 |
|--------|------|
| `version` | 版本号（如 `0.3.0`），留空则读取 `VERSION` 文件 |
| `changelog` | 更新日志（可选，支持多行） |
| `create_release` | 是否发布到 GitHub Release（是/否） |

**版本号优先级：** 手动输入 > `VERSION` 文件 > `manifest.json`

### 参与贡献

欢迎提交 Issue 和 Pull Request！

### 开源协议

[MIT License](LICENSE)
