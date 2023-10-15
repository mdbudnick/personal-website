import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

interface BlogPost {
  postId: string; // Unique identifier for the post
  tags: string[]; // List of tags associated with the post
  title: string; // Title of the blog post
  html: string; // HTML content of the blog post
  // Timestamp when the post was created (optional for updates)
  created?: string;
  // Timestamp when the post was last updated (optional for creates)
  updated?: string;
}

const dynamoDb = new DynamoDB.DocumentClient();

/**
 * Handles POST requests to upsert DynamoDB BlogPosts table.
 *
 * @param {APIGatewayProxyEvent} event - The incoming API Gateway event.
 * @returns {Promise<APIGatewayProxyResult>} The API Gateway response.
 */
// eslint-disable-next-line max-len
exports.handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Blog post required" }),
      };
    }
    const requestBody = JSON.parse(event.body);

    // Validate required fields
    if (!requestBody.title || !requestBody.html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Title and HTML are required" }),
      };
    }

    // Determine if it's an update or create operation based on the presence of postId
    const isUpdate = requestBody.postId !== undefined;

    const timestamp = new Date().toISOString();
    const item: BlogPost = {
      // Use postId for update or timestamp for create
      postId: isUpdate ? requestBody.postId : timestamp,
      tags: requestBody.tags || [],
      title: requestBody.title,
      html: requestBody.html,
      created: isUpdate ? undefined : timestamp,
      updated: isUpdate ? timestamp : undefined,
    };

    const params = {
      TableName: "BlogPosts",
      Item: item,
    };

    // Perform the put operation to insert or update the item in DynamoDB
    await dynamoDb.put(params).promise();

    return {
      statusCode: isUpdate ? 200 : 201,
      body: JSON.stringify({
        message: isUpdate ? "Post updated" : "Post created",
      }),
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
