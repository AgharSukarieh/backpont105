import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import { getAllEvents, deleteEvent } from "../../../Service/eventService";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* SVG placeholder */
const svgPlaceholder = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000' viewBox='0 0 1600 1000' preserveAspectRatio='none'>
    <rect width='100%' height='100%' fill='#f8fafc'/>
    <g fill='#cbd5e1' font-family='Inter, Arial, sans-serif' font-size='36' text-anchor='middle'>
      <text x='50%' y='48%'>لا توجد صورة</text>
      <text x='50%' y='62%' font-size='18'>Image not available</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();

function Thumb({ src, title }) {
  const imageSrc = src && String(src).trim() ? src : svgPlaceholder;
  return (
    <div className="flex-shrink-0 w-24 h-16 sm:w-28 sm:h-20 overflow-hidden rounded-lg bg-gray-100 shadow-sm">
      <img src={imageSrc} alt={title || "thumb"} className="w-full h-full object-cover" loading="lazy" />
    </div>
  );
}

export default function EventList() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, item: null });
  const [toasts, setToasts] = useState([]);
  const notify = useCallback(({ type = "info", title = "", message = "", duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  const fetchAll = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllEvents();
        const eventsArray = Array.isArray(data) ? data : [];
        setEvents(eventsArray);
      } catch (err) {
        const isCanceled =
          err?.code === "ERR_CANCELED" ||
          err?.name === "CanceledError" ||
          (err?.message && err.message.toLowerCase().includes("canceled"));
        if (isCanceled) return;
        console.error("Failed to fetch events:", err);
        setError("فشل في جلب قائمة الأحداث.");
        setEvents([]);
        notify({ type: "error", title: "فشل", message: "فشل في جلب قائمة الأحداث: " + (err.message || "خطأ غير معروف") });
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchAll(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchAll]);

  const onView = useCallback((item) => navigate(`/react-app/admin/event/${item.id}`, { state: { event: item } }), [navigate]);
  const onEdit = useCallback((item) => navigate(`/react-app/admin/event/${item.id}/edit`, { state: { event: item } }), [navigate]);

  const requestDelete = useCallback((item) => setConfirm({ open: true, item }), []);
  const cancelDelete = useCallback(() => setConfirm({ open: false, item: null }), []);

  const performDelete = useCallback(
    async (item) => {
      if (!item) return;
      setDeletingId(item.id);
      try {
        await deleteEvent(item.id);
        setEvents((prev) => prev.filter((e) => e.id !== item.id));
        notify({ type: "success", title: "تم الحذف", message: "تم حذف الحدث بنجاح" });
      } catch (err) {
        console.error("Delete failed:", err);
        notify({ type: "error", title: "فشل الحذف", message: "فشل حذف الحدث: " + (err.message || "خطأ غير معروف") });
      } finally {
        setDeletingId(null);
        setConfirm({ open: false, item: null });
      }
    },
    [notify]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const ctrl = new AbortController();
    try {
      await fetchAll(ctrl.signal);
    } finally {
      setRefreshing(false);
      ctrl.abort();
    }
  }, [fetchAll]);

  const [daysFilter, setDaysFilter] = useState(0);

  const safeDate = (v) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    if (!daysFilter || daysFilter <= 0) return events;
    const cutoff = Date.now() - daysFilter * 24 * 60 * 60 * 1000;
    return events.filter((e) => {
      const d = safeDate(e?.createdAt);
      if (!d) return false;
      return d.getTime() >= cutoff;
    });
  }, [events, daysFilter]);

  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const totalViews = filteredEvents.reduce((s, e) => s + (Number(e.views) || 0), 0);
    const totalClicks = filteredEvents.reduce((s, e) => s + (Number(e.numberClickedButton) || 0), 0);

    let mostViewed = null;
    if (filteredEvents.length > 0) {
      mostViewed = filteredEvents.reduce((best, e) => {
        const v = Number(e.views) || 0;
        return !best || v > (Number(best.views) || 0) ? e : best;
      }, null);
    }

    const locMap = filteredEvents.reduce((acc, e) => {
      const k = e.location ? String(e.location).trim() : "غير محدد";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const topLocations = Object.entries(locMap)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const recentCount = events.filter((e) => {
      const d = safeDate(e?.createdAt);
      if (!d) return false;
      return d.getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000;
    }).length;

    return { totalEvents, totalViews, totalClicks, mostViewed, topLocations, recentCount };
  }, [filteredEvents, events]);

  const lineChartData = useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) return { labels: [], datasets: [] };
    const map = filteredEvents.reduce((acc, ev) => {
      const d = safeDate(ev?.createdAt);
      if (!d) return acc;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${day}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const keys = Object.keys(map).sort((a, b) => new Date(a) - new Date(b));
    const labels = keys.map((k) => {
      const parts = k.split("-");
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
    });
    const data = keys.map((k) => map[k] ?? 0);
    return {
      labels,
      datasets: [
        {
          label: "عدد الأحداث",
          data,
          fill: true,
          borderColor: "#0ea5a0",
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return "rgba(14,165,160,0.12)";
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, "rgba(14,165,160,0.22)");
            gradient.addColorStop(1, "rgba(14,165,160,0.04)");
            return gradient;
          },
          tension: 0.28,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [filteredEvents]);

  const lineChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed?.y ?? ctx.parsed ?? 0;
              return ` ${v} حدث${v === 1 ? "" : "ات"}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } },
        y: { beginAtZero: true, precision: 0, grid: { color: "rgba(203,213,225,0.35)" } },
      },
    };
  }, []);

  const locationsChartData = useMemo(() => {
    const rows = stats.topLocations || [];
    if (!rows.length) return { labels: [], datasets: [] };
    const labels = rows.map((r) => r.location);
    const data = rows.map((r) => r.count);
    const colors = ["#2563EB", "#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"].slice(0, rows.length);
    return {
      labels,
      datasets: [
        {
          label: "أحداث",
          data,
          backgroundColor: colors,
          borderRadius: 8,
        },
      ],
    };
  }, [stats.topLocations]);

  const locationsChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
        y: { ticks: { mirror: false, padding: 6 }, grid: { display: false } },
      },
    };
  }, []);

  const itemVariants = { hidden: { opacity: 0, y: 8 }, enter: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8, scale: 0.99 } };

  const shortNumber = (n) => {
    if (n === null || n === undefined) return "0";
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
    return `${Math.round(n / 1_000_000)}M`;
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6" dir="rtl" lang="ar" aria-live="polite">
      {/* Toasts */}
      <div className="fixed top-5 left-5 z-50 flex flex-col items-start gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -12, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={
                "pointer-events-auto max-w-sm w-full p-3 rounded-lg shadow-lg transform " +
                (t.type === "error" ? "bg-red-50 border border-red-300" : t.type === "success" ? "bg-green-50 border border-green-300" : "bg-white border")
              }
              role="status"
              aria-live="assertive"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {t.title && <div className="font-semibold text-sm text-gray-800">{t.title}</div>}
                  <div className="text-sm text-gray-700 mt-1">{t.message}</div>
                </div>
                <button onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))} className="text-gray-500 hover:text-gray-700 p-1" aria-label="close">
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header: Title + Controls */}
      <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">قائمة الأحداث</h1>
          <p className="text-sm text-gray-500 mt-1">نظرة عامة على الأحداث وإحصاءات الأداء</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white rounded shadow p-2">
            {[0, 7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDaysFilter(d)}
                className={`px-3 py-1 rounded text-sm transition ${daysFilter === d ? "bg-indigo-600 text-white" : "text-gray-700"}`}
                aria-pressed={daysFilter === d}
                aria-label={d === 0 ? "عرض الكل" : `آخر ${d} يوم`}
              >
                {d === 0 ? "الكل" : `${d} يوم`}
              </button>
            ))}
          </div>

          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/react-app/admin/AddEvent")} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm shadow-sm hover:shadow-lg transition ml-2" aria-label="إضافة حدث">
            + حدث جديد
          </motion.button>

          <motion.button whileTap={{ scale: 0.96 }} onClick={onRefresh} disabled={refreshing} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm shadow-sm hover:shadow-lg transition ml-2 disabled:opacity-60" aria-label="تحديث">
            {refreshing ? "جارٍ..." : "تحديث"}
          </motion.button>
        </div>
      </header>

      {/* Grid: Left = list + stats, Right = charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4">
              <div className="p-2 bg-indigo-50 rounded-md">
                <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500">إجمالي الأحداث</div>
                <div className="text-lg font-semibold">{shortNumber(stats.totalEvents)}</div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4">
              <div className="p-2 bg-cyan-50 rounded-md">
                <svg className="w-5 h-5 text-cyan-600" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500">إجمالي المشاهدات</div>
                <div className="text-lg font-semibold">{shortNumber(stats.totalViews)}</div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4">
              <div className="p-2 bg-green-50 rounded-md">
                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500">نقرات التسجيل</div>
                <div className="text-lg font-semibold">{shortNumber(stats.totalClicks)}</div>
              </div>
            </div>
          </div>

          {/* Event list */}
          <section>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow animate-pulse">
                    <div className="w-24 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                      <div className="h-8 bg-gray-200 rounded w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white p-6 rounded shadow text-gray-600">لا توجد أحداث في الفترة المحددة.</div>
            ) : (
              <AnimatePresence>
                <div className="space-y-4">
                  {filteredEvents
                    .slice()
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((item) => (
                      <motion.div key={item.id} layout initial="hidden" animate="enter" exit="exit" variants={itemVariants} transition={{ duration: 0.24 }} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
                        <Thumb src={item.imageURL} title={item.title} />

                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-base font-semibold text-gray-900 truncate" title={item.title}>{item.title}</div>
                              <div className="text-sm text-gray-500 truncate" title={`${item.location ?? "غير محدد"} • ${safeDate(item.createdAt) ? safeDate(item.createdAt).toLocaleString("ar-EG") : item.createdAt}`}>
                                {item.location ?? "غير محدد"} • {safeDate(item.createdAt) ? safeDate(item.createdAt).toLocaleString("ar-EG") : item.createdAt}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-sm text-gray-500 text-right">
                                <div className="text-xs">المشاهدات</div>
                                <div className="font-medium text-gray-800">{shortNumber(item.views ?? 0)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 sm:mt-2 flex flex-wrap items-center gap-2">
                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => onView(item)} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm shadow-sm hover:shadow-md transition" aria-label={`عرض ${item.title}`}>عرض</motion.button>

                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => onEdit(item)} className="px-3 py-2 bg-yellow-500 text-white rounded-md text-sm shadow-sm hover:shadow-md transition" aria-label={`تعديل ${item.title}`}>تعديل</motion.button>

                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => requestDelete(item)} disabled={deletingId === item.id} className="px-3 py-2 bg-red-600 text-white rounded-md text-sm shadow-sm hover:shadow-md transition disabled:opacity-50" aria-label={`حذف ${item.title}`}>
                              {deletingId === item.id ? "جارٍ الحذف..." : "حذف"}
                            </motion.button>

                            <div className="ml-auto text-sm text-gray-500 flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                              <span className="font-medium text-gray-800">{item.numberClickedButton ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </AnimatePresence>
            )}
          </section>
        </div>

        {/* Right column */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">الأحداث عبر الزمن</div>
              <div className="text-xs text-gray-400">{lineChartData.labels?.length ?? 0} نقطة</div>
            </div>
            <div className="h-40">
              {loading ? (
                <div className="h-full w-full rounded-md overflow-hidden bg-gray-100 relative">
                  <div className="absolute inset-0 animate-gradient bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
                </div>
              ) : (
                <Line data={lineChartData} options={lineChartOptions} />
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">أكثر المواقع نشاطًا</div>
              <div className="text-xs text-gray-400">{stats.topLocations.length} موقع</div>
            </div>
            <div className="h-44">
              {stats.topLocations.length ? (
                <Bar data={locationsChartData} options={locationsChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">لا توجد بيانات للمواقع.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-700">موجز سريع</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>إجمالي: <span className="font-semibold text-gray-900">{shortNumber(stats.totalEvents)}</span></div>
              <div>المشاهدات: <span className="font-semibold text-gray-900">{shortNumber(stats.totalViews)}</span></div>
              <div>نقرات: <span className="font-semibold text-gray-900">{shortNumber(stats.totalClicks)}</span></div>
              <div>آخر 7 أيام: <span className="font-semibold text-gray-900">{shortNumber(stats.recentCount)}</span></div>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirm.open && confirm.item && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <motion.div initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 10, scale: 0.98 }} transition={{ type: "spring", stiffness: 280, damping: 30 }} className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4">
                <h3 id="confirm-title" className="text-lg font-semibold truncate" title={confirm.item.title}>تأكيد الحذف</h3>
                <p className="mt-2 text-sm text-gray-700">هل أنت متأكد أنك تريد حذف الحدث <span className="font-medium truncate" title={confirm.item.title}>{confirm.item.title}</span>؟ لا يمكن التراجع عن هذه العملية.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 p-4 border-t">
                <motion.button whileTap={{ scale: 0.98 }} onClick={cancelDelete} className="px-4 py-2 bg-gray-100 rounded text-sm w-full sm:w-auto" disabled={deletingId !== null}>إلغاء</motion.button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => performDelete(confirm.item)} className="px-4 py-2 bg-red-600 text-white rounded text-sm w-full sm:w-auto" disabled={deletingId === confirm.item.id}>
                  {deletingId === confirm.item.id ? "جارٍ الحذف..." : "حذف نهائي"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .animate-gradient { background-size: 200% 100%; animation: gradientMove 1.8s linear infinite; }
        @keyframes gradientMove { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* focus visible */
        :focus { outline: none; }
        :focus-visible { outline: 2px solid rgba(99,102,241,0.45); outline-offset: 2px; border-radius: 6px; }
      `}</style>
    </main>
  );
}