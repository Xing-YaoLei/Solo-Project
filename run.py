import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import Config
from app.dash_app.app import create_dash_app


def main():
    Config.ensure_dirs()
    app = create_dash_app()

    print("\n" + "=" * 70)
    print("   家装工地量房报价漏斗报表系统 v1.0")
    print("=" * 70)
    print(f"   访问地址: http://localhost:{Config.DASH_PORT}")
    print(f"   调试模式: {Config.DASH_DEBUG}")
    print(f"   时区: {Config.TIMEZONE}")
    print(f"   数据库: {Config.POSTGRES_HOST}:{Config.POSTGRES_PORT}/{Config.POSTGRES_DB}")
    print(f"   上传目录: {Config.UPLOAD_DIR}")
    print(f"   导出目录: {Config.EXPORT_DIR}")
    print("=" * 70)
    print("   默认账号：")
    print("     • admin / admin123 (管理员，全权限)")
    print("     • finance / finance123 (财务，可见金额)")
    print("     • viewer / viewer123 (只读，金额脱敏)")
    print("=" * 70 + "\n")

    app.run(
        host="0.0.0.0",
        port=Config.DASH_PORT,
        debug=Config.DASH_DEBUG,
        dev_tools_hot_reload=Config.DASH_DEBUG,
    )


if __name__ == "__main__":
    main()
