#!/bin/bash
# Local .deb build script
set -e

PKG_NAME="cockpit-webdav-manager"
VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['package_version'])")
PKG_DIR="${PKG_NAME}_${VERSION}"

echo "Building ${PKG_NAME} ${VERSION}..."

# Clean
rm -rf "${PKG_DIR}" "${PKG_NAME}_${VERSION}_all.deb"

# Create package structure
mkdir -p "${PKG_DIR}/DEBIAN"
mkdir -p "${PKG_DIR}/usr/share/cockpit/webdav-manager"

# Copy plugin files
cp -r css js lang index.html manifest.json \
  "${PKG_DIR}/usr/share/cockpit/webdav-manager/"

# Write control file
cat > "${PKG_DIR}/DEBIAN/control" << EOF
Package: ${PKG_NAME}
Version: ${VERSION}
Section: admin
Priority: optional
Architecture: all
Depends: cockpit (>= 270)
Maintainer: Omoinemie
Description: Cockpit plugin for WebDAV config management
 A WebDAV server configuration manager plugin for Cockpit.
 Manage users, rules, TLS, CORS, and file browsing
 through the Cockpit web console.
EOF

# Build
dpkg-deb --build "${PKG_DIR}"
echo "Done: ${PKG_NAME}_${VERSION}_all.deb"
echo "Install: sudo dpkg -i ${PKG_NAME}_${VERSION}_all.deb"
