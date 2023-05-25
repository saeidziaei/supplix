import dynamoDb from "../../util/dynamodb";

export const handler = async () => {
  const topTenantId = "isocloud";
  const getParams = {
    TableName: process.env.TENANT_TABLE,
    Key: {
      tenantId: topTenantId,
    },
  };

  const existingItem = await dynamoDb.get(getParams);

  if (!existingItem.Item) {
    const newItemParams = {
      TableName: process.env.TENANT_TABLE,
      Item: {
        tenantId: topTenantId,
        tenantName: "Main Tenant",
        createdBy: "System",
        createdAt: Date.now(),
      },
      ConditionExpression: "attribute_not_exists(tenantId)", // Ensures tenantId doesn't already exist
    };

    await dynamoDb.put(newItemParams);

    return newItemParams.Item;
  } else {
    return "Item with tenantId 'GodFather' already exists.";
  }
};
