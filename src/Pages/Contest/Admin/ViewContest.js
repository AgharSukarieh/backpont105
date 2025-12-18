import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import Swal from "sweetalert2";

const AddContest = () => {
  const navigate = useNavigate();

  const [contest, setContest] = useState({
    name: "",
    startTime: "",
    endTime: "",
    createdById: parseInt(localStorage.getItem("uid")) || 0, // استخدم ID المستخدم الحالي
    problemsId: [],
  });

  const [problems, setProblems] = useState([]); // المسائل المختارة
  const [allProblems, setAllProblems] = useState([]); // كل المسائل من السيرفر
  const [selectedProblemId, setSelectedProblemId] = useState(""); // مسألة للإضافة
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ جلب كل المسائل
  const fetchAllProblems = async () => {
    try {
      const res = await api.get("/Problem/GetAllProblemList", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAllProblems(res.data || []);
    } catch (err) {
      console.error("Error fetching problems:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProblems();
  }, []);

  // ✅ إضافة مسألة جديدة
  const addProblem = () => {
    if (!selectedProblemId) return;
    const problemToAdd = allProblems.find(
      (p) => p.id === parseInt(selectedProblemId)
    );
    if (!problemToAdd) return;

    if (contest.problemsId.includes(problemToAdd.id)) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ تنبيه",
        text: "هذه المسألة مضافة بالفعل!",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    setProblems([...problems, problemToAdd]);
    setContest({
      ...contest,
      problemsId: [...contest.problemsId, problemToAdd.id],
    });
    setSelectedProblemId("");

    Swal.fire({
      icon: "success",
      title: "✅ تمت الإضافة",
      text: "تمت إضافة المسألة إلى المسابقة بنجاح",
      confirmButtonText: "تم",
      confirmButtonColor: "#2563eb",
    });
  };

  // ✅ حذف مسألة من المسابقة
  const removeProblem = (problemId) => {
    setProblems(problems.filter((p) => p.id !== problemId));
    setContest({
      ...contest,
      problemsId: contest.problemsId.filter((id) => id !== problemId),
    });
  };

  // ✅ إنشاء المسابقة
  const handleAddContest = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(
        "/Contest/AddContest",
        {
          name: contest.name,
          startTime: contest.startTime,
          endTime: contest.endTime,
          createdById: contest.createdById,
          problemsId: contest.problemsId,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      Swal.fire({
        icon: "success",
        title: "🎉 تم إنشاء المسابقة",
        text: "تم إنشاء المسابقة الجديدة بنجاح!",
        confirmButtonText: "العودة إلى قائمة المسابقات",
        confirmButtonColor: "#2563eb",
      }).then(() => navigate("/react-app/admin/contests"));
    } catch (err) {
      console.error("Error creating contest:", err);
      Swal.fire({
        icon: "error",
        title: "❌ خطأ",
        text: "حدث خطأ أثناء إنشاء المسابقة! حاول مرة أخرى.",
        confirmButtonText: "حسنًا",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-600">
        ⏳ جاري تحميل البيانات...
      </p>
    );

  // ✅ فلترة المسائل بحيث لا يظهر إلا غير الموجودة في القائمة الحالية
  const availableProblems = allProblems.filter(
    (p) => !contest.problemsId.includes(p.id)
  );

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
        ➕ إنشاء مسابقة جديدة
      </h2>

      <form onSubmit={handleAddContest} className="space-y-5">
        {/* الاسم */}
        <div>
          <label className="block text-gray-700 mb-1">اسم المسابقة:</label>
          <input
            type="text"
            value={contest.name}
            onChange={(e) =>
              setContest({ ...contest, name: e.target.value })
            }
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* وقت البداية */}
        <div>
          <label className="block text-gray-700 mb-1">وقت البداية:</label>
          <input
            type="datetime-local"
            value={contest.startTime}
            onChange={(e) =>
              setContest({ ...contest, startTime: e.target.value })
            }
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* وقت النهاية */}
        <div>
          <label className="block text-gray-700 mb-1">وقت النهاية:</label>
          <input
            type="datetime-local"
            value={contest.endTime}
            onChange={(e) =>
              setContest({ ...contest, endTime: e.target.value })
            }
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* المسائل المختارة */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            🧩 المسائل المختارة:
          </h3>
          {problems.length === 0 ? (
            <p className="text-gray-500">لا توجد مسائل حالياً.</p>
          ) : (
            <ul className="space-y-2">
              {problems.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-gray-800">{p.title}</p>
                    <p className="text-sm text-gray-500">
                      الصعوبة: {p.difficulty}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProblem(p.id)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    🗑️ حذف
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* إضافة مسألة جديدة */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            ➕ إضافة مسألة جديدة:
          </h3>
          <div className="flex gap-3">
            <select
              value={selectedProblemId}
              onChange={(e) => setSelectedProblemId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">اختر مسألة</option>
              {availableProblems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} - ({p.difficulty})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addProblem}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              إضافة
            </button>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate("/react-app/admin/contests")}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            رجوع
          </button>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : "إنشاء المسابقة"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddContest;
