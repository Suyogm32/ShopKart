import mongoose, { Schema, model,models } from "mongoose";

const OrderSchema=new Schema({
    line_items:Object,
    Name:String,
    Email:String,
    Address:String,
    Postalcode:String,
    State:String,
    Country:String,
    Paid:Boolean
},{
    timestamps:true,
});

export const Order=models.Order || model('Order',OrderSchema);