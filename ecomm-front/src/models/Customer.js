import { Schema, model, models } from "mongoose";

const AddressSchema = new Schema({
  label: { type: String, default: "Home" },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalcode: { type: String, required: true },
  state: String,
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Not required — accounts created via Google have no password.
    password: String,
    image: String,
    phone: String,
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

export const Customer = models.Customer || model("Customer", CustomerSchema);