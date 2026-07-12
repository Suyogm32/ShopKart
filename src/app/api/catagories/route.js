import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { Catagory } from "@/models/category";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req) => {
  try {
    const data = await req.json();
    await mongooseConnect();
    const mycategory = new Catagory(data);
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

export const GET = withAuth(async (req) => {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const categoryById = await Catagory.findById(id);
      if (!categoryById) {
        return NextResponse.json({ message: "Category not found." }, { status: 404 });
      }
      return NextResponse.json(categoryById, { status: 200 });
    }

    const categories = await Catagory.find().populate("parentCatagory");
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({ message: "Error fetching categories." }, { status: 500 });
  }
});

export const PUT = withAuth(async (req) => {
  try {
    const { catagoryName, parentCatagory, properties, _id } = await req.json();

    if (!_id) {
      return NextResponse.json({ message: "Category id is required." }, { status: 400 });
    }

    await mongooseConnect();
    await Catagory.updateOne({ _id }, { catagoryName, parentCatagory, properties });

    return NextResponse.json({ message: `Category ${_id} updated.` }, { status: 200 });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ message: "Error updating category." }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req) => {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Category id is required." }, { status: 400 });
    }

    const deleted = await Catagory.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted." }, { status: 200 });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ message: "Error deleting category." }, { status: 500 });
  }
});
