#!/usr/bin/env bash

if [[ $# -ge 4 ]]; then
    export CDK_DEPLOY_ACCOUNT=$1
    export CDK_DEPLOY_REGION=$2
    export BUCKET_NAME=$3
    export DOMAIN_NAME=$4
    shift; shift; shift; shift
    zip -r www.zip ../www
    npx cdk bootstrap
    npx cdk deploy "$@"
    rm -r www.zip
    exit $?
else
    echo 1>&2 "Provide account and region as first two args."
    echo 1>&2 "Provide bucket and domain name as third and fourth args, respectively."
    echo 1>&2 "Additional args are passed through to cdk deploy."
    exit 1
fi