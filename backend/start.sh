#!/bin/bash
cd "$(dirname "$0")"
echo "Starting FastAPI server on port 8000..."
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
