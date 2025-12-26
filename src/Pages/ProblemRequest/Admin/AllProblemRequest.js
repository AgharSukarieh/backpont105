import React, { useEffect, useState } from "react";
import api from "../../../Service/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getAllProblemRequests, approveProblemRequest, rejectProblemRequest } from "../../../Service/problemRequestService";

const ProblemRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 جلب بيانات كل الاقتراحات
  const fetchRequests = async () => {
    try {
      const data = await getAllProblemRequests();
      const requestsArray = Array.isArray(data) ? data : [];
      setRequests(requestsArray);
    } catch (err) {
      console.error("حدث خطأ أثناء جلب البيانات:", err);
      Swal.fire("خطأ!", "حدث خطأ أثناء تحميل البيانات 😢", "error");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ✅ موافقة على المسألة
  const handleApprove = async (id) => {
    try {
      await approveProblemRequest(id);
      Swal.fire({
        title: "تمت الموافقة ✅",
        text: "تم قبول المسألة بنجاح!",
        icon: "success",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#16a34a",
      });
      fetchRequests();
    } catch (error) {
      console.error("حدث خطأ أثناء قبول المسألة:", error);
      Swal.fire({
        title: "خطأ!",
        text: "حدث خطأ أثناء قبول المسألة 😢: " + (error.message || "خطأ غير معروف"),
        icon: "error",
        confirmButtonText: "إغلاق",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  // ❌ رفض المسألة
  const handleReject = async (id) => {
    Swal.fire({
      title: "هل أنت متأكد؟",
      text: `سيتم رفض المسألة رقم ${id}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، ارفضها",
      cancelButtonText: "تراجع",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await rejectProblemRequest(id);
          Swal.fire("تم الرفض ❌", `تم رفض المسألة رقم ${id}`, "info");
          fetchRequests(); // إعادة تحميل القائمة بعد التغيير
        } catch (err) {
          console.error("حدث خطأ أثناء رفض المسألة:", err);
          Swal.fire("خطأ!", "حدث خطأ أثناء رفض المسألة 😢: " + (err.message || "خطأ غير معروف"), "error");
        }
      }
    });
  };

  // ✏️ تعديل المسألة
  const handleEdit = (id) => {
    navigate(`/react-app/admin/EditProblemProposal/${id}`);
  };

  // 🟡 تحويل الرقم إلى نص عربي
  const getStatusText = (status) => {
    switch (status) {
      case 1:
        return "قيد الانتظار ⏳";
      case 2:
        return "تمت الموافقة ✅";
      case 3:
        return "مرفوضة ❌";
      default:
        return "غير معروف";
    }
  };

  // 🎨 لون الحالة
  const getStatusStyle = (status) => {
    switch (status) {
      case 1:
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case 2:
        return "bg-green-100 text-green-700 border-green-300";
      case 3:
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">
          📋 قائمة اقتراحات المسائل
        </h1>
        <p className="text-gray-600 text-lg">
          يمكنك مراجعة المسائل المقترحة واتخاذ القرار المناسب لكل واحدة.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">⏳ جاري التحميل...</div>
      ) : requests.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          <p className="text-xl mb-2">📭 لا توجد طلبات مسائل حالياً</p>
          <p className="text-sm">لم يتم العثور على أي طلبات مسائل في النظام</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="border border-gray-200 rounded-lg bg-white p-5 shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
            >
              {/* العنوان */}
              <h2 className="text-xl font-semibold text-indigo-700 mb-1">
                {req.title}
              </h2>

              {/* التفاصيل */}
              <div className="text-gray-700 text-sm mb-2">
                <p>
                  <strong>الصعوبة:</strong> {req.difficulty || "غير محدد"}
                </p>
                <p>
                  <strong>الذاكرة:</strong> {req.memory || 0} MB
                </p>
                <p>
                  <strong>الوقت:</strong> {req.time || 0} sec
                </p>
                <p>
                  <strong>المستخدم:</strong> {req.userName || req.user?.userName || "غير محدد"}
                </p>
                <p>
                  <strong>التاريخ:</strong>{" "}
                  {req.createdAt ? new Date(req.createdAt).toLocaleString("ar-EG") : "غير محدد"}
                </p>
              </div>

              {/* الوسوم */}
              <div className="flex flex-wrap gap-2 mb-3">
                {(req.requestproblemTags || req.tags || []).map((tag, idx) => (
                  <span
                    key={tag.id || tag || idx}
                    className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-sm border border-indigo-100"
                  >
                    #{tag.tagName || tag.name || tag}
                  </span>
                ))}
              </div>

              {/* الحالة */}
              <div
                className={`text-center border rounded-lg py-2 mb-4 font-semibold ${getStatusStyle(
                  req.status
                )}`}
              >
                الحالة: {getStatusText(req.status)}
              </div>

              {/* الأزرار */}
              <div className="flex justify-between gap-2">
                <button
                  onClick={() => handleApprove(req.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg w-full transition"
                >
                  ✅ موافقة
                </button>
                <button
                  onClick={() => handleEdit(req.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full transition"
                >
                  ✏️ تعديل
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg w-full transition"
                >
                  ❌ رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProblemRequestList;
