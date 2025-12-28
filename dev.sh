#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/backend/venv"
VENV_PY="$VENV_DIR/bin/python"

echo "Starting Smart Parking (backend + frontend)..."

####################
# SETUP VENV
####################
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

echo "Installing Python dependencies..."
"$VENV_PY" -m pip install --upgrade pip -q
"$VENV_PY" -m pip install -r "$ROOT_DIR/backend/requirements.txt" -q

echo "Using Python: $VENV_PY"
echo "Using SQLite for local development"

####################
# BACKEND
####################
echo "Starting backend..."
cd "$ROOT_DIR/backend/parking_system"

export USE_SQLITE=true

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
echo ""
echo "✅ Smart Parking is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo ""
echo "Backend PID:  $BACKEND_PID"
echo "Sensors PID:  $SENSORS_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop everything."

trap "echo 'Stopping all...'; kill $BACKEND_PID $SENSORS_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait