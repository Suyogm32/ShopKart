import { User } from "@/models/User";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export const POST=async(req)=>{
    try{
        const data=await req.json();
        console.log(data);
        await mongooseConnect();
        const newuser=new User(data);
        await newuser.save();
        return new NextResponse(JSON.stringify({message:"the new user is created.",user:newuser}),{status:201});
    }
    catch(error){
            return new NextResponse(
                JSON.stringify({
                    message:"Error creating new User",
                    error,

                }),
                {
                    status:500,
                }
            );
    }
};

export const PUT=async(req,res)=>{
    try{
        const {phone,address,city,postalcode,state,country,password,_id}=await req.json();
        console.log({phone,address,city,postalcode,state,country,password,_id});
        await mongooseConnect();
        const myUser=await User.updateOne({_id},{phone,address,city,postalcode,state,country});
        return new NextResponse(JSON.stringify({message:'The user with id '+_id+' is updated.',CurrentUser:myUser}),{status:201});
    }
    catch(error){
            return new NextResponse(
                JSON.stringify({
                    message:"Error updating the data of a user",
                    error,

                }),
                {
                    status:500,
                }
            );
    }
}