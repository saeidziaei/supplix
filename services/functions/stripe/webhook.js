import Stripe from "stripe";
import dynamoDb from "../../util/dynamodb";
import httpResponse from "../../util/httpresponse";
import { getUser } from "../../util/handler";

const STRIPE_SIGNATURE_HEADER = "stripe-signature";

export const main = async (request, context) => {
  // would be cleaner to use custom lambda authorizer but it was hard to debug. TODO for later!
  const clientIP = request.requestContext.http.sourceIp;
  if (!isFromStripeIP(clientIP)) {
    return httpResponse("403", { msg: `Forbidden. Request denied` });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const endpointSecret = process.env.ENDPOINT_SECRET;

  try {
    console.info("Stripe webhook called");
    const sig = request.headers[STRIPE_SIGNATURE_HEADER];
    const stripe = new Stripe(stripeSecretKey);
    const event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      endpointSecret
    );


    if (event.type == "checkout.session.completed") {
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
        event.data.object.id,
        {
          expand: ["line_items"],
        }
      );
      const lineItems = sessionWithLineItems.line_items;

      // Save and process on stream trigger
      await saveStripeEvent({ ...event, lineItems });
    }
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return httpResponse("200", { msg: "Event already handled." });
    }

    return httpResponse("400", { msg: `Webhook Error: ${err.message}` });
  }

  return httpResponse("200", { msg: "Request handled successfully." });
};

async function saveStripeEvent(stripeEvent) {
  const params = {
    TableName: process.env.STRIPEEVENT_TABLE,
    Item: {
      stripeEventId: stripeEvent.id,
      stripeEvent: stripeEvent,
      createdAt: Date.now(), // Current Unix timestamp
      isProcessed: false,
    },
    ConditionExpression: "attribute_not_exists(stripeEventId)", // this is a safety measure against re-processing an event
  };

  await dynamoDb.put(params);

  return params.Item;
}

const allowedStripeWebhookIPs = [
  "3.18.12.63",
  "3.130.192.231",
  "13.235.14.237",
  "13.235.122.149",
  "18.211.135.69",
  "35.154.171.200",
  "52.15.183.38",
  "54.88.130.119",
  "54.88.130.237",
  "54.187.174.169",
  "54.187.205.235",
  "54.187.216.72",
];

const isFromStripeIP = (clientIP) => {
  return allowedStripeWebhookIPs.includes(clientIP);
};

