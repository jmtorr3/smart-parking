#!/usr/bin/env bash

set -e

echo "Starting Smart Parking (backend + frontend)..."

# --- BACKEND ---
echo "Starting backend..."
cd backend
source venv/bin/activate
cd parking_system
python manage.py migrate
python manage.py runserver 0.0.0.0:8000 &

BACKEND_PID=$!

# --- FRONTEND ---
echo "Starting frontend..."
cd ..
cd ../frontend
npm install
npm start &

FRONTEND_PID=$!

# --- WAIT ---
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both."

wait

