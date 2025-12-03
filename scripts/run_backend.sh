#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_DIR="$BACKEND_DIR/.venv"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but not found in PATH." >&2
  exit 1
fi

# Check if Docker is available and docker-compose.yml exists
if command -v docker >/dev/null 2>&1 && [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
  cd "$PROJECT_ROOT"
  
  # Detect docker-compose command (supports both 'docker-compose' and 'docker compose')
  if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
  elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
  else
    echo "Warning: docker-compose not found. Skipping Docker setup."
    DOCKER_COMPOSE_CMD=""
  fi
  
  if [ -n "$DOCKER_COMPOSE_CMD" ]; then
    echo "Starting PostgreSQL container..."
    $DOCKER_COMPOSE_CMD up -d postgres
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    timeout=30
    counter=0
    while ! $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U taskuser -d task_management >/dev/null 2>&1; do
      if [ $counter -ge $timeout ]; then
        echo "Timeout waiting for PostgreSQL to start" >&2
        exit 1
      fi
      sleep 1
      counter=$((counter + 1))
    done
    echo "PostgreSQL is ready!"
  fi
elif [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
  echo "Warning: Docker not found. Make sure PostgreSQL is running or remove DB_* variables from .env to use SQLite."
fi

cd "$BACKEND_DIR"

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment in $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Applying database migrations..."
python manage.py migrate

echo "Starting Django development server..."
python manage.py runserver

