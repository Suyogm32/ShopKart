import {backOrders} from "@/models/Backorders";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export const GET=async(req,res)=>{
    try{
        const {searchParams}=new URL(req.url);
        const id=searchParams.get('id');
        await mongooseConnect();
        const orders=await backOrders.find({sellerId:id});
        console.log(orders);
        return new NextResponse(JSON.stringify(orders),{status:200});
    }
    catch(error){
        return new NextResponse("Error in fetching products"+error,{status:500});
    }
}