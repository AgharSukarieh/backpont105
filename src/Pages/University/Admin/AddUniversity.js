import React, { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import { uploadUserImage } from "../../../Service/userService"; // افترضنا عندك خدمة رفع الصور

export default function AddUniversity() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      Swal.fire({ icon: "warning", title: "⚠️ الاسم مطلوب!" });
      return;
    }

    setLoading(true);

    try {
      // رفع الصورة إذا موجودة، وإلا نخلي الرابط فاضي
      let imageURL = "";
      if (imageFile) {
        imageURL = await uploadUserImage(imageFile);
      }

      const payload = {
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
        imageURL,
      };

      await api.post("/Universities", payload);

      Swal.fire({
        icon: "success",
        title: "✅ تم إضافة الجامعة",
        text: `تمت إضافة الجامعة "${name}" بنجاح`,
      });

      navigate("/react-app/admin/Universities"); // العودة لصفحة عرض الجامعات
    } catch (error) {
      console.error("❌ خطأ أثناء إضافة الجامعة:", error);
      Swal.fire({
        icon: "error",
        title: "❌ حدث خطأ",
        text: "فشل إضافة الجامعة، حاول مرة أخرى",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl"
      >
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          ➕ إضافة جامعة جديدة
        </h1>

        <label className="block mb-4">
          <span className="text-gray-700 font-medium">اسم الجامعة *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="أدخل اسم الجامعة"
            required
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-700 font-medium">العنوان</span>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="أدخل العنوان"
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-700 font-medium">الوصف المطول</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="أدخل الوصف الكامل للجامعة"
            rows={5}
          />
        </label>

        <label className="block mb-6">
          <span className="text-gray-700 font-medium">صورة الجامعة</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="mt-1 block w-full"
          />
          <p className="text-gray-400 text-sm mt-1">
            يمكن ترك الحقل فارغًا إذا لا توجد صورة
          </p>
        </label>

        <div className="flex justify-between items-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "⏳ جاري الإضافة..." : "إضافة الجامعة"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/Universities")}
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-xl hover:bg-gray-400 transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
