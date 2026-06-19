#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, timedelta
import argparse
from src.utils.config import load_config
from src.data_layer.data_repository import DataRepository
from src.utils.data_generator import MockDataGenerator


def main():
    parser = argparse.ArgumentParser(description="初始化旅游民宿套餐数据")
    parser.add_argument(
        "--days",
        type=int,
        default=180,
        help="生成多少天的数据（默认：180天）",
    )
    parser.add_argument(
        "--orders",
        type=int,
        default=800,
        help="生成多少条订单（默认：800条）",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="强制重新生成数据，覆盖现有数据库",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="随机数种子（默认：42）",
    )
    args = parser.parse_args()

    print("🏨 旅游民宿套餐数据初始化")
    print("==============================")

    config = load_config()

    if os.path.exists(config.duckdb.db_path) and not args.force:
        print(f"⚠️  数据库已存在: {config.duckdb.db_path}")
        print("   使用 --force 参数强制重新生成")
        confirm = input("   是否继续？(y/N): ")
        if confirm.lower() != "y":
            print("❌ 已取消")
            return

    if args.force and os.path.exists(config.duckdb.db_path):
        print(f"🗑️  删除现有数据库: {config.duckdb.db_path}")
        os.remove(config.duckdb.db_path)

    print(f"📊 初始化数据仓库...")
    repo = DataRepository(config, use_minio=False)

    print(f"🎲 使用随机种子: {args.seed}")
    generator = MockDataGenerator(repo, seed=args.seed)

    end_date = date.today()
    start_date = end_date - timedelta(days=args.days)

    print(f"📅 数据范围: {start_date} ~ {end_date}")
    print(f"📦 预计生成 {args.orders} 条订单")
    print()

    try:
        result = generator.generate_all_data(
            start_date=start_date,
            end_date=end_date,
            order_count=args.orders,
        )

        print()
        print("✅ 数据生成完成！")
        print("==============================")
        print(f"定价规则: {len(result['pricing_rules'])} 条")
        print(f"库存记录: {len(result['inventory'])} 条")
        print(f"OTA订单: {len(result['orders'])} 条")
        print(f"门锁记录: {len(result['door_records'])} 条")
        print(f"收款流水: {len(result['payments'])} 条")
        print(f"转化率版本: {len(result['versions'])} 个")
        print(f"分析备注: {len(result['notes'])} 条")
        print(f"超卖记录: {len(result['oversells'])} 条")
        print()
        print(f"💾 数据库文件: {config.duckdb.db_path}")
        print()
        print("🚀 启动命令:")
        print("   streamlit run app.py")

    except Exception as e:
        print(f"❌ 数据生成失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        repo.close()


if __name__ == "__main__":
    main()
