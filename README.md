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

If you already have a Postgres Database you prefer to use, then change the `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD`, otherwise, just leave the existing values.

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

For up to date and detailed documentation on the API, please see the Swagger documentation at [http://localhost:8080](http://localhost:8080)

## Tech Components

This is relatively simple:

Postgres for the Database.
Redis for handling a simple message queue.
Min IO for a local S3 Object Storage.
apps/backend-api - the API project
apps/backend-worker - the worker project (what processes the thumbnail images)

## Tech Stack Choices

Below you can read about the tech stack used within this project and the reasons for those choices.

### Dev Containers

I have these in as many projects as I can, so I can safely run a project with the current runtimes instead of having my host machine needing to install runtimes to be able to have intellisense and other functionality.

Personal oppinion, but if you are already making use of Docker for your project, it's not much extra effort to add this which brings a lot of extra value.

### Bun (Runtime)

Since the project will be running TypeScript, instead of having to do an extra step to compile the code, we can just make use of `bun` to run the code. It is highly performant, already passed v1 and considered stable.

### Postgres (Database)

This is just my goto Database choice when I want a SQL based database, it is extremely powerful, performant and scales extremely well. I used to previously used MariaDb/MySQL as my goto, but Postgres eventually won me over.

I do not see the need to use a NoSQL database for this project, so stuck with SQL and will have a simple ORM.

### Min IO (S3 Object Storage)

For local development purposes, this S3 compatible docker image is extremely useful. Easy to setup, free to use and if you ever want to swap over to real S3 storage, you just change the endpoint and API keys.

### Biome (Linting)

Biome is a lot faster than ESLint, stable and extremely simple configuration.

### Hono (Web Framework)

Fast, lightweight and given that it is named after the Japanese word for "Fire", it felt kind of fitting to use for a Japanese project.

### Zod (Schema Validation)

TypeBox is a lot faster, but I have used Zod a lot more and am more comfortable with it. Usually I pick it because I make good use of transforms which are not supported in TypeBox, so in reality, this could be swapped for TypeBox for performance since this project makes no use of Zod specific features. I am just more comfortable with it, so chose it.

### Redis and BullMQ

I needed a simple Queue system, I have used BullMQ before and it works quite well. It is well documented, and Redis is just a good in memory key/value store, which pairs with BullMQ.


## Trade-Offs

### What to do differently?

I needed to share some files between the Worker and the API, and usually this would be the ideal case for creating a shared package. Given this is a mono repo, that would mean something like Turbo Repo and Workspaces would be the ideal solution, however since I am not running any build steps and only running the code directly, purely to make everything simpler, and I am aware who the audience of this project is, I decided to just add a symlink for the common folder.

However, if this was to be used in a more professional manner, I would add build steps, turbo repo, workspaces, make adjustments to each Dockerfile and copy the correct files over, instead of taking a shortcut and using a symlink.

### What would be needed to change for Production?

Instead of using a self hosted Postgres Database, make use of a managed database for easier scaling.

Swap the environment variables of the S3 Object Storage for a real S3 Storage (AWS, BunnyCDN, or similar), the Min IO package was only added to ease local testing and development. Although I am quite certain the image would perform very well in production, by using that image you have to manage and maintain it - whilst using a real service, that's somebody else's concern that you pay for.

Depending on how much traffic is going to go through this, you could either swap Redis for a managed instance of Redis (not extremely high volume). However, if very high traffic is expected, I would feel more comfortable swapping out BullMQ and Redis for a managed message queue, and updating the code to make use of it accordingly. There are a number of options available depending on which cloud provider you make use of, but they all work relatively similarly and for this use case, any would work just fine.

### Scaling Up/Down

Once again, depending on the load in production, there are a few other considerations, depending on where the bottleneck might be.

Q: Are the images taking too long to process?

A: If the actual image processing is the slow part, perhaps consider rewriting the worker in another language that is more performant for the job it has been given. However, if the issue is purely down to the sheer number of requestse coming through, add some additional worker instances to handle the same job. This could then be scaled down again when there is less load.

Q: Are too many requests coming in for the API to handle (eg, network bandwidth is maxed out)?

A: Since we are already using a queue to move the slow running code to another service, the only thing we can do here is look at scaling up the API horizontally (more instances), and have the Cloud provider's load balancer distribute the traffic. When it calms down, it can reduce the number of active instances.

### Monitoring

Sometimes a Cloud Provider can offer a lot of useful tools for this out of the box, however from personal experience without the cloud, some of my favourites for this would be a mixture of `Prometheus` and `Grafana`. You can grab a lot of metrics from running docker images with Prometheus and then pipe that data into Grafana, and have some live reports of what is going on. When you have this in place, you can expose additional information from within your Docker image out towards Prometheus, so Grafana can show more than just memory usage, network load, etc - you could expose information like average time to send data to S3 storage (so you know if there's an issue there), or anything that it makes calls to such as database queries.

For the Workers you can do the same and expose information like average number of thumbnails processed per minute, and Grafana could let you see that data on a Service level or down to an Instance level, so you can see if perhaps an instance has somehow ended up stuck processing an extremely large file (or something else has gone wrong).

The possibilities are endless with the data you can expose, you just need to understand where could anything go wrong. You might not even get all the answers at the beginning, you might find the issue is in a very unknown place, but by having these metrics in place, you can at least begin to isolate where a problem lies.

Depending on your setup, it would be quite readonable to also setup some alerts when certain systems hit certain thresholds - for example, if too many requests keep failing, or if some services constantly crash and cannot recover (maybe bad data got into the system somehow, maybe a network outage, maybe a database problem, etc) - then you might want it to notify somebody via SMS, MS Teams, or some other system.

### Managing Services

The most common setup would be k8s (Kubernetes), it has built in monitoring and scaling with load balancing - you just give it the rules you want it to run with and it will just work.

However if you do not have that in place, you could use something simpler like Docker Swarm. K8s is the better choice overall (in my humble opinion), however Docker Swarm is a lower barrier of entry with less to understand when setting it up.

## License

MIT
