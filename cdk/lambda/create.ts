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


interface BlogPost {
    postId: string;       // Unique identifier for the post
    tags: string[];       // List of tags associated with the post
    title: string;        // Title of the blog post
    html: string;         // HTML content of the blog post
    created?: string;     // Timestamp when the post was created (optional for updates)
    updated?: string;     // Timestamp when the post was last updated (optional for creates)
}

const dynamoDb = new DynamoDB.DocumentClient();

/**
 * Handles POST requests to upsert DynamoDB BlogPosts table.
 *
 * @param {APIGatewayProxyEvent} event - The incoming API Gateway event.
 * @returns {Promise<APIGatewayProxyResult>} The API Gateway response.
 */
exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Blog post required' }),
          };
      }
      const requestBody = JSON.parse(event.body);
  
      // Validate required fields
      if (!requestBody.title || !requestBody.html) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Title and HTML are required' }),
        };
      }
  
      // Determine if it's an update or create operation based on the presence of postId
      const isUpdate = requestBody.postId !== undefined;
  
      const timestamp = new Date().toISOString();
      const item: BlogPost = {
        postId: isUpdate ? requestBody.postId : timestamp, // Use postId for update or timestamp for create
        tags: requestBody.tags || [],
        title: requestBody.title,
        html: requestBody.html,
        created: isUpdate ? undefined : timestamp,
        updated: isUpdate ? timestamp : undefined,
      };
  
      const params = {
        TableName: 'BlogPosts',
        Item: item,
      };
  
      // Perform the put operation to insert or update the item in DynamoDB
      await dynamoDb.put(params).promise();
  
      return {
        statusCode: isUpdate ? 200 : 201,
        body: JSON.stringify({ message: isUpdate ? 'Post updated' : 'Post created' }),
      };
    } catch (error) {
      console.error('Error:', error);
  
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      };
    }
  };