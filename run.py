import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

if __name__ == "__main__":
    app.run_server(
        host="0.0.0.0",
        port=8050,
        debug=False
    )
