#!/bin/bash
# Local .deb build script for cockpit-webdav-manager
set -euo pipefail

# ── Config ──
PKG_NAME="cockpit-webdav-manager"
PLUGIN_NAME="webdav-manager"          # install dir: /usr/share/cockpit/webdav-manager
MANIFEST="manifest.json"

# ── Version resolution (VERSION file > manifest.json) ──
VERSION=""
if [[ -f "VERSION" ]]; then
    VERSION=$(cat VERSION | tr -d '[:space:]')
fi

if [[ -z "$VERSION" ]]; then
    [[ -f "$MANIFEST" ]] || { echo "Error: $MANIFEST not found"; exit 1; }
    VERSION=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['package_version'])" "$MANIFEST")
fi

if [[ -z "$VERSION" ]]; then
    echo "Error: cannot determine version (no VERSION file and no package_version in $MANIFEST)"
    exit 1
fi

# ── Auto increment patch version ──
IFS='.' read -r major minor patch <<< "$VERSION"
patch=$((patch + 1))
VERSION="${major}.${minor}.${patch}"

# Save new version to VERSION file
echo "$VERSION" > VERSION

echo "==> Version: $VERSION (auto-incremented)"

# Sync version to manifest.json
python3 -c "
import json, sys
with open(sys.argv[1], 'r') as f:
    data = json.load(f)
data['package_version'] = sys.argv[2]
with open(sys.argv[1], 'w') as f:
    json.dump(data, f, indent=4)
    f.write('\n')
" "$MANIFEST" "$VERSION"

# Sync version to index.html footer
if [[ -f "index.html" ]]; then
    sed -i "s|<span id=\"footerVersion\">[^<]*</span>|<span id=\"footerVersion\">${VERSION}</span>|" index.html
fi

ARCH="all"
DEB_FILE="${PKG_NAME}_${VERSION}_${ARCH}.deb"
STAGING="${PLUGIN_NAME}_${VERSION}"   # temp dir uses short name, no "cockpit"

echo "==> Building ${PKG_NAME} ${VERSION}"

# ── Clean ──
rm -rf "$DEB_FILE"

# ─ Package structure (use tmp) ─
STAGING_DIR=$(mktemp -d)
STAGING="${STAGING_DIR}/${PLUGIN_NAME}_${VERSION}"
PLUGIN_DEST="${STAGING}/usr/share/cockpit/${PLUGIN_NAME}"
mkdir -p "${STAGING}/DEBIAN"
mkdir -p "$PLUGIN_DEST"

# ── Copy plugin files ──
# Support both flat (css/js/) and nested (static/css/static/js/) layouts
cp index.html "$PLUGIN_DEST/"
cp manifest.json "$PLUGIN_DEST/"

if [[ -d "static" ]]; then
    cp -r static "$PLUGIN_DEST/"
fi
# Legacy flat layout fallback
for item in css js; do
    [[ -d "$item" ]] && cp -r "$item" "$PLUGIN_DEST/"
done

# Copy webdav-manager.sh script
if [[ -f "webdav-manager.sh" ]]; then
    mkdir -p "${STAGING}/usr/local/bin"
    cp webdav-manager.sh "${STAGING}/usr/local/bin/webdav-manager"
    chmod 755 "${STAGING}/usr/local/bin/webdav-manager"
fi

# ─ DEBIAN/control ──
cat > "${STAGING}/DEBIAN/control" << EOF
Package: ${PKG_NAME}
Version: ${VERSION}
Section: admin
Priority: optional
Architecture: ${ARCH}
Depends: cockpit (>= 270)
Maintainer: Omoinemie
Homepage: https://github.com/Omoinemie/cockpit-webdav-manager
Description: Cockpit plugin for WebDAV config management
 A WebDAV server configuration manager plugin for Cockpit.
 Manage users, rules, TLS, CORS, and file browsing
 through the Cockpit web console.
EOF

# ── postinst: check webdav ──
cat > "${STAGING}/DEBIAN/postinst" << 'POSTINST'
#!/bin/sh
set -e

# Check if webdav is installed
if [ ! -x "/usr/bin/webdav" ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════╗"
    echo "║  WebDAV 服务未安装                            ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo ""
    echo "是否现在安装 WebDAV 服务？"
    echo "  - 从 GitHub 下载最新版本"
    echo "  - 创建 systemd 服务"
    echo "  - 生成默认配置"
    echo ""
    read -rp "安装 WebDAV？[Y/n] " choice
    choice=${choice:-Y}
    if [ "$choice" = "Y" ] || [ "$choice" = "y" ]; then
        /usr/local/bin/webdav-manager install
    else
        echo "跳过安装。稍后可运行: sudo webdav-manager install"
    fi
    echo ""
fi
POSTINST
chmod 755 "${STAGING}/DEBIAN/postinst"

# ── postrm: cleanup on uninstall ──
cat > "${STAGING}/DEBIAN/postrm" << 'POSTRM'
#!/bin/sh
set -e

case "$1" in
    remove|purge)
        # Remove management script
        rm -f /usr/local/bin/webdav-manager
        ;;
esac
POSTRM
chmod 755 "${STAGING}/DEBIAN/postrm"

# ─ Fix permissions ──
find "${STAGING}" -type d -exec chmod 0755 {} +
find "${STAGING}" -type f -exec chmod 0644 {} +
chmod 0755 "${STAGING}/DEBIAN"
chmod 0644 "${STAGING}/DEBIAN/control"
chmod 0755 "${STAGING}/DEBIAN/postinst"
chmod 0755 "${STAGING}/DEBIAN/postrm"
# Fix webdav-manager script permission
if [[ -f "${STAGING}/usr/local/bin/webdav-manager" ]]; then
    chmod 0755 "${STAGING}/usr/local/bin/webdav-manager"
fi

# ─ Build ─
dpkg-deb --root-owner-group --build "$STAGING" "$DEB_FILE"

# ─ Cleanup temp dir ─
rm -rf "$STAGING_DIR"

echo "==> Done: ${DEB_FILE}"
echo "    Size: $(du -h "$DEB_FILE" | cut -f1)"
echo "    Install: sudo dpkg -i ${DEB_FILE}"
