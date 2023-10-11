import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export const main = async (event, context) => {
  const basicPlanPriceId = process.env.BASIC_PLAN_PRICE_ID;
  const redPlanPriceId = process.env.RED_PLAN_PRICE_ID;

  console.log("start");
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
      console.log(record.eventName);
      if (record.eventName === "INSERT") {
        // see the record format at the bottom of this file
        const eventData = streamData.NewImage.stripeEvent.M.data.M.object.M;
        const customer_details = eventData.customer_details.M;
        const payment_status = eventData.payment_status.S;
        const lineItem = streamData.NewImage.stripeEvent.M.lineItems.M.data.L[0].M;
        const priceId = lineItem.price.M.id.S;
        const livemode = lineItem.price.M.livemode.BOOL;
        const contactPerson = customer_details.name.S;
        const contactEmail = customer_details.email.S;
        const contactNumber = customer_details.phone.S;
        const address = customer_details.address.M;
        const note = `Address: ${address.line1.S}, ${address.city.S}, ${address.state.S}`;
  
        console.log(payment_status, priceId, livemode, contactPerson, contactEmail, contactNumber, note);
 
        // create tenant
        // update record isProcessed =

        // const emailParams = {
        //   Destination: {
        //     ToAddresses: ["support@isocloud.com.au"],
        //   },
        //   Message: {
        //     Body: {
        //       Text: {
        //         Data: `Hi support!\n\nA new tenant has been created.
        //         \n\n 
        //         Payment Status: ${session.payment_status}\n
        //         Payment Status: ${stripeEvent.payment_status}\n
        //         Payment Status: ${stripeEvent.payment_status}\n
        //         `,
        //       },
        //     },
        //     Subject: { Data: "New Tenant" },
        //   },
        //   Source: "noreply@isocloud.com.au",
        // };

        // const client = new SESClient();

        // const command = new SendEmailCommand(emailParams);
        // const ret = await client.send(command);
        // console.log("Email sent successfully", ret);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
};

// *******************************************
// DynamoDB stream record format
// {
//     "stripeEventId": {
//       "S": "evt_1NzWDDK6bc3JGNzGAhI13WLw"
//     },
//     "createdAt": {
//       "N": "1696985498004"
//     },
//     "isProcessed": {
//       "BOOL": false
//     },
//     "stripeEvent": {
//       "M": {
//         "api_version": {
//           "S": "2023-08-16"
//         },
//         "created": {
//           "N": "1696906943"
//         },
//         "data": {
//           "M": {
//             "object": {
//               "M": {
//                 "after_expiration": {
//                   "NULL": true
//                 },
//                 "allow_promotion_codes": {
//                   "BOOL": false
//                 },
//                 "amount_subtotal": {
//                   "N": "69900"
//                 },
//                 "amount_total": {
//                   "N": "69900"
//                 },
//                 "automatic_tax": {
//                   "M": {
//                     "enabled": {
//                       "BOOL": false
//                     },
//                     "status": {
//                       "NULL": true
//                     }
//                   }
//                 },
//                 "billing_address_collection": {
//                   "S": "required"
//                 },
//                 "cancel_url": {
//                   "S": "https://stripe.com"
//                 },
//                 "client_reference_id": {
//                   "NULL": true
//                 },
//                 "consent": {
//                   "NULL": true
//                 },
//                 "consent_collection": {
//                   "M": {
//                     "promotions": {
//                       "S": "none"
//                     },
//                     "terms_of_service": {
//                       "S": "none"
//                     }
//                   }
//                 },
//                 "created": {
//                   "N": "1696906916"
//                 },
//                 "currency": {
//                   "S": "aud"
//                 },
//                 "currency_conversion": {
//                   "NULL": true
//                 },
//                 "customer": {
//                   "S": "cus_On6PkjJULn938g"
//                 },
//                 "customer_creation": {
//                   "S": "always"
//                 },
//                 "customer_details": {
//                   "M": {
//                     "address": {
//                       "M": {
//                         "city": {
//                           "S": "St Ives Chase"
//                         },
//                         "country": {
//                           "S": "AU"
//                         },
//                         "line1": {
//                           "S": "19 Windsor Place"
//                         },
//                         "line2": {
//                           "NULL": true
//                         },
//                         "postal_code": {
//                           "S": "2075"
//                         },
//                         "state": {
//                           "S": "NSW"
//                         }
//                       }
//                     },
//                     "email": {
//                       "S": "sziaei@gmail.com"
//                     },
//                     "name": {
//                       "S": "Samantha Fox"
//                     },
//                     "phone": {
//                       "S": "+61432331409"
//                     },
//                     "tax_exempt": {
//                       "S": "none"
//                     },
//                     "tax_ids": {
//                       "L": []
//                     }
//                   }
//                 },
//                 "customer_email": {
//                   "NULL": true
//                 },
//                 "custom_fields": {
//                   "L": []
//                 },
//                 "custom_text": {
//                   "M": {
//                     "shipping_address": {
//                       "NULL": true
//                     },
//                     "submit": {
//                       "NULL": true
//                     },
//                     "terms_of_service_acceptance": {
//                       "NULL": true
//                     }
//                   }
//                 },
//                 "expires_at": {
//                   "N": "1696993316"
//                 },
//                 "id": {
//                   "S": "cs_test_a16VG9kbsF1GCsN99U9tcGBC8KjlicbCDmXnlQIwIskw3hb8qyIM6AAJqW"
//                 },
//                 "invoice": {
//                   "S": "in_1NzWDAK6bc3JGNzGZYo524zo"
//                 },
//                 "invoice_creation": {
//                   "NULL": true
//                 },
//                 "livemode": {
//                   "BOOL": false
//                 },
//                 "locale": {
//                   "S": "en"
//                 },
//                 "metadata": {
//                   "M": {}
//                 },
//                 "mode": {
//                   "S": "subscription"
//                 },
//                 "object": {
//                   "S": "checkout.session"
//                 },
//                 "payment_intent": {
//                   "NULL": true
//                 },
//                 "payment_link": {
//                   "NULL": true
//                 },
//                 "payment_method_collection": {
//                   "S": "always"
//                 },
//                 "payment_method_configuration_details": {
//                   "M": {
//                     "id": {
//                       "S": "pmc_1NrZhXK6bc3JGNzGptw2cHzq"
//                     },
//                     "parent": {
//                       "NULL": true
//                     }
//                   }
//                 },
//                 "payment_method_options": {
//                   "NULL": true
//                 },
//                 "payment_method_types": {
//                   "L": [
//                     {
//                       "S": "card"
//                     },
//                     {
//                       "S": "link"
//                     }
//                   ]
//                 },
//                 "payment_status": {
//                   "S": "paid"
//                 },
//                 "phone_number_collection": {
//                   "M": {
//                     "enabled": {
//                       "BOOL": true
//                     }
//                   }
//                 },
//                 "recovered_from": {
//                   "NULL": true
//                 },
//                 "setup_intent": {
//                   "NULL": true
//                 },
//                 "shipping_address_collection": {
//                   "NULL": true
//                 },
//                 "shipping_cost": {
//                   "NULL": true
//                 },
//                 "shipping_details": {
//                   "NULL": true
//                 },
//                 "shipping_options": {
//                   "L": []
//                 },
//                 "status": {
//                   "S": "complete"
//                 },
//                 "submit_type": {
//                   "NULL": true
//                 },
//                 "subscription": {
//                   "S": "sub_1NzWDAK6bc3JGNzG4JD4zO0q"
//                 },
//                 "success_url": {
//                   "S": "https://stripe.com"
//                 },
//                 "total_details": {
//                   "M": {
//                     "amount_discount": {
//                       "N": "0"
//                     },
//                     "amount_shipping": {
//                       "N": "0"
//                     },
//                     "amount_tax": {
//                       "N": "0"
//                     }
//                   }
//                 },
//                 "url": {
//                   "NULL": true
//                 }
//               }
//             }
//           }
//         },
//         "id": {
//           "S": "evt_1NzWDDK6bc3JGNzGAhI13WLw"
//         },
//         "lineItems": {
//           "M": {
//             "data": {
//               "L": [
//                 {
//                   "M": {
//                     "amount_discount": {
//                       "N": "0"
//                     },
//                     "amount_subtotal": {
//                       "N": "69900"
//                     },
//                     "amount_tax": {
//                       "N": "0"
//                     },
//                     "amount_total": {
//                       "N": "69900"
//                     },
//                     "currency": {
//                       "S": "aud"
//                     },
//                     "description": {
//                       "S": "ISOCloud"
//                     },
//                     "id": {
//                       "S": "li_1NzWCmK6bc3JGNzG9TCR8u8f"
//                     },
//                     "object": {
//                       "S": "item"
//                     },
//                     "price": {
//                       "M": {
//                         "active": {
//                           "BOOL": true
//                         },
//                         "billing_scheme": {
//                           "S": "per_unit"
//                         },
//                         "created": {
//                           "N": "1695008384"
//                         },
//                         "currency": {
//                           "S": "aud"
//                         },
//                         "custom_unit_amount": {
//                           "NULL": true
//                         },
//                         "id": {
//                           "S": "price_1NrYJIK6bc3JGNzG7ncfa6bp"
//                         },
//                         "livemode": {
//                           "BOOL": false
//                         },
//                         "lookup_key": {
//                           "S": "ICP1"
//                         },
//                         "metadata": {
//                           "M": {}
//                         },
//                         "nickname": {
//                           "NULL": true
//                         },
//                         "object": {
//                           "S": "price"
//                         },
//                         "product": {
//                           "S": "prod_Oes3Ppy2scbFM5"
//                         },
//                         "recurring": {
//                           "M": {
//                             "aggregate_usage": {
//                               "NULL": true
//                             },
//                             "interval": {
//                               "S": "month"
//                             },
//                             "interval_count": {
//                               "N": "1"
//                             },
//                             "trial_period_days": {
//                               "NULL": true
//                             },
//                             "usage_type": {
//                               "S": "licensed"
//                             }
//                           }
//                         },
//                         "tax_behavior": {
//                           "S": "unspecified"
//                         },
//                         "tiers_mode": {
//                           "NULL": true
//                         },
//                         "transform_quantity": {
//                           "NULL": true
//                         },
//                         "type": {
//                           "S": "recurring"
//                         },
//                         "unit_amount": {
//                           "N": "69900"
//                         },
//                         "unit_amount_decimal": {
//                           "S": "69900"
//                         }
//                       }
//                     },
//                     "quantity": {
//                       "N": "1"
//                     }
//                   }
//                 }
//               ]
//             },
//             "has_more": {
//               "BOOL": false
//             },
//             "object": {
//               "S": "list"
//             },
//             "url": {
//               "S": "/v1/checkout/sessions/cs_test_a16VG9kbsF1GCsN99U9tcGBC8KjlicbCDmXnlQIwIskw3hb8qyIM6AAJqW/line_items"
//             }
//           }
//         },
//         "livemode": {
//           "BOOL": false
//         },
//         "object": {
//           "S": "event"
//         },
//         "pending_webhooks": {
//           "N": "1"
//         },
//         "request": {
//           "M": {
//             "id": {
//               "NULL": true
//             },
//             "idempotency_key": {
//               "NULL": true
//             }
//           }
//         },
//         "type": {
//           "S": "checkout.session.completed"
//         }
//       }
//     }
//   }
