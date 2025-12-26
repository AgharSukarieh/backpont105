import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEndedContests, getSoonContests, getRunningContests } from "../../Service/contestService";
import { CardSkeleton } from "../../Components/SkeletonLoading";

const ContestPage = () => {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [search, setSearch] = useState("");
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // جلب جميع أنواع المسابقات
        const [endedContests, soonContests, runningContests] = await Promise.all([
          getEndedContests(),
          getSoonContests(),
          getRunningContests()
        ]);
        
        // دمج جميع المسابقات مع إضافة حالة لكل مسابقة
        const allContests = [
          ...endedContests.map(c => ({ ...c, status: "ended" })),
          ...soonContests.map(c => ({ ...c, status: "soon" })),
          ...runningContests.map(c => ({ ...c, status: "running" }))
        ];
        
        // إزالة التكرارات بناءً على ID
        const uniqueContests = allContests.reduce((acc, current) => {
          const existing = acc.find(item => item.id === current.id);
          if (!existing) {
            acc.push(current);
          } else {
            // إعطاء الأولوية للحالة الأكثر أهمية: running > soon > ended
            const priority = { running: 3, soon: 2, ended: 1 };
            if (priority[current.status] > priority[existing.status]) {
              const index = acc.indexOf(existing);
              acc[index] = current;
            }
          }
          return acc;
        }, []);
        
        setContests(uniqueContests);
        console.log("📊 Loaded contests:", uniqueContests.length);
      } catch (err) {
        console.error("❌ Error fetching contests:", err);
        setError(err.message || "حدث خطأ في جلب المسابقات");
        setContests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  const getCountdown = (endTime) => {
    const diff = new Date(endTime) - now;
    if (diff <= 0) return "انتهت المسابقة";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${days}ي ${hours}س ${minutes}د ${seconds}ث`;
  };

  // استخدام الحالة من API بدلاً من الحساب المحلي
  const activeContests = contests.filter(c => c.status === "running");
  const upcomingContests = contests.filter(c => c.status === "soon");
  const endedContests = contests.filter(c => c.status === "ended");

  const filterContests = (list) =>
    list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const ContestCard = ({ contest }) => {
    // استخدام الحالة من API
    const isActive = contest.status === "running";
    const isUpcoming = contest.status === "soon";
    const isEnded = contest.status === "ended";

    return (
      <div
        className={`relative p-6 rounded-3xl shadow-lg transform transition hover:scale-105 cursor-pointer
          ${isActive 
            ? "bg-gradient-to-br from-green-400 to-green-600 text-white" 
            : isUpcoming
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-800"
          }`}
        onClick={() => navigate(`/react-app/ViewContest/${contest.id}`)}
      >
        <span
          className={`absolute top-4 right-4 px-3 py-1 rounded-full font-semibold text-sm
            ${isActive ? "bg-white text-green-700" :
              isUpcoming ? "bg-blue-300 text-blue-800" :
              "bg-gray-300 text-gray-700"
            }`}
        >
          {isActive ? "نشط الآن" : isUpcoming ? "قريباً" : "منتهية"}
        </span>

        <h2 className="text-2xl font-bold mb-4">{contest.name}</h2>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">البداية:</span>{" "}
            {contest.startTime ? new Date(contest.startTime).toLocaleString('ar-SA') : "غير محدد"}
          </p>
          <p>
            <span className="font-semibold">النهاية:</span>{" "}
            {contest.endTime ? new Date(contest.endTime).toLocaleString('ar-SA') : "غير محدد"}
          </p>
          <p>
            <span className="font-semibold">أنشئ بواسطة:</span>{" "}
            {contest.createdByUserName || `User ID ${contest.createdById}`}
          </p>
          {contest.universityName && (
            <p>
              <span className="font-semibold">الجامعة:</span>{" "}
              {contest.universityName}
            </p>
          )}
          {contest.hasRegisted && (
            <p className="text-green-600 font-semibold">
              ✓ أنت مسجل في هذه المسابقة
            </p>
          )}
        </div>

        {isActive && (
          <div className="bg-white/30 rounded-lg p-2 mt-4 text-center font-mono text-sm">
            <span className="font-semibold">الوقت المتبقي: </span>
            {getCountdown(contest.endTime)}
          </div>
        )}

        {/* الأزرار */}
        <div className="mt-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
          {isActive ? (
            <button
              className="w-full py-2 rounded-xl font-semibold bg-white text-green-700 hover:bg-white/90 transition"
              onClick={() => navigate(`/react-app/ViewContest/${contest.id}`)}
            >
              دخول المسابقة
            </button>
          ) : !isUpcoming ? (
            <button
              className="w-full py-2 rounded-xl font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
              onClick={() => navigate(`/react-app/ViewContest/${contest.id}`)}
            >
              عرض المسائل
            </button>
          ) : (
            <button
              className="w-full py-2 rounded-xl font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition"
              onClick={() => navigate(`/react-app/ViewContest/${contest.id}`)}
            >
              عرض التفاصيل
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <CardSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 font-semibold">حدث خطأ في تحميل المسابقات</p>
          <p className="text-red-500 text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-extrabold text-indigo-600 mb-6 text-center">
        قائمة المسابقات
      </h1>

      {/* بحث */}
      <div className="mb-8 flex justify-center">
        <input
          type="text"
          placeholder="ابحث عن مسابقة..."
          className="w-full md:w-1/2 p-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* المسابقات النشطة */}
      {filterContests(activeContests).length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-green-600">نشطة الآن</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {filterContests(activeContests).map(contest => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        </>
      )}

      {/* المسابقات القادمة */}
      {filterContests(upcomingContests).length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-blue-600">ستبدأ لاحقًا</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {filterContests(upcomingContests).map(contest => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        </>
      )}

      {/* المسابقات المنتهية */}
      {filterContests(endedContests).length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-gray-600">منتهية</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filterContests(endedContests).map(contest => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        </>
      )}

      {/* رسالة إذا لم توجد مسابقات */}
      {!loading && contests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">لا توجد مسابقات متاحة حالياً</p>
        </div>
      )}
    </div>
  );
};

export default ContestPage;
