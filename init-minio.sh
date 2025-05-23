#!/bin/sh

mc config host add myminio http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD;
mc admin user add myminio $S3_ACCESS_KEY $S3_SECRET_KEY;
mc admin policy attach myinio readwrite --user $S3_ACCESS_KEY;
mc config host add $S3_ACCESS_KEY http://minio:9000 $S3_ACCESS_KEY $S3_SECRET_KEY;
mc mb myminio/$S3_BUCKET;