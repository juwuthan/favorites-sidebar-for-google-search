#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXTENSION_DIR="$ROOT_DIR/edge-google-favorites-extension"
DIST_DIR="$ROOT_DIR/dist"
VERSION="$(node -e "console.log(require('$EXTENSION_DIR/manifest.json').version)")"
PACKAGE_NAME="favorites-sidebar-for-google-search-$VERSION.zip"

mkdir -p "$DIST_DIR"
rm -f "$DIST_DIR/$PACKAGE_NAME"

(
  cd "$EXTENSION_DIR"
  zip -r "$DIST_DIR/$PACKAGE_NAME" . \
    -x '*.DS_Store' \
    -x '__MACOSX/*' \
    -x 'icons/LOGO.png'
)

printf '%s\n' "$DIST_DIR/$PACKAGE_NAME"
