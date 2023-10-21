"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyWebsiteAppStack = void 0;
const acm = require("aws-cdk-lib/aws-certificatemanager");
const cdk = require("aws-cdk-lib");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const lambda = require("aws-cdk-lib/aws-lambda");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const route53 = require("aws-cdk-lib/aws-route53");
const s3 = require("aws-cdk-lib/aws-s3");
const targets = require("aws-cdk-lib/aws-route53-targets");
class MyWebsiteAppStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        if (!props || !props.domainName || props.domainName == "") {
            throw new Error("The domainName property is not defined.");
        }
        const domainName = props.domainName;
        if (!props || !props.bucketName || props.bucketName == "") {
            throw new Error("The bucketName property is not defined.");
        }
        const bucketName = props.bucketName;
        const bucket = new s3.Bucket(this, "WebsiteBucket", {
            bucketName,
            removalPolicy: props.environment != "production"
                ? cdk.RemovalPolicy.DESTROY
                : cdk.RemovalPolicy.RETAIN,
            autoDeleteObjects: props.environment != "production",
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
        });
        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, "OriginAccessIdentity");
        bucket.grantRead(originAccessIdentity);
        const blogTable = this.createDynamoDbTable(props.environment);
        const readBlogFunction = this.createReadLambda();
        const readFunctionUrl = new lambda.FunctionUrl(this, "Read Function URL", {
            function: readBlogFunction,
            authType: lambda.FunctionUrlAuthType.NONE,
            cors: { allowedOrigins: ["*"] },
        }).url;
        const createBlogFunction = this.createUpsertLambda();
        const createFunctionUrl = new lambda.FunctionUrl(this, "Create Function URL", {
            function: createBlogFunction,
            authType: lambda.FunctionUrlAuthType.AWS_IAM,
            cors: { allowedOrigins: ["*"] },
        }).url;
        blogTable.grantReadData(readBlogFunction);
        blogTable.grantReadWriteData(createBlogFunction);
        // We need to create this Zone beforehand because the domain name is not managed by AWS
        const zone = props.environment == "test"
            ? new route53.HostedZone(this, "TestZone", { zoneName: "testing" })
            : route53.HostedZone.fromLookup(this, "HostedZone", {
                domainName,
            });
        const certificate = new acm.Certificate(this, "SiteCertificate", {
            domainName,
            subjectAlternativeNames: [`*.${domainName}`],
            validation: {
                method: acm.ValidationMethod.DNS,
                props: { hostedZone: zone },
            },
        });
        const responseHeaderPolicy = this.createCFResponseHeadersPolicy();
        const distribution = this.createDistribution(certificate, domainName, bucket, originAccessIdentity, responseHeaderPolicy, readFunctionUrl, createFunctionUrl);
        // Create a new CNAME record for "www." + domainName pointing to the new distribution
        new route53.CnameRecord(this, "CnameRecord", {
            zone,
            recordName: `www.${domainName}`,
            domainName: distribution.domainName,
            ttl: cdk.Duration.minutes(5),
            deleteExisting: true,
        });
        new route53.ARecord(this, "Alias ARecord", {
            zone,
            recordName: domainName,
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
            ttl: cdk.Duration.minutes(5),
            deleteExisting: true,
        });
        new cdk.CfnOutput(this, "Domain", { value: `https://www.${domainName}` });
        new cdk.CfnOutput(this, "Bucket name", { value: bucketName });
        new cdk.CfnOutput(this, "CloudFrontUrl", {
            value: distribution.distributionDomainName,
        });
        new cdk.CfnOutput(this, "Read Lambda URL", { value: readFunctionUrl });
        new cdk.CfnOutput(this, "Create Lambda URL", { value: createFunctionUrl });
    }
    createDynamoDbTable(environment) {
        // Only the production table is stable
        let table;
        if (environment == "production") {
            table = dynamodb.Table.fromTableName(this, "BlogPostsTable", "BlogPosts");
        }
        table ?? (table = new dynamodb.Table(this, "BlogPosts", {
            tableName: "BlogPosts-" + environment,
            partitionKey: { name: "postId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "created", type: dynamodb.AttributeType.NUMBER },
            removalPolicy: environment == "production"
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        }));
        return table;
    }
    createReadLambda() {
        return new lambda.Function(this, "ReadBlogFunction", {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: "read.handler",
            code: lambda.Code.fromAsset("lambda"),
        });
    }
    createUpsertLambda() {
        return new lambda.Function(this, "CreateBlogFunction", {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: "create.handler",
            code: lambda.Code.fromAsset("lambda"),
        });
    }
    createCFResponseHeadersPolicy() {
        return new cloudfront.ResponseHeadersPolicy(this, "SecurityHeadersResponseHeaderPolicy", {
            comment: "Security headers response header policy",
            securityHeadersBehavior: {
                strictTransportSecurity: {
                    override: true,
                    accessControlMaxAge: cdk.Duration.days(2 * 365),
                    includeSubdomains: true,
                    preload: true,
                },
                contentTypeOptions: {
                    override: true,
                },
                referrerPolicy: {
                    override: true,
                    referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                },
                xssProtection: {
                    override: true,
                    protection: true,
                    modeBlock: true,
                },
                frameOptions: {
                    override: true,
                    frameOption: cloudfront.HeadersFrameOption.DENY,
                },
            },
        });
    }
    createDistribution(certificate, domainName, bucket, originAccessIdentity, headersPolicy, readFunctionUrl, createFunctionUrl) {
        return new cloudfront.Distribution(this, "CloudFrontDistribution", {
            certificate,
            domainNames: [domainName, `www.${domainName}`],
            sslSupportMethod: cloudfront.SSLMethod.SNI,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2018,
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 403,
                    responsePagePath: "/index.html",
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 404,
                    responsePagePath: "/404.html",
                },
            ],
            defaultRootObject: "index.html",
            defaultBehavior: {
                origin: new cdk.aws_cloudfront_origins.S3Origin(bucket, {
                    originAccessIdentity,
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                responseHeadersPolicy: headersPolicy,
            },
            additionalBehaviors: {
                "/post": {
                    origin: new origins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split("/", createFunctionUrl))),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                },
                "/posts/*": {
                    origin: new origins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split("/", readFunctionUrl))),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                },
            },
            enableLogging: true,
            logIncludesCookies: true,
            logFilePrefix: "cloudfront-logs/",
        });
    }
}
exports.MyWebsiteAppStack = MyWebsiteAppStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic2l0ZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndlYnNpdGUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMERBQTBEO0FBQzFELG1DQUFtQztBQUNuQyx5REFBeUQ7QUFFekQscURBQXFEO0FBQ3JELGlEQUFpRDtBQUNqRCw4REFBOEQ7QUFDOUQsbURBQW1EO0FBQ25ELHlDQUF5QztBQUN6QywyREFBMkQ7QUFRM0QsTUFBYSxpQkFBa0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM5QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQThCO1FBQ3RFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxVQUFVLElBQUksRUFBRSxFQUFFO1lBQ3pELE1BQU0sSUFBSSxLQUFLLENBQUMseUNBQXlDLENBQUMsQ0FBQztTQUM1RDtRQUNELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDcEMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLFVBQVUsSUFBSSxFQUFFLEVBQUU7WUFDekQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1NBQzVEO1FBQ0QsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUVwQyxNQUFNLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUNsRCxVQUFVO1lBQ1YsYUFBYSxFQUNYLEtBQUssQ0FBQyxXQUFXLElBQUksWUFBWTtnQkFDL0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztnQkFDM0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtZQUM5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QyxDQUNyRDtvQkFDRCxjQUFjLEVBQUUsVUFBVSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0I7b0JBQ2hFLG1CQUFtQixFQUNqQixVQUFVLENBQUMsbUJBQW1CLENBQUMsNkJBQTZCO2lCQUMvRDthQUNGO1lBQ0QsYUFBYSxFQUFFLElBQUk7WUFDbkIsa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixhQUFhLEVBQUUsa0JBQWtCO1NBQ2xDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWhQRCw4Q0FnUEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhY20gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXJcIjtcbmltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSBcImF3cy1jZGstbGliL2F3cy1jbG91ZGZyb250XCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSBcImF3cy1jZGstbGliL2F3cy1keW5hbW9kYlwiO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zXCI7XG5pbXBvcnQgKiBhcyByb3V0ZTUzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtcm91dGU1M1wiO1xuaW1wb3J0ICogYXMgczMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zM1wiO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXJvdXRlNTMtdGFyZ2V0c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE15V2Vic2l0ZUFwcFN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIGRvbWFpbk5hbWU6IHN0cmluZztcbiAgYnVja2V0TmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgTXlXZWJzaXRlQXBwU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IE15V2Vic2l0ZUFwcFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGlmICghcHJvcHMgfHwgIXByb3BzLmRvbWFpbk5hbWUgfHwgcHJvcHMuZG9tYWluTmFtZSA9PSBcIlwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZG9tYWluTmFtZSBwcm9wZXJ0eSBpcyBub3QgZGVmaW5lZC5cIik7XG4gICAgfVxuICAgIGNvbnN0IGRvbWFpbk5hbWUgPSBwcm9wcy5kb21haW5OYW1lO1xuICAgIGlmICghcHJvcHMgfHwgIXByb3BzLmJ1Y2tldE5hbWUgfHwgcHJvcHMuYnVja2V0TmFtZSA9PSBcIlwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgYnVja2V0TmFtZSBwcm9wZXJ0eSBpcyBub3QgZGVmaW5lZC5cIik7XG4gICAgfVxuICAgIGNvbnN0IGJ1Y2tldE5hbWUgPSBwcm9wcy5idWNrZXROYW1lO1xuXG4gICAgY29uc3QgYnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBcIldlYnNpdGVCdWNrZXRcIiwge1xuICAgICAgYnVja2V0TmFtZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6XG4gICAgICAgIHByb3BzLmVudmlyb25tZW50ICE9IFwicHJvZHVjdGlvblwiXG4gICAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXG4gICAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogcHJvcHMuZW52aXJvbm1lbnQgIT0gXCJwcm9kdWN0aW9uXCIsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgZW5mb3JjZVNTTDogdHJ1ZSxcbiAgICB9KTtcbiAgICBjb25zdCBvcmlnaW5BY2Nlc3NJZGVudGl0eSA9IG5ldyBjbG91ZGZyb250Lk9yaWdpbkFjY2Vzc0lkZW50aXR5KFxuICAgICAgdGhpcyxcbiAgICAgIFwiT3JpZ2luQWNjZXNzSWRlbnRpdHlcIlxuICAgICk7XG4gICAgYnVja2V0LmdyYW50UmVhZChvcmlnaW5BY2Nlc3NJZGVudGl0eSk7XG5cbiAgICBjb25zdCBibG9nVGFibGUgPSB0aGlzLmNyZWF0ZUR5bmFtb0RiVGFibGUocHJvcHMuZW52aXJvbm1lbnQpO1xuXG4gICAgY29uc3QgcmVhZEJsb2dGdW5jdGlvbiA9IHRoaXMuY3JlYXRlUmVhZExhbWJkYSgpO1xuICAgIGNvbnN0IHJlYWRGdW5jdGlvblVybCA9IG5ldyBsYW1iZGEuRnVuY3Rpb25VcmwodGhpcywgXCJSZWFkIEZ1bmN0aW9uIFVSTFwiLCB7XG4gICAgICBmdW5jdGlvbjogcmVhZEJsb2dGdW5jdGlvbixcbiAgICAgIGF1dGhUeXBlOiBsYW1iZGEuRnVuY3Rpb25VcmxBdXRoVHlwZS5OT05FLFxuICAgICAgY29yczogeyBhbGxvd2VkT3JpZ2luczogW1wiKlwiXSB9LFxuICAgIH0pLnVybDtcbiAgICBjb25zdCBjcmVhdGVCbG9nRnVuY3Rpb24gPSB0aGlzLmNyZWF0ZVVwc2VydExhbWJkYSgpO1xuICAgIGNvbnN0IGNyZWF0ZUZ1bmN0aW9uVXJsID0gbmV3IGxhbWJkYS5GdW5jdGlvblVybChcbiAgICAgIHRoaXMsXG4gICAgICBcIkNyZWF0ZSBGdW5jdGlvbiBVUkxcIixcbiAgICAgIHtcbiAgICAgICAgZnVuY3Rpb246IGNyZWF0ZUJsb2dGdW5jdGlvbixcbiAgICAgICAgYXV0aFR5cGU6IGxhbWJkYS5GdW5jdGlvblVybEF1dGhUeXBlLkFXU19JQU0sXG4gICAgICAgIGNvcnM6IHsgYWxsb3dlZE9yaWdpbnM6IFtcIipcIl0gfSxcbiAgICAgIH1cbiAgICApLnVybDtcblxuICAgIGJsb2dUYWJsZS5ncmFudFJlYWREYXRhKHJlYWRCbG9nRnVuY3Rpb24pO1xuICAgIGJsb2dUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlQmxvZ0Z1bmN0aW9uKTtcblxuICAgIC8vIFdlIG5lZWQgdG8gY3JlYXRlIHRoaXMgWm9uZSBiZWZvcmVoYW5kIGJlY2F1c2UgdGhlIGRvbWFpbiBuYW1lIGlzIG5vdCBtYW5hZ2VkIGJ5IEFXU1xuICAgIGNvbnN0IHpvbmUgPVxuICAgICAgcHJvcHMuZW52aXJvbm1lbnQgPT0gXCJ0ZXN0XCJcbiAgICAgICAgPyBuZXcgcm91dGU1My5Ib3N0ZWRab25lKHRoaXMsIFwiVGVzdFpvbmVcIiwgeyB6b25lTmFtZTogXCJ0ZXN0aW5nXCIgfSlcbiAgICAgICAgOiByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCBcIkhvc3RlZFpvbmVcIiwge1xuICAgICAgICAgICAgZG9tYWluTmFtZSxcbiAgICAgICAgICB9KTtcblxuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gbmV3IGFjbS5DZXJ0aWZpY2F0ZSh0aGlzLCBcIlNpdGVDZXJ0aWZpY2F0ZVwiLCB7XG4gICAgICBkb21haW5OYW1lLFxuICAgICAgc3ViamVjdEFsdGVybmF0aXZlTmFtZXM6IFtgKi4ke2RvbWFpbk5hbWV9YF0sXG4gICAgICB2YWxpZGF0aW9uOiB7XG4gICAgICAgIG1ldGhvZDogYWNtLlZhbGlkYXRpb25NZXRob2QuRE5TLFxuICAgICAgICBwcm9wczogeyBob3N0ZWRab25lOiB6b25lIH0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVzcG9uc2VIZWFkZXJQb2xpY3kgPSB0aGlzLmNyZWF0ZUNGUmVzcG9uc2VIZWFkZXJzUG9saWN5KCk7XG5cbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSB0aGlzLmNyZWF0ZURpc3RyaWJ1dGlvbihcbiAgICAgIGNlcnRpZmljYXRlLFxuICAgICAgZG9tYWluTmFtZSxcbiAgICAgIGJ1Y2tldCBhcyBzMy5CdWNrZXQsXG4gICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eSxcbiAgICAgIHJlc3BvbnNlSGVhZGVyUG9saWN5LFxuICAgICAgcmVhZEZ1bmN0aW9uVXJsLFxuICAgICAgY3JlYXRlRnVuY3Rpb25VcmxcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IENOQU1FIHJlY29yZCBmb3IgXCJ3d3cuXCIgKyBkb21haW5OYW1lIHBvaW50aW5nIHRvIHRoZSBuZXcgZGlzdHJpYnV0aW9uXG4gICAgbmV3IHJvdXRlNTMuQ25hbWVSZWNvcmQodGhpcywgXCJDbmFtZVJlY29yZFwiLCB7XG4gICAgICB6b25lLFxuICAgICAgcmVjb3JkTmFtZTogYHd3dy4ke2RvbWFpbk5hbWV9YCxcbiAgICAgIGRvbWFpbk5hbWU6IGRpc3RyaWJ1dGlvbi5kb21haW5OYW1lLFxuICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIGRlbGV0ZUV4aXN0aW5nOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCBcIkFsaWFzIEFSZWNvcmRcIiwge1xuICAgICAgem9uZSxcbiAgICAgIHJlY29yZE5hbWU6IGRvbWFpbk5hbWUsXG4gICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhcbiAgICAgICAgbmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0cmlidXRpb24pXG4gICAgICApLFxuICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIGRlbGV0ZUV4aXN0aW5nOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJEb21haW5cIiwgeyB2YWx1ZTogYGh0dHBzOi8vd3d3LiR7ZG9tYWluTmFtZX1gIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiQnVja2V0IG5hbWVcIiwgeyB2YWx1ZTogYnVja2V0TmFtZSB9KTtcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkNsb3VkRnJvbnRVcmxcIiwge1xuICAgICAgdmFsdWU6IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiUmVhZCBMYW1iZGEgVVJMXCIsIHsgdmFsdWU6IHJlYWRGdW5jdGlvblVybCB9KTtcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkNyZWF0ZSBMYW1iZGEgVVJMXCIsIHsgdmFsdWU6IGNyZWF0ZUZ1bmN0aW9uVXJsIH0pO1xuICB9XG5cbiAgY3JlYXRlRHluYW1vRGJUYWJsZShlbnZpcm9ubWVudDogc3RyaW5nKTogZHluYW1vZGIuSVRhYmxlIHtcbiAgICAvLyBPbmx5IHRoZSBwcm9kdWN0aW9uIHRhYmxlIGlzIHN0YWJsZVxuICAgIGxldCB0YWJsZTogZHluYW1vZGIuSVRhYmxlO1xuXG4gICAgaWYgKGVudmlyb25tZW50ID09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgICB0YWJsZSA9IGR5bmFtb2RiLlRhYmxlLmZyb21UYWJsZU5hbWUodGhpcywgXCJCbG9nUG9zdHNUYWJsZVwiLCBcIkJsb2dQb3N0c1wiKTtcbiAgICB9XG4gICAgdGFibGUgPz89IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCBcIkJsb2dQb3N0c1wiLCB7XG4gICAgICB0YWJsZU5hbWU6IFwiQmxvZ1Bvc3RzLVwiICsgZW52aXJvbm1lbnQsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogXCJwb3N0SWRcIiwgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogXCJjcmVhdGVkXCIsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXG4gICAgICByZW1vdmFsUG9saWN5OlxuICAgICAgICBlbnZpcm9ubWVudCA9PSBcInByb2R1Y3Rpb25cIlxuICAgICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXG4gICAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRhYmxlO1xuICB9XG5cbiAgY3JlYXRlUmVhZExhbWJkYSgpIHtcbiAgICByZXR1cm4gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcIlJlYWRCbG9nRnVuY3Rpb25cIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBoYW5kbGVyOiBcInJlYWQuaGFuZGxlclwiLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwibGFtYmRhXCIpLFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlVXBzZXJ0TGFtYmRhKCkge1xuICAgIHJldHVybiBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiQ3JlYXRlQmxvZ0Z1bmN0aW9uXCIsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgaGFuZGxlcjogXCJjcmVhdGUuaGFuZGxlclwiLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwibGFtYmRhXCIpLFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlQ0ZSZXNwb25zZUhlYWRlcnNQb2xpY3koKTogY2xvdWRmcm9udC5SZXNwb25zZUhlYWRlcnNQb2xpY3kge1xuICAgIHJldHVybiBuZXcgY2xvdWRmcm9udC5SZXNwb25zZUhlYWRlcnNQb2xpY3koXG4gICAgICB0aGlzLFxuICAgICAgXCJTZWN1cml0eUhlYWRlcnNSZXNwb25zZUhlYWRlclBvbGljeVwiLFxuICAgICAge1xuICAgICAgICBjb21tZW50OiBcIlNlY3VyaXR5IGhlYWRlcnMgcmVzcG9uc2UgaGVhZGVyIHBvbGljeVwiLFxuICAgICAgICBzZWN1cml0eUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICAgIHN0cmljdFRyYW5zcG9ydFNlY3VyaXR5OiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIGFjY2Vzc0NvbnRyb2xNYXhBZ2U6IGNkay5EdXJhdGlvbi5kYXlzKDIgKiAzNjUpLFxuICAgICAgICAgICAgaW5jbHVkZVN1YmRvbWFpbnM6IHRydWUsXG4gICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29udGVudFR5cGVPcHRpb25zOiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlZmVycmVyUG9saWN5OiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIHJlZmVycmVyUG9saWN5OlxuICAgICAgICAgICAgICBjbG91ZGZyb250LkhlYWRlcnNSZWZlcnJlclBvbGljeS5TVFJJQ1RfT1JJR0lOX1dIRU5fQ1JPU1NfT1JJR0lOLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeHNzUHJvdGVjdGlvbjoge1xuICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICBwcm90ZWN0aW9uOiB0cnVlLFxuICAgICAgICAgICAgbW9kZUJsb2NrOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZnJhbWVPcHRpb25zOiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIGZyYW1lT3B0aW9uOiBjbG91ZGZyb250LkhlYWRlcnNGcmFtZU9wdGlvbi5ERU5ZLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGNyZWF0ZURpc3RyaWJ1dGlvbihcbiAgICBjZXJ0aWZpY2F0ZTogYWNtLkNlcnRpZmljYXRlLFxuICAgIGRvbWFpbk5hbWU6IHN0cmluZyxcbiAgICBidWNrZXQ6IHMzLkJ1Y2tldCxcbiAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eTogY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSxcbiAgICBoZWFkZXJzUG9saWN5OiBjbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeSxcbiAgICByZWFkRnVuY3Rpb25Vcmw6IHN0cmluZyxcbiAgICBjcmVhdGVGdW5jdGlvblVybDogc3RyaW5nXG4gICk6IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uIHtcbiAgICByZXR1cm4gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsIFwiQ2xvdWRGcm9udERpc3RyaWJ1dGlvblwiLCB7XG4gICAgICBjZXJ0aWZpY2F0ZSxcbiAgICAgIGRvbWFpbk5hbWVzOiBbZG9tYWluTmFtZSwgYHd3dy4ke2RvbWFpbk5hbWV9YF0sXG4gICAgICBzc2xTdXBwb3J0TWV0aG9kOiBjbG91ZGZyb250LlNTTE1ldGhvZC5TTkksXG4gICAgICBtaW5pbXVtUHJvdG9jb2xWZXJzaW9uOiBjbG91ZGZyb250LlNlY3VyaXR5UG9saWN5UHJvdG9jb2wuVExTX1YxXzJfMjAxOCxcbiAgICAgIGVycm9yUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogXCIvaW5kZXguaHRtbFwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6IFwiLzQwNC5odG1sXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6IFwiaW5kZXguaHRtbFwiLFxuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogbmV3IGNkay5hd3NfY2xvdWRmcm9udF9vcmlnaW5zLlMzT3JpZ2luKGJ1Y2tldCwge1xuICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5LFxuICAgICAgICB9KSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6XG4gICAgICAgICAgY2xvdWRmcm9udC5PcmlnaW5SZXF1ZXN0UG9saWN5LkFMTF9WSUVXRVJfRVhDRVBUX0hPU1RfSEVBREVSLFxuICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3k6IGhlYWRlcnNQb2xpY3ksXG4gICAgICB9LFxuXG4gICAgICBhZGRpdGlvbmFsQmVoYXZpb3JzOiB7XG4gICAgICAgIFwiL3Bvc3RcIjoge1xuICAgICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuSHR0cE9yaWdpbihcbiAgICAgICAgICAgIGNkay5Gbi5zZWxlY3QoMiwgY2RrLkZuLnNwbGl0KFwiL1wiLCBjcmVhdGVGdW5jdGlvblVybCkpXG4gICAgICAgICAgKSxcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5BbGxvd2VkTWV0aG9kcy5BTExPV19BTEwsXG4gICAgICAgICAgb3JpZ2luUmVxdWVzdFBvbGljeTpcbiAgICAgICAgICAgIGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5BTExfVklFV0VSX0VYQ0VQVF9IT1NUX0hFQURFUixcbiAgICAgICAgfSxcbiAgICAgICAgXCIvcG9zdHMvKlwiOiB7XG4gICAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5IdHRwT3JpZ2luKFxuICAgICAgICAgICAgY2RrLkZuLnNlbGVjdCgyLCBjZGsuRm4uc3BsaXQoXCIvXCIsIHJlYWRGdW5jdGlvblVybCkpXG4gICAgICAgICAgKSxcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5BbGxvd2VkTWV0aG9kcy5BTExPV19HRVRfSEVBRF9PUFRJT05TLFxuICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6XG4gICAgICAgICAgICBjbG91ZGZyb250Lk9yaWdpblJlcXVlc3RQb2xpY3kuQUxMX1ZJRVdFUl9FWENFUFRfSE9TVF9IRUFERVIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgZW5hYmxlTG9nZ2luZzogdHJ1ZSxcbiAgICAgIGxvZ0luY2x1ZGVzQ29va2llczogdHJ1ZSxcbiAgICAgIGxvZ0ZpbGVQcmVmaXg6IFwiY2xvdWRmcm9udC1sb2dzL1wiLFxuICAgIH0pO1xuICB9XG59XG4iXX0=