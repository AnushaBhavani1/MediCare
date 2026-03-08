import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import { getAuth, clerkClient } from "@clerk/express";

//////////////////////////////////////////////////////
// Helpers
//////////////////////////////////////////////////////

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
function resolveClerkUserId(req) {
  try {
    if (typeof req.auth === "function") {
      const auth = req.auth();
      if (auth?.userId) return auth.userId;
    }

    const serverAuth = getAuth(req);
    return serverAuth?.userId || null;
  } catch {
    return null;
  }
}

//////////////////////////////////////////////////////
// GET ALL APPOINTMENTS (Admin)
//////////////////////////////////////////////////////

export const getAppointments = async (req, res) => {
  try {
    const {
      doctorId,
      mobile,
      status,
      search = "",
      limit: limitRaw = 50,
      page: pageRaw = 1,
    } = req.query;

    const limit = Math.min(100, Math.max(1, parseInt(limitRaw) || 50));
    const page = Math.max(1, parseInt(pageRaw) || 1);
    const skip = (page - 1) * limit;

    const filter = {};

    if (doctorId) filter.doctorId = doctorId;
    if (mobile) filter.mobile = mobile;
    if (status) filter.status = status;

    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [
        { patientName: re },
        { mobile: re },
        { notes: re },
      ];
    }

    const [items, total] = await Promise.all([
      Appointment.find(filter)
        .sort({ date: -1, time: -1 })
        .skip(skip)
        .limit(limit)
        .populate("doctorId", "name specialization imageUrl")
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      appointments: items,
      meta: { page, limit, total, count: items.length },
    });
  } catch (err) {
    console.error("GetAppointments Error:", err);
    return res.status(500).json({ success: false });
  }
};

//////////////////////////////////////////////////////
// GET APPOINTMENTS BY PATIENT
//////////////////////////////////////////////////////

export const getAppointmentsByPatient = async (req, res) => {
  try {
    const clerkUserId = resolveClerkUserId(req);

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const appointments = await Appointment.find({
      owner: clerkUserId,
    })
    .populate("doctorId", "name specialization imageUrl")
      .sort({ date: 1, time: 1 })
      .lean();

    return res.json({ success: true, appointments, });
  } catch (err) {
    console.error("GetAppointmentsByPatient Error:", err);
    return res.status(500).json({ success: false });
  }
};

//////////////////////////////////////////////////////
// CREATE APPOINTMENT
//////////////////////////////////////////////////////
export const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      patientName,
      mobile,
      age,
      gender,
      date,
      time,
      notes = "",
    } = req.body;

    const clerkUserId = resolveClerkUserId(req);

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!doctorId || !patientName || !mobile || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // Prevent double booking
    const existingSlot = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $in: ["Pending", "Confirmed"] },
    });

    if (existingSlot) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    // Get doctor
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

     console.log("Doctor Fee:", doctor.fee);
    // Get fee directly from doctor
    const numericFee = safeNumber(doctor.fee ?? doctor.fees ?? 0);

    const appointment = await Appointment.create({
      doctorId,
      doctorName: doctor.name,
      speciality: doctor.specialization,
      patientName,
      mobile,
      age,
      gender,
      date,
      time,
      fees: numericFee,
      notes,
      status: "Pending",
      owner: clerkUserId,
    });

    return res.status(201).json({
      success: true,
      appointment,
    });



  } catch (err) {
    console.error("CreateAppointment Error:", err);
    return res.status(500).json({ success: false });
  }

 
};


// UPDATE APPOINTMENT


export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = ["status", "date", "time", "notes"];

    const updates = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updated = await Appointment.findByIdAndUpdate(
  id,
  updates,
  { new: true, runValidators: true }
);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.json({ success: true, appointment: updated });

  } catch (err) {
    console.error("Update Error:", err);
    return res.status(500).json({ success: false });
  }
};

//////////////////////////////////////////////////////
// CANCEL APPOINTMENT
//////////////////////////////////////////////////////

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await Appointment.findById(id);

    if (!appt) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appt.status === "Canceled") {
      return res.status(400).json({
        success: false,
        message: "Appointment already canceled",
      });
    }

    if (appt.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Completed appointment cannot be canceled",
      });
    }

    appt.status = "Canceled";
    await appt.save();

    return res.json({ success: true, appointment: appt });

  } catch (err) {
    console.error("Cancel Error:", err);
    return res.status(500).json({ success: false });
  }
};

//////////////////////////////////////////////////////
// STATS
//////////////////////////////////////////////////////

export const getStats = async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const totalDoctors = await Doctor.countDocuments();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recent = await Appointment.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const completed = await Appointment.countDocuments({
      status: "Completed",
    });

    return res.json({
      success: true,
      stats: {
        totalAppointments,
        totalDoctors,
        completedAppointments: completed,
        recentLast7Days: recent,
      },
    });

  } catch (err) {
    console.error("Stats Error:", err);
    return res.status(500).json({ success: false });
  }
};

//////////////////////////////////////////////////////
// DOCTOR APPOINTMENTS
//////////////////////////////////////////////////////

export const getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const appointments = await Appointment.find({ doctorId })
      .sort({ date: 1, time: 1 })
      .lean();

    return res.json({ success: true, appointments });

  } catch (err) {
    console.error("DoctorAppointments Error:", err);
    return res.status(500).json({ success: false });
  }
};

//////////////////////////////////////////////////////
// REGISTERED USERS COUNT
//////////////////////////////////////////////////////

export const getRegisteredUserCount = async (req, res) => {
  try {
    const users = await clerkClient.users.getUserList({ limit: 1000 });

    const totalUsers = users?.data?.length || 0;

    return res.json({
      success: true,
      totalUsers
    });

  } catch (err) {
    console.error("UserCount Error:", err);

    return res.json({
      success: true,
      totalUsers: 0
    });
  }
};