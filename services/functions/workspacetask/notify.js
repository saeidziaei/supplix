import  { getUser } from "../../util/handler";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export const main = async (event, context) => {
  try {
    const stage = process.env.STAGE;
    
    for (const record of event.Records) {
      const streamData = record.dynamodb;

      if (streamData.NewImage.isRecurring && streamData.NewImage.isRecurring.S === "Y") {
        continue; // skip recurring tasks
      }

      if (
        record.eventName === "INSERT" ||
        (record.eventName === "MODIFY" && isUserIdChanged(streamData))
      ) {
        const userId = streamData.NewImage.userId.S;
        const workspaceId = streamData.NewImage.workspaceId.S;
        const taskId = streamData.NewImage.taskId.S;

        // Fetch user details using getUser function
        const user = await getUser(userId);

        const emailParams = {
          Destination: {
            ToAddresses: [stage === "prod" ? user.email : "support@isocloud.com.au"],
          },
          Message: {
            Body: {
              Text: {
                Data: `Hi ${user.firstName},\n\nA new task is assigned to you.  You can access it here: https://isocloud.com.au/workspace/${workspaceId}/task/${taskId} 
                ${stage === "prod" ? "" : `Stage: ${stage}\n\nShould have been sent to ${user.email}`}`,
              },
            },
            Subject: { Data: "New Task Assigned" },
          },
          Source: "noreply@isocloud.com.au", // Replace with your sender email
        };

        const client = new SESClient();

        const command = new SendEmailCommand(emailParams);
        const ret = await client.send(command);
        console.log("Email sent successfully", ret);
      }
    }
  } catch (error) {
    console.error("Error:", error);
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
