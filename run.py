import os
from dashboard.app import app, server

if __name__ == "__main__":
    debug = os.getenv("DASH_DEBUG", "True").lower() == "true"
    port = int(os.getenv("DASH_PORT", "8050"))
    host = os.getenv("DASH_HOST", "0.0.0.0")
    app.run_server(debug=debug, host=host, port=port)
