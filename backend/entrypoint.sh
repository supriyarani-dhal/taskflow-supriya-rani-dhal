#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  sleep 1
done

echo "PostgreSQL is ready!"
echo "Running database migrations..."

npm run migrate:up

echo "Starting server..."
exec node dist/index.js
