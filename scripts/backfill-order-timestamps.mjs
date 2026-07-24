import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const BackOrderSchema = new Schema(
  {
    productName: String,
    quantity: Number,
    price: Number,
    address: String,
    postalCode: String,
    paid: Boolean,
    sellerId: { type: mongoose.Types.ObjectId, ref: "User" },
    orderId: { type: mongoose.Types.ObjectId, ref: "Order" },
    delivered: Boolean,
  },
  { timestamps: true }
);
const backOrders = models.backOrders || model("backOrders", BackOrderSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const ordersMissingDate = await backOrders.find({ createdAt: { $exists: false } });
  console.log(`Found ${ordersMissingDate.length} orders missing createdAt.`);

  for (const order of ordersMissingDate) {
    const approxDate = order._id.getTimestamp(); // recovers the real creation time from the ObjectId
    await backOrders.collection.updateOne(
      { _id: order._id },
      { $set: { createdAt: approxDate, updatedAt: approxDate } }
    );
  }

  console.log("Backfill complete.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
