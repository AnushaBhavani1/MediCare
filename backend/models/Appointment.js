import mongoose from "mongoose";

const appointmentSchema= new mongoose.Schema({
    owner: {type:String , required:true,index:true},
    createdBy: {type:String,default:null,index:true},

    //patient info

    patientName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    age: { type: Number, default: null },
    gender: { type: String, default: "" },

    //doctor info : This creates a relationship between the Appointment and Doctor collections.
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    doctorName: { type: String, default: "" }, //These store a snapshot of doctor information at booking time.
    speciality: { type: String, default: "" },

    doctorImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    //appointment info
    date: { type: String, required: true },
    time: { type: String, required: true },

    fees: { type: Number, required: true, min: 0, default: 0 },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Canceled", "Rescheduled"],
      default: "Pending",
    },

    rescheduledTo: {
      date: { type: String },
      time: { type: String },
    },

    //payment mode
    payment: {
      method: {
        type: String,
        enum: ["Cash", "Online"],
        default: "Cash",
      },
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending",
      },
      amount: { type: Number, default: 0 },
      providerId: { type: String, default: "" }, //Used when integrating with payment gateways.
      meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    sessionId: { type: String, default: null, index: true }, //Used to track payment sessions.
    paidAt: { type: Date, default: null }, 
},{
    timestamps:true //This automatically adds two fields:createdAt ,updatedAt

});

const Appointment = mongoose.models.Appointment || mongoose.model("Appointment",appointmentSchema);

export default Appointment;