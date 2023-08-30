import { getUser } from "../../util/handler";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export const main = async (event, context) => {
  const stage = process.env.STAGE;

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

      if (
        streamData.NewImage.isRecurring &&
        streamData.NewImage.isRecurring.S === "Y"
      ) {
        continue; // skip recurring tasks
      }

      if (
        record.eventName === "INSERT" ||
        (record.eventName === "MODIFY" && isUserIdChanged(streamData))
      ) {
        const userId = streamData.NewImage.userId.S;
        const workspaceId = streamData.NewImage.workspaceId.S;
        const taskId = streamData.NewImage.taskId.S;
        const taskName = streamData.NewImage.taskName.S;

        // Fetch user details using getUser function
        if (!userId || userId === "-1") {
          continue; // skip if no owner
        }
        const user = await getUser(userId);

        const emailParams = {
          Destination: {
            ToAddresses: [
              stage === "prod" ? user.email : "support@isocloud.com.au",
            ],
          },
          Message: {
            Body: {
              Text: {
                Data: `Hi ${
                  user.firstName
                },\n\nA new task is assigned to you.\n ${taskName}\nSee more details here: https://app.isocloud.com.au/workspace/${workspaceId}/task/${taskId} 
                ${
                  stage === "prod"
                    ? ""
                    : `Stage: ${stage}\n\nShould have been sent to ${user.email}`
                }`,
              },
            },
            Subject: { Data: "New Task Assigned" },
          },
          Source: "noreply@isocloud.com.au",
        };

        const client = new SESClient();

        const command = new SendEmailCommand(emailParams);
        const ret = await client.send(command);
        console.log("Email sent successfully", ret);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
};

function isUserIdChanged(input) {
  if (!input.NewImage || !input.NewImage.userId) {
    return false;
  }

  const oldUserId = input.OldImage.userId.S;
  const newUserId = input.NewImage.userId.S;

  return oldUserId !== newUserId;
}