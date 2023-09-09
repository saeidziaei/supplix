import dynamoDb from "../../util/dynamodb";

export const handler = async () => {
  const scanParams = {
    TableName: process.env.FORM_TABLE,
  };

  try {
    const scanResult = await dynamoDb.scan(scanParams);

    // Loop through each item in the scan result
    for (const item of scanResult.Items) {
      if (!item.hasOwnProperty("userId")) {
        // If userId attribute is missing, set it to "-1"
        const updateParams = {
          TableName: process.env.FORM_TABLE,
          Key: {
            tenant_workspaceId: item.tenant_workspaceId,
            formId: item.formId,
          },
          UpdateExpression: "SET userId = :userId",
          ExpressionAttributeValues: {
            ":userId": "-1",
          },
        };

        await dynamoDb.update(updateParams).promise();
      }
    }

  } catch (error) {
    return "Error updating userId attributes";
  }
};
