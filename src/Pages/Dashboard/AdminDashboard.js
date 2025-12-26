import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Users,
  FileQuestion,
  Calendar,
  Tag,
  MessageSquare,
  BookOpen,
  University,
  Globe,
  Bell,
  Quote,
  Settings,
  BarChart3,
  PlusCircle,
  List,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  Menu,
  X,
  Home,
  LogOut,
  Sparkles,
  Zap,
  Moon,
  Sun,
} from "lucide-react";
import { getGeneralStats } from "../../Service/generalService";
import { UserContext } from "../../Hook/UserContext";
import { useTheme } from "../../Hook/ThemeContext";
import { useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import "./adminDashboard.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useContext(UserContext);
  const { theme, toggleTheme, isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getGeneralStats();
        console.log("📊 Stats data received:", data);
        
        // Ensure we have valid data structure
        if (data) {
          setStats({
            countrUsers: data.countrUsers ?? 0,
            countrProblems: data.countrProblems ?? 0,
            countrTags: data.countrTags ?? 0,
            countrContest: data.countrContest ?? 0,
            countrSubmissions: data.countrSubmissions ?? 0,
            countrQoutes: data.countrQoutes ?? 0,
            countrCountry: data.countrCountry ?? 0,
            countrRequestProblem: data.countrRequestProblem ?? 0,
          });
        } else {
          setStats({
            countrUsers: 0,
            countrProblems: 0,
            countrTags: 0,
            countrContest: 0,
            countrSubmissions: 0,
            countrQoutes: 0,
            countrCountry: 0,
            countrRequestProblem: 0,
          });
        }
      } catch (err) {
        console.error("❌ Error fetching stats:", err);
        setError("فشل تحميل الإحصائيات: " + (err.message || "خطأ غير معروف"));
        // Set default stats on error
        setStats({
          countrUsers: 0,
          countrProblems: 0,
          countrTags: 0,
          countrContest: 0,
          countrSubmissions: 0,
          countrQoutes: 0,
          countrCountry: 0,
          countrRequestProblem: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const adminSections = [
    {
      id: "problems",
      title: "إدارة المسائل",
      icon: <FileQuestion size={28} />,
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
      items: [
        { label: "إحصائيات المسائل", path: "/react-app/admin/dashboard", icon: <BarChart3 size={20} /> },
        { label: "جميع المسائل", path: "/react-app/admin/Problem-List", icon: <List size={20} /> },
        { label: "إضافة مسألة", path: "/react-app/admin/AddProblem", icon: <PlusCircle size={20} /> },
      ],
    },
    {
      id: "users",
      title: "إدارة المستخدمين",
      icon: <Users size={28} />,
      color: "green",
      gradient: "from-green-500 to-emerald-500",
      items: [
        { label: "جميع المستخدمين", path: "/react-app/admin/users", icon: <List size={20} /> },
        { label: "إضافة مستخدم", path: "/react-app/admin/add-user", icon: <PlusCircle size={20} /> },
      ],
    },
    {
      id: "contests",
      title: "إدارة المسابقات",
      icon: <Calendar size={28} />,
      color: "purple",
      gradient: "from-purple-500 to-pink-500",
      items: [
        { label: "جميع المسابقات", path: "/react-app/admin/contests", icon: <List size={20} /> },
        { label: "إضافة مسابقة", path: "/react-app/admin/AddContest", icon: <PlusCircle size={20} /> },
      ],
    },
    {
      id: "posts",
      title: "إدارة المنشورات",
      icon: <MessageSquare size={28} />,
      color: "pink",
      gradient: "from-pink-500 to-rose-500",
      items: [
        { label: "جميع المنشورات", path: "/react-app/admin/posts", icon: <List size={20} /> },
      ],
    },
    {
      id: "problem-requests",
      title: "طلبات المسائل",
      icon: <CheckCircle size={28} />,
      color: "teal",
      gradient: "from-teal-500 to-cyan-500",
      items: [
        { label: "جميع الطلبات", path: "/react-app/admin/problem-requests", icon: <List size={20} /> },
      ],
    },
    {
      id: "algorithms",
      title: "إدارة الخوارزميات",
      icon: <BookOpen size={28} />,
      color: "indigo",
      gradient: "from-indigo-500 to-purple-500",
      items: [
        { label: "جميع التاغات والخوارزميات", path: "/react-app/admin/Algorithm", icon: <List size={20} /> },
      ],
    },
    {
      id: "universities",
      title: "إدارة الجامعات",
      icon: <University size={28} />,
      color: "red",
      gradient: "from-red-500 to-orange-500",
      items: [
        { label: "جميع الجامعات", path: "/react-app/admin/Universities", icon: <List size={20} /> },
        { label: "إضافة جامعة", path: "/react-app/admin/AddUniversity", icon: <PlusCircle size={20} /> },
      ],
    },
    {
      id: "events",
      title: "إدارة الأحداث",
      icon: <Calendar size={28} />,
      color: "orange",
      gradient: "from-orange-500 to-amber-500",
      items: [
        { label: "جميع الأحداث", path: "/react-app/admin/EventList", icon: <List size={20} /> },
        { label: "إضافة حدث", path: "/react-app/admin/AddEvent", icon: <PlusCircle size={20} /> },
      ],
    },
    {
      id: "messages",
      title: "إدارة الرسائل",
      icon: <MessageSquare size={28} />,
      color: "yellow",
      gradient: "from-yellow-500 to-amber-500",
      items: [
        { label: "جميع الرسائل", path: "/react-app/admin/messages", icon: <List size={20} /> },
      ],
    },
  ];

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return new Intl.NumberFormat("ar-EG").format(num);
  };

  // Chart data
  const chartData = useMemo(() => {
    if (!stats) return null;

    const labels = [
      "المستخدمين",
      "المسائل",
      "التاغات",
      "المسابقات",
      "الحلول",
      "الاقتباسات",
      "الدول",
      "طلبات المسائل",
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

    const backgroundColors = [
      "rgba(16, 185, 129, 0.8)",    // green
      "rgba(59, 130, 246, 0.8)",    // blue
      "rgba(245, 158, 11, 0.8)",    // yellow
      "rgba(139, 92, 246, 0.8)",    // purple
      "rgba(6, 182, 212, 0.8)",     // cyan
      "rgba(236, 72, 153, 0.8)",    // pink
      "rgba(20, 184, 166, 0.8)",    // teal
      "rgba(99, 102, 241, 0.8)",    // indigo
    ];

    return {
      labels,
      datasets: [
        {
          label: "العدد",
          data: values,
          backgroundColor: backgroundColors,
          borderRadius: 12,
          borderSkipped: false,
        },
      ],
    };
  }, [stats]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const value = context.parsed.y ?? context.parsed;
            return ` ${formatNumber(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#334155",
          maxRotation: 45,
          minRotation: 0,
          font: { size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(15, 23, 42, 0.05)",
          drawBorder: false,
        },
        ticks: {
          color: "#334155",
          callback: function (value) {
            if (value >= 1000) return (value / 1000).toFixed(1) + "k";
            return value;
          },
          font: { size: 11 },
        },
      },
    },
    animation: {
      duration: 1500,
      easing: "easeOutQuart",
    },
  }), []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("idUser");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/react-app/login");
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: <Home size={20} />,
      path: "/admin/dashboard",
      color: "purple",
      exact: true,
    },
    {
      id: "problems",
      label: "المسائل",
      icon: <FileQuestion size={20} />,
      path: "/react-app/admin/Problem-List",
      color: "blue",
    },
    {
      id: "users",
      label: "المستخدمين",
      icon: <Users size={20} />,
      path: "/react-app/admin/users",
      color: "green",
    },
    {
      id: "contests",
      label: "المسابقات",
      icon: <Calendar size={20} />,
      path: "/react-app/admin/contests",
      color: "purple",
    },
    {
      id: "posts",
      label: "المنشورات",
      icon: <MessageSquare size={20} />,
      path: "/react-app/admin/posts",
      color: "pink",
    },
    {
      id: "problem-requests",
      label: "طلبات المسائل",
      icon: <CheckCircle size={20} />,
      path: "/react-app/admin/problem-requests",
      color: "teal",
    },
    {
      id: "algorithms",
      label: "الخوارزميات",
      icon: <BookOpen size={20} />,
      path: "/react-app/admin/Algorithm",
      color: "indigo",
    },
    {
      id: "universities",
      label: "الجامعات",
      icon: <University size={20} />,
      path: "/react-app/admin/Universities",
      color: "red",
    },
    {
      id: "events",
      label: "الأحداث",
      icon: <Calendar size={20} />,
      path: "/react-app/admin/EventList",
      color: "orange",
    },
    {
      id: "messages",
      label: "الرسائل",
      icon: <MessageSquare size={20} />,
      path: "/react-app/admin/messages",
      color: "yellow",
    },
  ];

  // Animation variants
  const sidebarVariants = {
    open: {
      width: 280,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      width: 0,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const menuItemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const logoTextVariants = {
    open: {
      opacity: 1,
      width: "auto",
      transition: {
        delay: 0.1,
        duration: 0.3,
      },
    },
    closed: {
      opacity: 0,
      width: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const userVariants = {
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        delay: 0.2,
        duration: 0.3,
      },
    },
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const statCardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    }),
  };

  const sectionCardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    }),
  };

  return (
    <div className={`admin-dashboard ${isDark ? "dark-mode" : ""}`}>
      {/* Sidebar */}
      <motion.aside
        className={`admin-sidebar ${sidebarOpen ? "admin-sidebar--open" : "admin-sidebar--closed"}`}
        variants={sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        initial={false}
        style={{
          overflow: sidebarOpen ? "auto" : "hidden",
        }}
      >
        <div className="admin-sidebar__header">
          <motion.div
            className="admin-sidebar__logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
              className="admin-sidebar__logo-icon"
            >
              <Sparkles size={24} />
            </motion.div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  className="admin-sidebar__logo-text"
                  variants={logoTextVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  لوحة الأدمن
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="admin-sidebar__header-actions">
            <motion.button
              className="admin-sidebar__theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
            <motion.button
              className="admin-sidebar__toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="إخفاء/إظهار القائمة"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {menuItems.map((item, index) => {
            const isActive =
              location.pathname === item.path ||
              (item.exact
                ? false
                : location.pathname.includes(item.path.replace("/react-app", ""))) ||
              (item.path === "/admin/dashboard" && location.pathname === "/admin/dashboard");

            return (
              <motion.button
                key={item.id}
                className={`admin-sidebar__item ${
                  isActive ? "admin-sidebar__item--active" : ""
                }`}
                onClick={() => navigate(item.path)}
                variants={menuItemVariants}
                animate={sidebarOpen ? "open" : "closed"}
                initial="closed"
                whileHover={{ x: -4, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
              >
                <motion.span
                  className={`admin-sidebar__item-icon admin-sidebar__item-icon--${item.color}`}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                >
                  {item.icon}
                </motion.span>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      className="admin-sidebar__item-label"
                      variants={logoTextVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <AnimatePresence>
            {sidebarOpen && user && (
              <motion.div
                className="admin-sidebar__user"
                variants={userVariants}
                initial="closed"
                animate="open"
                exit="closed"
                whileHover={{ y: -2, scale: 1.02 }}
              >
                <motion.div
                  className="admin-sidebar__user-avatar"
                  whileHover={{ rotate: 360, scale: 1.15 }}
                  transition={{ duration: 0.6 }}
                >
                  {user.userName?.[0]?.toUpperCase() || "A"}
                </motion.div>
                <div className="admin-sidebar__user-info">
                  <div className="admin-sidebar__user-name">{user.userName || "أدمن"}</div>
                  <div className="admin-sidebar__user-role">مدير النظام</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            className="admin-sidebar__logout"
            onClick={handleLogout}
            whileHover={{ x: -4, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
            >
              <LogOut size={20} />
            </motion.div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  variants={logoTextVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  تسجيل الخروج
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.div
        className={`admin-dashboard__main ${sidebarOpen ? "admin-dashboard__main--with-sidebar" : ""}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Menu Toggle Button - Always visible when sidebar is closed */}
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0, rotate: 180 }}
            className="admin-dashboard__menu-toggle-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="إظهار القائمة"
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <Zap size={24} />
          </motion.button>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="admin-dashboard__mobile-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="إظهار/إخفاء القائمة"
        >
          <Menu size={24} />
        </button>

        {/* Show dashboard content only on /admin/dashboard or /react-app/admin/dashboard */}
        {(location.pathname === "/admin/dashboard" || location.pathname === "/react-app/admin/dashboard") ? (
          <>
            {/* Stats Section */}
            <div className="admin-dashboard__stats-section">
              <motion.div
                className="admin-dashboard__section-header"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="admin-dashboard__section-title-wrapper">
                  <BarChart3 size={28} className="admin-dashboard__section-icon" />
                  <h2 className="admin-dashboard__section-title">الإحصائيات العامة</h2>
                </div>
                <motion.div
                  className="admin-dashboard__section-badge"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TrendingUp size={16} />
                  <span>مباشر</span>
                </motion.div>
              </motion.div>

              {loading ? (
                <motion.div
                  className="admin-dashboard__loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="admin-dashboard__loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>جاري تحميل الإحصائيات...</span>
                </motion.div>
              ) : error ? (
                <motion.div
                  className="admin-dashboard__error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <XCircle size={24} />
                  <span>{error}</span>
                </motion.div>
              ) : stats ? (
                <>
                  <motion.div
                    className="admin-dashboard__stats-grid"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}
                    initial="hidden"
                    animate="visible"
                  >
                    {[
                      { icon: <Users size={24} />, value: stats.countrUsers || 0, label: "المستخدمين", color: "users" },
                      { icon: <FileQuestion size={24} />, value: stats.countrProblems || 0, label: "المسائل", color: "problems" },
                      { icon: <Tag size={24} />, value: stats.countrTags || 0, label: "التاغات", color: "tags" },
                      { icon: <Calendar size={24} />, value: stats.countrContest || 0, label: "المسابقات", color: "contests" },
                      { icon: <CheckCircle size={24} />, value: stats.countrSubmissions || 0, label: "الحلول", color: "submissions" },
                      { icon: <Quote size={24} />, value: stats.countrQoutes || 0, label: "الاقتباسات", color: "quotes" },
                      { icon: <Globe size={24} />, value: stats.countrCountry || 0, label: "الدول", color: "countries" },
                      { icon: <Bell size={24} />, value: stats.countrRequestProblem || 0, label: "طلبات المسائل", color: "requests" },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        className={`admin-dashboard__stat-card stat-card--${stat.color}`}
                        variants={statCardVariants}
                        custom={index}
                        whileHover={{ y: -8, scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className="stat-card__icon"
                          whileHover={{ rotate: 10, scale: 1.1 }}
                        >
                          {stat.icon}
                        </motion.div>
                        <div className="stat-card__content">
                          <motion.div
                            className="stat-card__value"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                          >
                            {formatNumber(stat.value)}
                          </motion.div>
                          <div className="stat-card__label">{stat.label}</div>
                        </div>
                        <motion.div
                          className="stat-card__glow"
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Chart Section */}
                  {chartData && (
                    <motion.div
                      className="admin-dashboard__chart-section"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                    >
                      <div className="admin-dashboard__chart-card">
                        <div className="admin-dashboard__chart-header">
                          <BarChart3 size={24} />
                          <h3 className="admin-dashboard__chart-title">توزيع الإحصائيات</h3>
                        </div>
                        <div className="admin-dashboard__chart-container">
                          <Bar data={chartData} options={chartOptions} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  className="admin-dashboard__no-data"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <BarChart3 size={48} />
                  <p>لا توجد بيانات متاحة</p>
                </motion.div>
              )}
            </div>

            {/* Control Sections */}
            <div className="admin-dashboard__sections">
              <motion.div
                className="admin-dashboard__section-header"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="admin-dashboard__section-title-wrapper">
                  <Settings size={28} className="admin-dashboard__section-icon" />
                  <h2 className="admin-dashboard__section-title">أدوات التحكم</h2>
                </div>
                <div className="admin-dashboard__section-description">
                  إدارة سريعة لجميع أقسام المنصة
                </div>
              </motion.div>

              <motion.div
                className="admin-dashboard__sections-grid"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
              >
                {adminSections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    className={`admin-dashboard__section-card section-card--${section.color}`}
                    variants={sectionCardVariants}
                    custom={index}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="section-card__header">
                      <motion.div
                        className={`section-card__icon bg-gradient-to-br ${section.gradient}`}
                        whileHover={{ rotate: 10, scale: 1.1 }}
                      >
                        {section.icon}
                      </motion.div>
                      <h3 className="section-card__title">{section.title}</h3>
                    </div>
                    <div className="section-card__items">
                      {section.items.map((item, idx) => (
                        <motion.button
                          key={idx}
                          className="section-card__item"
                          onClick={() => navigate(item.path)}
                          whileHover={{ x: -6, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <motion.span
                            className="section-card__item-icon"
                            whileHover={{ rotate: 10, scale: 1.2 }}
                          >
                            {item.icon}
                          </motion.span>
                          <span className="section-card__item-label">{item.label}</span>
                          <motion.span
                            className="section-card__item-arrow"
                            initial={{ x: 0 }}
                            whileHover={{ x: -4 }}
                          >
                            →
                          </motion.span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </>
        ) : (
          <div className="admin-dashboard__content-wrapper">
            <Outlet />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
