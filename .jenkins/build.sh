#!/bin/bash
set -e

echo "=== Building simple-md-viewer ==="

# Install dependencies
npm ci || npm install

# Build Docker image (includes web build)
docker build -t simple-md-viewer .

echo "Build successful!"

# Stop and remove existing container (with force and wait)
echo "=== Stopping existing container ==="

echo "Build completed successfully!"
