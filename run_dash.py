#!/usr/bin/env python
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.dash_app.app import app, config


if __name__ == '__main__':
    print('=' * 60)
    print('长租公寓房源上架漏斗报表系统')
    print('=' * 60)
    print(f'启动地址: http://0.0.0.0:8050')
    print(f'调试模式: {config.DEBUG}')
    print(f'数据库: {config.DATABASE_URL.split("@")[-1] if "@" in config.DATABASE_URL else config.DATABASE_URL}')
    print()
    print('默认登录账号:')
    print('  管理层: admin / admin123')
    print('  一线人员: frontline / front123')
    print('=' * 60)
    app.run(debug=config.DEBUG, host='0.0.0.0', port=8050)
