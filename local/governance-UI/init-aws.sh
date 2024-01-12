#!/usr/bin/env bash

awslocal dynamodb create-table --cli-input-json file:///local/governance-UI/tableDefinitions/announcements.json
awslocal dynamodb batch-write-item --request-items file:///local/governance-UI/data/announcements.json

awslocal dynamodb create-table --cli-input-json file:///local/governance-UI/tableDefinitions/discoveredSchemas.json
awslocal dynamodb batch-write-item --request-items file:///local/governance-UI/data/discoveredSchemas.json

awslocal dynamodb create-table --cli-input-json file:///local/governance-UI/tableDefinitions/metrics.json
awslocal dynamodb batch-write-item --request-items file:///local/governance-UI/data/metrics.json

awslocal dynamodb create-table --cli-input-json file:///local/governance-UI/tableDefinitions/remediations.json
awslocal dynamodb batch-write-item --request-items file:///local/governance-UI/data/remediations.json

awslocal dynamodb create-table --cli-input-json file:///local/governance-UI/tableDefinitions/applications.json
awslocal dynamodb batch-write-item --request-items file:///local/governance-UI/data/applications.json

awslocal dynamodb create-table --cli-input-json file:///local/governance-UI/tableDefinitions/tables.json
awslocal dynamodb batch-write-item --request-items file:///local/governance-UI/data/tables.json

awslocal dynamodb create-table --cli-input-json file:///local/governance-UI/tableDefinitions/views.json
awslocal dynamodb batch-write-item --request-items file:///local/governance-UI/data/views.json

awslocal s3api create-bucket --bucket jd-data-catalog-schemas-devl
awslocal sns create-topic --name JDDataCatalogNotification

awslocal s3 sync /usr/test-data/schemas s3://jd-data-catalog-schemas-devl

awslocal s3api create-bucket --bucket jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3
awslocal s3 sync /usr/test-data/s3/marvel s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3

awslocal s3api create-bucket --bucket jd-us01-edl-devl-raw-c83faf53069a0f41ab2e25d47dcdf93a
awslocal s3 sync /usr/test-data/s3/files s3://jd-us01-edl-devl-raw-c83faf53069a0f41ab2e25d47dcdf93a

awslocal s3api create-bucket --bucket jd-data-catalog-attachment-devl
awslocal s3 sync /usr/test-data/s3/attachments s3://jd-data-catalog-attachment-devl

awslocal s3api create-bucket --bucket jd-data-catalog-static-devl
awslocal s3 sync /usr/test-data/s3/metadata s3://jd-data-catalog-static-devl
awslocal s3 sync /usr/test-data/s3/types s3://jd-data-catalog-static-devl

awslocal iam create-role --role-name my-role --assume-role-policy-document file:///local/governance-UI/data/assume-role.json
awslocal lambda create-function \
  --function-name jd-catalog-to-edl-catalog-adapter-lambda \
  --runtime nodejs14.x \
  --zip-file fileb:///local/governance-UI/data/lambda.zip \
  --handler lib/services/edl-handler-service.handle \
  --role arn:aws:iam::000000000000:role/my-role \
  --timeout 60 \
  --environment "Variables={environment=local,region=us-east-1,logLevel=error,multi_perm_enabled=true,EDL_OKTA_SECRET=${EDL_OKTA_SECRET}}"
awslocal sqs create-queue --queue-name jd-catalog-notification-dlq
awslocal sqs create-queue --queue-name jd-catalog-notification-queue --attributes file:///local/governance-UI/data/dlq-attributes.json
awslocal lambda create-event-source-mapping \
  --event-source-arn arn:aws:sqs:us-east-1:000000000000:jd-catalog-notification-queue \
  --function-name jd-catalog-to-edl-catalog-adapter-lambda
awslocal s3api create-bucket --bucket test-messages

awslocal sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:000000000000:JDDataCatalogNotification \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:000000000000:jd-catalog-notification-queue \
  --attributes "RawMessageDelivery=true"
