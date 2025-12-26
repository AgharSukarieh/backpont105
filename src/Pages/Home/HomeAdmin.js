import React, { useEffect, useState, useMemo } from "react";
import api from "../../Service/api";
import CountUp from "react-countup";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.6,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.8,
    },
  },
};

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.5,
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const blobVariants = {
  animate: {
    x: [0, 30, 0],
    y: [0, -30, 0],
    scale: [1, 1.1, 1],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const StatCard = ({ title, value, icon, accent, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      role="region"
      aria-label={`${title} statistic`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 ${accent} text-white shadow-lg flex items-center justify-between min-h-[88px] cursor-pointer group`}
      title={`${title}: ${value}`}
      style={{
        willChange: "transform",
      }}
    >
      <div className="flex items-center gap-3 w-full relative z-10">
        <div className="flex-1">
          <motion.span 
            className="text-xs sm:text-sm opacity-90 block"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: isHovered ? 1 : 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {title}
          </motion.span>
          <motion.h3 
            className="text-2xl sm:text-3xl font-extrabold leading-none mt-1"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
          >
            <CountUp 
              end={value || 0} 
              duration={2} 
              separator=","
              delay={index * 0.1}
            />
          </motion.h3>
        </div>

        <motion.div 
          className="flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-white/18 flex items-center justify-center shadow-md backdrop-blur-sm"
          animate={{
            rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{
            rotate: { duration: 0.5 },
            scale: { duration: 0.2 },
          }}
        >
          {icon}
        </motion.div>
      </div>

      {/* Animated background blob */}
      <motion.div 
        className="pointer-events-none absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 blur-3xl bg-white/30"
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          opacity: isHovered ? [0.2, 0.3, 0.2] : 0.2,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        animate={{
          x: isHovered ? "100%" : "-100%",
        }}
        transition={{
          duration: 0.6,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};

const IconUsers = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconProblems = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconTags = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10l4 4v6a2 2 0 01-2 2h-6l-8-8V7a2 2 0 012-2z" />
  </svg>
);

const IconContest = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M7 21H3V7a2 2 0 012-2h12l4 4v8a2 2 0 01-2 2h-5" />
  </svg>
);

const IconSubmissions = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3l-4 4-4-4" />
  </svg>
);

const IconQuotes = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M17 7h.01M3 20a4 4 0 014-4h10a4 4 0 014 4" />
  </svg>
);

const IconCountry = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M4 19h16M8 5v14M16 5v14" />
  </svg>
);

const IconRequests = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M12 8h0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AdminHome = () => {
  const [stats, setStats] = useState({
    countrUsers: 0,
    countrProblems: 0,
    countrTags: 0,
    countrContest: 0,
    countrSubmissions: 0,
    countrQoutes: 0,
    countrCountry: 0,
    countrRequestProblem: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const userName = (localStorage.getItem("userName") || "المشرف").toString();

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const res = await api.get("/general");
        if (res && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("خطأ في جلب الإحصائيات:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // prepare chart data - memoize so it doesn't recreate on every render
  const chartData = useMemo(() => {
    const labels = [
      "المستخدمين",
      "المسائل",
      "التاقات",
      "المسابقات",
      "التسليمات",
      "الاقتباسات",
      "الدول",
      "طلبات مسائل جديدة",
    ];
    const values = [
      stats.countrUsers || 0,
      stats.countrProblems || 0,
      stats.countrTags || 0,
      stats.countrContest || 0,
      stats.countrSubmissions || 0,
      stats.countrQoutes || 0,
      stats.countrCountry || 0,
      stats.countrRequestProblem || 0,
    ];
    // color palette that looks good on white bg
    const backgroundColors = [
      "#2563eb", // blue
      "#10b981", // green
      "#f59e0b", // yellow
      "#7c3aed", // purple
      "#ec4899", // pink
      "#6366f1", // indigo
      "#14b8a6", // teal
      "#f97316", // orange
    ];

    return {
      labels,
      datasets: [
        {
          label: "عدد",
          data: values,
          backgroundColor: backgroundColors,
          borderRadius: 8,
          barThickness: 28,
        },
      ],
    };
  }, [stats]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const val = context.parsed.y ?? context.parsed;
            return ` ${val.toLocaleString()}`;
          },
        },
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#334155",
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#334155",
          callback: function (value) {
            if (value >= 1000) return (value / 1000).toFixed(1) + "k";
            return value;
          },
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(15, 23, 42, 0.05)",
          drawBorder: false,
        },
      },
    },
  }), []);

  const statCards = [
    { title: "المستخدمين", value: stats.countrUsers, icon: IconUsers, accent: "from-blue-600 to-indigo-600 bg-gradient-to-br" },
    { title: "المسائل", value: stats.countrProblems, icon: IconProblems, accent: "from-green-500 to-emerald-500 bg-gradient-to-br" },
    { title: "التاقات", value: stats.countrTags, icon: IconTags, accent: "from-yellow-400 to-amber-500 bg-gradient-to-br" },
    { title: "المسابقات", value: stats.countrContest, icon: IconContest, accent: "from-purple-500 to-pink-500 bg-gradient-to-br" },
    { title: "التسليمات", value: stats.countrSubmissions, icon: IconSubmissions, accent: "from-pink-500 to-rose-500 bg-gradient-to-br" },
    { title: "الاقتباسات", value: stats.countrQoutes, icon: IconQuotes, accent: "from-indigo-500 to-violet-500 bg-gradient-to-br" },
    { title: "الدول", value: stats.countrCountry, icon: IconCountry, accent: "from-teal-500 to-cyan-500 bg-gradient-to-br" },
    { title: "طلبات مسائل جديدة", value: stats.countrRequestProblem, icon: IconRequests, accent: "from-orange-400 to-red-400 bg-gradient-to-br" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-x-hidden" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xl sm:text-2xl font-semibold text-indigo-600"
          >
            ⏳ جاري تحميل البيانات...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-slate-900 overflow-x-hidden"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-3xl p-6 md:p-10 bg-white/80 backdrop-blur-sm border border-gray-100/50 shadow-2xl overflow-hidden"
        >
          {/* Animated decorative blobs */}
          <motion.div
            variants={blobVariants}
            animate="animate"
            className="hidden sm:block absolute -top-12 -left-12 sm:w-40 sm:h-40 w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 opacity-60 blur-2xl pointer-events-none"
          />
          <motion.div
            variants={blobVariants}
            animate="animate"
            transition={{ delay: 2 }}
            className="hidden sm:block absolute -bottom-16 -right-8 sm:w-56 sm:h-56 w-48 h-48 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 opacity-40 blur-2xl pointer-events-none"
          />

          {/* Header */}
          <motion.div
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          >
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block mr-2"
                >
                  👑
                </motion.span>
                لوحة الإدارة
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="text-indigo-600 mr-2 font-semibold"
                >
                  {userName}
                </motion.span>
              </motion.h1>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-center gap-3"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-indigo-50 px-3 py-2 rounded-full border border-gray-100 shadow-sm"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg"
                >
                  {userName.charAt(0)}
                </motion.div>
                <div className="text-sm text-slate-700">
                  <div className="font-semibold leading-none">{userName}</div>
                  <div className="text-xs text-slate-500">مشرف النظام</div>
                </div>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg shadow-lg text-sm font-medium transition-all duration-200"
                onClick={() => window.location.reload()}
                aria-label="تحديث الصفحة"
                title="تحديث"
              >
                <motion.svg
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 11-8-8" />
                </motion.svg>
                تحديث
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Stats Cards Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {statCards.map((card, index) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
                accent={card.accent}
                index={index}
              />
            ))}
          </motion.div>

          {/* Chart section */}
          <motion.div
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            className="mt-8 bg-white/60 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100/50"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-between mb-4"
            >
              <h3 className="text-base sm:text-lg font-semibold text-slate-700 flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  📊
                </motion.span>
                توزيع الإحصائيات
              </h3>
              <div className="text-xs sm:text-sm text-slate-500">تمثيل بصري للأرقام الحالية</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="w-full"
            >
              <div className="w-full h-[220px] sm:h-56 md:h-72 lg:h-96">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 text-center text-sm text-slate-500"
          >
            الموقع برعاية المهندس أحمد نضال.
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminHome;
