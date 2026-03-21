import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { Catagory } from "@/models/category";


export const POST=async(req)=>{
    try{
        const data=await req.json();
        console.log(data);
        await mongooseConnect();
        const mycategory=new Catagory(data);
        await mycategory.save();
        console.log(mycategory);
        return new NextResponse(JSON.stringify({message:"the new category is created.",Catagory:mycategory}),{status:201});
    }
    catch(error){
            return new NextResponse(
                JSON.stringify({
                    message:"Error creating new catagory",
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
        if(id){
            const categoryById = await Catagory.findById(id);
            return new NextResponse(JSON.stringify(productById), { status: 200 });
        }else{
            const catagories=await Catagory.find().populate('parentCatagory');
            return new NextResponse(JSON.stringify(catagories),{status:200});
        }
    }
    catch(error){
        return new NextResponse("Error in fetching products"+error,{status:500});
    }
}

export const PUT=async(req,res)=>{
    try{
        const {catagoryName,parentCatagory,properties,_id}=await req.json();
        await mongooseConnect();
        const mycategory=await Catagory.updateOne({_id},{catagoryName,parentCatagory,properties});
        return new NextResponse(JSON.stringify({message:'The category with id '+_id+' is updated.',categorydetails:mycategory}),{status:201});
    }
    catch(error){
            return NextResponse(
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
            const deletedCategory=await Catagory.findByIdAndDelete({_id:id});
            return new NextResponse(JSON.stringify(deletedCategory), { status: 200 });
        }else{
            return new NextResponse(JSON.stringify({message:'The category with id '+_id+' is not found.'}),{status:404});
        }
    }
    catch(error){
        return new NextResponse("Error in fetching products"+error,{status:500});
    }
}