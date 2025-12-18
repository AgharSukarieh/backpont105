import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../Service/api";

const ContestList = () => {
  const [contests, setContests] = useState([]);
  const [selectedContest, setSelectedContest] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const fetchContests = async () => {
    try {
      const res = await api.get("/Contest/GetAllContest");
      const dataWithStatus = res.data.map((contest) => {
        const now = new Date();
        const start = new Date(contest.startTime);
        const end = new Date(contest.endTime);
        let status = "";
        if (now < start) status = "ستبدأ قريباً";
        else if (now > end) status = "منتهية";
        else status = "نشطة الآن";
        return { ...contest, status };
      });

      const order = { "نشطة الآن": 0, "ستبدأ قريباً": 1, "منتهية": 2 };
      dataWithStatus.sort((a, b) => order[a.status] - order[b.status]);

      setContests(dataWithStatus);
  } catch (err) {
    console.error("Error fetching contests:", err);
  }
};


  // ✅ فتح نافذة التأكيد
  const confirmDelete = (contest) => {
    setSelectedContest(contest);
    setShowConfirm(true);
  };

  // ✅ تنفيذ الحذف
  const handleDelete = async () => {
    try {
      await api.delete(`/Contest/RemoveContest?id=${selectedContest.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setContests(contests.filter((c) => c.id !== selectedContest.id));
      setShowConfirm(false);
      setSelectedContest(null);
    } catch (err) {
      console.error("Error deleting contest:", err);
      setShowConfirm(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center">📅 جميع المسابقات</h1>

        {/* زر إضافة مسابقة */}
        <button
          onClick={() => navigate("/react-app/admin/AddContest")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          ➕ إضافة مسابقة
        </button>
      </div>

      {/* عرض المسابقات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.map((contest) => (
          <div
            key={contest.id}
            className="relative bg-white shadow-lg rounded-2xl p-5 border border-gray-200 hover:shadow-xl transition duration-300"
          >
            {/* ✅ Badge الحالة */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold text-white"
              style={{
                backgroundColor:
                  contest.status === "نشطة الآن"
                    ? "#16a34a" // أخضر
                    : contest.status === "ستبدأ قريباً"
                    ? "#f59e0b" // برتقالي
                    : "#ef4444", // أحمر
              }}
            >
              {contest.status}
            </div>

            <h2 className="text-xl font-semibold mb-2 text-blue-600">
              {contest.name}
            </h2>
            <p className="text-gray-600 mb-1">
              👤 <span className="font-medium">{contest.createdByUserName}</span>
            </p>
            <p className="text-gray-600 mb-3">
              🕒 {new Date(contest.startTime).toLocaleString()} →{" "}
              {new Date(contest.endTime).toLocaleString()}
            </p>

            <div className="flex flex-wrap gap-2 justify-between mt-3">
              <button
                onClick={() =>
                  navigate(`/react-app/Admin/Stagging/${contest.id}`)
                }
                className="bg-indigo-500 text-white px-3 py-1 rounded-lg hover:bg-indigo-600"
              >
                عرض الستيجنق
              </button>

              <button
                onClick={() =>
                  navigate(`/react-app/admin/EditContest/${contest.id}`)
                }
                className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
              >
                تعديل
              </button>

              <button
                onClick={() => confirmDelete(contest)}
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {contests.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          🚫 لا توجد مسابقات حالياً.
        </p>
      )}

      {/* نافذة التأكيد */}
      {showConfirm && selectedContest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              تأكيد الحذف
            </h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من حذف المسابقة{" "}
              <span className="font-bold text-red-600">
                {selectedContest.name}
              </span>
              ؟
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestList;
