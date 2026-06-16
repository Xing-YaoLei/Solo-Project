#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from config import Config

if __name__ == '__main__':
    print(f"🚀 药店连锁处方审核风险监测系统启动中...")
    print(f"📊 访问地址: http://localhost:{Config.DASH_PORT}")
    print(f"📅 数据范围: 最近90天模拟数据")
    print()
    print("功能模块:")
    print("  📊 风险总览 - 处方审核核心指标概览")
    print("  🔍 深度复盘 - 批号效期→会员档案→补货单→库存 多层下钻")
    print("  📋 任务管理 - 处方不清任务及处理结论")
    print("  📞 回访追踪 - 回访完成率及绩效监控")
    print()
    app.run(
        debug=Config.DASH_DEBUG,
        port=Config.DASH_PORT,
        host='0.0.0.0'
    )
