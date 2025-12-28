#!/bin/bash
echo "🚀 Starting Smart Parking..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "🐳 Docker is not running. Starting Docker Desktop..."
    open /Applications/Docker.app
    
    # Wait for Docker to start
    echo "⏳ Waiting for Docker to start..."
    while ! docker info > /dev/null 2>&1; do
        sleep 2
    done
    echo "✅ Docker is running"
fi

# Start database first
echo "📦 Starting database..."
docker compose up -d db

# Wait for database to be healthy
echo "⏳ Waiting for database..."
until docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
done
echo "✅ Database is ready"

# Run migrations
echo "🔄 Running migrations..."
docker compose run --rm backend python manage.py migrate

# Seed the database
echo "🌱 Seeding database..."
docker compose run --rm backend python manage.py seed_data

# Start all services
echo "🎯 Starting all services..."
docker compose up -d

# Start sensor simulation in the background
echo "📡 Starting sensor simulation..."
docker compose exec -T -d backend python manage.py simulate_sensors

echo ""
echo "✅ Smart Parking is ready!"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:8000"
echo "   📡 Sensor simulation running in background"