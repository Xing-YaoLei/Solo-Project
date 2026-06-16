#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from data_models import initialize_all_data


def main():
    print("=" * 60)
    print("  康复中心患者分级风险监测系统 - 数据初始化")
    print("=" * 60)
    print()

    db_path = "data/rehab_center.duckdb"
    if os.path.exists(db_path):
        response = input(
            f"检测到已存在的数据库文件: {db_path}\n"
            f"是否覆盖重建？(此操作将删除所有现有数据) [y/N]: "
        ).strip().lower()
        if response == "y":
            os.remove(db_path)
            print("已删除旧数据库文件。")
        else:
            print("保留现有数据库，跳过初始化。")
            return

    print("\n正在初始化数据库并生成模拟数据...")
    print("-" * 60)

    try:
        db = get_db()
        initialize_all_data()

        print()
        print("=" * 60)
        print("  ✅ 数据初始化完成！")
        print("=" * 60)
        print()
        print("下一步操作:")
        print("  1. 安装依赖: pip install -r requirements.txt")
        print("  2. 启动系统: streamlit run src/app.py")
        print("  3. 访问 http://localhost:8501 查看看板")
        print()

    except Exception as e:
        print(f"\n❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
