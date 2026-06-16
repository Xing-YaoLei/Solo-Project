#!/bin/bash
set -e

GODOT_VERSION="4.3"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPORT_DIR="${PROJECT_DIR}/export/web"
GODOT_DIR="${HOME}/.godot_export_tools"

mkdir -p "${GODOT_DIR}" "${EXPORT_DIR}"

echo "=========================================="
echo "  口腔诊所复诊训练 Web 快速导出"
echo "=========================================="

GODOT_BIN="${GODOT_DIR}/Godot_v${GODOT_VERSION}-stable_macos.universal"
TEMPLATES_DIR="${HOME}/Library/Application Support/Godot/templates/${GODOT_VERSION}.stable"

download_file() {
    local url="$1"
    local output="$2"
    local name="$3"
    if [ ! -f "$output" ]; then
        echo "下载 ${name}..."
        curl -# -L -o "$output" "$url"
    else
        echo "${name} 已存在 ✓"
    fi
}

if [ ! -x "${GODOT_BIN}" ]; then
    download_file \
        "https://downloads.tuxfamily.org/godotengine/${GODOT_VERSION}/Godot_v${GODOT_VERSION}-stable_macos.universal.zip" \
        "${GODOT_DIR}/godot.zip" \
        "Godot ${GODOT_VERSION}"
    echo "解压中..."
    cd "${GODOT_DIR}"
    unzip -q -o godot.zip
    mv "Godot.app/Contents/MacOS/Godot" "${GODOT_BIN}"
    chmod +x "${GODOT_BIN}"
    xattr -d com.apple.quarantine "${GODOT_BIN}" 2>/dev/null || true
else
    echo "Godot 已存在 ✓"
fi

if [ ! -f "${TEMPLATES_DIR}/web_release.zip" ]; then
    download_file \
        "https://downloads.tuxfamily.org/godotengine/${GODOT_VERSION}/Godot_v${GODOT_VERSION}-stable_export_templates.tpz" \
        "${GODOT_DIR}/templates.tpz" \
        "Web 导出模板"
    echo "解压模板中..."
    mkdir -p "${TEMPLATES_DIR}"
    cd "${TEMPLATES_DIR}"
    unzip -q -o "${GODOT_DIR}/templates.tpz"
    mv templates/* . 2>/dev/null || true
else
    echo "导出模板已存在 ✓"
fi

echo ""
echo "导出 Web 版本..."
cd "${PROJECT_DIR}"
rm -f "${EXPORT_DIR}/"*.html "${EXPORT_DIR}/"*.js "${EXPORT_DIR}/"*.wasm "${EXPORT_DIR}/"*.pck "${EXPORT_DIR}/"*.png

"${GODOT_BIN}" --headless --path "${PROJECT_DIR}" --import 2>&1 | tail -3
"${GODOT_BIN}" --headless --path "${PROJECT_DIR}" \
    --export-release "Web" "${EXPORT_DIR}/index.html" 2>&1 | tail -10

echo ""
echo "=========================================="
echo "  ✅ 导出完成！"
echo "  📁 输出目录: ${EXPORT_DIR}"
echo "  🚀 启动服务器:"
echo "     cd ${EXPORT_DIR} && python3 -m http.server 8000"
echo "     浏览器访问: http://localhost:8000"
echo "=========================================="
