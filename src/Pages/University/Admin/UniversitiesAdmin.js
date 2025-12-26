import React, { useEffect, useState } from "react";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAllUniversities,
  deleteUniversity,
} from "../../../Service/UniversityService";
import Swal from "sweetalert2";

export default function UniversitiesAdmin() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllUniversities();
        setUniversities(data);
      } catch (error) {
        console.error("❌ حدث خطأ أثناء جلب الجامعات:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (u) => {
    const result = await Swal.fire({
      title: `⚠️ هل أنت متأكد؟`,
      text: `سيتم حذف الجامعة "${u.name}" نهائياً!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteUniversity(u.id);
      setUniversities((prev) => prev.filter((uni) => uni.id !== u.id));
      Swal.fire({
        icon: "success",
        title: "✅ تم الحذف",
        text: `تم حذف الجامعة "${u.name}" بنجاح`,
        confirmButtonColor: "#2563eb",
      });
    } catch (error) {
      console.error("❌ خطأ أثناء الحذف:", error);
      Swal.fire({
        icon: "error",
        title: "❌ حدث خطأ",
        text: "فشل حذف الجامعة، حاول مرة أخرى",
      });
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold text-gray-600">
        ⏳ جاري تحميل الجامعات...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            🏛️ إدارة الجامعات
          </h1>
          <button
            onClick={() => navigate("/react-app/admin/AddUniversity")}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={18} /> إضافة جامعة
          </button>
        </div>

        {universities.length === 0 ? (
          <p className="text-center text-gray-600">
            لا توجد جامعات متاحة حالياً.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {universities.map((u) => (
              <div
                key={u.id}
                className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              >
                <img
                  src={
                    u.imageURL && u.imageURL !== "string"
                      ? u.imageURL
                      : "https://www.creativefabrica.com/wp-content/uploads/2019/05/University-Icon-by-TheDesignerBD.jpg"
                  }
                  alt={u.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {u.name}
                  </h2>
                  <p className="text-gray-600 text-sm mb-1">
                    📍 {u.address || "لا يوجد عنوان"}
                  </p>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {u.description || "لا يوجد وصف متاح"}
                  </p>

                  <div className="flex justify-between">
                    <button
                      className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
                      onClick={() =>
                        navigate(`/react-app/admin/university/${u.id}`)
                      }
                    >
                      <Eye size={16} /> عرض
                    </button>

                    <button
                      className="flex items-center gap-1 bg-yellow-400 text-gray-800 px-3 py-1 rounded-lg hover:bg-yellow-500 transition"
                      onClick={() =>
                        navigate(`/react-app/admin/EditUniversity/${u.id}`)
                      }
                    >
                      <Edit size={16} /> تعديل
                    </button>

                    <button
                      className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
                      onClick={() => handleDelete(u)}
                    >
                      <Trash2 size={16} /> حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
