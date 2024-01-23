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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQW1DO0FBR25DLE1BQU0sUUFBUSxHQUFHLElBQUksa0JBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUUvQzs7Ozs7R0FLRztBQUNILG1DQUFtQztBQUM1QixNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRixJQUFJLENBQUM7UUFDSCw0QkFBNEI7UUFDNUIsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sTUFBTSxHQUFHO2dCQUNiLFNBQVMsRUFBRSxXQUFXO2dCQUN0QixLQUFLLEVBQUUsR0FBRztnQkFDVixvQkFBb0IsRUFBRSw2QkFBNkI7YUFDcEQsQ0FBQztZQUVGLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuRCxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDZixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDcEMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO29CQUNqQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7b0JBQ2YsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO29CQUNyQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7b0JBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2lCQUNsQixDQUFDLENBQUMsQ0FBQztnQkFFSixNQUFNLFFBQVEsR0FBMEI7b0JBQ3BDLFVBQVUsRUFBRSxHQUFHO29CQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztpQkFDOUIsQ0FBQztnQkFFRixPQUFPLFFBQVEsQ0FBQztZQUNoQixDQUFDO1lBQ0QsT0FBTztnQkFDTCxVQUFVLEVBQUUsR0FBRztnQkFDZixJQUFJLEVBQUUsMENBQTBDO2FBQ25ELENBQUM7UUFDSixDQUFDO2FBQU0sQ0FBQztZQUNOLHNCQUFzQjtZQUN0QixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV6QyxNQUFNLE1BQU0sR0FBRztnQkFDYixTQUFTLEVBQUUsV0FBVztnQkFDdEIsR0FBRyxFQUFFO29CQUNILElBQUksRUFBRSxRQUFRO2lCQUNmO2FBQ0YsQ0FBQztZQUVGLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVsRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNmLE9BQU87b0JBQ0wsVUFBVSxFQUFFLEdBQUc7b0JBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztpQkFDcEQsQ0FBQztZQUNKLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBMEI7Z0JBQ3RDLFVBQVUsRUFBRSxHQUFHO2dCQUNmLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7YUFDckIsQ0FBQztZQUVGLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFcEQsT0FBTztZQUNMLFVBQVUsRUFBRSxHQUFHO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQztTQUN6RCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQWxFVyxRQUFBLE9BQU8sV0FrRWxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRHluYW1vREIgfSBmcm9tIFwiYXdzLXNka1wiO1xuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gXCJhd3MtbGFtYmRhXCI7XG5cbmNvbnN0IGR5bmFtb0RiID0gbmV3IER5bmFtb0RCLkRvY3VtZW50Q2xpZW50KCk7XG4gIFxuLyoqXG4gKiBIYW5kbGVzIEdFVCByZXF1ZXN0cyB0byByZXRyaWV2ZSBibG9nIHBvc3RzIGZyb20gRHluYW1vREIuXG4gKlxuICogQHBhcmFtIHtBUElHYXRld2F5UHJveHlFdmVudH0gZXZlbnQgLSBUaGUgaW5jb21pbmcgQVBJIEdhdGV3YXkgZXZlbnQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+fSBUaGUgQVBJIEdhdGV3YXkgcmVzcG9uc2UuXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBtYXgtbGVuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEhhbmRsZSBHRVQgL3Bvc3RzIHJlcXVlc3RcbiAgICBpZiAoZXZlbnQucGF0aCA9PT0gXCIvXCIpIHtcbiAgICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgICAgVGFibGVOYW1lOiBcIkJsb2dQb3N0c1wiLFxuICAgICAgICBMaW1pdDogMTAwLFxuICAgICAgICBQcm9qZWN0aW9uRXhwcmVzc2lvbjogXCJ0aXRsZSxodG1sLGZpbGUsdGFncyxwb3N0ZWRcIlxuICAgICAgfTtcblxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGR5bmFtb0RiLnNjYW4ocGFyYW1zKS5wcm9taXNlKCk7XG4gICAgICBpZiAoZGF0YS5JdGVtcykge1xuICAgICAgICBjb25zdCBpdGVtcyA9IGRhdGEuSXRlbXMubWFwKChpdGVtKSA9PiAoe1xuICAgICAgICAgICAgdGl0bGU6IGl0ZW0udGl0bGUsXG4gICAgICAgICAgICBodG1sOiBpdGVtLmh0bWwsXG4gICAgICAgICAgICBjcmVhdGVkOiBpdGVtLmNyZWF0ZWQsXG4gICAgICAgICAgICBmaWxlOiBpdGVtLmZpbGUsXG4gICAgICAgICAgICB0YWdzOiBpdGVtLnRhZ3NcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlOiBBUElHYXRld2F5UHJveHlSZXN1bHQgPSB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShpdGVtcyksXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgICAgIGJvZHk6IFwiVGhlcmUgd2FzIGEgcHJvYmxlbSByZXRyaWV2aW5nIHRoZSBwb3N0c1wiLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSGFuZGxlIC88cG9zdC1odG1sPlxuICAgICAgY29uc3QgZmlsZW5hbWUgPSBldmVudC5wYXRoLnN1YnN0cmluZygxKTtcblxuICAgICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgICBUYWJsZU5hbWU6IFwiQmxvZ1Bvc3RzXCIsXG4gICAgICAgIEtleToge1xuICAgICAgICAgIGZpbGU6IGZpbGVuYW1lLFxuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGR5bmFtb0RiLmdldChwYXJhbXMpLnByb21pc2UoKTtcblxuICAgICAgaWYgKCFkYXRhLkl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiA0MDQsXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiBcIlBvc3Qgbm90IGZvdW5kXCIgfSksXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlOiBBUElHYXRld2F5UHJveHlSZXN1bHQgPSB7XG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgYm9keTogZGF0YS5JdGVtLmh0bWwsXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciByZWFkaW5nIGZyb20gRHluYW1vREJcIiwgZXJyb3IpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiSW50ZXJuYWwgU2VydmVyIEVycm9yXCIgfSksXG4gICAgfTtcbiAgfVxufTsiXX0=