#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, timedelta
import argparse
import logging
from src.utils.config import load_config
from src.data_layer.data_repository import DataRepository, CORE_TABLES
from src.utils.data_generator import MockDataGenerator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)


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
    repo = DataRepository(config, use_minio=True)
    if repo.use_minio:
        print(f"📡 MinIO 已连接: endpoint={config.minio.endpoint}, bucket={config.minio.bucket}")
    else:
        print(f"⚠️  MinIO 未启用或连接失败: {repo.minio_init_error}")
        if config.minio.enabled:
            print("🚨 配置已启用 MinIO，但连接失败。核心交易表（OTA订单/门锁记录/收款流水）将无法写入！")
            print("   请选择：")
            print("   1. 启动 MinIO 服务后重试")
            print("   2. 设置环境变量 MINIO_ENABLED=false 禁用 MinIO（仅用于本地开发）")
            if not args.force:
                confirm = input("   仍要继续？(y/N): ")
                if confirm.lower() != "y":
                    print("❌ 已取消")
                    return
        else:
            print("ℹ️  MinIO 已在配置中禁用，所有数据仅写入 DuckDB。")
            print("   核心交易表的 MinIO 对象将缺失，可后续通过 sync_to_minio 补发。")

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

        write_results = result.get("write_results", {})
        if write_results:
            print("📡 MinIO 双写结果统计")
            print("------------------------------")
            ok_count = 0
            fail_count = 0
            skip_count = 0
            fail_details = []
            missing_details = []
            for table, r in write_results.items():
                is_core = " 🔴" if table in CORE_TABLES else ""
                if r.minio_ok is True:
                    ok_count += 1
                    print(f"  ✅ {table:30s} {r.row_count:>6} 行 → {r.minio_object_name}")
                elif r.minio_ok is False:
                    fail_count += 1
                    print(f"  ❌{is_core} {table:30s} {r.row_count:>6} 行 → 写入失败: {r.minio_error}")
                    fail_details.append((table, r.minio_error))
                else:
                    skip_count += 1
                    print(f"  ⚠️{is_core} {table:30s} {r.row_count:>6} 行 → 对象缺失 (MinIO 未启用/未连接)")
                    missing_details.append((table, r.minio_error or repo.minio_init_error or "未知原因"))
            print()
            print(f"   MinIO 成功: {ok_count} 表  |  失败: {fail_count} 表  |  缺失: {skip_count} 表")

            core_missing = [t for t in CORE_TABLES if t in write_results and write_results[t].minio_ok is not True]
            core_fail = [t for t in CORE_TABLES if t in write_results and write_results[t].minio_ok is False]
            if core_missing:
                print()
                print(f"🚨 核心交易表 {core_missing} 未写入 MinIO，对象已缺失！")
                print("   请确保 MinIO 服务正常后，使用 sync_to_minio 补发数据。")
            if fail_details or missing_details:
                print()
                print("⚠️  以下表仅写入了 DuckDB（MinIO 对象缺失）：")
                for t, e in fail_details:
                    tag = " [核心]" if t in CORE_TABLES else ""
                    print(f"    - {t}{tag}: 写入失败: {e}")
                for t, e in missing_details:
                    tag = " [核心]" if t in CORE_TABLES else ""
                    print(f"    - {t}{tag}: 未写入 MinIO: {e}")
                print()
                print("   可调用 `repo.sync_to_minio([table_names])` 补发对象到 MinIO。")
            elif ok_count > 0 and skip_count == 0 and fail_count == 0:
                print("   ✅ 所有对象均已保留在 MinIO。")
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
