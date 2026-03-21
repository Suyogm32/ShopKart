import {Order } from "@/models/Order";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { backOrders } from "@/models/Backorders";
import { sendOrderConfirmationEmail } from "./SendMail";
export const PUT = async (req, res) => {
    try {
      await mongooseConnect();
      const {_id,Paid} =await req.json();
      console.log({_id,Paid});
      const ord = await Order.updateMany({_id},{Paid});
      const bord=await backOrders.updateMany({orderId:_id},{ $set: { paid: true } });
      const myord=await Order.findById({_id});
      const id=myord._id;
      const userEmail=myord.Email;
      const name=myord.Name;
      const items=myord.line_items;
      console.log({id,userEmail,name,items});
      sendOrderConfirmationEmail(userEmail,id,name,items);
      return new NextResponse(JSON.stringify({message:"Payment status updated"}), { status: 200 });
    } catch (error) {
      return new NextResponse("Error in fetching products" + error, {
        status: 500,
      });
    }
  };