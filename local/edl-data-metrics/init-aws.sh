#!/usr/bin/env bash

echo running metrics startup
awslocal dynamodb create-table --cli-input-json file:///local/edl-data-metrics/tableDefinitions/metrics.json
awslocal dynamodb batch-write-item --request-items file:///local/edl-data-metrics/data/metrics.json

secret_string='{"username":"'"$COLLIBRA_DQ_USERNAME"'","password":"'"$COLLIBRA_DQ_PASSWORD"'"}'
awslocal secretsmanager create-secret --name 'AE/DQ-COLLIBRA-TOKEN-CREDS' --secret-string $secret_string
