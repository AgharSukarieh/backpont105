import React, { useEffect, useState } from "react";

const contests = [
  {
    id: 1,
    name: "مسابقة الخوارزميات 2025",
    startTime: "2025-10-20T10:00:00",
    endTime: "2025-10-28T23:59:59",
    createdByUserName: "AhmadNedal",
    createdById: 27
  },
  {
    id: 2,
    name: "تحدي البرمجة العربي",
    startTime: "2025-10-25T09:00:00",
    endTime: "2025-11-02T23:59:59",
    createdByUserName: "CodeMaster",
    createdById: 12
  },
  {
    id: 3,
    name: "مسابقة الذكاء الاصطناعي",
    startTime: "2025-10-10T08:00:00",
    endTime: "2025-10-22T20:00:00",
    createdByUserName: "AI_Expert",
    createdById: 7
  }
];

const ContestPage = () => {
  const [now, setNow] = useState(new Date());
  const [search, setSearch] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
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

  const activeContests = contests.filter(
    c => new Date(c.startTime) <= now && new Date(c.endTime) > now
  );
  const upcomingContests = contests.filter(c => new Date(c.startTime) > now);
  const endedContests = contests.filter(c => new Date(c.endTime) <= now);

  const filterContests = (list) =>
    list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const ContestCard = ({ contest }) => {
    const endTime = new Date(contest.endTime);
    const isActive = endTime > now && new Date(contest.startTime) <= now;
    const isUpcoming = new Date(contest.startTime) > now;

    return (
      <div
        className={`relative p-6 rounded-3xl shadow-lg transform transition hover:scale-105
          ${isActive 
            ? "bg-gradient-to-br from-green-400 to-green-600 text-white" 
            : isUpcoming
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-800"
          }`}
      >
        <span
          className={`absolute top-4 right-4 px-3 py-1 rounded-full font-semibold text-sm
            ${isActive ? "bg-white text-green-700" :
              isUpcoming ? "bg-blue-300 text-blue-800" :
              "bg-gray-300 text-gray-700"
            }`}
        >
          {isActive ? "نشط" : isUpcoming ? "ستبدأ قريبًا" : "منتهي"}
        </span>

        <h2 className="text-2xl font-bold mb-4">{contest.name}</h2>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">البداية:</span>{" "}
            {new Date(contest.startTime).toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">النهاية:</span>{" "}
            {new Date(contest.endTime).toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">أنشئ بواسطة:</span>{" "}
            {contest.createdByUserName || `User ID ${contest.createdById}`}
          </p>
        </div>

        {isActive && (
          <div className="bg-white/30 rounded-lg p-2 mt-4 text-center font-mono text-sm">
            <span className="font-semibold">الوقت المتبقي: </span>
            {getCountdown(contest.endTime)}
          </div>
        )}

        {/* الأزرار */}
        <div className="mt-4 flex flex-col gap-3">
          {isActive ? (
            <button
              className="w-full py-2 rounded-xl font-semibold bg-white text-green-700 hover:bg-white/90 transition"
              onClick={() => alert(`دخول المسابقة: ${contest.name}`)}
            >
              دخول المسابقة
            </button>
          ) : !isUpcoming ? (
            <>
              <button
                className="w-full py-2 rounded-xl font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
                onClick={() => alert(`عرض المسائل: ${contest.name}`)}
              >
                عرض المسائل
              </button>
              <button
                className="w-full py-2 rounded-xl font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition"
                onClick={() => alert(`عرض الـ Staging: ${contest.name}`)}
              >
                عرض Staging
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  };

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
    </div>
  );
};

export default ContestPage;
