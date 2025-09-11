#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Navigate to the frontend directory
cd frontend

# Install dependencies and build the frontend
echo "Building frontend..."
bun install
bun run build

# Navigate back to the root directory
cd ..

# Let Encore build the Go application
echo "Building Go backend..."
go build -o app main.go