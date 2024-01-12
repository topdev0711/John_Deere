#!/usr/bin/env bash
rm -rf dist
npm ci
npm run build
docker compose build --no-cache && docker compose up --remove-orphans
