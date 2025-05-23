# Cogent Thumbnail API

A simple API for generating and serving thumbnails.

## Description

This repository is my submission for a code assignment given to me (Justin Nel) by Cogent Labs.

## Features

- Generate thumbnails from images
- Serve thumbnails via HTTP endpoints
- Built with TypeScript and Bun
- Linting with Biome

# Table of Contents

- [Architecture](#architecture)
  - [API](#api)
    - [API Usage](#api-usage)
    - [Potential API Improvements](#potential-api-improvements)
  - [Worker](#worker)
    - [Potential Worker Improvements](#potential-worker-improvements)
- [Tech Components](#tech-components)
- [Tech Stack Choices](#tech-stack-choices)
- [Trade Offs](#trade-offs)
- [Getting Started](#getting-started)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration)
- [Usage](#usage)

## Architecture

Message based architecture mixed with eventual consistency and hypermedia were the concepts used within this project.

There are 2 systems ([API](#api) and [Worker](#worker)) which were developed and would need to be hosted/run, and there are a further 3 (Postgres, Redis, MinIO) other systems which are used as tools to assist this.

### API

For the API, I chose to make use of Hono, Zod, Drizzle and BullMQ as the primary drivers for this system.

The API is responsible for only 4 tasks:

- Trigger Thumnail Creation
  - Receive an image (HTTP)
  - Assign it a unique ID (saved in Postgres)
  - Upload that image to Object Storage (MinIO)
  - Publish a message that an image needs to be processed
- Get Job Status
  - Fetch a job record from the database by ID (Postgres)
  - Append relevant hypermedia metadata depending on the job status
- List All Jobs
  - Fetch all jobs that are in the database (Postgres)
  - Append relevant hypermedia metadata depending on the job status
- Download Thumbnail Image
  - Fetch data about the image from the database (Postgres)
  - Download the file from the Object Storage (MinIO)
  - Return the image

The only heavy lifting done by the API is to upload an image to Object Storage and to download an image from Object Storage.
All other heavy compute is done on the Worker process. 

#### API Usage

Since no UI was required for this, to both compliment documentation as well as to make it easier to use, I have added Swagger UI.
You can view it here: [http://localhost:8080/swagger](http://localhost:8080/swagger)

In the image below the highlighted points are as follows:

1. Trigger Thumbnail Creation (upload an image)
2. Get Job Status
3. List All Jobs
4. Download Thumbnail Image

![Swagger UI](/docs/images/swagger-ui.png)

When you expand the option to upload an image, you should an image similar to the one below. Simply click `Choose file` to select a file on your computer to upload, and then the big blue `Execute` button to start the process.

![Swagger Upload Image](/docs/images/swagger-upload.png)

Once the file is uploaded, you should get back a response similar to the image below. In the response data you will see the following data:

- ID, the unique ID for the job you started
- Status, the current status of the job, further details of status can be seen [here](#api-job-statuses)
- Actions, this is hypermedia, further information can be seen [here](#api-hypermedia)

![Swagger Upload Complete](/docs/images/swagger-upload-complete.png)

When you want to fetch the status of any job, you just need the Job's ID, provide it to the GET and you will see similar to the image below.

![Swagger Get By ID](/docs/images/swagger-get-by-id.png)

If for whatever reason, you have forgotten the ID of your job, you can fetch a list of all the uploaded jobs and that would look similar to the image below.

![Swagger Job List](/docs/images/swagger-job-list.png)

And finally, if your thumbnail is ready to be downloaded, you can either use the Hypermedia or you can use Swagger, provide the ID, you will have an image similar to the one below, and it might not seem obvious at first, but you will then need to click on the "Download file" as highlighted with the red arrow.

![Swagger Download](/docs/images/swagger-download.png)

#### API Job Statuses

The jobs have 4 different statuses.

- `uploaded`, the image has been uploaded but nothing has happened to it yet.
- `processing`, a worker has started to process the thumbnail.
- `success`, the thumbnail has been processed without any issues
- `error`, the thumbnail failed to process and something went wrong

#### API Hypermedia

Hypermedia is a complex subject of it's own, but the basic summary is that in an API response, you return some additional metadata which can provide further actions that can be made against the data. So for the subject of this project, we have 2 potential actions that can appear, and they are as follows:

- `View Details`, this tells you where to query to fetch details about the job and what the response type would be.
- `Download`, this tells you where to go to download the thumbnail, along with the response type (a file).

#### Potential API Improvements

Instead of returning the image directly from the API, a URL to the image served from a CDN (or Object Storage directly), could be provided. This would remove some additional strain on the API service.

### Worker

The worker is not accessible over HTTP, it sits hidden away, listening to messages from BullMQ, which tells it there are jobs to process.
The only data it receives in the job is the Database ID of the item, it will then query the database for further information (such as what dimensions to create the thumbnail), and the expected output file format.

The worker will then download the image from the Object Storage (MinIO), make use of the Image Library `Sharp`, upload the thumbnail to Object Storage and update the database upon completion of when any error occurs.

#### Potential Worker Improvements

The worker is handling communication with the Database, it could be argued that it should receive all information via the Message and send all responses back as a new Message and somebody else has the sole responsibility of the Database.

I also had to make use of a "full fat" Docker distro for the Worker instead of Distroless (more secure and smaller size), due to some requirements from the Sharp library. Given a bit more time, I could have potentially figured out how to make it work.

Depending on the load, you can either scale the worker up with more instances, or consider using another language that is more performant for image generation. Since everything is de-coupled via eventual conssitency and message brokers, you can mix and match the best technologies for each task.

### Third Party Systems

As already mentioned previously, some third party systems were included to make this possible, they are explained below.

#### Postgres

We needed a database to track everything, I saw no need for a NoSQL database, and I just like how easily you can scale up Postgres. I could have used SQLite for this task, but I wanted to consider the idea that it could potentially go to production, in which case, this is a battle tested tool.

#### Redis

BullMQ is a Message Broker library which makes use of Redis to handle all of it's data communication. Currently no other usage of Redis is being made.
I have used this in the past in production, it does work very well, however if you are expecting a lot more load, I would personally lean more towards something like RabbitMQ or similar.

#### Min IO

Instead of just mounting files on a disk, I wanted to pretend this was a real production system which had to scale. So I made use of MinIO, which is a free to use, S3 compatible Object Storage system.
I did not want to have pay for anything or do any complex key sharing for this task, so I used this as a quick solution. If this project were to go into production, you simply would need to swap the endpoints used for MinIO for AWS or similar S3 Object Storage, and it would just work, no code changes required.

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

### Drizzle (ORM)

Drizzle ORM was used in this project because it targets Postgres as it's primary target and other databases are simply "extra" as far as the documentation seems to be concerned. It is simple to use, the tooling for generating migration files, along with tracking and applying migrations are extremely simple, so I went with this.

The only thing I would have considered to do differently would have been to apply the database changes as part of a deployment stage, instead of part of the application code itself.

### Redis and BullMQ

I needed a simple Queue system, I have used BullMQ before and it works quite well. It is well documented, and Redis is just a good in memory key/value store, which pairs with BullMQ.

### Vitest

Over the years I have used a lot of different testing frameworks, at the end of the day, I care purely about performance, I want to fail fast so I can get back to writing code and fixing bugs or developing features. Vitest is a library I have been using for the past couple years and am comfortable with it, however there is no reason to not swap it out for Jest or some other framework if it will bring more value or adoptability.

## Trade-Offs

### What to do differently?

I needed to share some files between the Worker and the API, and usually this would be the ideal case for creating a shared package. Given this is a mono repo, that would mean something like Turbo Repo and Workspaces would be the ideal solution, however since I am not running any build steps and only running the code directly, purely to make everything simpler, and I am aware who the audience of this project is, I decided to just copy/paste the common files between the two projects. There is not much to them, but this technical debt can cause problems further down the line if not solved.

I feel abstracting the common files into a package shared within the mono repo would have been a good way to solve this, but would have complicated the build steps, so I chose the quick and simple solution for now.

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

## Getting Started

### Prerequisites

- Docker
- Docker Compose

If you make use of the included Dev Container, you will not need to install Node/Bun/etc on your host machine.

### Setup

Before running anything, copy the `.env.example` to `.env`.

#### Database

If you already have a Postgres Database you prefer to use, then change the `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD`, otherwise, just leave the existing values.

#### S3 Object Storage

If you already have some S3 Object storage, please update the `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` and `S3_BUCKET` accordingly.

A script has been added to automatically configure access key, secret and a bucket for MinIO to make development faster (see the [init-minio.sh](/init-minio.sh)).

However, if you want to skip using that and do everything manually, then please follow the steps in [`docs/minio-setup.md`](docs/minio-setup.md) to configure MinIO.

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

## Testing

Currently there are only Integration and Unit Tests in place, a number more could be added, however I felt the ones I submitted offer a rough understanding of my thought process.

Please note that the integration tests require the Database to be up and running. If it is not already, then run `docker compose db up -d`

### Unit Tests

The unit tests are primarily in place to test business logic, checking what data is being sent here, when are errors thrown, etc.

To run these tests, you will need to navigate to each application and run `bun run test`.

For API
```sh
cd apps/backend-api
bun run test
```

For Worker
```sh
cd apps/backend-worker
bun run test
```

### Integration

These tests are purely to make sure the connection to the third party systems (such as a database) have been setup correctly. So it will attempt to connect to the third party system and interact with it. These types of tests can range from purely connection if the connection exists, all the way down to checking if the correct permissions are in place.

I have only added the integration tests on the Worker project, and only for Postgres - however, both the MinIO and Redis connections would potentially also need integration tests since they are third party systems that need to work for this system to work at all.

To run the integration tests, you need to run `bun run test:integration` within the worker folder.

```sh
cd apps/backend-worker
bun run test:integration
```

## License

MIT
