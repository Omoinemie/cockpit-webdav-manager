#!/usr/bin/env bash
#
# WebDAV 管理脚本 — 安装 / 更新 / 卸载 hacdias/webdav
# 用法: webdav-manager.sh install | update | uninstall
#

set -euo pipefail

# ── 常量 ──────────────────────────────────────────────
REPO="hacdias/webdav"
BINARY_NAME="webdav"
INSTALL_DIR="/usr/bin"
CONFIG_DIR="/etc/webdav"
CONFIG_FILE="${CONFIG_DIR}/webdav.yml"
SERVICE_NAME="webdav"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# ── 颜色 ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
err()   { echo -e "${RED}[✘]${NC} $*" >&2; }
step()  { echo -e "${CYAN}[▸]${NC} $*"; }

# ── 架构检测 ──────────────────────────────────────────
detect_arch() {
    local arch
    arch=$(uname -m)
    case "$arch" in
        x86_64 | amd64)   echo "amd64" ;;
        aarch64 | arm64)   echo "arm64" ;;
        armv7l | armhf)    echo "armv7" ;;
        armv6l)            echo "armv6" ;;
        i686 | i386)       echo "386"   ;;
        *)
            err "不支持的架构: $arch"
            exit 1
            ;;
    esac
}

# ── 获取最新版本号 ────────────────────────────────────
get_latest_version() {
    local version
    version=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
        | grep '"tag_name"' \
        | head -1 \
        | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')
    if [[ -z "$version" ]]; then
        err "无法获取最新版本号"
        exit 1
    fi
    echo "$version"
}

# ── 获取当前已安装版本 ────────────────────────────────
get_installed_version() {
    if ! command -v "$BINARY_NAME" &>/dev/null; then
        echo ""
        return
    fi
    # 尝试多种常见输出格式
    local raw
    raw=$("$BINARY_NAME" version 2>&1 || true)
    # 匹配 vX.Y.Z 或 X.Y.Z
    local ver
    ver=$(echo "$raw" | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    # 统一加 v 前缀
    if [[ -n "$ver" && ! "$ver" =~ ^v ]]; then
        ver="v${ver}"
    fi
    echo "$ver"
}

# ── 下载并安装二进制 ──────────────────────────────────
install_binary() {
    local version="$1"
    local arch
    arch=$(detect_arch)
    local os="linux"
    local filename="${os}-${arch}-webdav.tar.gz"
    local download_url="https://github.com/${REPO}/releases/download/${version}/${filename}"
    local tmp_dir
    tmp_dir=$(mktemp -d)

    step "下载 ${filename} ..."
    if ! curl -fSL --progress-bar -o "${tmp_dir}/${filename}" "$download_url"; then
        err "下载失败: $download_url"
        rm -rf "$tmp_dir"
        exit 1
    fi

    step "解压 ..."
    tar -xzf "${tmp_dir}/${filename}" -C "$tmp_dir"

    step "安装二进制到 ${INSTALL_DIR}/${BINARY_NAME} ..."
    install -m 755 "${tmp_dir}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"

    rm -rf "$tmp_dir"
    info "二进制安装完成"
}

# ── 创建默认配置 ──────────────────────────────────────
create_default_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        warn "配置文件已存在，跳过生成: ${CONFIG_FILE}"
        return
    fi

    step "生成默认配置 ..."
    mkdir -p "$CONFIG_DIR"
    cat > "$CONFIG_FILE" <<'YAML'
# WebDAV 配置文件
# 文档: https://github.com/hacdias/webdav

# 监听地址与端口
address: 0.0.0.0
port: 6065

# TLS 设置
tls: false
cert: cert.pem
key: key.pem

# 路径前缀
prefix: /

# 功能开关
debug: false
noSniff: false
behindProxy: false

# WebDAV 根目录
directory: /data

# 默认权限 (C=Create R=Read U=Update D=Delete)
permissions: R

# 规则
rules: []
rulesBehavior: overwrite

# 日志配置
log:
  format: console
  colors: true
  outputs:
    - stderr

# CORS 设置
cors:
  enabled: true
  credentials: true
  allowed_hosts:
    - '*'
  allowed_headers:
    - Authorization
    - Content-Type
    - Depth
    - Destination
    - If
    - Lock-Token
    - Overwrite
    - TimeOut
    - Translate
  allowed_methods:
    - COPY
    - DELETE
    - GET
    - HEAD
    - LOCK
    - UNLOCK
    - MKCOL
    - MOVE
    - OPTIONS
    - POST
    - PROPFIND
    - PROPPATCH
    - PUT
  exposed_headers: []
YAML
    info "默认配置已写入: ${CONFIG_FILE}"
}

# ── 创建 systemd 服务 ────────────────────────────────
create_service() {
    step "创建 systemd 服务 ..."
    cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=WebDAV
After=network.target

[Service]
Type=simple
User=root
ExecStart=${INSTALL_DIR}/${BINARY_NAME} --config ${CONFIG_FILE}
Restart=on-failure
RestartSec=5s
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload
    info "服务文件已创建: ${SERVICE_FILE}"
}

# ── 启动服务 ──────────────────────────────────────────
start_service() {
    step "启动 ${SERVICE_NAME} 服务 ..."
    systemctl enable --now "$SERVICE_NAME"
    sleep 1
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        info "服务运行中 ✓"
        systemctl --no-pager status "$SERVICE_NAME" | head -10
    else
        err "服务启动失败，查看日志: journalctl -u ${SERVICE_NAME} -n 20"
        exit 1
    fi
}

# ── 安装 ──────────────────────────────────────────────
do_install() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  WebDAV 安装${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""

    if command -v "$BINARY_NAME" &>/dev/null; then
        warn "WebDAV 已安装: $(get_installed_version)"
        warn "如需更新请使用: $0 update"
        exit 0
    fi

    local version
    version=$(get_latest_version)
    step "最新版本: ${version}"

    install_binary "$version"
    create_default_config
    create_service
    start_service

    echo ""
    info "安装完成！版本: ${version}"
    info "配置文件: ${CONFIG_FILE}"
    info "默认端口: 8080"
    cache_version
    echo ""
}

# ── 更新 ──────────────────────────────────────────────
do_update() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  WebDAV 更新${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""

    if ! command -v "$BINARY_NAME" &>/dev/null; then
        err "WebDAV 未安装，请先执行: $0 install"
        exit 1
    fi

    local installed_ver latest_ver
    installed_ver=$(get_installed_version)
    latest_ver=$(get_latest_version)

    if [[ -z "$installed_ver" ]]; then
        warn "无法检测本地版本，将执行强制更新"
    else
        info "当前版本: ${installed_ver}"
        info "最新版本: ${latest_ver}"
        if [[ "$installed_ver" == "$latest_ver" ]]; then
            info "已是最新版本，无需更新"
            exit 0
        fi
    fi

    step "停止服务 ..."
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true

    install_binary "$latest_ver"
    create_service

    step "重启服务 ..."
    systemctl start "$SERVICE_NAME"
    sleep 1
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        info "更新完成！${installed_ver} → ${latest_ver}"
        cache_version
    else
        err "服务启动失败，查看日志: journalctl -u ${SERVICE_NAME} -n 20"
        exit 1
    fi
    echo ""
}

# ── 卸载 ──────────────────────────────────────────────
do_uninstall() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  WebDAV 卸载${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""

    echo -e "${YELLOW}即将卸载 WebDAV，以下内容将被移除:${NC}"
    echo "  - ${INSTALL_DIR}/${BINARY_NAME}"
    echo "  - ${SERVICE_FILE}"
    echo "  - systemd 服务 (${SERVICE_NAME})"
    echo ""
    echo -e "${YELLOW}配置文件 (${CONFIG_DIR}) 将保留${NC}"
    echo ""
    read -rp "确认卸载？[y/N] " confirm
    if [[ ! "$confirm" =~ ^[yY]$ ]]; then
        info "取消卸载"
        exit 0
    fi

    step "停止并禁用服务 ..."
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true

    step "删除服务文件 ..."
    rm -f "$SERVICE_FILE"
    systemctl daemon-reload

    step "删除二进制 ..."
    rm -f "${INSTALL_DIR}/${BINARY_NAME}"

    info "卸载完成"
    info "配置目录 ${CONFIG_DIR} 已保留，如需清理请手动删除: rm -rf ${CONFIG_DIR}"
    echo ""
}

# ── 缓存版本号 ──
VERSION_CACHE="/etc/webdav/.version"

cache_version() {
    local ver=""
    if command -v "$BINARY_NAME" &>/dev/null; then
        local raw
        raw=$("$BINARY_NAME" version 2>&1 || true)
        ver=$(echo "$raw" | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+' | head -1 | sed 's/^v//')
    fi
    if [[ -n "$ver" ]]; then
        echo "$ver" > "$VERSION_CACHE"
    fi
}

read_cached_version() {
    if [[ -f "$VERSION_CACHE" ]]; then
        cat "$VERSION_CACHE"
    fi
}

# ── 检查更新（输出JSON）────────────────────────────────
do_check_update() {
    # 优先读取缓存版本
    local current_ver
    current_ver=$(read_cached_version)

    # 缓存不存在则实时获取
    if [[ -z "$current_ver" ]] && command -v "$BINARY_NAME" &>/dev/null; then
        local raw
        raw=$("$BINARY_NAME" version 2>&1 || true)
        current_ver=$(echo "$raw" | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+' | head -1 | sed 's/^v//')
    fi

    # 获取到版本后写入缓存
    if [[ -n "$current_ver" ]]; then
        mkdir -p "$(dirname "$VERSION_CACHE")"
        echo "$current_ver" > "$VERSION_CACHE"
    fi

    local latest_ver=""
    latest_ver=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null \
        | grep '"tag_name"' \
        | head -1 \
        | sed -E 's/.*"tag_name":\s*"v?([^"]+)".*/\1/')

    local has_update="false"
    if [[ -n "$current_ver" && -n "$latest_ver" && "$current_ver" != "$latest_ver" ]]; then
        has_update="true"
    fi

    echo "{\"current\":\"${current_ver:-unknown}\",\"latest\":\"${latest_ver:-unknown}\",\"hasUpdate\":${has_update}}"
}

# ── 帮助 ──────────────────────────────────────────────
usage() {
    echo ""
    echo "用法: $0 {install|update|uninstall|check-update}"
    echo ""
    echo "  install       安装最新版 WebDAV 并配置 systemd 服务"
    echo "  update        更新到最新版本"
    echo "  uninstall     卸载 WebDAV（保留配置文件）"
    echo "  check-update  检查更新（输出JSON格式结果）"
    echo ""
}

# ── 交互式菜单 ────────────────────────────────────────
interactive_menu() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  WebDAV 管理脚本${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""

    # 显示当前状态
    local installed_ver
    installed_ver=$(get_installed_version)
    if [[ -n "$installed_ver" ]]; then
        info "已安装版本: ${installed_ver}"
    else
        warn "WebDAV 未安装"
    fi

    echo ""
    echo "  1) 安装"
    echo "  2) 更新"
    echo "  3) 卸载"
    echo "  0) 退出"
    echo ""
    read -rp "请选择 [0-3]: " choice

    case "$choice" in
        1) do_install ;;
        2) do_update ;;
        3) do_uninstall ;;
        0) echo "退出"; exit 0 ;;
        *) err "无效选项"; exit 1 ;;
    esac
}

# ── 主入口 ────────────────────────────────────────────
main() {
    if [[ $# -lt 1 ]]; then
        interactive_menu
        exit 0
    fi

    case "$1" in
        install)      do_install ;;
        update)       do_update ;;
        uninstall)    do_uninstall ;;
        check-update) do_check_update ;;
        *)
            err "未知命令: $1"
            usage
            exit 1
            ;;
    esac
}

main "$@"
