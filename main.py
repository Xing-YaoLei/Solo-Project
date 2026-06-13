from app.dashboard import app

if __name__ == "__main__":
    from db.connection import init_db
    init_db()
    app.run(debug=True, host="0.0.0.0", port=8050)
