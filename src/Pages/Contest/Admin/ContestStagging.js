import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getContestById } from "../../../Service/contestService";
import api from "../../../Service/api";
import Swal from "sweetalert2";
import { Trophy, Medal, Award, ArrowLeft, RefreshCw } from "lucide-react";

export default function ContestStagging() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [contest, setContest] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("🔍 ContestStagging component mounted with id:", id);

  // جلب بيانات المسابقة
  const fetchContest = async () => {
    if (!id) {
      console.error("❌ Contest ID is missing");
      setError("معرف المسابقة غير موجود");
      setLoading(false);
      return;
    }
    
    try {
      const contestId = Number(id);
      console.log("📤 Fetching contest with ID:", contestId);
      
      if (isNaN(contestId) || contestId <= 0) {
        throw new Error("معرف المسابقة غير صحيح");
      }
      
      const data = await getContestById(contestId);
      console.log("✅ Contest data received:", data);
      setContest(data);
    } catch (err) {
      console.error("❌ Error fetching contest:", err);
      setError("فشل تحميل بيانات المسابقة: " + (err.message || "خطأ غير معروف"));
    }
  };

  // جلب ترتيب المسابقة (Standings/Leaderboard)
  const fetchStandings = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const contestId = Number(id);
      console.log("📤 Fetching standings for contest:", contestId);
      
      // محاولة endpoints مختلفة
      const endpoints = [
        `/api/contests/${contestId}/standings`,
        `/api/contests/${contestId}/leaderboard`,
        `/api/contests/${contestId}/rankings`,
        `/api/contests/${contestId}/staging`,
      ];
      
      let lastError;
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          const response = await api.get(endpoint);
          const data = Array.isArray(response.data) ? response.data : [];
          console.log(`✅ Fetched ${data.length} standings from: ${endpoint}`);
          setStandings(data);
          setError(null);
          return;
        } catch (error) {
          console.log(`❌ Failed with endpoint: ${endpoint}`, error?.response?.status);
          lastError = error;
          if (error?.response?.status !== 404) {
            throw error;
          }
        }
      }
      
      // إذا فشلت جميع المحاولات، استخدم بيانات وهمية للعرض
      console.warn("⚠️ No standings endpoint found, using empty array");
      setStandings([]);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching standings:", err);
      setError("فشل في جلب ترتيب المسابقة: " + (err.message || "خطأ غير معروف"));
      setStandings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContest();
    fetchStandings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />;
    return <span className="text-gray-600 font-bold">{rank}</span>;
  };

  if (loading && !contest) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">⏳ جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error && !contest) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" dir="rtl">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <p className="text-xl text-red-500 mb-4">❌ خطأ</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchContest();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white shadow-md rounded-xl space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🏆 ترتيب المسابقة
          </h1>
          {contest && (
            <p className="text-gray-600">
              {contest.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchStandings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">جاري تحميل الترتيب...</p>
          </div>
        </div>
      ) : standings.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">📭 لا يوجد ترتيب بعد</p>
            <p className="text-gray-500 text-sm">لم يتم تسجيل أي نتائج في هذه المسابقة حتى الآن.</p>
          </div>
        </div>
      ) : (
        /* Standings Table */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <th className="px-4 py-3 text-right font-semibold">الترتيب</th>
                <th className="px-4 py-3 text-right font-semibold">المستخدم</th>
                <th className="px-4 py-3 text-right font-semibold">النقاط</th>
                <th className="px-4 py-3 text-right font-semibold">المسائل المحلولة</th>
                <th className="px-4 py-3 text-right font-semibold">الوقت الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, index) => (
                <tr
                  key={entry.userId || entry.id || index}
                  className={`border-b hover:bg-gray-50 ${
                    index < 3 ? "bg-yellow-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {entry.imageURL ? (
                        <img
                          src={entry.imageURL}
                          alt={entry.userName || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                          {(entry.userName || "U")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {entry.userName || "مستخدم غير معروف"}
                        </p>
                        {entry.userId && (
                          <p className="text-xs text-gray-500">ID: {entry.userId}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-blue-600 text-lg">
                      {entry.totalScore || entry.score || entry.points || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-gray-700">
                      {entry.solvedProblems || entry.solvedCount || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-600">
                      {entry.totalTime
                        ? `${Math.floor(entry.totalTime / 60)}:${String(entry.totalTime % 60).padStart(2, "0")}`
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

