"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const dynamoDb = new aws_sdk_1.DynamoDB.DocumentClient();
/**
 * Handles POST requests to upsert DynamoDB BlogPosts table.
 *
 * @param {APIGatewayProxyEvent} event - The incoming API Gateway event.
 * @returns {Promise<APIGatewayProxyResult>} The API Gateway response.
 */
// eslint-disable-next-line max-len
exports.handler = async (event) => {
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
        const item = {
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
    }
    catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3JlYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQW1DO0FBY25DLE1BQU0sUUFBUSxHQUFHLElBQUksa0JBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUUvQzs7Ozs7R0FLRztBQUNILG1DQUFtQztBQUNuQyxPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssRUFDckIsS0FBMkIsRUFDSyxFQUFFO0lBQ2xDLElBQUk7UUFDRixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRTtZQUNmLE9BQU87Z0JBQ0wsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQzthQUN4RCxDQUFDO1NBQ0g7UUFDRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUzQywyQkFBMkI7UUFDM0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFO1lBQzNDLE9BQU87Z0JBQ0wsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsNkJBQTZCLEVBQUUsQ0FBQzthQUNqRSxDQUFDO1NBQ0g7UUFFRCxrRkFBa0Y7UUFDbEYsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUM7UUFFbEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMzQyxNQUFNLElBQUksR0FBYTtZQUNyQixnREFBZ0Q7WUFDaEQsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUztZQUNqRCxJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUksSUFBSSxFQUFFO1lBQzVCLEtBQUssRUFBRSxXQUFXLENBQUMsS0FBSztZQUN4QixJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUk7WUFDdEIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQ3pDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUztTQUMxQyxDQUFDO1FBRUYsTUFBTSxNQUFNLEdBQUc7WUFDYixTQUFTLEVBQUUsV0FBVztZQUN0QixJQUFJLEVBQUUsSUFBSTtTQUNYLENBQUM7UUFFRixxRUFBcUU7UUFDckUsTUFBTSxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXJDLE9BQU87WUFDTCxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7WUFDaEMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsY0FBYzthQUNwRCxDQUFDO1NBQ0gsQ0FBQztLQUNIO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUvQixPQUFPO1lBQ0wsVUFBVSxFQUFFLEdBQUc7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSx1QkFBdUIsRUFBRSxDQUFDO1NBQ3pELENBQUM7S0FDSDtBQUNILENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCIH0gZnJvbSBcImF3cy1zZGtcIjtcbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tIFwiYXdzLWxhbWJkYVwiO1xuXG5pbnRlcmZhY2UgQmxvZ1Bvc3Qge1xuICBwb3N0SWQ6IHN0cmluZzsgLy8gVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBwb3N0XG4gIHRhZ3M6IHN0cmluZ1tdOyAvLyBMaXN0IG9mIHRhZ3MgYXNzb2NpYXRlZCB3aXRoIHRoZSBwb3N0XG4gIHRpdGxlOiBzdHJpbmc7IC8vIFRpdGxlIG9mIHRoZSBibG9nIHBvc3RcbiAgaHRtbDogc3RyaW5nOyAvLyBIVE1MIGNvbnRlbnQgb2YgdGhlIGJsb2cgcG9zdFxuICAvLyBUaW1lc3RhbXAgd2hlbiB0aGUgcG9zdCB3YXMgY3JlYXRlZCAob3B0aW9uYWwgZm9yIHVwZGF0ZXMpXG4gIGNyZWF0ZWQ/OiBzdHJpbmc7XG4gIC8vIFRpbWVzdGFtcCB3aGVuIHRoZSBwb3N0IHdhcyBsYXN0IHVwZGF0ZWQgKG9wdGlvbmFsIGZvciBjcmVhdGVzKVxuICB1cGRhdGVkPzogc3RyaW5nO1xufVxuXG5jb25zdCBkeW5hbW9EYiA9IG5ldyBEeW5hbW9EQi5Eb2N1bWVudENsaWVudCgpO1xuXG4vKipcbiAqIEhhbmRsZXMgUE9TVCByZXF1ZXN0cyB0byB1cHNlcnQgRHluYW1vREIgQmxvZ1Bvc3RzIHRhYmxlLlxuICpcbiAqIEBwYXJhbSB7QVBJR2F0ZXdheVByb3h5RXZlbnR9IGV2ZW50IC0gVGhlIGluY29taW5nIEFQSSBHYXRld2F5IGV2ZW50LlxuICogQHJldHVybnMge1Byb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0Pn0gVGhlIEFQSSBHYXRld2F5IHJlc3BvbnNlLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxlblxuZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKFxuICBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnRcbik6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgaWYgKCFldmVudC5ib2R5KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogXCJCbG9nIHBvc3QgcmVxdWlyZWRcIiB9KSxcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHJlcXVlc3RCb2R5ID0gSlNPTi5wYXJzZShldmVudC5ib2R5KTtcblxuICAgIC8vIFZhbGlkYXRlIHJlcXVpcmVkIGZpZWxkc1xuICAgIGlmICghcmVxdWVzdEJvZHkudGl0bGUgfHwgIXJlcXVlc3RCb2R5Lmh0bWwpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiBcIlRpdGxlIGFuZCBIVE1MIGFyZSByZXF1aXJlZFwiIH0pLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmUgaWYgaXQncyBhbiB1cGRhdGUgb3IgY3JlYXRlIG9wZXJhdGlvbiBiYXNlZCBvbiB0aGUgcHJlc2VuY2Ugb2YgcG9zdElkXG4gICAgY29uc3QgaXNVcGRhdGUgPSByZXF1ZXN0Qm9keS5wb3N0SWQgIT09IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBjb25zdCBpdGVtOiBCbG9nUG9zdCA9IHtcbiAgICAgIC8vIFVzZSBwb3N0SWQgZm9yIHVwZGF0ZSBvciB0aW1lc3RhbXAgZm9yIGNyZWF0ZVxuICAgICAgcG9zdElkOiBpc1VwZGF0ZSA/IHJlcXVlc3RCb2R5LnBvc3RJZCA6IHRpbWVzdGFtcCxcbiAgICAgIHRhZ3M6IHJlcXVlc3RCb2R5LnRhZ3MgfHwgW10sXG4gICAgICB0aXRsZTogcmVxdWVzdEJvZHkudGl0bGUsXG4gICAgICBodG1sOiByZXF1ZXN0Qm9keS5odG1sLFxuICAgICAgY3JlYXRlZDogaXNVcGRhdGUgPyB1bmRlZmluZWQgOiB0aW1lc3RhbXAsXG4gICAgICB1cGRhdGVkOiBpc1VwZGF0ZSA/IHRpbWVzdGFtcCA6IHVuZGVmaW5lZCxcbiAgICB9O1xuXG4gICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgVGFibGVOYW1lOiBcIkJsb2dQb3N0c1wiLFxuICAgICAgSXRlbTogaXRlbSxcbiAgICB9O1xuXG4gICAgLy8gUGVyZm9ybSB0aGUgcHV0IG9wZXJhdGlvbiB0byBpbnNlcnQgb3IgdXBkYXRlIHRoZSBpdGVtIGluIER5bmFtb0RCXG4gICAgYXdhaXQgZHluYW1vRGIucHV0KHBhcmFtcykucHJvbWlzZSgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IGlzVXBkYXRlID8gMjAwIDogMjAxLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtZXNzYWdlOiBpc1VwZGF0ZSA/IFwiUG9zdCB1cGRhdGVkXCIgOiBcIlBvc3QgY3JlYXRlZFwiLFxuICAgICAgfSksXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3I6XCIsIGVycm9yKTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBcIkludGVybmFsIFNlcnZlciBFcnJvclwiIH0pLFxuICAgIH07XG4gIH1cbn07XG4iXX0=