#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_PY="$ROOT_DIR/backend/venv/bin/python"

echo "Starting Smart Parking (backend + frontend)..."
echo "Using Python: $VENV_PY"

####################
# BACKEND
####################
echo "Starting backend..."
cd "$ROOT_DIR/backend/parking_system"

# Migrate & seed
"$VENV_PY" manage.py migrate
"$VENV_PY" manage.py seed_data || echo "seed_data failed (continuing)"

# Start long-running processes in background
"$VENV_PY" manage.py simulate_sensors &
SENSORS_PID=$!

"$VENV_PY" manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

####################
# FRONTEND
####################
echo "Starting frontend..."
cd "$ROOT_DIR/frontend"

[ -d node_modules ] || npm install
npm run dev &
FRONTEND_PID=$!

####################
# WAIT & TRAP
####################
echo "Backend PID: $BACKEND_PID"
echo "Sensors PID: $SENSORS_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop everything."

# Forward Ctrl+C / SIGTERM to all child processes
trap "echo 'Stopping all...'; kill $BACKEND_PID $SENSORS_PID $FRONTEND_PID; exit" SIGINT SIGTERM

wait

