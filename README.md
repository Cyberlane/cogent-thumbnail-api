# Cogent Thumbnail API

A simple API for generating and serving thumbnails.

## Features

- Generate thumbnails from images
- Serve thumbnails via HTTP endpoints
- Built with TypeScript and Bun
- Linting with Biome

## Getting Started

### Prerequisites

- Bun (pre-installed in this dev container)
- Git (pre-installed)

### Setup

Before running anything, copy the `.env.example` to `.env`.

#### Database

If you already have a Postgres Database you prefer to use, then change the `DB_HOST`, `DB_NAME`, `DB_USER` and `DB_PASSWORD`, otherwise, just leave the existing values.

#### S3 Object Storage

If you already have some S3 Object storage, please update the `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` and `S3_BUCKET` accordingly.

If you do not have that, then please follow the steps in [`doc/minio-setup.md`](doc/minio-setup.md) to configure MinIO.

### Development Environment

After completing the MinIO setup, you can start the project using either:

- The dev container (recommended)
- `docker-compose` in the root directory

### Root Directory

If you already have a database and S3 storage, you can provide their values in the `.env` file in the root directory.  
If you need a database and S3 storage, run the following command in the root directory to start the required services with Docker Compose:

```sh
docker-compose -f .devcontainer/docker-compose.common.yml -f docker-compose.yml up
```

## Usage

Send a request to the API endpoint to generate or retrieve a thumbnail.  
Refer to the API documentation for details.

## Development

This project is set up for development in a dev container running Debian GNU/Linux 12 (bookworm).

## License

MIT
