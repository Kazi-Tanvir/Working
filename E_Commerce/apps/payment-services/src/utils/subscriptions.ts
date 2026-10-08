import { StripeProductType } from "@repo/types";
import { consumer } from "./kafka";
import { createStripeProduct, deleteStripeProduct } from "./stripeProducts";

export const runKafkaSubscriptions = async () => {
  await consumer.subscribe([
    {
      topicName: "product.created",
      topicHandler: async (product: StripeProductType) => {
        console.log("Received message : product.created", product);
        await createStripeProduct(product);
      },
    },
    {
      topicName: "product.deleted",
      topicHandler: async (productId: number) => {
        console.log("Received message : product.deleted", productId);
        await deleteStripeProduct(productId);
      },
    },
  ]);
};