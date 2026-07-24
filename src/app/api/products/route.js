import { product } from "@/models/product";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";

import { z } from "zod";

const productSchema = z.object({
  productName: z.string().min(1, "Product name is required."),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0."),
  stock: z.coerce.number().int().min(0, "Stock can't be negative.").optional(),
  productImages: z.array(z.string()).optional(),
  category: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  properties: z.record(z.any()).optional(),
});

export const POST = withAuth(async (req, _context, session) => {
  try {
    const data = await req.json();
    const parsed = productSchema.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input.", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await mongooseConnect();
    const myproduct = new product({ ...parsed.data, sellerId: session.user.id });
    await myproduct.save();

    return NextResponse.json({ message: "Product created.", product: myproduct }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ message: "Error creating product." }, { status: 500 });
  }
});

export const GET = withAuth(async (req, _context, session) => {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const productById = await product.findOne({ _id: id, sellerId: session.user.id });
      if (!productById) {
        return NextResponse.json({ message: "Product not found." }, { status: 404 });
      }
      return NextResponse.json(productById, { status: 200 });
    }

    // Pagination — defaults to page 1, 20 per page, capped at 100 to prevent abuse
    const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit")) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { sellerId: session.user.id };
    const [products, total] = await Promise.all([
      product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      product.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        data: products,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json({ message: "Error fetching products." }, { status: 500 });
  }
});

export const PUT = withAuth(async (req, _context, session) => {
  try {
    const data = await req.json();
    const parsed = productSchema.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input.", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await mongooseConnect();

    // Ownership check — only the seller who owns this product can update it
    const updated = await product.updateOne({ _id, sellerId: session.user.id }, { ...parsed.data });

    if (updated.matchedCount === 0) {
      return NextResponse.json({ message: "Product not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ message: `Product ${_id} updated.` }, { status: 200 });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ message: "Error updating product." }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, _context, session) => {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Product id is required." }, { status: 400 });
    }

    // Ownership check — can only delete your own product
    const deleted = await product.findOneAndDelete({ _id: id, sellerId: session.user.id });

    if (!deleted) {
      return NextResponse.json({ message: "Product not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted." }, { status: 200 });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ message: "Error deleting product." }, { status: 500 });
  }
});
