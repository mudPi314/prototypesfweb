#!/bin/bash

# Production deployment script for the backend server

# Exit on error
set -e

# Load environment variables if .env file exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  export $(grep -v '^#' .env | xargs)
fi

# Set production environment
export NODE_ENV=production

# Set default port if not specified
if [ -z "$PORT" ]; then
  export PORT=3000
  echo "PORT not specified, defaulting to 3000"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --production
else
  echo "Dependencies already installed"
fi

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
  echo "Python virtual environment not found. Please set up the Python environment first."
  exit 1
fi

# Start the server
echo "Starting server in production mode on port $PORT..."
node server.js 