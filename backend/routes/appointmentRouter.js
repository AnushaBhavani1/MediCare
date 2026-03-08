import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";

import {
  cancelAppointment,
  createAppointment,
  getAppointments,
  getAppointmentsByDoctor,
  getAppointmentsByPatient,
  getRegisteredUserCount,
  getStats,
  updateAppointment,
} from "../controllers/appointmentControllers.js";

const appointmentRouter = express.Router();

// Public
appointmentRouter.get("/", getAppointments);
appointmentRouter.get("/stats/summary", getStats);
appointmentRouter.get("/doctor/:doctorId", getAppointmentsByDoctor);
appointmentRouter.get("/patients/count", getRegisteredUserCount);

// Authenticated
appointmentRouter.post("/", clerkMiddleware(), requireAuth(), createAppointment);
appointmentRouter.get("/me", clerkMiddleware(), requireAuth(), getAppointmentsByPatient);

// Update & Cancel
appointmentRouter.post("/:id/cancel", cancelAppointment);
appointmentRouter.put("/:id", updateAppointment);

export default appointmentRouter;