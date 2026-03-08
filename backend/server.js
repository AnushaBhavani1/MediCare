// import express from 'express';
// import cors from 'cors';
// import 'dotenv/config';
// console.log("JWT_SECRET:", process.env.JWT_SECRET);

// import {clerkMiddleware} from '@clerk/express'
// import {connectDB} from './config/db.js'
// import { connect } from 'mongoose';
// import doctorRouter from './routes/doctorRoutes.js';
// import serviceRouter from './routes/serviceRouter.js';
// import appointmentRouter from './routes/appointmentRouter.js';
// import serviceAppointmentRouter from './routes/serviceAppointmentRouter.js';

// const app=express();
// const port=4000;
// const allowedOrigins=[
//     "http://localhost:5173",
//     "http://localhost:5174"
// ];

// //Middleware
// app.use(cors(
//     {
//         origin : function (origin,callback){
//             if(!origin) return callback(null,true);
//             if(allowedOrigins.includes(origin))
//             {
//                 return callback(null,true)
//             }
//             return callback(new Error("Not allowed by CORS "));
//         },
//         credentials:true,
//         methods:["GET","POST","PUT","DELETE","OPTIONS"],
//         allowedHeaders:["Content-Type","Authorization"]
//     }
// ));
// app.use(clerkMiddleware())
// app.use(express.json({limit:"20mb"}))
// app.use(express.urlencoded({limit:"20mb",extended:true}))



// connectDB()

// //Routes
// app.use("/api/doctors",doctorRouter);
// app.use("/api/services",serviceRouter);
// app.use("/api/appointments",appointmentRouter);
// app.use("/api/service-appointments",serviceAppointmentRouter);


// app.get('/',(req,res)=>{
//     res.send("API WORKING");
// });
// app.listen(port,()=>{
//     console.log(`server started on http://localhost:${port}`);

// })

import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./config/db.js";

import doctorRouter from "./routes/doctorRouter.js";
import serviceRouter from "./routes/serviceRouter.js";
import appointmentRouter from "./routes/appointmentRouter.js";
import serviceAppointmentRouter from "./routes/serviceAppointmentRouter.js";

const app = express();
const port = 4000;

/* ---------------------- PATH FIX (IMPORTANT) ---------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------------- CONFIG ---------------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

/* ---------------------- MIDDLEWARE ---------------------- */

// CORS Setup
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

/* ---------------------- SERVE UPLOADS FOLDER ---------------------- */

//  THIS IS THE IMPORTANT PART
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

/* ---------------------- GLOBAL ERROR HANDLER ---------------------- */

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