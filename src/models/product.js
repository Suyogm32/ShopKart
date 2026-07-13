import mongoose, { Schema, model, models } from "mongoose";

const ProductSchema = new Schema(
  {
    productName: String,
    description: String,
    price: { type: Number, required: true },
    productImages: [{ type: String }],
    category: { type: mongoose.Types.ObjectId, ref: "Catagory", index: true },
    properties: { type: Object },
    sellerId: { type: mongoose.Types.ObjectId, ref: "User", index: true },
  },
  {
    timestamps: true,
  }
);

export const product = models.products || model("products", ProductSchema);
