#!/bin/bash

echo "🚀 Starting Smart Parking..."

# Start database first
echo "📦 Starting database..."
docker compose up -d db

# Wait for database to be healthy
echo "⏳ Waiting for database..."
sleep 5

# Run migrations
echo "🔄 Running migrations..."
docker compose run --rm backend python manage.py migrate

# Seed the database
echo "🌱 Seeding database..."
docker compose run --rm backend python manage.py seed_data

# Start all services
echo "🎯 Starting all services..."
docker compose up -d

echo ""
echo "✅ Smart Parking is ready!"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:8000"
