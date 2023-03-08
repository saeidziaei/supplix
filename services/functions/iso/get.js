import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.ISO_TABLE,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    Key: {
      tenant: tenant, 
      isoId: 'top-level', 
    },
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    // throw new Error("Item not found.");
    // as we now have one and only one top level process, the first time just return an empty tree
    return {
      tree: {
        guid: "0",
        title: "Top level",
        content: "",
        children: [],
      },
    };
  }
  // Return the retrieved item
  return result.Item;
});

