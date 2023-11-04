export function getPlanName(priceId) {
  const basicPlanPriceId = process.env.BASIC_PLAN_PRICE_ID;
  const redPlanPriceId = process.env.RED_PLAN_PRICE_ID;

  let plan = "Unknown";
  switch (priceId) {
    case basicPlanPriceId:
      plan = "ISOCloud Basic";
      break;

    case redPlanPriceId:
      plan = "ISOCloud Red";
      break;

    default:
      break; 
  }

  return plan;
}
