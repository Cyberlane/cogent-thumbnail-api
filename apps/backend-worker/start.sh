#!/bin/bash
set -e

echo "Running migrations..."
bun run db:apply & PID=$!
wait $PID

echo "Migrations completed."
echo "Starting the backend worker..."
bun start & PID=$!

wait $PID