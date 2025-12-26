import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getUniversityById } from "../../../Service/UniversityService";

export default function UniversityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUniversity = async () => {
      if (!id) {
        setError("معرف الجامعة غير موجود في الرابط.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const numericId = Number(id);
        console.log("🔍 Fetching university with ID:", numericId);

        if (isNaN(numericId) || numericId <= 0) {
          throw new Error("معرف الجامعة غير صحيح.");
        }

        const data = await getUniversityById(numericId);
        console.log("✅ University data received:", data);

        if (!data || !data.id) {
          throw new Error("لم يتم العثور على بيانات الجامعة.");
        }

        setUniversity(data);
      } catch (error) {
        console.error("❌ خطأ أثناء جلب بيانات الجامعة:", error);
        console.error("❌ Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          universityId: id,
        });
        const errorMessage =
          error.response?.status === 404
            ? "الجامعة غير موجودة."
            : error.response?.data?.message || error.message || "خطأ أثناء تحميل بيانات الجامعة!";
        setError(errorMessage);
        setUniversity(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversity();
  }, [id]);

  const initials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <div className="animate-pulse h-4 w-48 bg-gray-200 rounded mb-4 mx-auto" />
          <div className="text-lg font-semibold text-gray-600">⏳ جاري تحميل بيانات الجامعة...</div>
        </div>
      </div>
    );

  if (error || !university) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <div className="text-red-500 text-xl font-semibold mb-2">❌ {error || "لم يتم العثور على الجامعة"}</div>
          <p className="text-gray-600 mb-4">معرف الجامعة: {id}</p>
          <div className="flex items-center justify-center gap-3">
          <button
              onClick={() => {
                setError(null);
                setLoading(true);
                const fetchUniversity = async () => {
                  try {
                    const data = await getUniversityById(Number(id));
                    setUniversity(data);
                    setError(null);
                  } catch (err) {
                    setError(err.message || "خطأ أثناء تحميل بيانات الجامعة!");
                  } finally {
                    setLoading(false);
                  }
                };
                fetchUniversity();
              }}
            className="mt-3 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
              🔄 إعادة المحاولة
            </button>
            <button
              onClick={() => navigate("/react-app/admin/Universities")}
              className="mt-3 inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              <ArrowLeft size={16} /> العودة للقائمة
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white pb-16">
      {/* HERO */}
      <div className="relative">
        <div
          className="h-64 sm:h-72 md:h-96 w-full bg-center bg-cover"
          style={{
            backgroundImage: `linear-gradient(rgba(7,16,35,0.45), rgba(7,16,35,0.45)), url('${
              university.imageURL && university.imageURL !== ""
                ? university.imageURL
                : "https://images.unsplash.com/photo-1562072549-7ff3d50717f6?auto=format&fit=crop&w=1400&q=80"
            }')`,
          }}
          aria-hidden="true"
        />
        {/* Floating card */}
        <div className="max-w-5xl mx-auto -mt-12 px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 items-center">
              <div className="md:col-span-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 flex items-center gap-3">
                  <span className="text-2xl">🏛️</span> {university.name}
                </h1>
                <p className="mt-2 text-sm text-slate-600 flex items-center gap-2">
                  <span className="text-gray-400">📍</span>{" "}
                  <span>{university.address || "لا يوجد عنوان"}</span>
                </p>

                <div className="mt-6 flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
                    <div className="text-sm text-slate-500">🎓 الطلاب</div>
                    <div className="text-xl font-semibold text-slate-800">{university.students ? university.students.length : 0}</div>
                  </div>

                  {/* إضافات مستقبلية: موقع، تواصل */}
                  <div className="flex items-center gap-2 ml-auto md:ml-0">
                    <button
                      onClick={() => navigate(-1)}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      aria-label="العودة"
                    >
                      <ArrowLeft size={16} /> العودة
                    </button>
                  </div>
                </div>
              </div>

              {/* Right column: logo / hero preview */}
              <div className="flex justify-center md:justify-end">
                <div className="w-36 h-36 rounded-2xl overflow-hidden border border-white/40 shadow">
                  <img
                    src={
                      university.imageURL && university.imageURL !== ""
                        ? university.imageURL
                        : "https://images.unsplash.com/photo-1562072549-7ff3d50717f6?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={university.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/300x300?text=🏛️";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: About / description card */}
          <div className="lg:col-span-2">
            <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">نبذة عن الجامعة</h2>
              <p className="text-slate-700 leading-relaxed">
                {university.description || "لا يوجد وصف متاح حالياً. يمكن تحرير التفاصيل من لوحة الإدارة."}
              </p>

              {/* small info row */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500">العنوان</div>
                  <div className="mt-1 font-medium text-slate-800">{university.address || "غير محدد"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500">عدد الطلاب</div>
                  <div className="mt-1 font-medium text-slate-800">{university.students ? university.students.length : 0}</div>
                </div>
              </div>
            </section>

            {/* Students list */}
            <section className="mt-6 bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">👨‍🎓 الطلاب المسجلين</h3>
                <span className="text-sm text-gray-500">{university.students ? university.students.length : 0} طالب/طالبة</span>
              </div>

              {university.students && university.students.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {university.students.map((student) => {
                    const imgSrc = student.imageURL || student.imageUrl || "";
                    return (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-lg transition bg-white"
                      >
                        <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden bg-slate-100 border border-gray-200 flex items-center justify-center text-slate-700 font-semibold">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={student.name || "طالب"}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = "";
                              }}
                            />
                          ) : (
                            <span className="text-lg">{initials(student.name)}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="text-slate-800 font-medium truncate">{"الادمن"}</div>
                            <div className="text-xs text-gray-400">#{student.id}</div>
                          </div>
                          {/* optional smaller details */}
                          <div className="text-sm text-gray-500 truncate">
                            {student.email ? student.email : "بريد غير متوفر"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">لا يوجد طلاب مسجلين حالياً.</p>
              )}
            </section>
          </div>

          {/* Right: Actions / quick info */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 text-center">
              <div className="text-sm text-gray-500">تم الإنشاء</div>
              <div className="mt-2 text-lg font-semibold text-slate-800">
                {university.createdAt ? new Date(university.createdAt).toLocaleDateString("ar-EG") : "الأدمن"}
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={() => navigate(`/react-app/admin/EditUniversity/${university.id}`)}
                  className="w-full inline-flex justify-center items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                >
                  ✏️ تعديل الجامعة
                </button>

              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}