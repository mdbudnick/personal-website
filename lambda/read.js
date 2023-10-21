"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = require("aws-sdk");
const dynamoDb = new aws_sdk_1.DynamoDB.DocumentClient();
/**
 * Handles GET requests to retrieve blog posts from DynamoDB.
 *
 * @param {APIGatewayProxyEvent} event - The incoming API Gateway event.
 * @returns {Promise<APIGatewayProxyResult>} The API Gateway response.
 */
// eslint-disable-next-line max-len
const handler = async (event) => {
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
                const response = {
                    statusCode: 200,
                    body: JSON.stringify(items),
                };
                return response;
            }
            return {
                statusCode: 500,
                body: "There was a problem retrieving the posts",
            };
        }
        else {
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
            const response = {
                statusCode: 200,
                body: data.Item.html,
            };
            return response;
        }
    }
    catch (error) {
        console.error("Error reading from DynamoDB", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQW1DO0FBR25DLE1BQU0sUUFBUSxHQUFHLElBQUksa0JBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUUvQzs7Ozs7R0FLRztBQUNILG1DQUFtQztBQUM1QixNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRixJQUFJO1FBQ0YsNEJBQTRCO1FBQzVCLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUU7WUFDdEIsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsU0FBUyxFQUFFLFdBQVc7Z0JBQ3RCLEtBQUssRUFBRSxHQUFHO2dCQUNWLG9CQUFvQixFQUFFLDZCQUE2QjthQUNwRCxDQUFDO1lBRUYsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25ELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDZCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDcEMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO29CQUNqQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7b0JBQ2YsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO29CQUNyQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7b0JBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2lCQUNsQixDQUFDLENBQUMsQ0FBQztnQkFFSixNQUFNLFFBQVEsR0FBMEI7b0JBQ3BDLFVBQVUsRUFBRSxHQUFHO29CQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztpQkFDOUIsQ0FBQztnQkFFRixPQUFPLFFBQVEsQ0FBQzthQUNmO1lBQ0QsT0FBTztnQkFDTCxVQUFVLEVBQUUsR0FBRztnQkFDZixJQUFJLEVBQUUsMENBQTBDO2FBQ25ELENBQUM7U0FDSDthQUFNO1lBQ0wsc0JBQXNCO1lBQ3RCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpDLE1BQU0sTUFBTSxHQUFHO2dCQUNiLFNBQVMsRUFBRSxXQUFXO2dCQUN0QixHQUFHLEVBQUU7b0JBQ0gsSUFBSSxFQUFFLFFBQVE7aUJBQ2Y7YUFDRixDQUFDO1lBRUYsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWxELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUNkLE9BQU87b0JBQ0wsVUFBVSxFQUFFLEdBQUc7b0JBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztpQkFDcEQsQ0FBQzthQUNIO1lBRUQsTUFBTSxRQUFRLEdBQTBCO2dCQUN0QyxVQUFVLEVBQUUsR0FBRztnQkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJO2FBQ3JCLENBQUM7WUFFRixPQUFPLFFBQVEsQ0FBQztTQUNqQjtLQUNGO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXBELE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUM7U0FDekQsQ0FBQztLQUNIO0FBQ0gsQ0FBQyxDQUFDO0FBbEVXLFFBQUEsT0FBTyxXQWtFbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEeW5hbW9EQiB9IGZyb20gXCJhd3Mtc2RrXCI7XG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSBcImF3cy1sYW1iZGFcIjtcblxuY29uc3QgZHluYW1vRGIgPSBuZXcgRHluYW1vREIuRG9jdW1lbnRDbGllbnQoKTtcbiAgXG4vKipcbiAqIEhhbmRsZXMgR0VUIHJlcXVlc3RzIHRvIHJldHJpZXZlIGJsb2cgcG9zdHMgZnJvbSBEeW5hbW9EQi5cbiAqXG4gKiBAcGFyYW0ge0FQSUdhdGV3YXlQcm94eUV2ZW50fSBldmVudCAtIFRoZSBpbmNvbWluZyBBUEkgR2F0ZXdheSBldmVudC5cbiAqIEByZXR1cm5zIHtQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD59IFRoZSBBUEkgR2F0ZXdheSByZXNwb25zZS5cbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1sZW5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgLy8gSGFuZGxlIEdFVCAvcG9zdHMgcmVxdWVzdFxuICAgIGlmIChldmVudC5wYXRoID09PSBcIi9cIikge1xuICAgICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgICBUYWJsZU5hbWU6IFwiQmxvZ1Bvc3RzXCIsXG4gICAgICAgIExpbWl0OiAxMDAsXG4gICAgICAgIFByb2plY3Rpb25FeHByZXNzaW9uOiBcInRpdGxlLGh0bWwsZmlsZSx0YWdzLHBvc3RlZFwiXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZHluYW1vRGIuc2NhbihwYXJhbXMpLnByb21pc2UoKTtcbiAgICAgIGlmIChkYXRhLkl0ZW1zKSB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gZGF0YS5JdGVtcy5tYXAoKGl0ZW0pID0+ICh7XG4gICAgICAgICAgICB0aXRsZTogaXRlbS50aXRsZSxcbiAgICAgICAgICAgIGh0bWw6IGl0ZW0uaHRtbCxcbiAgICAgICAgICAgIGNyZWF0ZWQ6IGl0ZW0uY3JlYXRlZCxcbiAgICAgICAgICAgIGZpbGU6IGl0ZW0uZmlsZSxcbiAgICAgICAgICAgIHRhZ3M6IGl0ZW0udGFnc1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2U6IEFQSUdhdGV3YXlQcm94eVJlc3VsdCA9IHtcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGl0ZW1zKSxcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICAgICAgYm9keTogXCJUaGVyZSB3YXMgYSBwcm9ibGVtIHJldHJpZXZpbmcgdGhlIHBvc3RzXCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBIYW5kbGUgLzxwb3N0LWh0bWw+XG4gICAgICBjb25zdCBmaWxlbmFtZSA9IGV2ZW50LnBhdGguc3Vic3RyaW5nKDEpO1xuXG4gICAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgIFRhYmxlTmFtZTogXCJCbG9nUG9zdHNcIixcbiAgICAgICAgS2V5OiB7XG4gICAgICAgICAgZmlsZTogZmlsZW5hbWUsXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZHluYW1vRGIuZ2V0KHBhcmFtcykucHJvbWlzZSgpO1xuXG4gICAgICBpZiAoIWRhdGEuSXRlbSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1lc3NhZ2U6IFwiUG9zdCBub3QgZm91bmRcIiB9KSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzcG9uc2U6IEFQSUdhdGV3YXlQcm94eVJlc3VsdCA9IHtcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICBib2R5OiBkYXRhLkl0ZW0uaHRtbCxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIHJlYWRpbmcgZnJvbSBEeW5hbW9EQlwiLCBlcnJvcik7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcIiB9KSxcbiAgICB9O1xuICB9XG59OyJdfQ==