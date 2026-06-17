#!/bin/bash
set -e
cd "$(dirname "$0")"

PROJECT_DIR="$(pwd)"
GODOT_BIN="/Users/yaoleyxing/Developer/solo-mange-pro/MP0260/tools/Godot.app/Contents/MacOS/Godot"
EXPORT_DIR="$PROJECT_DIR/build/web"
GODOT_HOME="$PROJECT_DIR/.godot_home"
TEMPLATES_DIR="$GODOT_HOME/export_templates/4.6.3.stable"

echo "=============================================="
echo "🔧 物业装修备案调度 - Web 导出构建脚本"
echo "=============================================="
echo ""

mkdir -p "$EXPORT_DIR" "$TEMPLATES_DIR"

# 检查导出模板
if [ ! -f "$TEMPLATES_DIR/web_nothreads_release.zip" ] || [ ! -f "$TEMPLATES_DIR/web_nothreads_debug.zip" ]; then
    echo "📥 正在下载 Godot 4.6.3 Web 导出模板..."
    
    # 尝试多个下载源
    DOWNLOAD_URLS=(
        "https://mirror.ghproxy.com/https://github.com/godotengine/godot-builds/releases/download/4.6.3-stable/Godot_v4.6.3-stable_export_templates.tpz"
        "https://ghproxy.com/https://github.com/godotengine/godot-builds/releases/download/4.6.3-stable/Godot_v4.6.3-stable_export_templates.tpz"
        "https://github.com/godotengine/godot-builds/releases/download/4.6.3-stable/Godot_v4.6.3-stable_export_templates.tpz"
    )
    
    TEMPLATE_FILE="/tmp/godot_4.6.3_templates.tpz"
    DOWNLOAD_SUCCESS=0
    
    for URL in "${DOWNLOAD_URLS[@]}"; do
        echo "   尝试: $URL"
        if curl -L --connect-timeout 20 --max-time 300 -o "$TEMPLATE_FILE" "$URL" 2>/dev/null; then
            if [ -f "$TEMPLATE_FILE" ] && [ $(stat -f%z "$TEMPLATE_FILE") -gt 1000000 ]; then
                DOWNLOAD_SUCCESS=1
                echo "   ✅ 下载成功"
                break
            fi
        fi
        rm -f "$TEMPLATE_FILE"
        echo "   ❌ 失败，尝试下一个..."
    done
    
    if [ "$DOWNLOAD_SUCCESS" -eq 1 ]; then
        echo "📦 正在解压模板..."
        cd /tmp
        unzip -q -o godot_4.6.3_templates.tpz
        if [ -d "templates" ]; then
            cp templates/web_nothreads_*.zip "$TEMPLATES_DIR/" 2>/dev/null || true
        fi
        if [ -d "Godot_v4.6.3-stable_export_templates" ]; then
            cp Godot_v4.6.3-stable_export_templates/web_nothreads_*.zip "$TEMPLATES_DIR/" 2>/dev/null || true
        fi
        cd "$PROJECT_DIR"
    fi
fi

# 检查是否有模板
if [ ! -f "$TEMPLATES_DIR/web_nothreads_release.zip" ]; then
    echo ""
    echo "⚠️  自动下载失败，请手动执行以下步骤："
    echo "  1. 打开项目：$GODOT_BIN --path \"$PROJECT_DIR\""
    echo "  2. 菜单: 编辑器 → 管理导出模板..."
    echo "  3. 点击「下载并安装」下载 4.6.3.stable 模板"
    echo "  4. 完成后重新运行本脚本"
    echo ""
    echo "或手动下载模板 zip 放到："
    echo "  $TEMPLATES_DIR/web_nothreads_release.zip"
    echo "  $TEMPLATES_DIR/web_nothreads_debug.zip"
    exit 1
fi

echo "✅ 导出模板就绪"
echo ""
echo "🚀 开始导出 Web 版本..."

export GODOT_DATA_HOME="$GODOT_HOME"
export XDG_DATA_HOME="$GODOT_HOME"

"$GODOT_BIN" \
    --headless \
    --path "$PROJECT_DIR" \
    --export-release "Web" \
    "build/web/index.html"

EXPORT_RESULT=$?

if [ $EXPORT_RESULT -eq 0 ] && [ -f "$EXPORT_DIR/index.html" ]; then
    echo ""
    echo "=============================================="
    echo "✅ 导出成功！"
    echo "=============================================="
    echo ""
    echo "导出文件位于:"
    echo "  $EXPORT_DIR/"
    echo ""
    ls -lh "$EXPORT_DIR/" | head -10
    echo ""
    echo "启动服务器:  ./run_web.sh"
    echo "或访问:      http://localhost:8080/build/web/"
else
    echo ""
    echo "❌ 导出失败，错误码: $EXPORT_RESULT"
    exit 1
fi
