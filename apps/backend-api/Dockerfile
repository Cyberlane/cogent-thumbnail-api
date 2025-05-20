ARG APP_VERSION=latest
ARG BUN_VERSION=1.1.26

# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:${BUN_VERSION} as base

ARG APP_VERSION
ARG BUN_VERSION

WORKDIR /usr/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base as dev
COPY . .
COPY --from=install /temp/dev/node_modules node_modules

# set the app version
ENV APP_VERSION=${APP_VERSION}

# copy node_modules and drizzle from temp directory
FROM base AS prerelease
COPY --from=dev /usr/app /usr/app

# copy production dependencies and source code into final image
FROM oven/bun:${BUN_VERSION}-distroless AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/app/src src
COPY --from=dev /usr/app/drizzle drizzle
COPY --from=dev /usr/app/tsconfig.json tsconfig.json

ARG APP_VERSION=latest

ENV NODE_ENV=production
ENV APP_VERSION=$APP_VERSION

# run the app
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]