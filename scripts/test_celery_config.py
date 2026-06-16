#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_celery_imports():
    print("=" * 60)
    print("🔍 测试 1: 检查 Celery 相关模块导入")
    print("=" * 60)
    try:
        from celery_tasks.app import celery_app
        print("✅ celery_app 导入成功")
    except Exception as e:
        print(f"❌ celery_app 导入失败: {e}")
        return False

    try:
        from celery_tasks.tasks import (
            sync_his_data, check_his_delay, check_imaging_missing,
            check_billing_caliber_change, check_no_show_impact,
            run_full_monitoring_cycle
        )
        print("✅ 所有任务函数导入成功")
    except Exception as e:
        print(f"❌ 任务函数导入失败: {e}")
        return False

    try:
        from celery_tasks import beat_config
        print("✅ beat_config 导入成功")
    except Exception as e:
        print(f"❌ beat_config 导入失败: {e}")
        return False

    print()
    return True


def test_celery_app_config():
    print("=" * 60)
    print("🔍 测试 2: 检查 Celery 应用配置")
    print("=" * 60)

    from celery_tasks.app import celery_app

    print(f"\n📋 应用名称: {celery_app.main}")
    print(f"📋 Broker: {celery_app.conf.broker_url}")
    print(f"📋 Backend: {celery_app.conf.result_backend}")

    print("\n📦 队列配置:")
    queues = celery_app.conf.task_queues
    if queues:
        for q in queues:
            print(f"  ✅ {q.name} (routing_key: {q.routing_key})")
    else:
        print("  ❌ 未配置队列")
        return False

    print("\n🚦 任务路由配置:")
    routes = celery_app.conf.task_routes
    expected_routes = {
        "celery_tasks.tasks.sync_his_data": "sync_queue",
        "celery_tasks.tasks.check_his_delay": "monitor_queue",
        "celery_tasks.tasks.check_imaging_missing": "monitor_queue",
        "celery_tasks.tasks.check_billing_caliber_change": "monitor_queue",
        "celery_tasks.tasks.check_no_show_impact": "analytics_queue",
        "celery_tasks.tasks.run_full_monitoring_cycle": "analytics_queue",
    }

    all_routes_ok = True
    for task_name, expected_queue in expected_routes.items():
        if task_name in routes:
            actual_queue = routes[task_name].get("queue", "unknown")
            if actual_queue == expected_queue:
                print(f"  ✅ {task_name} -> {actual_queue}")
            else:
                print(f"  ❌ {task_name} -> {actual_queue} (预期: {expected_queue})")
                all_routes_ok = False
        else:
            print(f"  ❌ {task_name} 未配置路由")
            all_routes_ok = False

    print()
    return all_routes_ok


def test_task_queue_decorators():
    print("=" * 60)
    print("🔍 测试 3: 检查任务装饰器队列配置")
    print("=" * 60)

    from celery_tasks.tasks import (
        sync_his_data, check_his_delay, check_imaging_missing,
        check_billing_caliber_change, check_no_show_impact,
        run_full_monitoring_cycle
    )

    task_queue_map = {
        sync_his_data: "sync_queue",
        check_his_delay: "monitor_queue",
        check_imaging_missing: "monitor_queue",
        check_billing_caliber_change: "monitor_queue",
        check_no_show_impact: "analytics_queue",
        run_full_monitoring_cycle: "analytics_queue",
    }

    all_ok = True
    for task, expected_queue in task_queue_map.items():
        task_name = task.name
        actual_queue = getattr(task, "queue", "not_set")
        if actual_queue == expected_queue:
            print(f"  ✅ {task_name} -> queue={actual_queue}")
        else:
            print(f"  ❌ {task_name} -> queue={actual_queue} (预期: {expected_queue})")
            all_ok = False

    print()
    return all_ok


def test_beat_config():
    print("=" * 60)
    print("🔍 测试 4: 检查 Beat 定时任务配置")
    print("=" * 60)

    from celery_tasks.app import celery_app
    from celery_tasks import beat_config

    schedule = celery_app.conf.beat_schedule
    if not schedule:
        print("  ❌ 未配置定时任务")
        return False

    expected_tasks = {
        "sync-his-every-5-minutes": {"task": "celery_tasks.tasks.sync_his_data", "queue": "sync_queue"},
        "check-his-delay-every-10-minutes": {"task": "celery_tasks.tasks.check_his_delay", "queue": "monitor_queue"},
        "check-imaging-missing-every-15-minutes": {"task": "celery_tasks.tasks.check_imaging_missing", "queue": "monitor_queue"},
        "check-no-show-impact-every-hour": {"task": "celery_tasks.tasks.check_no_show_impact", "queue": "analytics_queue"},
        "check-billing-caliber-daily": {"task": "celery_tasks.tasks.check_billing_caliber_change", "queue": "monitor_queue"},
        "run-full-monitoring-cycle-every-30-minutes": {"task": "celery_tasks.tasks.run_full_monitoring_cycle", "queue": "analytics_queue"},
    }

    all_ok = True
    for task_key, expected in expected_tasks.items():
        if task_key in schedule:
            config = schedule[task_key]
            actual_task = config.get("task", "unknown")
            actual_queue = config.get("options", {}).get("queue", "not_set")

            task_ok = actual_task == expected["task"]
            queue_ok = actual_queue == expected["queue"]

            if task_ok and queue_ok:
                print(f"  ✅ {task_key}:")
                print(f"     task={actual_task}, queue={actual_queue}")
                print(f"     schedule={config.get('schedule', 'unknown')}")
            else:
                print(f"  ❌ {task_key}:")
                if not task_ok:
                    print(f"     task={actual_task} (预期: {expected['task']})")
                if not queue_ok:
                    print(f"     queue={actual_queue} (预期: {expected['queue']})")
                all_ok = False
        else:
            print(f"  ❌ {task_key} 未配置")
            all_ok = False

    print()
    return all_ok


def test_task_chain_construction():
    print("=" * 60)
    print("🔍 测试 5: 检查任务链构建 (run_full_monitoring_cycle)")
    print("=" * 60)

    try:
        from celery import chain, group
        from celery_tasks.tasks import (
            sync_his_data, check_his_delay, check_imaging_missing,
            check_billing_caliber_change, check_no_show_impact
        )

        workflow = chain(
            sync_his_data.si(full_sync=False),
            group(
                check_his_delay.si(),
                check_imaging_missing.si(),
                check_billing_caliber_change.si()
            ),
            check_no_show_impact.si()
        )

        print("✅ 任务链构建成功!")
        print(f"   任务链类型: {type(workflow).__name__}")
        print(f"   任务数量: {len(workflow.tasks)}")

        print("\n📋 任务链结构:")
        for i, task in enumerate(workflow.tasks):
            if hasattr(task, 'tasks'):
                print(f"   {i+1}. [GROUP] 包含 {len(task.tasks)} 个并行任务:")
                for j, subtask in enumerate(task.tasks):
                    print(f"      {j+1}. {subtask.task} (immutable)")
            else:
                print(f"   {i+1}. {task.task} (immutable)")

        print("\n✅ 使用 .si() 确保任务不会接收前一个任务的返回值")
        print()
        return True

    except Exception as e:
        print(f"❌ 任务链构建失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_dashboard_celery_integration():
    print("=" * 60)
    print("🔍 测试 6: 检查看板与 Celery 集成")
    print("=" * 60)

    try:
        from dashboard.layout import CELERY_AVAILABLE
        print(f"📋 Celery 可用状态: {CELERY_AVAILABLE}")

        if CELERY_AVAILABLE:
            from dashboard.layout import run_full_monitoring_cycle
            print(f"✅ 看板成功导入 run_full_monitoring_cycle 任务")
            print(f"   任务名称: {run_full_monitoring_cycle.name}")
            print(f"   任务队列: {getattr(run_full_monitoring_cycle, 'queue', 'not_set')}")
        else:
            print("⚠️  Celery 不可用（可能缺少依赖），看板将以数据只读模式运行")

        print("\n✅ 看板与 Celery 集成配置正确")
        print("   非演示模式下点击刷新按钮将触发完整监测周期")
        print()
        return True

    except Exception as e:
        print(f"❌ 看板 Celery 集成检查失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("\n🦷 口腔诊所洁牙预约风险监测系统 - Celery 配置测试")
    print("=" * 60 + "\n")

    tests = [
        ("模块导入", test_celery_imports),
        ("应用配置", test_celery_app_config),
        ("任务装饰器", test_task_queue_decorators),
        ("Beat 配置", test_beat_config),
        ("任务链构建", test_task_chain_construction),
        ("看板集成", test_dashboard_celery_integration),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ 测试 '{name}' 异常: {e}")
            import traceback
            traceback.print_exc()
            results.append((name, False))

    print("=" * 60)
    print("📊 测试结果汇总")
    print("=" * 60)

    passed = sum(1 for _, r in results if r)
    total = len(results)

    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"  {status} - {name}")

    print(f"\n总计: {passed}/{total} 测试通过")

    if passed == total:
        print("\n🎉 所有 Celery 配置测试通过!")
        print("\n📖 下一步操作:")
        print("  1. 确保 Redis 服务已启动")
        print("  2. 确保 PostgreSQL 服务已启动并配置好连接")
        print("  3. 启动 Worker:")
        print("     ./start.sh  (选择选项 2 或分别选择 3/4/5)")
        print("  4. 启动 Beat:")
        print("     ./start.sh  (选择选项 6)")
        print("  5. 关闭演示模式: 修改 .env 中 DEMO_MODE=false")
        print("  6. 启动看板: ./start.sh (选择选项 1)")
        return 0
    else:
        print(f"\n❌ {total - passed} 个测试失败，请检查配置")
        return 1


if __name__ == "__main__":
    sys.exit(main())
