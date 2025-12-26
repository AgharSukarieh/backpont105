import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import { Eye, Edit, Trash2, X, Save } from "lucide-react";

export default function ProblemEvaluationAdmin() {
  const { id: problemId } = useParams();
  const navigate = useNavigate();

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Modal states
  const [viewModal, setViewModal] = useState(null); // evaluation object or null
  const [editModal, setEditModal] = useState(null); // evaluation object copy for editing
  const [deleteModal, setDeleteModal] = useState(null); // evaluation object to delete

  // map difficulty string -> API numeric value (adjust mapping if your API expects other numbers)
  const difficultyToNumber = (val) => {
    if (val === null || val === undefined || val === "") return 0;
    const v = String(val).toLowerCase();
    if (v === "easy") return 1;
    if (v === "medium") return 2;
    if (v === "hard") return 3;
    const n = Number(val);
    return Number.isNaN(n) ? 0 : n;
  };

  // map any incoming representation to display text (Arabic)
  const displayDifficulty = (val) => {
    if (val === null || val === undefined || val === "") return "غير محدد";
    const v = String(val).toLowerCase();
    if (v === "easy" || v === "1") return "سهل";
    if (v === "medium" || v === "2") return "متوسط";
    if (v === "hard" || v === "3") return "صعب";
    return String(val);
  };

  // Fetch evaluations by problemId
  const fetchEvaluations = async () => {
    if (!problemId) {
      console.error("❌ Problem ID is missing");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setFetchError("");
      const numericProblemId = Number(problemId);
      console.log("📤 Fetching evaluations for problem:", numericProblemId);
      
      if (isNaN(numericProblemId) || numericProblemId <= 0) {
        throw new Error("معرف المسألة غير صحيح");
      }
      
      // محاولة endpoints مختلفة
      const endpoints = [
        `/api/problem-evaluations/problems/${numericProblemId}`,
        `/api/problem-evaluations/${numericProblemId}`,
        `/problem-evaluations/problems/${numericProblemId}`,
      ];
      
      let lastError;
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          const res = await api.get(endpoint);
          const data = Array.isArray(res.data) ? res.data : [];
          console.log(`✅ Fetched ${data.length} evaluations from: ${endpoint}`);
          setEvaluations(data);
          return;
        } catch (error) {
          console.log(`❌ Failed with endpoint: ${endpoint}`, error?.response?.status);
          lastError = error;
          if (error?.response?.status !== 404) {
            throw error;
          }
        }
      }
      
      throw lastError || new Error("فشل في جلب التقييمات");
    } catch (err) {
      console.error("❌ Failed to fetch evaluations:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        problemId,
      });
      setFetchError("فشل في جلب التقييمات: " + (err.message || "خطأ غير معروف"));
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!problemId) return;
    fetchEvaluations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  // Open view modal
  const openView = (ev) => {
    setViewModal(ev);
  };

  // Open edit modal (clone object)
  const openEdit = (ev) => {
    setEditModal({
      ...ev,
      evaluationScore: ev.evaluationScore ?? 0,
      comments: ev.comments ?? "",
      problemDifficulty: ev.problemDifficulty ?? "",
      evaluatedAt: ev.evaluatedAt ? new Date(ev.evaluatedAt).toISOString() : new Date().toISOString(),
      updatedAt: ev.updatedAt ? new Date(ev.updatedAt).toISOString() : new Date().toISOString(),
    });
  };

  // Handle edit form changes
  const onEditChange = (field, value) => {
    setEditModal((prev) => ({ ...prev, [field]: value }));
  };

  // Submit update (PUT)
  const submitUpdate = async () => {
    if (!editModal || !editModal.id) return;
    const score = Number(editModal.evaluationScore);
    if (Number.isNaN(score) || score < 0) {
      setFetchError("الرجاء إدخال قيمة تقييم صحيحة (رقم >= 0).");
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage("جاري تحديث التقييم...");
      setFetchError("");

      const payload = {
        evaluationScore: Math.round(score),
        comments: editModal.comments || "",
        userId: editModal.userId || 0,
        problemId: Number(editModal.problemId || problemId),
        // convert to numeric difficulty expected by API
        problemDifficulty: difficultyToNumber(editModal.problemDifficulty),
        evaluatedAt: editModal.evaluatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // محاولة endpoints مختلفة
      const endpoints = [
        `/api/problem-evaluations/${editModal.id}`,
        `/api/ProblemEvaluation/Update/${editModal.id}`,
        `/api/problem-evaluations/update/${editModal.id}`,
      ];
      
      let lastError;
      for (const endpoint of endpoints) {
        try {
          await api.put(endpoint, payload);
          break;
        } catch (error) {
          lastError = error;
          if (error?.response?.status !== 404) {
            throw error;
          }
        }
      }
      
      if (lastError && lastError?.response?.status === 404) {
        throw lastError;
      }

      await fetchEvaluations();
      setEditModal(null);
      setSuccessMessage("تم تحديث التقييم بنجاح.");
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (err) {
      console.error("Update failed:", err);
      setFetchError("فشل تحديث التقييم. حاول مرة أخرى.");
    } finally {
      setActionLoading(false);
      setActionMessage("");
    }
  };

  // Confirm delete modal open
  const openDelete = (ev) => {
    setDeleteModal(ev);
  };

  // Perform delete (DELETE)
  const confirmDelete = async () => {
    if (!deleteModal || !deleteModal.id) return;
    try {
      setActionLoading(true);
      setActionMessage("جاري حذف التقييم...");
      setFetchError("");

      // محاولة endpoints مختلفة
      const endpoints = [
        `/api/problem-evaluations/${deleteModal.id}`,
        `/api/ProblemEvaluation/Delete/${deleteModal.id}`,
        `/api/problem-evaluations/delete/${deleteModal.id}`,
      ];
      
      let lastError;
      for (const endpoint of endpoints) {
        try {
          await api.delete(endpoint);
          break;
        } catch (error) {
          lastError = error;
          if (error?.response?.status !== 404) {
            throw error;
          }
        }
      }
      
      if (lastError && lastError?.response?.status === 404) {
        throw lastError;
      }

      setDeleteModal(null);
      await fetchEvaluations();
      setSuccessMessage("تم حذف التقييم.");
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (err) {
      console.error("Delete failed:", err);
      setFetchError("فشل حذف التقييم. حاول مرة أخرى.");
    } finally {
      setActionLoading(false);
      setActionMessage("");
    }
  };

  // Render small avatar (if imageURL missing, show initials)
  const Avatar = ({ imageURL, name }) => {
    if (imageURL) {
      return (
        <img
          src={imageURL}
          alt={name}
          className="w-12 h-12 rounded-full object-cover border"
          onError={(e) => {
            // eslint-disable-next-line no-param-reassign
            e.target.style.display = "none";
          }}
        />
      );
    }
    const initials = (name || "")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return (
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold border">
        {initials || "?"}
      </div>
    );
  };

  console.log("🔍 ProblemEvaluationAdmin component mounted with problemId:", problemId);
  
  if (!problemId) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" dir="rtl">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <p className="text-xl text-red-500 mb-4">❌ معرف المسألة غير موجود</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            العودة للخلف
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-xl space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">تقييمات المسألة</h2>
          <div className="text-sm text-gray-500 mt-1">المعرّف: {problemId}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            عد للخلف
          </button>
          <button
            onClick={fetchEvaluations}
            className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            إعادة تحميل
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="text-sm text-green-700 bg-green-50 p-2 rounded">{successMessage}</div>
      )}

      {fetchError && (
        <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{fetchError}</div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">جاري تحميل التقييمات...</p>
          </div>
        </div>
      ) : fetchError ? (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-700 font-semibold mb-2">❌ خطأ</p>
            <p className="text-red-600 text-sm mb-4">{fetchError}</p>
            <button
              onClick={fetchEvaluations}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      ) : evaluations.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
            <p className="text-gray-600 text-lg mb-2">📭 لا توجد تقييمات</p>
            <p className="text-gray-500 text-sm">لا توجد تقييمات لهذه المسألة حتى الآن.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-4 p-4 border rounded-md hover:shadow-sm"
            >
              <div>
                <Avatar imageURL={ev.imageURL} name={ev.userName} />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{ev.userName || "مستخدم"}</div>
                    <div className="text-sm text-gray-500">{ev.problemTitle || ""}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">الصعوبة:</div>
                    <div className="font-medium">{displayDifficulty(ev.problemDifficulty)}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">التقييم:</div>
                    <div className="font-bold text-indigo-600 text-lg">{ev.evaluationScore}</div>
                  </div>
                </div>

                <div className="mt-2 text-gray-700">
                  {ev.comments ? ev.comments : <span className="text-gray-400">لا تعليقات</span>}
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  تم التقييم: {ev.evaluatedAt ? new Date(ev.evaluatedAt).toLocaleString("ar-EG") : "-"}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openView(ev)}
                  className="flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Eye size={16} /> عرض
                </button>

                <button
                  onClick={() => openEdit(ev)}
                  className="flex items-center gap-2 px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  <Edit size={16} /> تعديل
                </button>

                <button
                  onClick={() => openDelete(ev)}
                  className="flex items-center gap-2 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 size={16} /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={() => setViewModal(null)}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4">
              <Avatar imageURL={viewModal.imageURL} name={viewModal.userName} />
              <div>
                <div className="font-bold text-lg">{viewModal.userName}</div>
                <div className="text-sm text-gray-500">{viewModal.userId ? `ID: ${viewModal.userId}` : ""}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-600">التقييم:</div>
              <div className="text-2xl font-bold text-indigo-600">{viewModal.evaluationScore}</div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-600">التعليق:</div>
              <div className="mt-2 text-gray-800 whitespace-pre-wrap">{viewModal.comments || "لا تعليقات"}</div>
            </div>

            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
              <div>الصعوبة: {displayDifficulty(viewModal.problemDifficulty)}</div>
              <div>تم التقييم: {viewModal.evaluatedAt ? new Date(viewModal.evaluatedAt).toLocaleString("ar-EG") : "-"}</div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setViewModal(null)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={() => setEditModal(null)}
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold">تعديل التقييم</h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-gray-700 block">التقييم (Score)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={editModal.evaluationScore ?? 0}
                  onChange={(e) => onEditChange("evaluationScore", e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 block">التعليق</label>
                <textarea
                  value={editModal.comments ?? ""}
                  onChange={(e) => onEditChange("comments", e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 block">الصعوبة</label>
                <select
                  value={editModal.problemDifficulty ?? ""}
                  onChange={(e) => onEditChange("problemDifficulty", e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="">-- غير محدد --</option>
                  <option value="Easy">سهل</option>
                  <option value="Medium">متوسط</option>
                  <option value="Hard">صعب</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">إلغاء</button>
              <button
                onClick={submitUpdate}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
                disabled={actionLoading}
              >
                <Save size={16} /> حفظ
              </button>
            </div>

            {/* action overlay */}
            {actionLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="animate-spin mb-2" style={{ width: 28, height: 28, border: "3px solid #d1d5db", borderTop: "3px solid #6366f1", borderRadius: "50%" }} />
                  <div className="text-sm text-gray-700">{actionMessage || "جاري التنفيذ..."}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={() => setDeleteModal(null)}
            >
              <X size={20} />
            </button>

            <h4 className="text-lg font-bold">تأكيد الحذف</h4>
            <p className="mt-3 text-gray-600">هل أنت متأكد أنك تريد حذف تقييم المستخدم <span className="font-medium">{deleteModal.userName}</span>؟</p>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">إلغاء</button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={actionLoading}
              >
                حذف
              </button>
            </div>

            {/* action overlay */}
            {actionLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="animate-spin mb-2" style={{ width: 28, height: 28, border: "3px solid #d1d5db", borderTop: "3px solid #ef4444", borderRadius: "50%" }} />
                  <div className="text-sm text-gray-700">{actionMessage || "جاري التنفيذ..."}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}