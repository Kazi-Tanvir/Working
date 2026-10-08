import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { clerkMiddleware } from "@hono/clerk-auth";
import { cors } from "hono/cors";
import sessioRoute from "./routes/session.route.js";
import webhookRoute from "./routes/webhook.route.js";
import { producer, consumer } from "./utils/kafka.js";
import { runKafkaSubscriptions } from "./utils/subscriptions.js";

const app = new Hono();

app.use("*", clerkMiddleware());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3002"],
  }),
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// app.post('/create-stripe-product', async (c) => {
// const res = await stripe.products.create({
//   "id": "prod_123",
//   "name": "T-shirt",
//   "description": "Comfortable cotton t-shirt",
//   default_price_data: {
//     currency: 'usd',
//     unit_amount: 2000,
//   },
// })
// return c.json(res)
// });

// app.get('/stripe-product-price', async (c) => {
//   const res = await stripe.prices.list({ product: 'prod_123' })
//   return c.json(res)
// });

app.route("/sessions", sessioRoute);
app.route("/webhook", webhookRoute);

app.post("/", (c) => {
  return c.text("Payment service received a request");
});

const start = async () => {
  try {
    await Promise.all([
      producer.connect(),
      consumer.connect(),
    ]);
    await runKafkaSubscriptions();
    serve(
      {
        fetch: app.fetch,
        port: 8002,
      },
      (info) => {
        console.log(`Payment service is running on port 8002`);
      },
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};
start();
