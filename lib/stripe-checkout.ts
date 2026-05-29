export type StripeCheckoutPlan = "trial" | "one-time";

type CheckoutInput = {
  plan: StripeCheckoutPlan;
  origin: string;
};

const planCopy: Record<StripeCheckoutPlan, { name: string; mode: "subscription" | "payment"; amount: number }> = {
  trial: {
    name: "Tongue Test TCM Monthly Plan",
    mode: "subscription",
    amount: 799,
  },
  "one-time": {
    name: "Tongue Test TCM One-Time Full Reading",
    mode: "payment",
    amount: 699,
  },
};

export async function createStripeCheckoutSession({ plan, origin }: CheckoutInput) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return {
      demoAccess: process.env.NODE_ENV !== "production",
      message: "Stripe is not configured yet. Add STRIPE_SECRET_KEY in Vercel before launch.",
    };
  }

  const config = planCopy[plan];
  const params = new URLSearchParams();
  params.set("mode", config.mode);
  params.set("success_url", `${origin}/tongue-assessment?checkout=success&plan=${plan}`);
  params.set("cancel_url", `${origin}/tongue-assessment?checkout=cancelled`);
  params.set("allow_promotion_codes", "true");
  params.set("billing_address_collection", "auto");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(config.amount));
  params.set("line_items[0][price_data][product_data][name]", config.name);

  if (config.mode === "subscription") {
    params.set("line_items[0][price_data][recurring][interval]", "month");
    params.set("subscription_data[trial_period_days]", "14");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Stripe checkout failed: ${detail || response.statusText}`);
  }

  const session = await response.json();
  return {
    demoAccess: false,
    url: typeof session.url === "string" ? session.url : "",
  };
}
