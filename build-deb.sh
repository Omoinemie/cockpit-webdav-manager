#!/bin/bash
# Local .deb build script for cockpit-webdav-manager
set -euo pipefail

# ── Config ──
PKG_NAME="cockpit-webdav-manager"
PLUGIN_NAME="webdav-manager"          # install dir: /usr/share/cockpit/webdav-manager
MANIFEST="manifest.json"

# ── Preflight ──
[[ -f "$MANIFEST" ]] || { echo "Error: $MANIFEST not found"; exit 1; }

VERSION=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['package_version'])" "$MANIFEST")
ARCH="all"
DEB_FILE="${PKG_NAME}_${VERSION}_${ARCH}.deb"
STAGING="${PLUGIN_NAME}_${VERSION}"   # temp dir uses short name, no "cockpit"

echo "==> Building ${PKG_NAME} ${VERSION}"

# ── Clean ──
rm -rf "$STAGING" "$DEB_FILE"

# ─ Package structure ──
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
if [[ -d "lang" ]]; then
    cp -r lang "$PLUGIN_DEST/"
fi
# Legacy flat layout fallback
for item in css js; do
    [[ -d "$item" ]] && cp -r "$item" "$PLUGIN_DEST/"
done

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

# ── postinst: restart cockpit so it picks up the plugin ──
cat > "${STAGING}/DEBIAN/postinst" << 'EOF'
#!/bin/sh
set -e
if systemctl is-active --quiet cockpit.socket 2>/dev/null; then
    systemctl restart cockpit.socket || true
fi
EOF
chmod 755 "${STAGING}/DEBIAN/postinst"

# ─ Fix permissions ──
find "${STAGING}" -type d -exec chmod 0755 {} +
find "${STAGING}" -type f -exec chmod 0644 {} +
chmod 0755 "${STAGING}/DEBIAN"
chmod 0644 "${STAGING}/DEBIAN/control"
chmod 0755 "${STAGING}/DEBIAN/postinst"

# ─ Build ─
dpkg-deb --root-owner-group --build "$STAGING" "$DEB_FILE"

echo "==> Done: ${DEB_FILE}"
echo "    Size: $(du -h "$DEB_FILE" | cut -f1)"
echo "    Install: sudo dpkg -i ${DEB_FILE}"
