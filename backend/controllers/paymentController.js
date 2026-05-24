import razorpay from "../config/razorpay.js";

export const createOrder = async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // convert to paisa
      currency: "INR",
      receipt: "receipt_order",
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error creating order",
    });
  }
};