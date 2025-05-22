ARG APP_VERSION=latest
ARG BUN_VERSION=1.2.14

# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:${BUN_VERSION} AS base

ARG APP_VERSION
ARG BUN_VERSION

WORKDIR /usr/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
WORKDIR /usr/app/prod
COPY package.json bun.lock ./
# install with --production (exclude devDependencies)
RUN bun install --frozen-lockfile --production

# copy production dependencies and source code into final image
FROM oven/bun:distroless AS release
WORKDIR /usr/app
COPY tsconfig.base.json tsconfig.json ./
COPY src ./src
COPY --from=install /usr/app/prod/node_modules node_modules

ARG APP_VERSION=latest

ENV NODE_ENV=production
ENV APP_VERSION=$APP_VERSION

# run the app
EXPOSE 3000/tcp
CMD [ "/usr/app/src/index.ts" ]