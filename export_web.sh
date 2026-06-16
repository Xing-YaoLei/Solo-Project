#!/bin/bash
set -e

GODOT_VERSION="4.3"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPORT_DIR="${PROJECT_DIR}/export/web"
TMP_DIR="/tmp/godot_export_$$"

mkdir -p "${TMP_DIR}"

echo "=========================================="
echo "  口腔诊所复诊训练 Web 导出脚本"
echo "  Godot ${GODOT_VERSION}"
echo "=========================================="

cd "${TMP_DIR}"

if [ ! -x "${TMP_DIR}/Godot.app/Contents/MacOS/Godot" ]; then
    echo "[1/4] 下载 Godot ${GODOT_VERSION}..."
    curl -L -o godot.zip "https://downloads.tuxfamily.org/godotengine/${GODOT_VERSION}/Godot_v${GODOT_VERSION}-stable_macos.universal.zip"
    echo "      解压中..."
    unzip -q godot.zip
    xattr -d com.apple.quarantine Godot.app 2>/dev/null || true
    chmod +x Godot.app/Contents/MacOS/Godot
else
    echo "[1/4] Godot 已存在，跳过下载"
fi

if [ ! -f "${TMP_DIR}/web_export_templates.tpz" ]; then
    echo "[2/4] 下载 Web 导出模板..."
    curl -L -o web_templates.tpz \
        "https://downloads.tuxfamily.org/godotengine/${GODOT_VERSION}/Godot_v${GODOT_VERSION}-stable_export_templates.tpz"
    mkdir -p "${TMP_DIR}/templates/${GODOT_VERSION}.stable"
    cd "${TMP_DIR}/templates/${GODOT_VERSION}.stable"
    unzip -q "${TMP_DIR}/web_templates.tpz"
    mv templates/* . 2>/dev/null || true
    cd "${TMP_DIR}"
else
    echo "[2/4] Web 导出模板已存在，跳过下载"
fi

echo "[3/4] 准备导出目录..."
mkdir -p "${EXPORT_DIR}"
rm -f "${EXPORT_DIR}/"*.html "${EXPORT_DIR}/"*.js "${EXPORT_DIR}/"*.wasm "${EXPORT_DIR}/"*.pck

echo "[4/4] 导出 Web 版本..."
GODOT_BIN="${TMP_DIR}/Godot.app/Contents/MacOS/Godot"
"${GODOT_BIN}" --headless --path "${PROJECT_DIR}" \
    --export-release "Web" "${EXPORT_DIR}/index.html" 2>&1 | tail -20

echo ""
echo "=========================================="
echo "  导出完成！"
echo "  文件位置: ${EXPORT_DIR}/index.html"
echo ""
echo "  运行方式（任选其一）："
echo "  1. cd ${EXPORT_DIR} && python3 -m http.server 8000"
echo "     然后浏览器打开 http://localhost:8000"
echo "  2. 使用 VS Code Live Server 插件"
echo "  3. 直接用浏览器打开 index.html"
echo "=========================================="
