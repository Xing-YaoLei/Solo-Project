import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dashboard.app import app
from dashboard import layout

if __name__ == "__main__":
    print("🦷 口腔诊所洁牙预约风险监测看板启动中...")
    print("访问地址: http://localhost:8050")
    print("按 Ctrl+C 停止服务")
    app.run(
        host="0.0.0.0",
        port=8050,
        debug=False
    )
