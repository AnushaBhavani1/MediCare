// import mongoose from "mongoose";

// export const connectDB = async()=>{
//     await mongoose.connect("mongodb+srv://anushaaddala16_db_user:wghWw7s5SwnywOlX@cluster0.ipsrglc.mongodb.net/MediCare?appName=Cluster0")
//     .then(()=>{
//         console.log("DB CONNECTED ")
//     })
// }

import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://anushaaddala16_db_user:MediCare123@cluster0.ipsrglc.mongodb.net/MediCare?retryWrites=true&w=majority"
  );

  console.log("DB CONNECTED");
  console.log("Connected DB Name:", mongoose.connection.name);
};