"use client";

import { loadStripe } from "@stripe/stripe-js";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CartItemsType, ShippingFormInputs } from "@repo/types";
import CheckoutForm from "./CheckoutForm";
import useCartStore from "@/stores/cartStore";

const stripePromise = loadStripe(
  "pk_test_51TUSJw8hCKvzSSAoQFWRxMfVEvpisioiBPp4vBnjsdhjFZwsnCscfNxsjSLyWwxTgpbNkgAhZ5Ie0iyDONg2tFuV00YoCoKMN5"
);

const fetchClientSecret = async (cart: CartItemsType, token: string): Promise<string> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL}/sessions/create-checkout-session`,
    {
      method: "POST",
      body: JSON.stringify({ cart }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const json = await response.json();
  const secret = json.clientSecret || json.checkoutSessionClientSecret;
  if (!secret) {
    throw new Error("Client secret not returned by payment service");
  }
  return secret;
};

const StripePaymentForm = ({
  shippingForm,
}: {
  shippingForm: ShippingFormInputs;
}) => {
  const { cart } = useCartStore();
  const [token, setToken] = useState<string | null>(null);
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getToken().then((tok) => setToken(tok));
    }
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return <div className="flex items-center justify-center p-6 text-sm text-gray-500">Loading checkout...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-3 border border-red-100 rounded-lg bg-red-50/50">
        <p className="text-red-600 font-medium text-sm">Please sign in to proceed with payment.</p>
      </div>
    );
  }

  if (!token) {
    return <div className="flex items-center justify-center p-6 text-sm text-gray-500">Loading payment session...</div>;
  }

  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      options={{ clientSecret: fetchClientSecret(cart, token) }}
    >
      <CheckoutForm shippingForm={shippingForm} />
    </CheckoutElementsProvider>
  );
};

export default StripePaymentForm;