#!/bin/bash

awslocal iam create-role --role-name my-role --assume-role-policy-document file:///docker-entrypoint-initaws.d/assume-role.json
awslocal lambda create-function \
  --function-name jd-catalog-to-edl-catalog-adapter-lambda \
  --runtime nodejs14.x \
  --zip-file fileb:///docker-entrypoint-initaws.d/lambda.zip \
  --handler lib/services/edl-handler-service.handle \
  --role arn:aws:iam::000000000000:role/my-role \
  --timeout 60 \
  --environment "Variables={environment=local,region=us-east-1,logLevel=error,multi_perm_enabled=true,EDL_OKTA_SECRET=${EDL_OKTA_SECRET}}"
awslocal sqs create-queue \
  --queue-name jd-catalog-notification-dlq
awslocal sqs create-queue \
  --queue-name jd-catalog-notification-queue \
  --attributes file:///docker-entrypoint-initaws.d/dlq-attributes.json
awslocal lambda create-event-source-mapping \
  --event-source-arn arn:aws:sqs:us-east-1:000000000000:jd-catalog-notification-queue \
  --function-name jd-catalog-to-edl-catalog-adapter-lambda
awslocal s3api create-bucket --bucket test-messages
