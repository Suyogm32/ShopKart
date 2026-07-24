import mongoose, { Schema, model, models } from "mongoose";

const BackOrderSchema = new Schema(
  {
    productName: String,
    quantity: Number,
    price: Number,
    address: String,
    postalCode: String,
    paid: Boolean,
    sellerId: { type: mongoose.Types.ObjectId, ref: "User", index: true },
    orderId: { type: mongoose.Types.ObjectId, ref: "Order", index: true },
    delivered: Boolean,
  },
  {
    timestamps: true,
  }
);

export const backOrders = models.backOrders || model("backOrders", BackOrderSchema);
