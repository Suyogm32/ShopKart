// Import the AWS SDK
import AWS from "aws-sdk";

// Set the region for SES
AWS.config.update({ region: "ap-south-1" }); // Replace 'us-east-1' with your preferred region

// Create an SES object
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

// Function to send order confirmation email
export const sendOrderConfirmationEmail = async (userEmail, orderId, name,line_items) => {
  let emailContent = `Dear ${name},
    Your order with ID ${orderId} has been placed successfully.\n`;
  line_items.forEach(item => {
    let currentstring=`${item.price_data.product_data.name}  ${item.quantity}Qty  ₹${item.price_data.unit_amount} \n`;
    emailContent+=currentstring;
  });
  emailContent+='Thank you! Continue shopping with us  😊\n Your order will be deilvered soon!'
  const params = {
    Destination: {
      ToAddresses: [userEmail], // Destination email address
    },
    Message: {
      Body: {
        Text: {
          Data: emailContent,
        },
      },
      Subject: {
        Data: "Order Confirmation",
      },
    },
    Source: "suyogm32+ecomm@gmail.com", // Sender email address (verified in SES)
  };

  try {
    await ses.sendEmail(params).promise();
    console.log("Order confirmation email sent successfully.");
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    // Handle error (e.g., retry logic, error logging)
  }
};
