import { product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { Order } from "@/models/Order";
import  {backOrders} from "@/models/Backorders";

const stripe = require("stripe")(process.env.STRIPE_SK);

// Assuming you have models for Product, User, and Order

// Logic to create a new document in the aggregated collection when a new order is placed
async function createAggregatedDocument(line_items,currentOrder,productInfo) {
 
  const aggregatedDocuments = [];
  
  for (const lineItem of line_items) {
    const product = productInfo.find(product => product.productName === lineItem. price_data.product_data.name); // Assuming productId is stored in the line item 

    const aggregatedDocument = {
      productName: product.productName,
      quantity: lineItem.quantity,
      price: lineItem.price_data.unit_amount/100, // Assuming this is the price from the line item
      address: `${currentOrder.Address}, ${currentOrder.State}, ${currentOrder.Country}`,
      postalCode: currentOrder.Postalcode,
      paid: currentOrder.Paid,
      sellerId: product.sellerId,
      orderId:currentOrder._id,
      delivered:false,
    };

    aggregatedDocuments.push(aggregatedDocument);
  }

  console.log("aggregatedDocument",aggregatedDocuments);
  const resp=await backOrders.insertMany(aggregatedDocuments);
   console.log(resp.data);
}



export const POST = async (req, res) => {
  try {
    await mongooseConnect();
    const data = await req.json(); // req.body should now contain parsed JSON data
    const { Name, Email, Address, City, Postalcode, State, Country, products } =
      data;
    const uniqueIds = [...new Set(products)];
    const productsInfo = await product.find({ _id: { $in: uniqueIds } });
    let line_items = [];
    uniqueIds.forEach((productId) => {
      const info = productsInfo.find((p) => p._id.toString() === productId);
      const quantity = products.filter((id) => id === productId)?.length || 0;
      if (quantity > 0 && info) {
        line_items.push({
          quantity,
          price_data: {
            currency: "inr",
            product_data: { name: info.productName},
            unit_amount: quantity * info.price*100,
          },
        });
      }
    });
    // console.log(line_items);
    const orderData = {
      line_items,
      Name,
      Email,
      Address,
      City,
      Postalcode,
      State,
      Country,
      Paid: false,
    };
    const currentOrder = new Order(orderData);
    await currentOrder.save();

    const paymentsession=await stripe.checkout.sessions.create({
        line_items,
        mode:'payment',
        customer_email:Email,
        success_url:process.env.URL+'cart/success/'+currentOrder._id,
        cancel_url:process.env.URL+'cart/canceled',
        metadata:{orderId:currentOrder._id.toString()}
    });
    console.log("paymentsession->",paymentsession.payment_status);
    const ans=await createAggregatedDocument(line_items,currentOrder,productsInfo);
    
    return new NextResponse(
      JSON.stringify({url: paymentsession.url, currentOrder }),
      { status: 201 }
    );
  } catch (error) {
    return new NextResponse("Error in paymentsession of products" + error, {
      status: 500,
    });
  }
};

