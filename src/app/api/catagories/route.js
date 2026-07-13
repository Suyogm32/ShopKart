import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { Catagory } from "@/models/category";
import { withAuth } from "@/lib/withAuth";

import { z } from "zod";

const categorySchema = z.object({
  catagoryName: z.string().min(1, "Category name is required."),
  parentCatagory: z.string().optional(),
  properties: z
    .array(
      z.object({
        name: z.string().min(1, "Property name is required."),
        values: z.array(z.string()),
      })
    )
    .optional(),
});

export const POST = withAuth(async (req, _context, session) => {
  try {
    const data = await req.json();
    const parsed = categorySchema.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input.", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await mongooseConnect();
    const mycategory = new Catagory({ ...parsed.data, sellerId: session.user.id });
    await mycategory.save();
    return NextResponse.json(
      { message: "Category created.", category: mycategory },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ message: "Error creating category." }, { status: 500 });
  }
});

export const GET = withAuth(async (req, _context, session) => {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const categoryById = await Catagory.findOne({ _id: id, sellerId: session.user.id });
      if (!categoryById) {
        return NextResponse.json({ message: "Category not found." }, { status: 404 });
      }
      return NextResponse.json(categoryById, { status: 200 });
    }

    // Pagination — default limit is generous since this list also populates
    // the "parent category" dropdown in the UI, and categories are typically
    // low in number compared to products/orders.
    const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit")) || 100, 1), 200);
    const skip = (page - 1) * limit;

    // Only return categories belonging to the authenticated seller
    const filter = { sellerId: session.user.id };
    const [categories, total] = await Promise.all([
      Catagory.find(filter).populate("parentCatagory").skip(skip).limit(limit),
      Catagory.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        data: categories,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({ message: "Error fetching categories." }, { status: 500 });
  }
});

export const PUT = withAuth(async (req, _context, session) => {
  try {
    const { _id, ...rest } = await req.json();

    if (!_id) {
      return NextResponse.json({ message: "Category id is required." }, { status: 400 });
    }

    const parsed = categorySchema.safeParse(rest);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input.", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await mongooseConnect();

    // Ownership check — only the seller who owns this category can update it
    const updated = await Catagory.updateOne({ _id, sellerId: session.user.id }, parsed.data);

    if (updated.matchedCount === 0) {
      return NextResponse.json(
        { message: "Category not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: `Category ${_id} updated.` }, { status: 200 });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ message: "Error updating category." }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, _context, session) => {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Category id is required." }, { status: 400 });
    }

    // Ownership check — can only delete your own category
    const deleted = await Catagory.findOneAndDelete({ _id: id, sellerId: session.user.id });

    if (!deleted) {
      return NextResponse.json(
        { message: "Category not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Category deleted." }, { status: 200 });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ message: "Error deleting category." }, { status: 500 });
  }
});
