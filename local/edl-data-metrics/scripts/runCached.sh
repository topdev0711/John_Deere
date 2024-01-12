#!/usr/bin/env bash
rm -rf dist
npm i
npm run build
docker compose up --remove-orphans
