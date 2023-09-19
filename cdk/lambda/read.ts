import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoDb = new DynamoDB.DocumentClient();
  
/**
 * Handles GET requests to retrieve blog posts from DynamoDB.
 *
 * @param {APIGatewayProxyEvent} event - The incoming API Gateway event.
 * @returns {Promise<APIGatewayProxyResult>} The API Gateway response.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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