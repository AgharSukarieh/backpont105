import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import { getUserById } from "../../../Service/userService";


export default function ViewUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    if (!id) {
      console.error("❌ User ID is missing");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const userId = Number(id);
      console.log("📤 Fetching user with ID:", userId);
      
      if (isNaN(userId) || userId <= 0) {
        throw new Error("معرف المستخدم غير صحيح");
      }
      
      const data = await getUserById(userId);
      console.log("✅ User data received:", data);
      
      if (!data || !data.id) {
        throw new Error("لم يتم العثور على بيانات المستخدم");
      }
      
      setUser(data);
    } catch (err) {
      console.error("❌ Error fetching user:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        userId: id,
      });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const getInitials = (name = "") => {
    const parts = name.trim().split(" ");
    if (parts.length === 0) return "N/A";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6" dir="rtl" aria-busy="true">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/5" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/5" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>

          <div className="h-32 bg-gray-200 rounded" />
          <div className="flex justify-start">
            <div className="h-10 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-center mt-10 text-red-600" dir="rtl">
        ❌ لم يتم العثور على المستخدم
      </p>
    );
  }

  const acceptance = Number(user.acceptanceRate) || 0;
  const clampedAcceptance = Math.max(0, Math.min(100, acceptance));

  const stats = [
    { id: "acceptance", label: "نسبة القبول", value: `${clampedAcceptance}%` },
    { id: "submissions", label: "إجمالي المحاولات", value: user.totalSubmissions ?? "—" },
    { id: "solved", label: "إجمالي المسائل المحلولة", value: user.totalProblemsSolved ?? "—" },
    { id: "easy", label: "سهلة محلولة", value: user.easyProblemsSolvedCount ?? 0 },
    { id: "medium", label: "متوسطة محلولة", value: user.mediumProblemsSolvedCount ?? 0 },
    { id: "hard", label: "صعبة محلولة", value: user.hardProblemsSolvedCount ?? 0 },
    { id: "streak", label: "أيام التتابع الحالية", value: user.streakDay ?? 0 },
    { id: "maxStreak", label: "أقصى تتابع", value: user.maxStreak ?? 0 },
  ];

  return (
    <div className="max-w-4xl mx-auto mt-12 bg-white p-6 md:p-8 rounded-xl shadow-lg" dir="rtl">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: avatar/info */}
        <div className="flex-shrink-0 flex items-center gap-4">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.userName ? `صورة ${user.userName}` : "صورة المستخدم"}
              className="w-28 h-28 md:w-32 md:h-32 object-cover rounded-full shadow-sm"
            />
          ) : (
            <div
              className="w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-white text-xl font-semibold"
              style={{ backgroundColor: "#4F46E5" }}
              aria-hidden="true"
            >
              {getInitials(user.userName || user.email)}
            </div>
          )}
        </div>

        {/* Right: main details */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{user.userName || "—"}</h2>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded">
              <span className="font-medium">الدور:</span>
              <span>{user.role || "—"}</span>
            </span>

            <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded">
              <strong className="font-medium">البريد:</strong>
              <span>{user.email || "—"}</span>
            </span>

            {user.country && (
              <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-3 py-1 rounded">
                <strong className="font-medium">الدولة:</strong>
                <span className="flex items-center gap-2">
                  <span>{user.country.nameCountry}</span>
                  {user.country.iconUrl && (
                    <img src={user.country.iconUrl} alt={user.country.nameCountry} className="w-5 h-5 rounded" />
                  )}
                </span>
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-3">
            <strong>تاريخ التسجيل:</strong> {formatDate(user.registerAt)}
          </p>

          {/* Acceptance progress */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">معدل القبول</span>
              <span className="text-sm font-semibold text-gray-800">{clampedAcceptance}%</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded overflow-hidden">
              <div
                className={`h-3 rounded ${
                  clampedAcceptance >= 75 ? "bg-green-500" : clampedAcceptance >= 40 ? "bg-yellow-400" : "bg-red-500"
                }`}
                style={{ width: `${clampedAcceptance}%` }}
                role="progressbar"
                aria-valuenow={clampedAcceptance}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <section className="mt-6">
        <h3 className="text-lg font-semibold mb-3">📊 إحصائيات المستخدم</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.id}
              className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex flex-col justify-between"
            >
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="mt-2 text-xl font-semibold text-gray-800">{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tags / solved counts */}
      {user.tagSolvedCounts && user.tagSolvedCounts.length > 0 && (
        <section className="mt-6">
          <h3 className="text-lg font-semibold mb-3">🏷️ التاقات المحلولة</h3>
          <div className="flex flex-wrap gap-2">
            {user.tagSolvedCounts.map((tag) => (
              <span
                key={tag.id || tag.tagName}
                className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm"
                title={`${tag.count} مسائل محلولة في ${tag.tagName}`}
              >
                <span className="font-medium">{tag.tagName}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{tag.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => navigate("/react-app/admin/users")}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          aria-label="العودة لقائمة المستخدمين"
        >
          رجوع
        </button>

        {/* optional: edit button (uncomment if you have an edit route) */}
        {/* <button
          onClick={() => navigate(`/react-app/admin/users/${id}/edit`)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          تعديل
        </button> */}
      </div>
    </div>
  );
}