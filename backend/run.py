import uvicorn
import os

if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
