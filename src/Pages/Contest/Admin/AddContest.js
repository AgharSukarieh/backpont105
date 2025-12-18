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
    createdById: parseInt(localStorage.getItem("idUser")) ,
    problemsId: [],
  });

  const [allProblems, setAllProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جلب كل المسائل من السيرفر
  const fetchAllProblems = async () => {
    try {
      const res = await api.get("/Problem/GetAllProblemList");
      setAllProblems(res.data || []);
    } catch (err) {
      console.error("Error fetching problems:", err);
      Swal.fire("خطأ", "فشل تحميل المسائل من السيرفر.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProblems();
  }, []);

  // تحويل التاريخ إلى ISO
  const toIsoString = (localDatetime) => {
    if (!localDatetime) return null;
    const date = new Date(localDatetime);
    return date.toISOString();
  };

  // إضافة مسألة
  const addProblem = () => {
    if (!selectedProblemId) return;

    const problemId = Number(selectedProblemId);
    if (contest.problemsId.includes(problemId)) {
      Swal.fire("تنبيه", "هذه المسألة مضافة بالفعل!", "warning");
      return;
    }

    setContest({
      ...contest,
      problemsId: [...contest.problemsId, problemId],
    });

    setSelectedProblemId("");
  };

  const removeProblem = (id) => {
    setContest({
      ...contest,
      problemsId: contest.problemsId.filter((pid) => pid !== id),
    });
  };

  // حفظ المسابقة
  const handleAddContest = async (e) => {
    e.preventDefault();

    if (!contest.name.trim()) {
      Swal.fire("تنبيه", "اسم المسابقة مطلوب!", "warning");
      return;
    }

    if (!contest.startTime || !contest.endTime) {
      Swal.fire("تنبيه", "يجب تحديد وقت البداية والنهاية!", "warning");
      return;
    }

    if (contest.problemsId.length === 0) {
      Swal.fire("تنبيه", "يجب إضافة مسألة واحدة على الأقل!", "warning");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: contest.name.trim(),
        startTime: toIsoString(contest.startTime),
        endTime: toIsoString(contest.endTime),
        createdById: Number(contest.createdById),
        problemsId: contest.problemsId.map(Number),
      };

      console.log("Payload:", payload);

      const res = await api.post("/Contest/AddContest", payload, {
        headers: { "Content-Type": "application/json" },
      });

      Swal.fire("نجاح", "تم إضافة المسابقة بنجاح!", "success").then(() =>
        navigate("/react-app/admin/contests")
      );
    } catch (err) {
      console.error("Error adding contest:", err.response || err);
      Swal.fire(
        "خطأ",
        err.response?.data?.message || "حدث خطأ أثناء إضافة المسابقة.",
        "error"
      );
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

  const availableProblems = allProblems.filter(
    (p) => !contest.problemsId.includes(p.id)
  );

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
        ➕ إضافة مسابقة جديدة
      </h2>

      <form onSubmit={handleAddContest} className="space-y-5">
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

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            🧩 المسائل المضافة:
          </h3>
          {contest.problemsId.length === 0 ? (
            <p className="text-gray-500">لا توجد مسائل حالياً.</p>
          ) : (
            <ul className="space-y-2">
              {contest.problemsId.map((pid) => {
                const p = allProblems.find((p) => p.id === pid);
                if (!p) return null;
                return (
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
                );
              })}
            </ul>
          )}
        </div>

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
            {saving ? "جاري الحفظ..." : "حفظ المسابقة"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddContest;
   