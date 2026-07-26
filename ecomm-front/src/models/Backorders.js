import mongoose, { Schema, model, models } from "mongoose";

const BackOrderSchema = new Schema(
  {
    productName: String,
    quantity: Number,
    price: Number,
    address: String,
    city: String,
    postalCode: String,
    paid: Boolean,
    sellerId: { type: mongoose.Types.ObjectId, ref: "User" },
    orderId: { type: mongoose.Types.ObjectId, ref: "Order" },
    delivered: Boolean,
  },
  {
    timestamps: true,
  }
);

export const backOrders = models.backOrders || model("backOrders", BackOrderSchema);
