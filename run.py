import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.dashboard.app import app
from app.dashboard.layouts import create_layout
from app.dashboard.callbacks import register_callbacks

app.layout = create_layout()
register_callbacks(app)

if __name__ == "__main__":
    app.run_server(debug=False, host="0.0.0.0", port=8050)
