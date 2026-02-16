#!/bin/bash

# Script to start MongoDB Docker container for laundry backend

DOCKER_DIR="/home/friday20/Desktop/Docker_db"
PROJECT_DIR="/home/friday20/Desktop/backend-laundry"

echo "🚀 Starting MongoDB Docker container..."
cd "$DOCKER_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start MongoDB
docker-compose up -d

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 5

# Check if container is running
if docker ps | grep -q mongodb-laundry; then
    echo "✅ MongoDB container is running!"
    echo ""
    echo "Connection details:"
    echo "  Host: localhost"
    echo "  Port: 27017"
    echo "  Database: laundry_backend"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo ""
    echo "To view logs: docker-compose -f $DOCKER_DIR/docker-compose.yml logs -f"
    echo "To stop: docker-compose -f $DOCKER_DIR/docker-compose.yml down"
else
    echo "❌ Failed to start MongoDB container"
    echo "Check logs with: docker-compose -f $DOCKER_DIR/docker-compose.yml logs"
    exit 1
fi

