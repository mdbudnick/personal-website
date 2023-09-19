#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found."
  exit 1
fi

# Load environment variables from .env file
set -a
source .env
set +a

# Check if required environment variables are set
if [ -z "$CDK_DEPLOY_ACCOUNT" ] || [ -z "$CDK_DEPLOY_REGION" ] || [ -z "$DOMAIN_NAME" ] || [ -z "$BUCKET_NAME" ]; then
  echo "Error: Required environment variables not set in .env file."
  exit 1
fi

# Compile Typescript
npm run build

# Continue with CDK deployment
npx cdk bootstrap
npx cdk deploy "$@"