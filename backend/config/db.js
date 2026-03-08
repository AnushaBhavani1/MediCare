import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("DB CONNECTED");
  console.log("Connected DB Name:", mongoose.connection.name);
};