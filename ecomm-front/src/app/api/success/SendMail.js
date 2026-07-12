// Uses the AWS SDK v3 SES client (bundler-friendly — the legacy "aws-sdk"
// package loads its service definitions from JSON files at runtime, which
// breaks when webpack bundles server routes for `next build`).
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: "ap-south-1" }); // Replace 'ap-south-1' with your preferred region

// Function to send order confirmation email
export const sendOrderConfirmationEmail = async (userEmail, orderId, name, line_items) => {
  let emailContent = `Dear ${name},
    Your order with ID ${orderId} has been placed successfully.\n`;
  line_items.forEach((item) => {
    let currentstring = `${item.price_data.product_data.name}  ${item.quantity}Qty  ₹${item.price_data.unit_amount} \n`;
    emailContent += currentstring;
  });
  emailContent += "Thank you! Continue shopping with us  😊\n Your order will be deilvered soon!";

  const command = new SendEmailCommand({
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
  });

  try {
    await ses.send(command);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    // Handle error (e.g., retry logic, error logging)
  }
};
