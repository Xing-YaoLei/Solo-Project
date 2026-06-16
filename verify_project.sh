#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${PROJECT_DIR}"

echo "=========================================="
echo "  项目验证：口腔诊所会员复诊训练"
echo "=========================================="
echo ""

check_file() {
    if [ -f "$1" ]; then
        echo "  ✅ $2: $1"
        return 0
    else
        echo "  ❌ $2: $1 不存在"
        return 1
    fi
}

echo "[1/3] 检查核心文件..."
check_file "project.godot" "项目配置"
check_file "icon.svg" "项目图标"
check_file "export_presets.cfg" "Web 导出配置"
check_file "scripts/game_data.gd" "核心数据单例"
check_file "scripts/replay_manager.gd" "回放管理单例"
check_file "scripts/stats_manager.gd" "统计管理单例"
check_file "scripts/main_menu.gd" "主菜单脚本"
check_file "scripts/game.gd" "游戏核心脚本"
check_file "scripts/settlement.gd" "结算页脚本"
check_file "scripts/statistics.gd" "统计页脚本"
check_file "scripts/leaderboard.gd" "排行榜脚本"
check_file "scripts/replay_viewer.gd" "回放查看器脚本"
echo ""

echo "[2/3] 检查场景文件..."
check_file "scenes/main_menu.tscn" "主菜单场景"
check_file "scenes/game.tscn" "游戏场景"
check_file "scenes/settlement.tscn" "结算页场景"
check_file "scenes/statistics.tscn" "统计页场景"
check_file "scenes/leaderboard.tscn" "排行榜场景"
check_file "scenes/replay_viewer.tscn" "回放查看器场景"
echo ""

echo "[3/3] 检查导出配置..."
check_file "export_presets.cfg" "导出预设"
check_file "build_web.sh" "一键导出脚本"
check_file "export_web.sh" "备用导出脚本"
echo ""

echo "=========================================="
echo "  验证完成！项目文件完整。"
echo ""
echo "  🚀 快速开始："
echo "  1. 导出 Web 版: ./build_web.sh"
echo "  2. 用 Godot 4.3 打开: ${PROJECT_DIR}"
echo "  3. 直接运行: 按 F5 开始训练"
echo ""
echo "  📂 导出目录: ${PROJECT_DIR}/export/web/"
echo "=========================================="
