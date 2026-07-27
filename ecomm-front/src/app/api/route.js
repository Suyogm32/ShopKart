import { product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export const GET = async (req) => {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const lt = searchParams.get("limit");

    if (id) {
      const productById = await product.findById(id);
      return new NextResponse(JSON.stringify(productById), { status: 200 });
    }

    if (lt) {
      // "New Arrivals" style request — just the N most recent, unchanged behavior
      const cappedLimit = Math.min(Math.max(parseInt(lt) || 10, 1), 50);
      const products = await product.find({}, null, { sort: { _id: -1 }, limit: cappedLimit });
      return new NextResponse(JSON.stringify(products), { status: 200 });
    }

    // Full product listing — this was the unbounded query the load test caught.
    // Paginated now instead of returning every product in one response.
    const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize")) || 20, 1), 100);
    const skip = (page - 1) * pageSize;

    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const filter = {};
    if (category) filter.category = category;
    if (search) {
      // Note: unindexed regex scan. Fine at this catalogue size, but the load
      // test showed what unbounded queries cost — a text index on productName
      // is the next step if the catalogue grows.
      filter.productName = { $regex: search.trim(), $options: "i" };
    }

    const [products, total] = await Promise.all([
      product.find(filter).sort({ _id: -1 }).skip(skip).limit(pageSize),
      product.countDocuments(filter),
    ]);

    return new NextResponse(
      JSON.stringify({
        data: products,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 },
      }),
      { status: 200 }
    );
  } catch (error) {
    return new NextResponse("Error in fetching products" + error, { status: 500 });
  }
};
