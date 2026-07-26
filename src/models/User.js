const { Schema, models, model } = require("mongoose");

const UserSchema = new Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    address: String,
    city: String,
    postalcode: String,
    state: String,
    country: String,
    password: String,
    businessType: String,
    gstin: String,
    storeName: String,
    logoUrl: String,
    vacationMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);