#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dashboard.app import app
from config.settings import settings


def main():
    print("🏥 康复中心康复评估风险监测系统")
    print(f"🚀 启动Dash应用，端口: {settings.DASH_PORT}")
    print(f"🔗 访问地址: http://localhost:{settings.DASH_PORT}")
    print(f"💾 数据库: {'SQLite' if settings.USE_SQLITE else 'PostgreSQL'}")
    print("=" * 60)

    app.run_server(
        debug=settings.DASH_DEBUG,
        port=settings.DASH_PORT,
        host="0.0.0.0",
    )


if __name__ == "__main__":
    main()
