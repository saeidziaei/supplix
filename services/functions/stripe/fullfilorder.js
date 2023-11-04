import * as uuid from "uuid";
import dynamoDb from "../../util/dynamodb";
import { createNewUser } from "../user/create";
import { generateRandomPassword } from "../../../frontend/src/lib/helpers";
import { sendEmail } from "../../util/email";
import { getPlanName } from "../../util/plan";

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
      if (!streamData.NewImage) {
        continue; // skip deletion
      }

      if (record.eventName === "INSERT") {
        // see the record format at the bottom of this file
        const eventData = streamData.NewImage.stripeEvent.M.data.M.object.M;
        const stripeEventId = streamData.NewImage.stripeEventId.S;
        const customer_details = eventData.customer_details.M;
        const paymentStatus = eventData.payment_status.S;
        const lineItem =
          streamData.NewImage.stripeEvent.M.lineItems.M.data.L[0].M;
        const custom_fields = eventData.custom_fields.L;

        const priceId = lineItem.price.M.id.S;
        const livemode = lineItem.price.M.livemode.BOOL;
        const contactPerson = customer_details.name.S;
        const contactEmail = customer_details.email.S;
        const contactNumber = customer_details.phone.S;
        const address = customer_details.address.M;
        const note = `Address: ${address.line1.S}, ${address.city.S}, ${address.state.S}`;
        const companyName = custom_fields[0].M.text.M.value.S;

        const plan = getPlanName(priceId);

        // 1. create tenant
        const tenantId = uuid.v1();

        const tenantPutParams = {
          TableName: process.env.TENANT_TABLE,
          Item: {
            tenantId,
            tenantName: companyName,
            contactPerson,
            contactEmail,
            contactNumber,
            note,
            priceId,
            paymentStatus,
            createdBy: "system",
            createdAt: Date.now(),
            stripeEventId, // link this tenant to the stripe event
          },
        };

        // 2. mark event as processed
        const streipeEventUpdateParams = {
          TableName: process.env.STRIPEEVENT_TABLE,

          Key: {
            stripeEventId: stripeEventId,
          },
          UpdateExpression: `SET 
            isProcessed = :isProcessed, 
            tenantId = :tenantId`,
          ExpressionAttributeValues: {
            ":isProcessed": true,
            ":tenantId": tenantId, // link the event to tenant
          },
          ReturnValues: "ALL_NEW",
        };

        const transactParams = {
          TransactItems: [
            { Put: tenantPutParams },
            { Update: streipeEventUpdateParams },
          ],
        };
        await dynamoDb.transactWrite(transactParams);

        // 3. Create admin user
        let isUserCreated = false;
        try {
          const password = generateRandomPassword();
          await createNewUser(
            tenantId,
            true,
            contactEmail,
            password,
            contactPerson,
            "",
            "",
            "",
            "system"
          );
          isUserCreated = true;
        } catch (e) {
          console.log("User could not be created", e);
        }

        // 4. Notify admin
        const userInfo = isUserCreated
          ? `Admin user: ${contactEmail}`
          : `WARNING - The admin user for this tenant could not be created. Please check the emaile address ${contactEmail} isn't reused.`;
        const to = "support@isocloud.com.au";
        const body = `Hi support!\n\nA new tenant has been created through subscription.
            \n${userInfo}
            \n\n 
            Tenant: ${companyName}\n
            Payment Status: ${paymentStatus}\n
            Plan: ${plan}\n
            Livemode: ${livemode}\n
            `;
        const subject = `New Tenant ${companyName}`;

        const ret = await sendEmail(to, subject, body);
        console.log("Email sent successfully", ret);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
};



// *******************************************
// DynamoDB stream record format
// {
//   "stripeEventId": {
//     "S": "evt_1NzvhLK6bc3JGNzGeLPh399t"
//   },
//   "createdAt": {
//     "N": "1697004912915"
//   },
//   "isProcessed": {
//     "BOOL": false
//   },
//   "stripeEvent": {
//     "M": {
//       "api_version": {
//         "S": "2023-08-16"
//       },
//       "created": {
//         "N": "1697004911"
//       },
//       "data": {
//         "M": {
//           "object": {
//             "M": {
//               "after_expiration": {
//                 "NULL": true
//               },
//               "allow_promotion_codes": {
//                 "BOOL": false
//               },
//               "amount_subtotal": {
//                 "N": "0"
//               },
//               "amount_total": {
//                 "N": "0"
//               },
//               "automatic_tax": {
//                 "M": {
//                   "enabled": {
//                     "BOOL": false
//                   },
//                   "status": {
//                     "NULL": true
//                   }
//                 }
//               },
//               "billing_address_collection": {
//                 "S": "required"
//               },
//               "cancel_url": {
//                 "S": "https://stripe.com"
//               },
//               "client_reference_id": {
//                 "NULL": true
//               },
//               "consent": {
//                 "NULL": true
//               },
//               "consent_collection": {
//                 "M": {
//                   "promotions": {
//                     "S": "none"
//                   },
//                   "terms_of_service": {
//                     "S": "none"
//                   }
//                 }
//               },
//               "created": {
//                 "N": "1697004858"
//               },
//               "currency": {
//                 "S": "aud"
//               },
//               "currency_conversion": {
//                 "NULL": true
//               },
//               "customer": {
//                 "S": "cus_OnWkZNHiyZXxyQ"
//               },
//               "customer_creation": {
//                 "S": "always"
//               },
//               "customer_details": {
//                 "M": {
//                   "address": {
//                     "M": {
//                       "city": {
//                         "S": "St Ives Chase"
//                       },
//                       "country": {
//                         "S": "AU"
//                       },
//                       "line1": {
//                         "S": "19 Windsor Place"
//                       },
//                       "line2": {
//                         "NULL": true
//                       },
//                       "postal_code": {
//                         "S": "2075"
//                       },
//                       "state": {
//                         "S": "NSW"
//                       }
//                     }
//                   },
//                   "email": {
//                     "S": "kereshmehj@gmail.com"
//                   },
//                   "name": {
//                     "S": "KJ Java"
//                   },
//                   "phone": {
//                     "S": "+61413975013"
//                   },
//                   "tax_exempt": {
//                     "S": "none"
//                   },
//                   "tax_ids": {
//                     "L": []
//                   }
//                 }
//               },
//               "customer_email": {
//                 "NULL": true
//               },
//               "custom_fields": {
//                 "L": [
//                   {
//                     "M": {
//                       "key": {
//                         "S": "companyname"
//                       },
//                       "label": {
//                         "M": {
//                           "custom": {
//                             "S": "Company name"
//                           },
//                           "type": {
//                             "S": "custom"
//                           }
//                         }
//                       },
//                       "optional": {
//                         "BOOL": false
//                       },
//                       "text": {
//                         "M": {
//                           "maximum_length": {
//                             "NULL": true
//                           },
//                           "minimum_length": {
//                             "NULL": true
//                           },
//                           "value": {
//                             "S": "Best Company"
//                           }
//                         }
//                       },
//                       "type": {
//                         "S": "text"
//                       }
//                     }
//                   }
//                 ]
//               },
//               "custom_text": {
//                 "M": {
//                   "shipping_address": {
//                     "NULL": true
//                   },
//                   "submit": {
//                     "NULL": true
//                   },
//                   "terms_of_service_acceptance": {
//                     "NULL": true
//                   }
//                 }
//               },
//               "expires_at": {
//                 "N": "1697091258"
//               },
//               "id": {
//                 "S": "cs_test_a1D3Gkdel5iVG225OYAudrebkBtKTichNGBIjnlZJ3aziT16URzIYRmcRG"
//               },
//               "invoice": {
//                 "S": "in_1NzvhKK6bc3JGNzGxnfOMnpb"
//               },
//               "invoice_creation": {
//                 "NULL": true
//               },
//               "livemode": {
//                 "BOOL": false
//               },
//               "locale": {
//                 "S": "en"
//               },
//               "metadata": {
//                 "M": {}
//               },
//               "mode": {
//                 "S": "subscription"
//               },
//               "object": {
//                 "S": "checkout.session"
//               },
//               "payment_intent": {
//                 "NULL": true
//               },
//               "payment_link": {
//                 "NULL": true
//               },
//               "payment_method_collection": {
//                 "S": "always"
//               },
//               "payment_method_configuration_details": {
//                 "M": {
//                   "id": {
//                     "S": "pmc_1NrZhXK6bc3JGNzGptw2cHzq"
//                   },
//                   "parent": {
//                     "NULL": true
//                   }
//                 }
//               },
//               "payment_method_options": {
//                 "M": {}
//               },
//               "payment_method_types": {
//                 "L": [
//                   {
//                     "S": "card"
//                   },
//                   {
//                     "S": "link"
//                   }
//                 ]
//               },
//               "payment_status": {
//                 "S": "paid"
//               },
//               "phone_number_collection": {
//                 "M": {
//                   "enabled": {
//                     "BOOL": true
//                   }
//                 }
//               },
//               "recovered_from": {
//                 "NULL": true
//               },
//               "setup_intent": {
//                 "NULL": true
//               },
//               "shipping_address_collection": {
//                 "NULL": true
//               },
//               "shipping_cost": {
//                 "NULL": true
//               },
//               "shipping_details": {
//                 "NULL": true
//               },
//               "shipping_options": {
//                 "L": []
//               },
//               "status": {
//                 "S": "complete"
//               },
//               "submit_type": {
//                 "NULL": true
//               },
//               "subscription": {
//                 "S": "sub_1NzvhKK6bc3JGNzGA6JACNbW"
//               },
//               "success_url": {
//                 "S": "https://stripe.com"
//               },
//               "total_details": {
//                 "M": {
//                   "amount_discount": {
//                     "N": "0"
//                   },
//                   "amount_shipping": {
//                     "N": "0"
//                   },
//                   "amount_tax": {
//                     "N": "0"
//                   }
//                 }
//               },
//               "url": {
//                 "NULL": true
//               }
//             }
//           }
//         }
//       },
//       "id": {
//         "S": "evt_1NzvhLK6bc3JGNzGeLPh399t"
//       },
//       "lineItems": {
//         "M": {
//           "data": {
//             "L": [
//               {
//                 "M": {
//                   "amount_discount": {
//                     "N": "0"
//                   },
//                   "amount_subtotal": {
//                     "N": "0"
//                   },
//                   "amount_tax": {
//                     "N": "0"
//                   },
//                   "amount_total": {
//                     "N": "0"
//                   },
//                   "currency": {
//                     "S": "aud"
//                   },
//                   "description": {
//                     "S": "ISOCloud Red"
//                   },
//                   "id": {
//                     "S": "li_1NzvgUK6bc3JGNzGj44JMYS1"
//                   },
//                   "object": {
//                     "S": "item"
//                   },
//                   "price": {
//                     "M": {
//                       "active": {
//                         "BOOL": true
//                       },
//                       "billing_scheme": {
//                         "S": "per_unit"
//                       },
//                       "created": {
//                         "N": "1695008534"
//                       },
//                       "currency": {
//                         "S": "aud"
//                       },
//                       "custom_unit_amount": {
//                         "NULL": true
//                       },
//                       "id": {
//                         "S": "price_1NrYLiK6bc3JGNzGlfbhH0vH"
//                       },
//                       "livemode": {
//                         "BOOL": false
//                       },
//                       "lookup_key": {
//                         "NULL": true
//                       },
//                       "metadata": {
//                         "M": {}
//                       },
//                       "nickname": {
//                         "NULL": true
//                       },
//                       "object": {
//                         "S": "price"
//                       },
//                       "product": {
//                         "S": "prod_Oes5abI8MN3Bb7"
//                       },
//                       "recurring": {
//                         "M": {
//                           "aggregate_usage": {
//                             "NULL": true
//                           },
//                           "interval": {
//                             "S": "month"
//                           },
//                           "interval_count": {
//                             "N": "1"
//                           },
//                           "trial_period_days": {
//                             "NULL": true
//                           },
//                           "usage_type": {
//                             "S": "licensed"
//                           }
//                         }
//                       },
//                       "tax_behavior": {
//                         "S": "unspecified"
//                       },
//                       "tiers_mode": {
//                         "NULL": true
//                       },
//                       "transform_quantity": {
//                         "NULL": true
//                       },
//                       "type": {
//                         "S": "recurring"
//                       },
//                       "unit_amount": {
//                         "N": "119900"
//                       },
//                       "unit_amount_decimal": {
//                         "S": "119900"
//                       }
//                     }
//                   },
//                   "quantity": {
//                     "N": "1"
//                   }
//                 }
//               }
//             ]
//           },
//           "has_more": {
//             "BOOL": false
//           },
//           "object": {
//             "S": "list"
//           },
//           "url": {
//             "S": "/v1/checkout/sessions/cs_test_a1D3Gkdel5iVG225OYAudrebkBtKTichNGBIjnlZJ3aziT16URzIYRmcRG/line_items"
//           }
//         }
//       },
//       "livemode": {
//         "BOOL": false
//       },
//       "object": {
//         "S": "event"
//       },
//       "pending_webhooks": {
//         "N": "1"
//       },
//       "request": {
//         "M": {
//           "id": {
//             "NULL": true
//           },
//           "idempotency_key": {
//             "NULL": true
//           }
//         }
//       },
//       "type": {
//         "S": "checkout.session.completed"
//       }
//     }
//   }
// }
