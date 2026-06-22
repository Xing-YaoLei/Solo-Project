#!/bin/bash
cd "$(dirname "$0")"

if [ ! -f "audit_compliance.db" ]; then
    echo "Initializing database..."
    python3 -c "
import sys
sys.path.insert(0, '.')
from utils.init_data import initialize_all
initialize_all()
"
fi

echo "Starting Dash server on http://localhost:8050..."
python3 app.py
