import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  Users,
  Stethoscope,
  Activity,
  Star,
  Award,
  Package,
  Phone,
  Mail,
  Heart,
  Brain,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DoctorDetailsModal from "./DoctorDetailsModal";
import AddDoc from "./AddDoc";
import AddPatient from "./AddPatient";
import styles from "./HospitalDashBoard.module.css";

const COLORS = ["#60A5FA", "#34D399", "#FBBF24", "#F87171", "#A78BFA", "#EC4899"];

const DEPT_ICONS = {
  Cardiology: Heart,
  Neurology: Brain,
  Emergency: Zap,
  Orthopedics: Activity,
  default: Stethoscope,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "13px",
        }}
      >
        <p style={{ fontWeight: 700, marginBottom: "6px" }}>{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{ color: entry.color, margin: 0, fontWeight: 500 }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const HospitalDashboard = () => {
  const location = useLocation();
  const hospital = location?.state?.data;
  const hospitalId = hospital?._id || hospital?.hospitalId;

  const [dashboardData, setDashboardData] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/hospitals/${hospitalId}/dashboard`
      );
      if (res.data.success && res.data.dashboard) {
        setDashboardData(res.data.dashboard);
      } else {
        setError("Failed to load hospital data.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!hospitalId) {
      setError("Hospital ID not found. Please log in again.");
      return;
    }
    fetchDashboardData();
  }, [hospitalId]);

  if (error)
    return (
      <div className={styles.centerWrapper}>
        <div className={styles.errorCard}>
          <Activity size={32} />
          <p>{error}</p>
        </div>
      </div>
    );

  if (!dashboardData)
    return (
      <div className={styles.centerWrapper}>
        <div className={styles.loader}></div>
        <p className={styles.loadingText}>Loading hospital dashboard...</p>
      </div>
    );

  const { hospital: hosp, doctors = [], patients = [] } = dashboardData;
  const equipment = dashboardData.equipment || hosp?.equipment || [];

  // --- Doctor–Patient Mapping ---
  const doctorPatientMap = {};
  patients.forEach((p) => {
    if (p.doctor?._id)
      doctorPatientMap[p.doctor._id] =
        (doctorPatientMap[p.doctor._id] || 0) + 1;
  });

  const doctorsWithCounts = doctors.map((d) => ({
    ...d,
    patientsTreated: doctorPatientMap[d._id] || 0,
  }));

  // --- Department, Experience, Performance ---
  const deptData = doctorsWithCounts.reduce((acc, d) => {
    const key = d.specialization || d.department || "General";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const departmentChartData = Object.entries(deptData).map(([name, value]) => ({
    name,
    value,
  }));

  const topDoctors = [...doctorsWithCounts]
    .sort((a, b) => b.patientsTreated - a.patientsTreated)
    .slice(0, 5)
    .map((d) => ({
      name: d.name,
      patients: d.patientsTreated,
    }));

  const experienceDist = doctorsWithCounts.reduce((acc, d) => {
    const key =
      d.experience < 5
        ? "0–5 yrs"
        : d.experience < 10
        ? "5–10 yrs"
        : d.experience < 15
        ? "10–15 yrs"
        : "15+ yrs";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const experienceChartData = Object.entries(experienceDist).map(
    ([name, count]) => ({ name, count })
  );

  const performanceData = doctorsWithCounts.map((doc) => ({
    name: doc.name,
    patients: doc.patientsTreated,
    rating: Math.floor(Math.random() * 20) + 80,
  }));

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>{hosp.name}</h1>
            <p className={styles.subtitle}>
              {hosp.address?.city}, {hosp.address?.state}
            </p>
            <div className={styles.contactRow}>
              {hosp.contact?.phone && (
                <span className={styles.pill}>
                  <Phone size={14} /> {hosp.contact.phone}
                </span>
              )}
              {hosp.contact?.email && (
                <span className={styles.pill}>
                  <Mail size={14} /> {hosp.contact.email}
                </span>
              )}
            </div>
          </div>

          <div className={styles.ratingBox}>
            <Star className={styles.starIcon} size={24} />
            <div className={styles.ratingValue}>{hosp.rating || "4.6"}</div>
            <div className={styles.ratingLabel}>Hospital Rating</div>
          </div>
        </div>

        <nav className={styles.tabs}>
          {[
            { id: "overview", label: "Overview", icon: <Activity size={16} /> },
            { id: "doctors", label: "Doctors", icon: <Stethoscope size={16} /> },
            { id: "patients", label: "Patients", icon: <Users size={16} /> },
            { id: "equipment", label: "Equipment", icon: <Package size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${
                activeTab === tab.id ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          {/* ✅ Add Doctor Button */}
          <button
            onClick={() => setShowAddDoctor(true)}
            className={styles.addDoctorBtn}
          >
            + Add Doctor
          </button>
        </nav>
      </header>

      {/* ✅ Add Doctor Modal */}
      {showAddDoctor && (
        <AddDoc
          hospitalId={hospitalId}
          onClose={() => setShowAddDoctor(false)}
          onDoctorAdded={() => fetchDashboardData()}
        />
      )}

      {/* ✅ Add Patient Modal */}
      {showAddPatient && (
        <AddPatient
          hospitalId={hospitalId}
          doctors={doctors}
          onClose={() => setShowAddPatient(false)}
          onPatientAdded={() => fetchDashboardData()}
        />
      )}

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        {/* ===== OVERVIEW ===== */}
        {activeTab === "overview" && (
          <>
            {/* ✅ STATS */}
            <section className={styles.statsRow}>
              {[
                {
                  icon: <Stethoscope size={24} />,
                  color: "#60A5FA",
                  bg: "#DBEAFE",
                  label: "Total Doctors",
                  value: doctorsWithCounts.length,
                  trend: "+12% this month",
                },
                {
                  icon: <Users size={24} />,
                  color: "#10B981",
                  bg: "#D1FAE5",
                  label: "Total Patients",
                  value: patients.length,
                  trend: "+8% this month",
                },
                {
                  icon: <Package size={24} />,
                  color: "#F59E0B",
                  bg: "#FEF3C7",
                  label: "Equipment",
                  value: equipment.length,
                  trend: "+3 new items",
                },
                {
                  icon: <Award size={24} />,
                  color: "#8B5CF6",
                  bg: "#EDE9FE",
                  label: "Departments",
                  value: Object.keys(deptData).length,
                  trend: "Active specializations",
                },
              ].map((card, i) => (
                <div key={i} className={styles.statCard}>
                  <div
                    className={styles.statIconBox}
                    style={{
                      background: card.bg,
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div className={styles.statInfo}>
                    <p>{card.label}</p>
                    <h3>{card.value}</h3>
                    <span className={styles.trend}>{card.trend}</span>
                  </div>
                </div>
              ))}
            </section>

            {/* ✅ CHARTS */}
            <section className={styles.chartGrid}>
              <div className={styles.chartCard}>
                <h3>Top Performing Doctors</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topDoctors}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="patients" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.chartCard}>
                <h3>Department Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={departmentChartData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {departmentChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.chartCard}>
                <h3>Experience Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={experienceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#34D399" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.chartCard}>
                <h3>Doctor Performance Overview</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="patients"
                      stroke="#3B82F6"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#10B981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        {/* ===== DOCTORS ===== */}
        {activeTab === "doctors" && (
          <div className={styles.doctorGrid}>
            {doctorsWithCounts.map((doc) => {
              const DeptIcon =
                DEPT_ICONS[doc.specialization] || DEPT_ICONS.default;
              return (
                <div
                  key={doc._id}
                  className={styles.doctorCard}
                  onClick={() => setSelectedDoctor(doc)}
                >
                  <div className={styles.doctorTop}>
                    <div className={styles.avatar}>
                      <DeptIcon size={22} />
                    </div>
                    <div className={styles.tinyBadge}>
                      {doc.experience || 5} yrs
                    </div>
                  </div>
                  <h3>{doc.name}</h3>
                  <p className={styles.docSpecial}>
                    {doc.specialization || "General"}
                  </p>
                  <button
                    className={styles.viewBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDoctor(doc);
                    }}
                  >
                    View Details →
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== PATIENTS ===== */}
        {activeTab === "patients" && (
          <>
            <div className={styles.addSection}>
              <button
                onClick={() => setShowAddPatient(true)}
                className={styles.addDoctorBtn}
              >
                + Add Patient
              </button>
            </div>

            <div className={styles.doctorGrid}>
              {patients.map((p) => (
                <div
                  key={p._id}
                  className={`${styles.doctorCard} ${styles.patientCard}`}
                >
                  <div className={styles.patientIconTop}>
                    <Users size={24} />
                  </div>
                  <h3>{p.name}</h3>
                  <p>
                    {p.gender}, {p.age} years
                  </p>
                  <p>
                    Doctor: <b>{p.doctor?.name || "Not Assigned"}</b>
                  </p>
                  <p>{p.visitHistory?.[0]?.diagnosis || "General Checkup"}</p>
                  
                </div>

              ))}
            </div>
          </>
        )}

        {/* ===== EQUIPMENT ===== */}
        {activeTab === "equipment" && (
          <div className={styles.doctorGrid}>
            {equipment.length > 0 ? (
              equipment.map((item, i) => (
                <div
                  key={i}
                  className={`${styles.doctorCard} ${styles.equipmentCard}`}
                >
                  <div className={styles.avatar}>
                    <Package size={24} />
                  </div>
                  <h3>{item.name || item}</h3>
                  <p className={styles.docSpecial}>Available & Operational</p>
                </div>
              ))
            ) : (
              <div className={styles.errorCard}>No equipment data found</div>
            )}
          </div>
        )}
      </main>

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <DoctorDetailsModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </div>
  );
};

export default HospitalDashboard;
