import React, { useEffect, useState, useMemo } from "react";
import {
  PlusCircle,
  List,
  FileQuestion,
  Tag,
  CheckCircle,
  Calendar,
  BarChart3,
  User,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import api from "../../../Service/api";
import { useNavigate } from "react-router-dom";

/*
  نسخة عربية فقط ومحسّنة للتصميم مع إضافات إحصائية:
  - حالات تحميل/خطأ
  - بطاقات إحصائية محسّنة
  - نسبة الصعوبات مع شريط تقدم
  - رسم بياني للاضافات حسب التاريخ
  - أعلى الوسوم المستخدمة
  - أكثر الكتاب نشاطاً
  - متوسط الحلول لكل مسألة
  - جدول آخر المسائل المضافة
  كل شيء RTL ومهيأ للعرض العربي.
*/

export default function AdminProblems() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statsTop, setStatsTop] = useState([]);
  const [statsDifficulty, setStatsDifficulty] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [topTags, setTopTags] = useState([]);
  const [topAuthors, setTopAuthors] = useState([]);
  const [avgSolutions, setAvgSolutions] = useState(0);
  const [recentProblems, setRecentProblems] = useState([]);

  // لتهيئة الأرقام باللغة العربية
  const fmtNumber = (v) =>
    new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(v ?? 0);

  useEffect(() => {
    let mounted = true;

    const fetchProblems = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/api/problems/all");
        const data = Array.isArray(res.data) ? res.data : [];

        // إحصائيات أساسية
        const totalProblems = data.length;
        const totalSolutions = data.reduce((s, p) => s + (p.solutions?.length || 0), 0);

        const tagsFlat = data.flatMap((p) => (Array.isArray(p.tags) ? p.tags.map((t) => t.tagName) : []));
        const tagsCount = tagsFlat.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {});

        const uniqueTagsCount = new Set(tagsFlat).size;

        const authors = data.map((p) => p.userName || "غير محدد");
        const authorsCount = authors.reduce((acc, name) => {
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});

        const uniqueAuthorsCount = new Set(authors).size;

        // الصعوبات
        const easyCount = data.filter((p) => {
          const d = (p.difficulty || "").toString().toLowerCase();
          return d === "سهل" || d === "easy";
        }).length;
        const mediumCount = data.filter((p) => {
          const d = (p.difficulty || "").toString().toLowerCase();
          return d === "متوسط" || d === "medium";
        }).length;
        const hardCount = data.filter((p) => {
          const d = (p.difficulty || "").toString().toLowerCase();
          return d === "صعب" || d === "hard";
        }).length;

        // متوسط الحلول لكل مسألة
        const avg = totalProblems > 0 ? +(totalSolutions / totalProblems).toFixed(2) : 0;

        // أعلى الوسوم
        const tagsList = Object.entries(tagsCount)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        // أكثر الكتاب نشاطاً
        const authorsList = Object.entries(authorsCount)
          .map(([author, count]) => ({ author, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        // إعداد الرسم البياني (مجموعة حسب التاريخ)
        const map = new Map();
        let unknownCount = 0;
        data.forEach((p) => {
          if (!p.dateTime) {
            unknownCount++;
            return;
          }
          const d = new Date(p.dateTime);
          if (isNaN(d.getTime())) {
            unknownCount++;
            return;
          }
          const iso = d.toISOString().slice(0, 10);
          map.set(iso, (map.get(iso) || 0) + 1);
        });

        const sortedDates = Array.from(map.entries()).sort((a, b) => (a[0] > b[0] ? 1 : -1));
        const dateFormatter = new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "short" });

        const chartArr = sortedDates.map(([iso, count]) => {
          const d = new Date(iso);
          return { date: dateFormatter.format(d), count, iso };
        });
        if (unknownCount > 0) chartArr.push({ date: "غير محدد", count: unknownCount, iso: "zzzz" });

        // آخر المسائل
        const recent = [...data]
          .sort((a, b) => {
            const da = new Date(a.dateTime || 0).getTime();
            const db = new Date(b.dateTime || 0).getTime();
            return db - da;
          })
          .slice(0, 6)
          .map((p) => ({
            id: p._id || p.id || Math.random().toString(36).slice(2, 9),
            title: p.title || p.name || "بدون عنوان",
            author: p.userName || "غير محدد",
            solutions: p.solutions?.length || 0,
            tags: Array.isArray(p.tags) ? p.tags.map((t) => t.tagName).join(", ") : "",
            date: p.dateTime ? new Date(p.dateTime) : null,
          }));

        if (!mounted) return;

        setStatsTop([
          { title: "عدد المسائل", value: totalProblems, icon: FileQuestion, color: "bg-blue-500" },
          { title: "عدد الحلول الإجمالي", value: totalSolutions, icon: CheckCircle, color: "bg-green-500" },
          { title: "الوسوم المستخدمة", value: uniqueTagsCount, icon: Tag, color: "bg-yellow-500" },
          { title: "عدد الكتاب الفريدين", value: uniqueAuthorsCount, icon: List, color: "bg-purple-500" },
        ]);

        setStatsDifficulty([
          { title: "المسائل السهلة", value: easyCount, icon: BarChart3, color: "bg-emerald-500" },
          { title: "المسائل المتوسطة", value: mediumCount, icon: BarChart3, color: "bg-orange-500" },
          { title: "المسائل الصعبة", value: hardCount, icon: BarChart3, color: "bg-red-500" },
        ]);

        setTopTags(tagsList);
        setTopAuthors(authorsList);
        setAvgSolutions(avg);
        setChartData(chartArr);
        setRecentProblems(recent);
      } catch (err) {
        console.error("خطأ عند جلب البيانات:", err);
        if (!mounted) return;
        setError("حدث خطأ خلال جلب البيانات. حاول لاحقًا.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProblems();

    return () => {
      mounted = false;
    };
  }, []);

  // مكوّن بطاقة إحصائية
  const StatCard = ({ title, value, Icon, color, onClick }) => (
    <div
      onClick={onClick}
      className="flex items-center bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition cursor-pointer"
    >
      <div className={`p-3 rounded-lg text-white ${color} flex items-center justify-center`} style={{ minWidth: 50, minHeight: 50 }}>
        <Icon size={22} />
      </div>
      <div className="mr-4">
        <h3 className="text-gray-600 text-sm">{title}</h3>
        <p className="text-xl font-semibold">{fmtNumber(value)}</p>
      </div>
    </div>
  );

  // شريط تحميل بسيط
  const Spinner = () => (
    <div className="flex items-center gap-3">
      <svg className="animate-spin h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-gray-600">جاري التحميل...</span>
    </div>
  );

  // تنسيق التاريخ عربي
  const fmtDate = (d) =>
    d ? new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "short", year: "numeric" }).format(d) : "غير محدد";

  return (
    <div dir="rtl" className="p-6 space-y-6 text-right">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المسائل</h1>
          <p className="text-sm text-gray-500 mt-1">لوحة تحكم لعرض إحصاءات المسائل والوسوم والكتاب</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/react-app/admin/AddProblem")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition focus:outline-none"
            aria-label="إضافة مسألة"
          >
            <PlusCircle size={18} />
            إضافة مسألة
          </button>

          <button
            onClick={() => navigate("/react-app/admin/Problem-List")}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg transition focus:outline-none"
            aria-label="عرض المسائل"
          >
            <List size={18} />
            عرض المسائل
          </button>
        </div>
      </header>

      {loading ? (
        <div className="bg-white p-6 rounded-xl shadow flex items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow-sm">{error}</div>
      ) : (
        <>
          {/* البطاقات الأساسية */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsTop.map((s, i) => (
              <StatCard
                key={i}
                title={s.title}
                value={s.value}
                Icon={s.icon}
                color={s.color}
                onClick={() => {
                  // سلوك اختياري عند الضغط: نفتح قائمة المسائل أو نفلتر (يمكن تخصيص لاحقًا)
                  navigate("/react-app/admin/Problem-List");
                }}
              />
            ))}
          </section>

          {/* صف الصعوبات والرسم واللوحة الجانبية */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* صعوبات */}
            <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-gray-700 font-semibold flex items-center gap-2">
                <BarChart3 size={18} />
                توزيع الصعوبات
              </h3>

              <div className="mt-4 space-y-4">
                {statsDifficulty.map((d, idx) => {
                  const total = statsTop[0]?.value || 1;
                  const percent = total ? Math.round((d.value / Math.max(1, total)) * 100) : 0;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md text-white ${d.color}`}>
                            <d.icon size={16} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">{d.title}</p>
                          </div>
                        </div>
                        <div className="text-sm font-semibold">{fmtNumber(d.value)}</div>
                      </div>

                      <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={d.color}
                          style={{ width: `${Math.min(100, percent)}%`, height: "100%" }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{percent}% من الإجمالي</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* الرسم البياني */}
            <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} />
                <h3 className="text-gray-700 font-semibold">إحصائيات إضافة المسائل</h3>
              </div>

              {chartData.length === 0 ? (
                <div className="py-8 text-center text-gray-500">لا توجد بيانات للرسم البياني</div>
              ) : (
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 6, right: 8, bottom: 6, left: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [fmtNumber(value), "عدد المسائل"]} />
                      <CartesianGrid stroke="#f3f4f6" strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* اللوحة الجانبية: أعلى الوسوم + أكثر الكتاب + متوسط الحلول */}
            <aside className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md space-y-4">
              <div>
                <h4 className="text-gray-700 font-semibold flex items-center gap-2"><Tag size={16} /> أعلى الوسوم</h4>
                <ul className="mt-3 space-y-2">
                  {topTags.length === 0 ? (
                    <li className="text-gray-500">لا توجد وسوم</li>
                  ) : (
                    topTags.map((t, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{i + 1}</span>
                          <span className="text-gray-700">{t.tag}</span>
                        </div>
                        <span className="text-sm text-gray-500">{fmtNumber(t.count)}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div>
                <h4 className="text-gray-700 font-semibold flex items-center gap-2"><User size={16} /> أكثر الكتاب نشاطاً</h4>
                <ul className="mt-3 space-y-2">
                  {topAuthors.length === 0 ? (
                    <li className="text-gray-500">لا توجد بيانات</li>
                  ) : (
                    topAuthors.map((a, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{i + 1}</span>
                          <span className="text-gray-700">{a.author}</span>
                        </div>
                        <span className="text-sm text-gray-500">{fmtNumber(a.count)}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="pt-2 border-t">
                <h4 className="text-gray-700 font-semibold flex items-center gap-2"><CheckCircle size={16} /> متوسط الحلول</h4>
                <div className="mt-2 text-lg font-semibold">{avgSolutions} <span className="text-sm text-gray-500">حل/مسألة</span></div>
              </div>
            </aside>
          </section>

          {/* آخر المسائل */}
          <section className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-700 font-semibold flex items-center gap-2">
                <Clock size={18} />
                آخر المسائل
              </h3>
              <button
                onClick={() => navigate("/react-app/admin/Problem-List")}
                className="text-sm text-blue-600 hover:underline"
              >
                عرض الكل
              </button>
            </div>

            {recentProblems.length === 0 ? (
              <div className="py-8 text-center text-gray-500">لا توجد مسائل مؤخرًا</div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b">
                      <th className="py-2 pr-3 text-right">العنوان</th>
                      <th className="py-2 pr-3 text-right">الكاتب</th>
                      <th className="py-2 pr-3 text-right">الوسوم</th>
                      <th className="py-2 pr-3 text-right">الحلول</th>
                      <th className="py-2 pr-3 text-right">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProblems.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 pr-3">{p.title}</td>
                        <td className="py-3 pr-3 text-gray-700">{p.author}</td>
                        <td className="py-3 pr-3 text-gray-600">{p.tags || "-"}</td>
                        <td className="py-3 pr-3 text-gray-700">{fmtNumber(p.solutions)}</td>
                        <td className="py-3 pr-3 text-gray-600">{fmtDate(p.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}