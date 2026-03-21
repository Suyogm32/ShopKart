import { User } from "@/models/User";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export const POST=async(req)=>{
    try{
        const { email, password }=await req.json();
        console.log("At backend",{ email, password });
        await mongooseConnect();
        const user=await User.findOne({ email, password });
        if (user) {
            // User found, return success response
            return new NextResponse(JSON.stringify({ "message": "Login successful",user:user}), { status: 200 });
        } else {
            // User not found, return error response
            return new NextResponse(JSON.stringify({ "error": "Invalid username or password" }), { status: 401 });
        }
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