import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./config/db.js";

import doctorRouter from "./routes/doctorRouter.js";
import serviceRouter from "./routes/serviceRouter.js";
import appointmentRouter from "./routes/appointmentRouter.js";
import serviceAppointmentRouter from "./routes/serviceAppointmentRouter.js";

const app = express();
const port = 4000;

/* ---------------------- PATH FIX ---------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------------- CONFIG ---------------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

/* ---------------------- MIDDLEWARE ---------------------- */

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(clerkMiddleware());

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

/* ---------------------- UPLOADS FOLDER ---------------------- */

const uploadsPath = path.join(__dirname, "uploads");

// create folder if not exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// serve uploads
app.use("/uploads", express.static(uploadsPath));

/* ---------------------- DATABASE ---------------------- */

connectDB();

/* ---------------------- ROUTES ---------------------- */

app.use("/api/doctors", doctorRouter);
app.use("/api/services", serviceRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/service-appointments", serviceAppointmentRouter);

/* ---------------------- HEALTH CHECK ---------------------- */

app.get("/", (req, res) => {
  res.send("API WORKING");
});

/* ---------------------- ERROR HANDLER ---------------------- */

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

/* ---------------------- START SERVER ---------------------- */

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});