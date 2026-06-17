#!/usr/bin/env python3
"""
Celery 启动器 - 不依赖 shell 执行权限，直接用 Python 启动

用法:
    python celery_launcher.py worker    # 启动 Celery Worker
    python celery_launcher.py beat      # 启动 Celery Beat (定时调度)
    python celery_launcher.py both      # 同时启动 Worker 和 Beat
"""
import sys
import subprocess
import os
import signal


CELERY_APP = "app.utils.celery_app.celery_app"


def launch_worker():
    cmd = [
        sys.executable, "-m", "celery",
        "-A", CELERY_APP,
        "worker",
        "--loglevel=info",
        "-Q", "celery",
        "-c", "2",
    ]
    print("=== 启动 Celery Worker ===")
    print(f"执行命令: {' '.join(cmd)}")
    print("Worker 日志等级: INFO")
    print("并发数: 2")
    print("队列: celery")
    print("=" * 40)
    try:
        return subprocess.run(cmd, env=os.environ.copy())
    except KeyboardInterrupt:
        print("\n收到终止信号，Worker 已关闭")
        return 0


def launch_beat():
    cmd = [
        sys.executable, "-m", "celery",
        "-A", CELERY_APP,
        "beat",
        "--loglevel=info",
    ]
    print("=== 启动 Celery Beat (定时任务调度器) ===")
    print(f"执行命令: {' '.join(cmd)}")
    print("调度间隔:")
    print("  - 门禁记录同步: 每 5 分钟")
    print("  - 护理终端同步: 每 10 分钟")
    print("  - 收费系统同步: 每 1 小时")
    print("  - 异常检测:     每 15 分钟")
    print("  - 缓存刷新:     每 30 分钟")
    print("=" * 40)
    try:
        return subprocess.run(cmd, env=os.environ.copy())
    except KeyboardInterrupt:
        print("\n收到终止信号，Beat 已关闭")
        return 0


def launch_both():
    import multiprocessing
    print("=== 同时启动 Worker + Beat (多进程模式) ===")

    p_beat = multiprocessing.Process(target=_run_beat_subprocess, name="CeleryBeat")
    p_worker = multiprocessing.Process(target=_run_worker_subprocess, name="CeleryWorker")

    p_beat.daemon = False
    p_worker.daemon = False

    p_beat.start()
    import time
    time.sleep(2)
    p_worker.start()

    print(f"Beat  PID: {p_beat.pid}")
    print(f"Worker PID: {p_worker.pid}")
    print("按 Ctrl+C 停止全部进程...")

    def _terminate_all(signum, frame):
        print("\n正在关闭所有进程...")
        for p in [p_worker, p_beat]:
            if p.is_alive():
                p.terminate()
                p.join(timeout=5)
        sys.exit(0)

    signal.signal(signal.SIGINT, _terminate_all)
    signal.signal(signal.SIGTERM, _terminate_all)

    try:
        while p_worker.is_alive() and p_beat.is_alive():
            time.sleep(1)
    finally:
        _terminate_all(None, None)


def _run_worker_subprocess():
    sys.argv = ["celery", "worker"]
    launch_worker()


def _run_beat_subprocess():
    sys.argv = ["celery", "beat"]
    launch_beat()


def print_usage():
    print("用法: python celery_launcher.py <命令>")
    print("")
    print("可用命令:")
    print("  worker    启动 Celery Worker")
    print("  beat      启动 Celery Beat (定时任务调度器)")
    print("  both      同时启动 Worker 和 Beat")
    print("")
    print("示例:")
    print("  python celery_launcher.py worker")
    print("  python celery_launcher.py beat")
    print("  python celery_launcher.py both")
    print("")
    print("注意: 确保 Redis 已启动，且 .env 已配置 REDIS_HOST")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "worker":
        sys.exit(launch_worker().returncode if launch_worker() else 0)
    elif command == "beat":
        sys.exit(launch_beat().returncode if launch_beat() else 0)
    elif command == "both":
        sys.exit(launch_both() or 0)
    elif command in ("-h", "--help", "help"):
        print_usage()
        sys.exit(0)
    else:
        print(f"错误: 未知命令 '{command}'")
        print("")
        print_usage()
        sys.exit(1)
