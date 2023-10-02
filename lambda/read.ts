import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const dynamoDb = new DynamoDB.DocumentClient();
  
/**
 * Handles GET requests to retrieve blog posts from DynamoDB.
 *
 * @param {APIGatewayProxyEvent} event - The incoming API Gateway event.
 * @returns {Promise<APIGatewayProxyResult>} The API Gateway response.
 */
// eslint-disable-next-line max-len
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Handle GET /posts request
    if (event.path === "/") {
      const params = {
        TableName: "BlogPosts",
        Limit: 100,
        ProjectionExpression: "title,html,file,tags,posted"
      };

      const data = await dynamoDb.scan(params).promise();
      if (data.Items) {
        const items = data.Items.map((item) => ({
            title: item.title,
            html: item.html,
            created: item.created,
            file: item.file,
            tags: item.tags
        }));

        const response: APIGatewayProxyResult = {
            statusCode: 200,
            body: JSON.stringify(items),
        };

        return response;
        }
    } else {
      // Handle /<post-html>
      const filename = event.path.substring(1);

      const params = {
        TableName: "BlogPosts",
        Key: {
          file: filename,
        },
      };

      const data = await dynamoDb.get(params).promise();

      if (!data.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Post not found" }),
        };
      }

      const response: APIGatewayProxyResult = {
        statusCode: 200,
        body: data.Item.html,
      };

      return response;
    }
  } catch (error) {
    console.error("Error reading from DynamoDB", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};