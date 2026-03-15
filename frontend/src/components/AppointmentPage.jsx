import React, { useCallback, useEffect, useMemo, useState } from "react";
import { appointmentPageStyles,cardStyles,badgeStyles,iconSize, } from "../assets/dummyStyles";
import axios from 'axios';
import { useAuth, useUser } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import { CalendarDays, Clock, CreditCard, Wallet, CheckCircle, Bell, XCircle } from "lucide-react";

const API_BASE = "https://medicare-backend-i0t4.onrender.com";
const API = axios.create({baseURL : API_BASE})

function pad(n) {
  return String(n ?? 0).padStart(2, "0");
}

function parseDateTime(dateStr, timeStr) {
  const fast = new Date(`${dateStr} ${timeStr}`);
  if (!isNaN(fast)) return fast;

  const parts = (dateStr || "").split(" ");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const month = months[m];
    let [t, ampm] = (timeStr || "").split(" ");
    let [hh, mm] = (t || "0:00").split(":");
    hh = Number(hh || 0);
    mm = Number(mm || 0);

    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;

    return new Date(Number(y), month, Number(d), hh, mm);
  }

  const iso = new Date(dateStr);
  if (!isNaN(iso)) return iso;
  return new Date();
}

function computeStatus(item) {
  const now = new Date();
  if (!item) return "Pending";

  if (item.status === "Canceled") return "Canceled";
  if (item.status === "Rescheduled") {
    if (item.rescheduledTo && item.rescheduledTo.date && item.rescheduledTo.time) {
      const dt = parseDateTime(item.rescheduledTo.date, item.rescheduledTo.time);
      if (now >= dt) return "Completed";
    }
    return "Rescheduled";
  }

  if (item.status === "Completed") return "Completed";

  if (item.status === "Confirmed") {
    const dtConfirmed = parseDateTime(item.date, item.time);
    if (now >= dtConfirmed) return "Completed";
    return "Confirmed";
  }

  if (item.status === "Pending") {
    const dtPending = parseDateTime(item.date, item.time);
    if (now >= dtPending) return "Completed";
    return "Pending";
  }

  const dt = parseDateTime(item.date, item.time);
  if (now >= dt) return "Completed";
  return item.confirmed ? "Confirmed" : "Pending";
}

const PaymentBadge = ({ payment }) => {
  return payment === "Online" ? (
    <span className={badgeStyles.paymentBadge.online}>
      <CreditCard className={iconSize.small} /> Online
    </span>
  ) : (
    <span className={badgeStyles.paymentBadge.cash}>
      <Wallet className={iconSize.small} /> Cash
    </span>
  );
};

const StatusBadge = ({ itemStatus }) => {
  if (itemStatus === "Completed")
    return (
      <span className={badgeStyles.statusBadge.completed}>
        <CheckCircle className={iconSize.small} /> Completed
      </span>
    );

  if (itemStatus === "Confirmed")
    return (
      <span className={badgeStyles.statusBadge.confirmed}>
        <Bell className={iconSize.small} /> Confirmed
      </span>
    );

  if (itemStatus === "Pending")
    return (
      <span className={badgeStyles.statusBadge.pending}>
        <Clock className={iconSize.small} /> Pending
      </span>
    );

  if (itemStatus === "Canceled")
    return (
      <span className={badgeStyles.statusBadge.canceled}>
        <XCircle className={iconSize.small} /> Canceled
      </span>
    );

  return (
    <span className={badgeStyles.statusBadge.default}>
      <CalendarDays className={iconSize.small} /> Rescheduled
    </span>
  );
};

const AppointmentPage = () => {

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const [doctorAppts, setDoctorAppts] = useState([]);
  const [serviceAppts, setServiceAppts] = useState([]);

  const [appointmentsRaw, setAppointmentsRaw] = useState({
    doctors: [],
    services: [],
  });

  const [error, setError] = useState(null);

  const loadDoctorAppointments = useCallback(async () => {
    if (!isLoaded) return;

    setLoadingDoctors(true);
    setError(null);

    let token = null;

    try {
      token = await getToken();
    } catch (err) {}

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {

      const resp = await API.get("/api/appointments/me", { headers });

      const fetched =
        resp?.data?.appointments ??
        resp?.data?.data ??
        resp?.data ??
        [];

      const arr = Array.isArray(fetched) ? fetched : [];

      const doctors = arr.filter((a) =>
        (a.doctorId !== undefined && a.doctorId !== null) ||
        !!a.doctorName ||
        !a.serviceId
      );

      setDoctorAppts(doctors);
      setAppointmentsRaw((p) => ({ ...p, doctors }));

    } catch (err) {

      setDoctorAppts([]);

    } finally {
      setLoadingDoctors(false);
    }

  }, [isLoaded, getToken, user]);

  const loadServiceAppointments = useCallback(async () => {

    if (!isLoaded) return;

    setLoadingServices(true);
    setError(null);

    let token = null;

    try {
      token = await getToken();
    } catch (err) {}

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {

      const resp = await API.get("/api/service-appointments/me", { headers });

      const fetched =
        resp?.data?.appointments ??
        resp?.data?.data ??
        resp?.data ??
        [];

      const arr = Array.isArray(fetched) ? fetched : [];

      setServiceAppts(arr);
      setAppointmentsRaw((p) => ({ ...p, services: arr }));

    } catch (err) {

      setServiceAppts([]);

    } finally {

      setLoadingServices(false);

    }

  }, [isLoaded, getToken, user]);

  useEffect(() => {
    loadDoctorAppointments();
    loadServiceAppointments();
  }, [isLoaded, isSignedIn, user, loadDoctorAppointments, loadServiceAppointments]);

  function normalizeRescheduled(rt) {

    if (!rt) return null;

    if (rt.date && rt.time)
      return { date: rt.date, time: rt.time };

    if (rt.date && (rt.hour !== undefined || rt.minute !== undefined || rt.ampm)) {
      const hour = rt.hour ?? 0;
      const minute = rt.minute ?? 0;
      const ampm = rt.ampm ?? "";

      return { date: rt.date, time: `${hour}:${pad(minute)} ${ampm}` };
    }

    return {
      date: rt.date || rt?.dateString || "",
      time:
        rt.time ||
        (rt.hour
          ? `${rt.hour}:${pad(rt.minute || 0)} ${rt.ampm || ""}`
          : rt?.timeString || ""),
    };
  }

  const appointmentData = useMemo(() => {
    return doctorAppts
      .map((a) => {

        const id = a._id || a.id || String(a._id || "");

        const doctorObj =
          typeof a.doctorId === "object" && a.doctorId
            ? a.doctorId
            : {};

        const image =
  doctorObj?.imageUrl ||
  doctorObj?.avatar ||
  doctorObj?.image ||
  a?.doctorImage?.url ||
  a?.doctorImage ||
  a?.profileImage ||
  "/placeholder-doctor.png";

        const doctorName =
          doctorObj.name ||
          a.doctorName ||
          a.doctor ||
          "Doctor";

        const specialization =
          doctorObj.specialization ||
          a.specialization ||
          a.speciality ||
          "";

        const experience =
          doctorObj.experience ||
          a.experience ||
          "";

        const date = a.date || "";

        let time = a.time || "";

        const payment = (a.payment && a.payment.method) || "Cash";

        const status =
          a.status ||
          (a.payment && a.payment.status === "Paid"
            ? "Confirmed"
            : "Pending");

        const rescheduledTo =
          normalizeRescheduled(
            a.rescheduledTo || {
              date: a.rescheduledDate,
              time: a.rescheduledTime,
            }
          );

        return {
          id,
          image,
          doctor: doctorName,
          specialization,
          experience,
          date,
          time,
          payment,
          status,
          rescheduledTo,
        };

      })
      .map((x) => ({ ...x, status: computeStatus(x) }));

  }, [doctorAppts]);

  const serviceData = useMemo(() => {

    return serviceAppts
      .map((s) => {

        const id = s._id || s.id || String(s._id || "");

        const svc =
          typeof s.serviceId === "object" && s.serviceId
            ? s.serviceId
            : {};

      const image =
  s.serviceImage?.url ||
  s.serviceId?.imageUrl ||
  s.serviceId?.image ||
  svc?.imageUrl ||
  "/placeholder-service.png";

        const name =
          s.serviceName ||
          svc.name ||
          svc.title ||
          "Service";

        const price =
          s.fees ??
          s.amount ??
          s.price ??
          0;

        const date = s.date || "";
        const time =
  s.time ||
  (s.hour !== undefined
    ? `${String(s.hour).padStart(2,"0")}:${String(s.minute || 0).padStart(2,"0")} ${s.ampm || ""}`
    : "");

        const payment =
          (s.payment && s.payment.method) || "Cash";

        const status =
          s.status ||
          (s.payment && s.payment.status === "Paid"
            ? "Confirmed"
            : "Pending");

        const rescheduledTo =
          normalizeRescheduled(s.rescheduledTo || null);

        return {
          id,
          image,
          name,
          price,
          date,
          time,
          payment,
          status,
          rescheduledTo,
        };

      })
      .map((x) => ({ ...x, status: computeStatus(x) }));

  }, [serviceAppts]);

  return (

    <div className={appointmentPageStyles.pageContainer}>

      <Toaster position="top-right" />

      <div className={appointmentPageStyles.maxWidthContainer}>

        <h1 className={appointmentPageStyles.doctorTitle}>
          Your Doctor Appointments
        </h1>

        {loadingDoctors && (
          <div className={appointmentPageStyles.loadingText}>
            Loading Doctors...
          </div>
        )}

        {!loadingDoctors && appointmentData.length === 0 && (
          <div className={appointmentPageStyles.emptyStateText}>
            No doctor appointments found.
          </div>
        )}

        <div className={appointmentPageStyles.doctorGrid}>

          {appointmentData.map((item) => (

            <div key={item.id} className={cardStyles.doctorCard}>

              <div className={cardStyles.doctorImageContainer}>

                <img
                  src={item.image || "/placeholder-doctor.png"}
                  alt={item.doctor}
                  className={cardStyles.image}
                  loading="lazy"
                />

              </div>

              <h2 className={cardStyles.doctorName}>
                {item.doctor}
              </h2>

              <div className={cardStyles.specialization}>
                {item.specialization} {item.experience ? `• ${item.experience}` : ""}
              </div>

              <p className={cardStyles.dateContainer}>
                <CalendarDays className={iconSize.medium} /> {item.date}
              </p>

              <p className={cardStyles.timeContainer}>
                <Clock className={iconSize.medium} /> {item.time}
              </p>

              <div className={cardStyles.badgesContainer}>
                <PaymentBadge payment={item.payment} />
                <StatusBadge itemStatus={item.status} />
              </div>

            </div>

          ))}

        </div>

        <h1 className={appointmentPageStyles.serviceTitle}>
          Your Booked Services
        </h1>

        {loadingServices && (
          <div className={appointmentPageStyles.serviceLoadingText}>
            Loading Service Bookings...
          </div>
        )}

        {!loadingServices && serviceData.length === 0 && (
          <div className={appointmentPageStyles.emptyStateText}>
            No services bookings found.
          </div>
        )}

        <div className={appointmentPageStyles.serviceGrid}>

          {serviceData.map((srv) => (

            <div key={srv.id} className={cardStyles.serviceCard}>

              <div className={cardStyles.serviceImageContainer}>
                <img
                  src={srv.image || "/placeholder-service.png"}
                  alt={srv.name}
                  className={cardStyles.image}
                  loading="lazy"
                />
              </div>

              <h3 className={cardStyles.serviceName}>
                {srv.name}
              </h3>

              <p className={cardStyles.price}>
                ₹{srv.price}
              </p>

              <p className={cardStyles.serviceDateContainer}>
                <CalendarDays className={iconSize.medium} /> {srv.date}
              </p>

              <p className={cardStyles.serviceTimeContainer}>
                <Clock className={iconSize.medium} /> {srv.time}
              </p>

              <div className={cardStyles.badgesContainer}>
                <PaymentBadge payment={srv.payment} />
                <StatusBadge itemStatus={srv.status} />
              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

};

export default AppointmentPage;