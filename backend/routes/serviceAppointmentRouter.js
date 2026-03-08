import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";

import {
  createServiceAppointment,
  getServiceAppointments,
  getServiceAppointmentById,
  updateServiceAppointment,
  cancelServiceAppointment,
  getServiceAppointmentStats,
  getAppointmentsByPatient,
} from "../controllers/serviceAppointmentController.js";
const serviceAppointmentRouter = express.Router();

serviceAppointmentRouter.get("/", getServiceAppointments);
serviceAppointmentRouter.get("/stats/summary", getServiceAppointmentStats);
serviceAppointmentRouter.get(
  "/me",
  clerkMiddleware(),
  requireAuth(),
  getAppointmentsByPatient
);
serviceAppointmentRouter.post(
  "/",
  clerkMiddleware(),
  requireAuth(),
  createServiceAppointment
);

serviceAppointmentRouter.get("/:id", getServiceAppointmentById);
serviceAppointmentRouter.put("/:id", updateServiceAppointment);
serviceAppointmentRouter.post("/:id/cancel", cancelServiceAppointment);

export default serviceAppointmentRouter;