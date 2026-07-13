// One-time migration: resizes any product images uploaded *before* the
// upload route started resizing at upload time. New uploads are already
// fixed — this just cleans up what's already in the bucket.
//
// Run with: node scripts/backfill-resize-images.mjs

import "dotenv/config";
import mongoose from "mongoose";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

const ProductSchema = new mongoose.Schema({ productImages: [{ type: String }] }, { strict: false });
const Product = mongoose.models.products || mongoose.model("products", ProductSchema);

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await Product.find({});
  console.log(`Checking ${products.length} products...`);

  let resizedCount = 0;

  for (const p of products) {
    for (const url of p.productImages || []) {
      const key = decodeURIComponent(url.split("/").pop());

      try {
        const obj = await s3Client.send(
          new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key })
        );
        const buffer = await streamToBuffer(obj.Body);
        const metadata = await sharp(buffer).metadata();

        if (metadata.width && metadata.width <= 1200) {
          continue; // already resized, skip
        }

        const resized = await sharp(buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .jpeg({ quality: 50 })
          .toBuffer();

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: resized,
            ContentType: "image/jpeg",
          })
        );

        console.log(`Resized ${key}: ${metadata.width}px -> max 1200px`);
        resizedCount++;
      } catch (err) {
        console.error(`Skipping ${key} — error: ${err.message}`);
      }
    }
  }

  console.log(`Done. Resized ${resizedCount} image(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
