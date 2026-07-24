import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const UserSchema = new Schema({ email: String });
const User = models.User || model("User", UserSchema);

const ProductSchema = new Schema(
  {
    productName: String,
    description: String,
    price: { type: Number, required: true },
    productImages: [{ type: String }],
    category: { type: mongoose.Types.ObjectId, ref: "Catagory" },
    properties: { type: Object },
    sellerId: { type: mongoose.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const Product = models.products || model("products", ProductSchema);

const CategorySchema = new Schema({
  catagoryName: { type: String, required: true },
  parentCatagory: { type: mongoose.Types.ObjectId, ref: "Catagory" },
  properties: [{ type: Object }],
  sellerId: { type: mongoose.Types.ObjectId, ref: "User" },
});
const Catagory = models.Catagory || model("Catagory", CategorySchema);

const SELLER_EMAIL = process.argv[2];
const NUM_PRODUCTS = parseInt(process.argv[3]) || 3000;

async function main() {
  if (!SELLER_EMAIL) {
    console.error("Usage: node scripts/seed-load-test-data.mjs <seller-email> [numProducts]");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const seller = await User.findOne({ email: SELLER_EMAIL });
  if (!seller) {
    console.error(`No user found with email ${SELLER_EMAIL}`);
    process.exit(1);
  }
  console.log(`Seeding data for seller ${seller.email} (${seller._id})...`);

  const existingProducts = await Product.find({ sellerId: seller._id }).limit(20);
  const sampleImages = existingProducts.flatMap((p) => p.productImages).filter(Boolean);

  const categoryNames = ["Electronics", "Clothing", "Home & Kitchen", "Books", "Toys"];
  const categories = await Catagory.insertMany(
    categoryNames.map((name) => ({ catagoryName: name, sellerId: seller._id, properties: [] }))
  );
  console.log(`Created ${categories.length} categories.`);

  const BATCH_SIZE = 500;
  let created = 0;

  while (created < NUM_PRODUCTS) {
    const batchSize = Math.min(BATCH_SIZE, NUM_PRODUCTS - created);
    const batch = Array.from({ length: batchSize }, (_, i) => {
      const index = created + i;
      return {
        productName: `Load Test Product ${index}`,
        description: `Synthetic product #${index} generated for load testing.`,
        price: Math.floor(Math.random() * 100000) + 100,
        productImages: sampleImages.length ? [sampleImages[index % sampleImages.length]] : [],
        category: categories[index % categories.length]._id,
        sellerId: seller._id,
        properties: {},
      };
    });

    await Product.insertMany(batch);
    created += batchSize;
    console.log(`Inserted ${created}/${NUM_PRODUCTS} products...`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
