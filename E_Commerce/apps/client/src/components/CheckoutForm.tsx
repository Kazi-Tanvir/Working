"use client";

import { ShippingFormInputs } from "@repo/types";
import { PaymentElement, useCheckout } from "@stripe/react-stripe-js/checkout";
import { ConfirmError } from "@stripe/stripe-js";
import { useState } from "react";

const CheckoutForm = ({
  shippingForm,
}: {
  shippingForm: ShippingFormInputs;
}) => {
  const checkoutResult = useCheckout();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ConfirmError | null>(null);

  const handleClick = async () => {
    if (checkoutResult.type !== "success") return;
    const checkout = checkoutResult.checkout;   
    setLoading(true);
    try {
        await checkout.updateEmail(shippingForm.email);
        await checkout.updateShippingAddress({
          name: shippingForm.name,
          address: {
            line1: shippingForm.address,
            city: shippingForm.city,
            country: "US",
          },
        });

        const res = await checkout.confirm();
        if (res.type === "error") {
          setError(res.error);
        }
    } catch (e: any) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      <PaymentElement options={{ layout: "accordion" }} />
      <button
        disabled={loading}
        onClick={handleClick}
        className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-medium p-2.5 rounded-lg cursor-pointer transition-all duration-200"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
      {error && <div className="text-red-500 text-sm mt-2">{error.message}</div>}
    </div>
  );
};

export default CheckoutForm;