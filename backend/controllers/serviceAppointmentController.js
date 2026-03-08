import ServiceAppointment from "../models/serviceAppointment.js";
import Service from "../models/service.js";
import { getAuth } from "@clerk/express";

/* ---------------- HELPERS ---------------- */

const safeNumber = (val) => {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const t = timeStr.trim();
  const m = t.match(/([0-9]{1,2}):?([0-9]{0,2})\s*(AM|PM|am|pm)?/);
  if (!m) return null;

  let hh = parseInt(m[1], 10);
  let mm = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = (m[3] || "").toUpperCase();

  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  if (ampm) return { hour: hh, minute: mm, ampm };

  if (hh === 0) return { hour: 12, minute: mm, ampm: "AM" };
  if (hh === 12) return { hour: 12, minute: mm, ampm: "PM" };
  if (hh > 12) return { hour: hh - 12, minute: mm, ampm: "PM" };
  return { hour: hh, minute: mm, ampm: "AM" };
}

function resolveClerkUserId(req) {
  try {
    const auth = req.auth || {};
    return (
      auth?.userId ||
      auth?.user_id ||
      auth?.user?.id ||
      getAuth(req)?.userId ||
      null
    );
  } catch {
    return null;
  }
}

/* ---------------- CREATE APPOINTMENT ---------------- */

export const createServiceAppointment  = async (req, res) => {
  try {
    const clerkUserId = resolveClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      serviceId,
      patientName,
      mobile,
      age,
      gender,
      date,
      time,
      hour,
      minute,
      ampm,
      amount,
      fees,
      notes = "",
    } = req.body;

    if (!serviceId || !patientName || !mobile || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const numericAmount = safeNumber(amount ?? fees ?? 0);
    if (numericAmount === null || numericAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    let finalHour = safeNumber(hour);
    let finalMinute = safeNumber(minute);
    let finalAmpm = ampm ? ampm.toUpperCase() : null;

    if (time && (finalHour === null || finalMinute === null)) {
      const parsed = parseTimeString(time);
      if (!parsed) {
        return res.status(400).json({
          success: false,
          message: "Invalid time format",
        });
      }
      finalHour = parsed.hour;
      finalMinute = parsed.minute;
      finalAmpm = parsed.ampm;
    }

    if (
      finalHour === null ||
      finalMinute === null ||
      !["AM", "PM"].includes(finalAmpm)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid time",
      });
    }

    // Check service exists
    const service = await Service.findById(serviceId).lean();
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Prevent duplicate slot globally
    const existing = await ServiceAppointment.findOne({
      serviceId,
      date,
      hour: finalHour,
      minute: finalMinute,
      ampm: finalAmpm,
      status: { $ne: "Canceled" },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Slot already booked",
      });
    }

    const appointment = await ServiceAppointment.create({
  serviceId,
  serviceName: service.name,

  serviceImage: {
   url: service.imageUrl ? String(service.imageUrl).trim() : "",
   publicId: service.imagePublicId || null
},

      patientName,
      mobile,
      age,
      gender,
      date,
      hour: finalHour,
      minute: finalMinute,
      ampm: finalAmpm,
      fees: numericAmount,
      createdBy: clerkUserId,
      notes,
      status: "Pending",
      payment: {
        method: "Cash",
        status: "Pending",
        amount: numericAmount,
      },
    });

    return res.status(201).json({
      success: true,
      appointment,
    });
  } catch (err) {
    console.error("createAppointment error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ---------------- GET ALL ---------------- */

export const getServiceAppointments = async (req, res) => {
  try {
    const { serviceId, mobile, status } = req.query;

    const filter = {};
    if (serviceId) filter.serviceId = serviceId;
    if (mobile) filter.mobile = mobile;
    if (status) filter.status = status;

   const appointments = await ServiceAppointment.find(filter)
  .populate("serviceId")   // ⭐ This is the key fix
  .sort({ createdAt: -1 })
  .lean();

    return res.json({ success: true, appointments });
  } catch (err) {
    console.error("getServiceAppointments error:", err);
    return res.status(500).json({ success: false });
  }
};

/* ---------------- GET BY ID ---------------- */

export const getServiceAppointmentById = async (req, res) => {
  try {
    const appt = await ServiceAppointment.findById(req.params.id).lean();
    if (!appt) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }
    return res.json({ success: true, data: appt });
  } catch {
    return res.status(500).json({ success: false });
  }
};

/* ---------------- UPDATE (SAFE) ---------------- */

export const updateServiceAppointment = async (req, res) => {
  try {
    const body = req.body || {};

    const updates = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;

    if (body.date !== undefined) updates.date = body.date;
    if (body.hour !== undefined) updates.hour = Number(body.hour);
    if (body.minute !== undefined) updates.minute = Number(body.minute);
    if (body.ampm !== undefined) updates.ampm = body.ampm;

    // ⭐ IMPORTANT — nested object safe update
    if (body.rescheduledTo && typeof body.rescheduledTo === "object") {
      updates.rescheduledTo = {
        date: body.rescheduledTo.date,
        time: body.rescheduledTo.time,
      };
    }

    const updated = await ServiceAppointment.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
        lean: true
      }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    return res.json({
      success: true,
      data: updated,
    });

  } catch (err) {
    console.error("updateServiceAppointment error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ---------------- CANCEL ---------------- */

export const cancelServiceAppointment = async (req, res) => {
  try {
    const appt = await ServiceAppointment.findById(req.params.id);
    if (!appt) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    if (appt.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed appointment",
      });
    }

    appt.status = "Canceled";
    await appt.save();

    return res.json({ success: true, data: appt });
  } catch {
    return res.status(500).json({ success: false });
  }
};

/* ---------------- PATIENT APPOINTMENTS ---------------- */

export const getAppointmentsByPatient = async (req, res) => {
  try {
    const clerkUserId = resolveClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const list = await ServiceAppointment.find({
  createdBy: clerkUserId,
})
.populate("serviceId")   // ⭐ VERY IMPORTANT
.sort({ createdAt: -1 })
.lean();

    return res.json({ success: true, data: list });
  } catch {
    return res.status(500).json({ success: false });
  }
};

/* ---------------- STATS SUMMARY ---------------- */

export const getServiceAppointmentStats = async (req, res) => {
  try {
    // Get all services
    const services = await Service.find().lean();

    // Get all appointments
    const appointments = await ServiceAppointment.find().lean();

    const summary = services.map((service) => {
      const serviceAppointments = appointments.filter(
        (a) => String(a.serviceId) === String(service._id)
      );

      const totalAppointments = serviceAppointments.length;

      const completed = serviceAppointments.filter(
        (a) => a.status === "Completed"
      ).length;

      const canceled = serviceAppointments.filter(
        (a) => a.status === "Canceled"
      ).length;

      return {
        id: service._id,
        name: service.name,
        price: service.price || 0,
        image: service.image || service.imageUrl || "",
        totalAppointments,
        completed,
        canceled,
      };
    });

    return res.json(summary);
  } catch (error) {
    console.error("getServiceAppointmentStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};