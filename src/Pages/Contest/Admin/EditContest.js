import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {getContestById,updateContest } from "../../../Service/contestService";

import { getAllProblems } from "../../../Service/ProblemService";
import { getAllUniversities } from "../../../Service/UniversityService";


const EditContest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contest, setContest] = useState({
    name: "",
    startTime: "",
    endTime: "",
    createdById: 0,
    problemsId: [],
    isPublic: true,
    universityId: 0,
  });

  const [problems, setProblems] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ جلب بيانات المسابقة
  const fetchContest = async () => {
    if (!id) {
      console.error("❌ Contest ID is missing");
      console.error("❌ Current URL params:", window.location.pathname);
      Swal.fire({
        icon: "error",
        title: "❌ خطأ",
        text: "معرف المسابقة غير موجود",
        confirmButtonText: "حسنًا",
      });
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const contestId = Number(id);
      console.log("📤 Fetching contest with ID:", contestId);
      console.log("📤 Raw id from useParams:", id);
      console.log("📤 Type of id:", typeof id);
      console.log("📤 Current URL:", window.location.pathname);
      
      if (isNaN(contestId) || contestId <= 0) {
        console.error("❌ Invalid contest ID:", id, "converted to:", contestId);
        throw new Error(`معرف المسابقة غير صحيح: ${id}`);
      }
      
      const data = await getContestById(contestId);
      console.log("✅ Contest data received:", data);
      
      setContest({
        name: data.name || "",
        startTime: data.startTime || "",
        endTime: data.endTime || "",
        createdById: data.createdById || 0,
        problemsId: data.problems?.map((p) => p.id) || [],
        isPublic: data.isPublic ?? true,
        universityId: data.universityId ?? 0,
      });
      setProblems(data.problems || []);
    } catch (err) {
      console.error("❌ Error fetching contest:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        contestId: id,
      });
      
      Swal.fire({
        icon: "error",
        title: "❌ خطأ",
        text: "فشل تحميل بيانات المسابقة: " + (err.message || "خطأ غير معروف"),
        confirmButtonText: "حسنًا",
        footer: err.response?.status ? `رمز الخطأ: ${err.response.status}` : "",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ جلب كل المسائل
  const fetchAllProblems = async () => {
    try {
      const data = await getAllProblems();
      setAllProblems(data || []);
    } catch (err) {
      console.error("Error fetching problems:", err);
    }
  };

  // ✅ جلب الجامعات
  const fetchUniversities = async () => {
    try {
      const data = await getAllUniversities();
      setUniversities(data || []);
    } catch (err) {
      console.error("Error fetching universities:", err);
    }
  };

  // ✅ حذف مسألة من المسابقة
  const removeProblem = (problemId) => {
    const updatedProblems = problems.filter((p) => p.id !== problemId);
    const updatedIds = contest.problemsId.filter((id) => id !== problemId);
    setProblems(updatedProblems);
    setContest({ ...contest, problemsId: updatedIds });
  };

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
      text: "تمت إضافة المسألة بنجاح",
      confirmButtonText: "تم",
      confirmButtonColor: "#2563eb",
    });
  };

  // ✅ حفظ التعديلات
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!id) {
      Swal.fire({
        icon: "error",
        title: "❌ خطأ",
        text: "معرف المسابقة غير موجود",
        confirmButtonText: "حسنًا",
      });
      return;
    }
    
    // التحقق من البيانات قبل الإرسال
    if (!contest.name || !contest.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ تحذير",
        text: "الرجاء إدخال اسم المسابقة",
        confirmButtonText: "حسنًا",
      });
      return;
    }
    
    if (!contest.startTime || !contest.endTime) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ تحذير",
        text: "الرجاء إدخال وقت البداية والنهاية",
        confirmButtonText: "حسنًا",
      });
      return;
    }
    
    setSaving(true);

    try {
      const contestId = Number(id);
      console.log("📤 Updating contest:", contestId, contest);
      
      const payload = {
        id: contestId,
        name: contest.name.trim(),
        startTime: contest.startTime,
        endTime: contest.endTime,
        createdById: Number(contest.createdById) || 0,
        problemsId: contest.problemsId.map(Number) || [],
        isPublic: contest.isPublic ?? true,
        universityId: Number(contest.universityId) || 0,
      };
      
      console.log("📤 Update payload:", payload);
      
      await updateContest(contestId, payload);

      Swal.fire({
        icon: "success",
        title: "🎉 تم التعديل بنجاح",
        text: "تم تعديل بيانات المسابقة بنجاح!",
        confirmButtonText: "رجوع إلى قائمة المسابقات",
        confirmButtonColor: "#2563eb",
      }).then(() => navigate("/react-app/admin/contests"));
    } catch (err) {
      console.error("❌ Error updating contest:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        contestId: id,
      });
      
      const errorMessage = err.message || err.response?.data?.message || "حدث خطأ أثناء التعديل";
      Swal.fire({
        icon: "error",
        title: "❌ خطأ",
        text: errorMessage,
        confirmButtonText: "حسنًا",
        footer: err.response?.status ? `رمز الخطأ: ${err.response.status}` : "",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // التحقق من وجود id قبل استدعاء fetchContest
    if (id) {
      fetchContest();
    }
    fetchAllProblems();
    fetchUniversities();
  }, [id]); // إضافة id إلى dependency array

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">⏳ جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const availableProblems = allProblems.filter(
    (p) => !contest.problemsId.includes(p.id)
  );

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
        ✏️ تعديل المسابقة
      </h2>

      <form onSubmit={handleUpdate} className="space-y-5">
        {/* الاسم */}
        <div>
          <label className="block text-gray-700 mb-1">اسم المسابقة:</label>
          <input
            type="text"
            value={contest.name}
            onChange={(e) => setContest({ ...contest, name: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* وقت البداية */}
        <div>
          <label className="block text-gray-700 mb-1">وقت البداية:</label>
          <input
            type="datetime-local"
            value={contest.startTime.slice(0, 16)}
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
            value={contest.endTime.slice(0, 16)}
            onChange={(e) =>
              setContest({ ...contest, endTime: e.target.value })
            }
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* العلنية */}
        <div>
          <label className="block text-gray-700 mb-1">هل المسابقة عامة؟</label>
          <select
            value={contest.isPublic}
            onChange={(e) =>
              setContest({ ...contest, isPublic: e.target.value === "true" })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="true">نعم</option>
            <option value="false">لا</option>
          </select>
        </div>

        {/* الجامعة */}
        <div>
          <label className="block text-gray-700 mb-1">الجامعة (اختياري):</label>
          <select
            value={contest.universityId || ""}
            onChange={(e) =>
              setContest({
                ...contest,
                universityId: parseInt(e.target.value) || 0,
              })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="">بدون جامعة</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* المسائل */}
        <div>
          <label className="block text-gray-700 mb-1">المسائل:</label>
          <ul className="list-disc ml-6 mb-2">
            {problems.map((p) => (
              <li key={p.id} className="flex justify-between items-center">
                {p.title}
                <button
                  type="button"
                  onClick={() => removeProblem(p.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>

          <div className="flex gap-3 items-center">
            <select
              value={selectedProblemId}
              onChange={(e) => setSelectedProblemId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">اختر مسألة</option>
              {availableProblems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
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

        {/* زر الحفظ */}
        <div className="text-center">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "⏳ جاري الحفظ..." : "💾 حفظ التعديلات"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditContest;
