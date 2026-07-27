import mongoose, { Schema, model, models } from "mongoose";

const ProductSchema = new Schema(
  {
    productName: String,
    description: String,
    price: { type: Number, required: true },
    productImages: [{ type: String }],
    category: { type: mongoose.Types.ObjectId, ref: "Catagory" },
    properties: { type: Object },
    sellerId: { type: mongoose.Types.ObjectId, ref: "User" },
    // Shipping dimensions — used for live carrier rate quotes at checkout.
    weight: { type: Number, default: 1 },
    length: { type: Number, default: 10 },
    width: { type: Number, default: 8 },
    height: { type: Number, default: 4 },
  },
  {
    timestamps: true,
  }
);

export const product = models.products || model("products", ProductSchema);
