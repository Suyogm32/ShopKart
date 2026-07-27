const SHIPPO_BASE_URL = "https://api.goshippo.com";

const shippoRequest = async (path, { method = "POST", body } = {}, errorLabel) => {
  const resp = await fetch(`${SHIPPO_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Shippo API error response:", JSON.stringify(data));
    throw new Error(data?.detail || JSON.stringify(data) || errorLabel);
  }
  return data;
};

export const shippoProvider = {
  name: "shippo",

  getRates: async ({ addressFrom, addressTo, parcel }) => {
    const shipment = await shippoRequest(
      "/shipments/",
      {
        body: {
          address_from: addressFrom,
          address_to: addressTo,
          parcels: [parcel],
          async: false,
        },
      },
      "Failed to fetch shipping rates."
    );

    // Note: a quoted rate isn't guaranteed to be purchasable — carriers like
    // UPS/DHL need explicit activation in the Shippo dashboard and will fail
    // at transaction time with "account is not yet registered". There's no
    // reliable pre-purchase signal for this (master accounts don't appear in
    // /carrier_accounts/), so we surface the provider's error instead.
    return {
      shipmentId: shipment.object_id,
      messages: (shipment.messages || []).map((m) => m.text || String(m)),
      hiddenRateCount: 0,
      rates: (shipment.rates || []).map((r) => ({
        rateId: r.object_id,
        provider: r.provider,
        service: r.servicelevel?.name,
        amount: r.amount,
        currency: r.currency,
        estimatedDays: r.estimated_days,
      })),
    };
  },

  buyLabel: async ({ rateId }) => {
    const transaction = await shippoRequest(
      "/transactions/",
      { body: { rate: rateId, label_file_type: "PDF", async: false } },
      "Failed to purchase shipping label."
    );

    if (transaction.status !== "SUCCESS") {
      const reason = transaction.messages?.map((m) => m.text).join(" ") || "Unknown error.";
      throw new Error(reason);
    }

    return {
      transactionId: transaction.object_id,
      trackingNumber: transaction.tracking_number,
      labelUrl: transaction.label_url,
      trackingStatus: transaction.tracking_status || "PURCHASED",
    };
  },
};
