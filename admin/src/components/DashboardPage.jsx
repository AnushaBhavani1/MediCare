import React, { useState, useEffect, useMemo } from "react";
import { dashboardStyles as s } from "../assets/dummyStyles";
import {
  BadgeIndianRupee,
  CalendarRange,
  CheckCircle,
  UserRoundCheck,
  XCircle,
  Users,
  Search,
} from "lucide-react";

const API_BASE = "http://localhost:4000";
const PATIENT_COUNT_API = `${API_BASE}/api/appointments/patients/count`;
const INITIAL_COUNT = 5;
// =============================
// HELPER
// =============================
const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// =============================
// NORMALIZE DOCTOR
// =============================
function normalizeDoctor(doc) {
  const id = doc._id || doc.id || Math.random().toString();

  const name =
    doc.name ||
    doc.fullName ||
    `${doc.firstName || ""} ${doc.lastName || ""}`.trim() ||
    "Unknown";

  const specialization =
    doc.specialization ||
    doc.speciality ||
    (Array.isArray(doc.specializations)
      ? doc.specializations.join(", ")
      : "") ||
    "General";

  const fee = safeNumber(
    doc.fee ??
    doc.fees ??
    doc.consultationFee ??
    doc.consultation_fee ??
    0
  );

const appointments = {
  total: safeNumber(doc.appointmentsTotal),
  completed: safeNumber(doc.appointmentsCompleted),
  canceled: safeNumber(doc.appointmentsCanceled),
};
 const earnings = safeNumber(doc.earnings ?? appointments.completed * fee);

  // ⭐ IMAGE FIX HERE
  const image =
    doc.imageUrl ||
    doc.avatar ||
    doc.profileImage ||
    doc.image ||
    "/placeholder-doctor.png";

  return {
    id,
    name,
    specialization,
    fee,
    appointments,
    earnings,
    image,
  };
}

// =============================
// DASHBOARD COMPONENT
// =============================
const DashboardPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [patientCount, setPatientCount] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // ✅ FIXED
  const [showAll, setShowAll] = useState(false);
  // =============================
  // FETCH DOCTORS
  // =============================
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/api/doctors?limit=200`);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const body = await res.json();

        const list =
          Array.isArray(body)
            ? body
            : body?.data || body?.doctors || body?.result || [];

        setDoctors(Array.isArray(list) ? list.map(normalizeDoctor) : []);
      } catch (err) {
        console.error("Doctor fetch error:", err);
        setDoctors([]);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  // =============================
  // FETCH PATIENT COUNT
  // =============================
  useEffect(() => {
  const loadPatients = async () => {
    try {
      const res = await fetch(PATIENT_COUNT_API);
      const body = await res.json();

      setPatientCount(body.totalUsers || 0);

    } catch (err) {
      console.error("Patient count error:", err);
      setPatientCount(0);
    }
  };

  loadPatients();
}, []);

  // =============================
  // FILTER DOCTORS
  // =============================
  const filteredDoctors = useMemo(() => {
    if (!query.trim()) return doctors;

    const q = query.toLowerCase();

    return doctors.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      String(d.fee).includes(q)
    );
  }, [doctors, query]);

  const visibleDoctors = filteredDoctors;

  // =============================
  // CALCULATE TOTALS
  // =============================
  const totals = useMemo(() => {
    return {
      totalDoctors: doctors.length,
      totalAppointments: doctors.reduce(
        (sum, d) => sum + safeNumber(d.appointments.total),
        0
      ),
      totalEarnings: doctors.reduce(
        (sum, d) => sum + safeNumber(d.earnings),
        0
      ),
      completed: doctors.reduce(
        (sum, d) => sum + safeNumber(d.appointments.completed),
        0
      ),
      canceled: doctors.reduce(
        (sum, d) => sum + safeNumber(d.appointments.canceled),
        0
      ),
    };
  }, [doctors]);

  return (
    <div className={s.pageContainer}>
      <div className={s.maxWidthContainer}>

        <div className={s.headerContainer}>
          <div>
            <h1 className={s.headerTitle}>DASHBOARD</h1>
            <p className={s.headerSubtitle}>
              Overview of doctors & appointments
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className={s.statsGrid}>
          <StatCard icon={<Users className="w-6 h-6" />} label="Total Doctors" value={totals.totalDoctors} />
          <StatCard icon={<UserRoundCheck className="w-6 h-6" />} label="Total Registered Users" value={patientCount} />
          <StatCard icon={<CalendarRange className="w-6 h-6" />} label="Total Appointments" value={totals.totalAppointments} />
          <StatCard icon={<BadgeIndianRupee className="w-6 h-6" />} label="Total Earnings" value={`Rs.${totals.totalEarnings}`} />
          <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Completed" value={totals.completed} />
          <StatCard icon={<XCircle className="w-6 h-6" />} label="Canceled" value={totals.canceled} />
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className={s.searchLabel}>Search Doctors</label>
          <div className={s.searchContainer}>
            <div className={s.searchInputContainer}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={s.searchInput}
                placeholder="Search name / Specialization / fee"
              />
              <Search className={s.searchIcon} />
            </div>
            <button
              onClick={() => setQuery("")}
              className={s.clearButton + " " + s.cursorPointer}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={s.tableContainer}>
          <div className={s.tableHeader}>
            <h2 className={s.tableTitle}>Doctors</h2>
            <p className={s.tableCount}>
              {loading
                ? "Loading..."
                : `Showing ${visibleDoctors.length} of ${filteredDoctors.length}`}
            </p>
          </div>

          {error && (
            <div className={s.errorContainer}>
              Error loading doctors: {error}
            </div>
          )}

          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead className={s.tableHead}>
                <tr>
                  <th className={s.tableHeaderCell}>Doctor</th>
                  <th className={s.tableHeaderCell}>Specialization</th>
                  <th className={s.tableHeaderCell}>Fee</th>
                  <th className={s.tableHeaderCell}>Appointments</th>
                  <th className={s.tableHeaderCell}>Completed</th>
                  <th className={s.tableHeaderCell}>Canceled</th>
                  <th className={s.tableHeaderCell}>Total Earnings</th>
                </tr>
              </thead>
               <tbody className={s.tableBody}>
                {visibleDoctors.map((d, idx) => (
                  <tr
                    key={d.id}
                    className={s.tableRow + " " + 
                      (idx % 2 === 0 ? s.tableRowEven : s.tableRowOdd)}
                  >
                    <td className={s.tableCell + " " + s.tableCellFlex}>
                      <div className={s.verticalLine} />
                      <img
                        src={d.image}
                        alt={d.name}
                        className={s.doctorImage}
                      />
                      <div>
                        <div className={s.doctorName}>
                          {d.name}
                        </div>
                        <div className={s.doctorId}>
                          ID: {d.id}
                        </div>
                      </div>
                    </td>

                    <td className={s.tableCell + " " + s.doctorSpecialization}>
                      {d.specialization}
                    </td>

                    <td className={s.tableCell + " " + s.feeText}>
                      ₹ {d.fee}
                    </td>

                    <td className={s.tableCell + " " + s.appointmentsText}>
                      {d.appointments.total}
                    </td>

                    <td className={s.tableCell + " " + s.completedText}>
                      {d.appointments.completed}
                    </td>

                    <td className={s.tableCell + " " + s.canceledText}>
                      {d.appointments.canceled}
                    </td>

                    <td className={s.tableCell + " " + s.earningsText}>
                      ₹ {d.earnings.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
        
             
            </table>
          </div>

          <div className={s.mobileDoctorContainer}>
            <div className={s.mobileDoctorGrid}>
              {visibleDoctors.map((d)=>(
                <MobileDoctorCard key={d.id} d={d}/>

              ))}
            </div>
          </div>

          {filteredDoctors.length > INITIAL_COUNT && (
            <div className={s.showMoreContainer}>
              <button onClick={()=> setShowAll((s)=> !s)}
              className={s.showMoreButton + " " + s.cursorPointer}>
                {showAll ? 
                "Show less" : `Show more (${filteredDoctors.length - INITIAL_COUNT})`}
              </button>
              </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;

// =============================
// STAT CARD
// =============================
function StatCard({ icon, label, value }) {
  return (
    <div className={s.statCard}>
      <div className={s.statCardContent}>
        <div className={s.statIconContainer}>{icon}</div>
        <div className="flex-1">
          <div className={s.statLabel}>{label}</div>
          <div className={s.statValue}>{value}</div>
        </div>
      </div>
    </div>
  );
}


function MobileDoctorCard({d}) {
  return (
    <div className={s.mobileDoctorCard}>
      <div className={s.mobileDoctorHeader}>
        <div className=" flex items-center gap-3">
          <img src={d.image} alt={d.name} className={s.mobileDoctorImage}/>
          <div>
            <div className={s.mobileDoctorName}>{d.name}</div>
            <div className={s.mobileDoctorSpecialization}>
              {d.specialization}
            </div>
          </div>
        </div>
        <div className={s.mobileStatsGrid}>
          <div>
            <div className={s.mobileStatLabel}>Appts</div>
            <div className={s.mobileStatValue}>{d.appointments.total}</div>


          </div>

           <div>
            <div className={s.mobileStatLabel}>Done</div>
            <div className={s.mobileStatValue + " " + s.textEmerald600}>{d.appointments.completed}</div>


          </div>

             <div>
            <div className={s.mobileStatLabel}>Cancel</div>
            <div className={s.mobileStatValue + " " + s.textRose500}>{d.appointments.canceled}</div>
            

          </div>

        </div>

        <div className={s.mobileEarningsContainer}>
          <div>Earned</div>
          <div className=" font-semibold"> Rs {d.earnings.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}