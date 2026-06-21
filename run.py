import os
import sys
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

os.environ.setdefault('FLASK_ENV', 'development')

from app.dashboard import create_app

server = create_app(os.environ.get('FLASK_ENV', 'default'))

if __name__ == '__main__':
    debug = False
    port = int(os.environ.get('PORT', 8050))
    print("=" * 60)
    print("  法律服务案件委托风险监测平台")
    print("  Legal Case Risk Monitor Dashboard")
    print("=" * 60)
    print(f"  访问地址: http://localhost:{port}")
    print("  登录账号: admin/admin123  |  partner/partner123")
    print("           lawyer/lawyer123  |  auditor/auditor123")
    print("  调度服务: celery -A celery_app worker -B -l INFO")
    print("=" * 60)

    dash_app = server.config.get('DASH_APP')
    if dash_app:
        dash_app.run_server(
            debug=debug,
            host='0.0.0.0',
            port=port,
            dev_tools_hot_reload=debug,
            dev_tools_props_check=False
        )
    else:
        server.run(debug=debug, host='0.0.0.0', port=port)
