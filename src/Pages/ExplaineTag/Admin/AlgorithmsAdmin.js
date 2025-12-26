import React, { useEffect, useState } from "react";
import { Eye, Edit, Trash, Plus, ArrowLeft } from "lucide-react";
import { getExplaineTagsByTagId } from "../../../Service/TagServices";
import api from "../../../Service/api";
import { useParams, useNavigate } from "react-router-dom";

export default function AlgorithmsAdmin() {
  const { id: tagId } = useParams();
  const navigate = useNavigate();

  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlgorithms = async () => {
    if (!tagId) {
      setError("لم يتم تحديد Tag ID في الرابط.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("🔍 Fetching algorithms for tagId:", tagId);
      
      // استخدام خدمة التاجات
      const data = await getExplaineTagsByTagId(tagId);
      console.log("✅ Algorithms fetched:", data);
      
      // معالجة البيانات - قد تكون مصفوفة أو كائن
      if (Array.isArray(data)) {
        setAlgorithms(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setAlgorithms(data.data);
      } else if (data?.items && Array.isArray(data.items)) {
        setAlgorithms(data.items);
      } else {
        console.warn("⚠️ Unexpected data format:", data);
        setAlgorithms([]);
      }
    } catch (err) {
      console.error("❌ Error fetching algorithms:", err);
      setError("حدث خطأ أثناء جلب البيانات: " + (err.message || "خطأ غير معروف"));
    } finally {
      setLoading(false);
    }
  };

  const deleteAlgorithm = async (id) => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذه الخوارزمية؟")) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/explained-tags/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlgorithms(algorithms.filter((algo) => algo.id !== id));
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحذف.");
    }
  };

  useEffect(() => {
    fetchAlgorithms();
  }, [tagId]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">⏳ جارٍ تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-8">
          <p className="text-red-500 text-lg mb-4">❌ {error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={fetchAlgorithms}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔄 إعادة المحاولة
            </button>
            <button
              onClick={() => navigate("/react-app/admin/Algorithm")}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <ArrowLeft size={16} /> العودة للقائمة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/react-app/admin/Algorithm")}
            className="text-gray-600 hover:text-gray-800"
            title="العودة للقائمة"
          >
            <ArrowLeft size={20} />
          </button>
        <h1 className="text-3xl font-bold text-gray-800">إدارة الخوارزميات</h1>
          {tagId && (
            <span className="text-sm text-gray-500">(Tag ID: {tagId})</span>
          )}
        </div>
        <button
          onClick={() => navigate(`/react-app/admin/AddAlgorithm/${tagId}`)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={16} /> إضافة خوارزمية
        </button>
      </div>

      {algorithms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">لا توجد خوارزميات مرتبطة بهذا التاج.</p>
          <button
            onClick={() => navigate(`/react-app/admin/AddAlgorithm/${tagId}`)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg mx-auto"
          >
            <Plus size={16} /> إضافة خوارزمية جديدة
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {algorithms.map((algo) => (
          <div
            key={algo.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition flex flex-col justify-between h-full"
          >
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-700">{algo.title || "بدون عنوان"}</h2>
              <p className="text-gray-400 text-sm mt-1">ID: {algo.id}</p>
            </div>

            <div className="flex justify-between mt-auto gap-2">
              <button
                onClick={() => navigate(`/react-app/admin/AlgorithmDetails/${algo.id}`)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              >
                <Eye size={16} /> عرض
              </button>
              <button
                onClick={() => navigate(`/react-app/admin/EditAlgorithm/${algo.id}`)}
                className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
              >
                <Edit size={16} /> تعديل
              </button>
              <button
                onClick={() => deleteAlgorithm(algo.id)}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                <Trash size={16} /> حذف
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
