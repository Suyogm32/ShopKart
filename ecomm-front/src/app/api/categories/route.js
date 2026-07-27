import { Catagory } from "@/models/Catagory";
import { product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    await mongooseConnect();

    const [categories, counts] = await Promise.all([
      Catagory.find().sort({ catagoryName: 1 }),
      product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    ]);

    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    const data = categories.map((c) => ({
      _id: c._id,
      catagoryName: c.catagoryName,
      parentCatagory: c.parentCatagory || null,
      productCount: countMap.get(String(c._id)) || 0,
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({ message: "Error fetching categories." }, { status: 500 });
  }
};
