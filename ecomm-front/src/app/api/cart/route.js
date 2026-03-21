import { product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export const POST = async (req, res) => {
  try {
    await mongooseConnect();
    const data =await req.json();
    console.log("ids are ",data);
    const products = await product.find({ _id: { $in: data.ids } });
    return new NextResponse(JSON.stringify(products), { status: 200 });
  } catch (error) {
    return new NextResponse("Error in fetching products" + error, {
      status: 500,
    });
  }
};
