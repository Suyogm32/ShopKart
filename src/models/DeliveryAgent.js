import mongoose, { Schema, model, models } from "mongoose";

const DeliveryAgentSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    sellerId: { type: mongoose.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

export const DeliveryAgent = models.DeliveryAgent || model("DeliveryAgent", DeliveryAgentSchema);