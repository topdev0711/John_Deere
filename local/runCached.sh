#!/usr/bin/env bash

npm i
npm run build
docker compose up --remove-orphans
