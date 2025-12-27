#!/usr/bin/env bash

set -e

echo "Starting Smart Parking (backend + frontend)..."

# --- BACKEND ---
echo "Starting backend..."
cd backend
source venv/bin/activate
cd parking_system

# Migrate & seed
python manage.py migrate
python manage.py seed_data || echo "seed_data failed (continuing)"

# Start simulate_sensors in background
python manage.py simulate_sensors &
SENSORS_PID=$!

# Start Django server in background
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# --- FRONTEND ---
echo "Starting frontend..."
cd ../../frontend
[ -d node_modules ] || npm install
npm start &
FRONTEND_PID=$!

# --- WAIT ---
echo "Backend PID: $BACKEND_PID"
echo "Sensors PID: $SENSORS_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop all processes."

wait

