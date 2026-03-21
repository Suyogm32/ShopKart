import { product } from "@/models/product";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";



export const POST=async(req)=>{
    try{
        const data=await req.json();
        console.log(data);
        await mongooseConnect();
        const myproduct=new product(data);
        await myproduct.save();
        return new NextResponse(JSON.stringify({message:"the new product is creatsed.",product:myproduct}),{status:201});
    }
    catch(error){
            return new NextResponse(
                JSON.stringify({
                    message:"Error creating new product",
                    error,

                }),
                {
                    status:500,
                }
            );
    }
}

export const GET=async(req,res)=>{
    try{
        await mongooseConnect();
        const {searchParams}=new URL(req.url);
        const id=searchParams.get('id');
        const sellerId=searchParams.get('sellerId');
        console.log(sellerId);
        if(id){
            const productById = await product.findById(id);
            return new NextResponse(JSON.stringify(productById), { status: 200 });
        }else{
            const products=await product.find({sellerId:sellerId});
            return new NextResponse(JSON.stringify(products),{status:200});
        }
    }
    catch(error){
        return new NextResponse("Error in fetching products"+error,{status:500});
    }
}

export const PUT=async(req,res)=>{
    try{
        const {productName,description,price,productImages,category,properties,_id}=await req.json();
        console.log(category);
        await mongooseConnect();
        const myproduct=await product.updateOne({_id},{productName,category,description,price,productImages,properties});
        return new NextResponse(JSON.stringify({message:'The product with id '+_id+' is updated.',product:myproduct}),{status:201});
    }
    catch(error){
            return new NextResponse(
                JSON.stringify({
                    message:"Error updating the data of a product",
                    error,

                }),
                {
                    status:500,
                }
            );
    }
}

export const DELETE=async(req,res)=>{
    try{
        await mongooseConnect();
        const {searchParams}=new URL(req.url);
        const id=searchParams.get('id');

        console.log(id);

        if(id){
            const deletedProduct=await product.findByIdAndDelete({_id:id});
            return new NextResponse(JSON.stringify(deletedProduct), { status: 200 });
        }else{
            return new NextResponse(JSON.stringify({message:'The product with id '+_id+' is not found.'}),{status:404});
        }
    }
    catch(error){
        return new NextResponse("Error in fetching products"+error,{status:500});
    }
}