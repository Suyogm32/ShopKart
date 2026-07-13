import mongoose, { Schema, models, model } from "mongoose";

const CatergorySchema = new Schema({
  catagoryName: { type: String, required: true },
  parentCatagory: { type: mongoose.Types.ObjectId, ref: "Catagory" },
  properties: [{ type: Object }],
  sellerId: { type: mongoose.Types.ObjectId, ref: "User", index: true },
});

export const Catagory = models?.Catagory || model("Catagory", CatergorySchema);
