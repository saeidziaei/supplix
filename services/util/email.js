import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export  async function sendEmail  (to, subject, body, from = "noreply@isocloud.com.au")  {

    const emailParams = {
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Body: {
            Text: {
              Data: body,
            },
          },
          Subject: { Data: subject },
        },
        Source: from,
      };

      const client = new SESClient();

      const command = new SendEmailCommand(emailParams);
      return await client.send(command);
};
