const SHIPPO_BASE_URL = "https://api.goshippo.com";

const shippoRequest = async (path, body, errorLabel) => {
  const resp = await fetch(`${SHIPPO_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
        address_from: addressFrom,
        address_to: addressTo,
        parcels: [parcel],
        async: false,
      },
      "Failed to fetch shipping rates."
    );

    return {
      shipmentId: shipment.object_id,
      messages: (shipment.messages || []).map((m) => m.text || String(m)),
      rates: (shipment.rates || []).map((r) => ({
        rateId: r.object_id,
        provider: r.provider,
        service: r.servicelevel?.name,
        amount: Number(r.amount),
        currency: r.currency,
        estimatedDays: r.estimated_days,
      })),
    };
  },
};
