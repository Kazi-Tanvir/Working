import { Hono } from "hono";
import Stripe from "stripe";
import stripe from "../utils/stripe";

const webhookRoute = new Hono();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// Mock message broker producer for sending payment events.
const producer = {
  send: (topic: string, message: any) => {
    console.log(`[Mock Message Broker] Sent to ${topic}:`, JSON.stringify(message, null, 2));
  }
};

webhookRoute.post("/stripe", async (c) => {
  const rawBody = await c.req.text();
  const sig = c.req.header("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret);
  } catch (error) {
    console.log("Webhook verification failed !");
    return c.json({ error: "Webhook verification failed !" }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;

      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id
      );
      // TODO: CREATE ORDER
      producer.send("payment.successful", {
        value: {
          userId: session.client_reference_id,
          email: session.customer_details?.email,
          amount: session.amount_total,
          status: session.payment_status === "paid" ? "success" : "failed",
          products: lineItems.data.map((item) => ({
            name: item.description,
            quantity: item.quantity,
            price: item.price?.unit_amount,
          })),
        },
      });

      break;

    default:
      break;
  }
  return c.json({ received: true });
});

export default webhookRoute;