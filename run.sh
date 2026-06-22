#!/bin/bash
cd "$(dirname "$0")"

echo "Checking database status..."
python3 -c "
import sys
sys.path.insert(0, '.')
from app.database import ensure_database_ready, DB_TYPE, register_models, Base

print(f'Database type: {DB_TYPE}')
model_count = register_models()
print(f'Registered models: {model_count} tables')
if not ensure_database_ready():
    print('❌ Database connection failed, please check if PostgreSQL service is running')
    sys.exit(1)
print('✅ Database ready')
"

if [ $? -ne 0 ]; then
    exit 1
fi

echo "Starting Dash server on http://localhost:8050..."
python3 app.py
