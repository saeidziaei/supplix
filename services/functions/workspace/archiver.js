import dynamoDb from "../../util/dynamodb";

export const main = async (event, context) => {
  for (const record of event.Records) {
    try {
      const streamData = record.dynamodb;
      if (!streamData) {
        console.warn(
          "[WARNING]",
          "DynamoDB data is missing in this record.",
          record
        );
        continue;
      }

      //  check that this is a delete event
      if (streamData.OldImage && !streamData.NewImage) {

      const tenant = streamData.OldImage.tenant.S;

      const putParams = {
        TableName: process.env.DELETEDARCHIVE_TABLE,
        Item: {
          tenant: tenant,
          deletedAt: Date.now(),
          recordType: "Workspace",
          record: streamData.OldImage,
        },
      };
      await dynamoDb.put(putParams);
    } else {
      console.log("This is not a delete event, do nothing")
    }
    } catch (error) {
      console.error("Error:", error);
    }
  }
};
