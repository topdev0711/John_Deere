#!/usr/bin/env bash

#docker compose -f local/metrics/docker-compose.yaml up

npm ci
npm run build
docker compose build --no-cache && docker compose up --remove-orphans
