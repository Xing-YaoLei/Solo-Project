#!/bin/bash
# 物业装修备案调度 - Web 启动脚本
# 使用方法: 
# 1. 在 Godot 4 编辑器中: 项目 -> 导出 -> 选择 Web -> 导出项目 到 build/web/
# 2. 运行此脚本启动本地服务器
# 3. 浏览器打开 http://localhost:8080

cd "$(dirname "$0")"
BUILD_DIR="build/web"

if [ ! -d "$BUILD_DIR" ] || [ -z "$(ls -A "$BUILD_DIR" 2>/dev/null)" ]; then
    echo "=============================================="
    echo "⚠️  未找到 Web 导出文件"
    echo "=============================================="
    echo ""
    echo "请先在 Godot 4 编辑器中导出 Web 版本:"
    echo "  1. 打开项目: project.godot"
    echo "  2. 菜单: 项目 -> 导出..."
    echo "  3. 选择预设: Web"
    echo "  4. 点击: 导出项目..."
    echo "  5. 保存路径: build/web/index.html"
    echo ""
    echo "导出完成后重新运行此脚本"
    echo ""
    echo "正在为您启动开发预览服务器..."
    echo ""
fi

# 检查 Python3 是否可用
if command -v python3 &> /dev/null; then
    SERVER_CMD="python3 -m http.server 8080"
elif command -v python &> /dev/null; then
    SERVER_CMD="python -m SimpleHTTPServer 8080"
else
    echo "❌ 未找到 Python，请安装 Python 3 或使用其他 HTTP 服务器"
    exit 1
fi

# 如果 build/web 不存在，以项目根目录提供服务并显示引导页
if [ ! -d "$BUILD_DIR" ] || [ -z "$(ls -A "$BUILD_DIR" 2>/dev/null)" ]; then
    echo "=============================================="
    echo "🌐  启动开发引导服务器"
    echo "=============================================="
    echo ""
    echo "请在浏览器打开:"
    echo "  http://localhost:8080/"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    $SERVER_CMD
else
    cd "$BUILD_DIR"
    echo "=============================================="
    echo "🎮  启动游戏 Web 服务器"
    echo "=============================================="
    echo ""
    echo "请在浏览器打开:"
    echo "  http://localhost:8080/"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    $SERVER_CMD
fi
