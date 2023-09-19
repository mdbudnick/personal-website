import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda'

// AWS Lambda Function Urls are reusing types from APIGateway
// but many fields are not used or filled with default values
// see: https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html
// It would be nice to have types with only the used fields and add them to:
// https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/aws-lambda
type LambdaFunctionUrlEvent = APIGatewayProxyEventV2
type LambdaFunctionUrlResult = APIGatewayProxyStructuredResultV2

import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoDb = new DynamoDB.DocumentClient();

export const readHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Handle GET /posts request
    if (event.path === '/posts' || event.path === '/posts/') {
      const params = {
        TableName: 'BlogPosts',
        Limit: 20,
      };

      const data = await dynamoDb.scan(params).promise();
      if (data.Items) {
        const items = data.Items.map((item) => ({
            title: item.title,
            html: item.html,
            created: item.created,
        }));

        const response: APIGatewayProxyResult = {
            statusCode: 200,
            body: JSON.stringify(items),
        };

        return response;
        }
    } else {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Problem retrieving posts' }),
        };
    }

    // Handle GET /posts/{postId} request
    if (event.path.startsWith('/posts/')) {
      const postId = event.path.substring('/posts/'.length);

      const params = {
        TableName: 'BlogPosts',
        Key: {
          postId: postId,
        },
      };

      const data = await dynamoDb.get(params).promise();

      if (!data.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Post not found' }),
        };
      }

      const response: APIGatewayProxyResult = {
        statusCode: 200,
        body: data.Item.html,
      };

      return response;
    }

    // Handle unsupported routes
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Not Found' }),
    };
  } catch (error) {
    console.error('Error reading from DynamoDB', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};


export async function createHandler(
    event: LambdaFunctionUrlEvent,
    context: Context
    ): Promise<LambdaFunctionUrlResult> {
    console.log(context.functionName)
    console.log(`${event.requestContext.http.method} ${event.rawPath}`)
    return {
        statusCode: 200,
        body: 'Hello create!',
    }
    }