import mongoose, { Schema, model, models } from "mongoose";

const ProductSchema = new Schema(
  {
    productName: String,
    description: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    productImages: [{ type: String }],
    category: { type: mongoose.Types.ObjectId, ref: "Catagory", index: true },
    properties: { type: Object },
    sellerId: { type: mongoose.Types.ObjectId, ref: "User", index: true },
    // Shipping dimensions — used for live carrier rate quotes at checkout.
    // Defaults keep pre-existing products quotable until a seller fills these in.
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
