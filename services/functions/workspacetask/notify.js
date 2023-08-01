import handler from "../../util/handler";
import { SESClient, SendEmailCommand  } from "@aws-sdk/client-ses";

export const main =  async (event, context) => {

    event.Records.forEach((record, index) => {
      const dynamodbData = record.dynamodb;
      console.log(`Record ${index + 1}:`, JSON.stringify(dynamodbData));
    });
  
const client = new SESClient();

const params = {
  Source: 'noreply@isocloud.com.au', // The email address you want to send the email from
  Destination: {
    ToAddresses: ['support@isocloud.com.au'], // The email address you want to send the email to
  },
  Message: {
    Subject: {
      Data: 'Dummy Email', // The subject of the email
    },
    Body: {
      Text: {
        Data: 'This is a dummy email sent using AWS SES!', // The body of the email
      },
    },
  },
};

const command = new SendEmailCommand(params);
console.log("command", command);
try {
    const ret = await client.send(command);
    console.log('Email sent successfully', ret);
    // process data.
  } catch (error) {
    console.error(error);
  } finally {
    // finally.
  }
  



}
