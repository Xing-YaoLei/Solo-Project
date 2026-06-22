from app.dash_app.app import app, server
from app.database import init_db, Base

init_db()

if __name__ == "__main__":
    from app.config import Config
    app.run_server(debug=Config.DASH_DEBUG, host="0.0.0.0", port=8050)
