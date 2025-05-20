#!/bin/sh

# Wait for MinIO to start
sleep 10

# Create the bucket if it doesn't exist
BUCKET_NAME=${MINIO_BUCKET}

if ! mc ls myminio/${BUCKET_NAME}; then
  mc mb myminio/${BUCKET_NAME}
  echo "Bucket '${BUCKET_NAME}' created."
else
  echo "Bucket '${BUCKET_NAME}' already exists."
fi

# Keep the container running
exec "$@"