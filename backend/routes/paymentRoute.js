import express from "express";
import { createOrder } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-order", createOrder);

export default paymentRouter;