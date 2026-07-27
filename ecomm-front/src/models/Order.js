import mongoose, { Schema, model, models } from "mongoose";

const OrderSchema = new Schema(
  {
    line_items: Object,
    Name: String,
    Email: String,
    Address: String,
    City: String,
    Postalcode: String,
    State: String,
    Country: String,
    Paid: Boolean,
    subtotal: Number,
    tax: Number,
    shipping: Number,
    total: Number,
    paymentIntentId: String,
    status: { type: String, default: "placed" },
    cancelledAt: Date,
    refundId: String,
    customerId: { type: mongoose.Types.ObjectId, ref: "Customer", index: true },
  },
  {
    timestamps: true,
  }
);

export const Order = models.Order || model("Order", OrderSchema);
