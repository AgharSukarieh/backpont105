import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import Swal from "sweetalert2";
import { getAllCountries } from "../../../Service/CountryService"; // استدعاء الفنكشن الجاهز
import { uploadUserImage, getUserById, updateUser } from "../../../Service/userService";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [countries, setCountries] = useState([]); // قائمة الدول

  // جلب بيانات المستخدم
  const fetchUser = async () => {
    if (!id) {
      console.error("❌ User ID is missing");
      Swal.fire({
        icon: "error",
        title: "❌ خطأ",
        text: "معرف المستخدم غير موجود",
      });
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const userId = Number(id);
      console.log("📤 Fetching user with ID:", userId, "(type:", typeof userId, ")");
      
      if (isNaN(userId) || userId <= 0) {
        throw new Error("معرف المستخدم غير صحيح");
      }
      
      const data = await getUserById(userId);
      console.log("✅ User data received:", data);
      
      if (!data || !data.id) {
        throw new Error("لم يتم العثور على بيانات المستخدم");
      }
      
      setUser({
        id: data.id,
        email: data.email || "",
        userName: data.userName || "",
        imageURL: data.imageUrl || data.imageURL || "",
        countryId: data.country?.id || data.countryId || 0, // الدولة مبدأياً
      });
    } catch (err) {
      console.error("❌ خطأ في جلب بيانات المستخدم:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        userId: id,
      });
      
      const errorMessage = err.message || "فشل تحميل بيانات المستخدم";
      Swal.fire({
        icon: "error",
        title: "❌ خطأ",
        text: errorMessage,
        footer: err.response?.status ? `رمز الخطأ: ${err.response.status}` : "",
      });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // جلب قائمة الدول
  const fetchCountries = async () => {
    try {
      const data = await getAllCountries();
      setCountries(data || []);
    } catch (err) {
      console.error("خطأ في جلب قائمة الدول:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchCountries();
  }, [id]);

  // رفع الصورة
  const handleImageChange = (e) => {
    if (e.target.files[0] && user) {
      setImageFile(e.target.files[0]);
      setUser({ ...user, imageURL: URL.createObjectURL(e.target.files[0]) });
    }
  };

  // حفظ التعديلات
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);

    try {
      let imageUrl = user.imageURL || "";

      if (imageFile) {
        imageUrl = await uploadUserImage(imageFile);
      }

      // التحقق من البيانات قبل الإرسال
      if (!user.email || !user.userName) {
        Swal.fire({
          icon: "warning",
          title: "⚠️ تحذير",
          text: "الرجاء إدخال البريد الإلكتروني واسم المستخدم",
        });
        setSaving(false);
        return;
      }

      const payload = {
        email: user.email.trim(),
        userName: user.userName.trim(),
        imageURL: imageUrl || "",
        countryId: Number(user.countryId) || 0,
        universityId: 0, // إضافة universityId بقيمة افتراضية
      };

      console.log("📤 Submitting user update:", {
        userId: user.id,
        payload: JSON.stringify(payload, null, 2),
      });

      await updateUser(user.id, payload);

      Swal.fire({
        icon: "success",
        title: "✅ تم التعديل",
        text: "تم تحديث بيانات المستخدم بنجاح!",
      }).then(() => navigate("/react-app/admin/users"));
    } catch (err) {
      console.error("❌ خطأ أثناء التعديل:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
      
      // استخراج رسالة الخطأ بشكل صحيح
      let errorMessage = "حدث خطأ أثناء تعديل المستخدم";
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      }
      
      Swal.fire({
        icon: "error",
        title: "❌ خطأ",
        text: errorMessage,
        footer: err.response?.status ? `رمز الخطأ: ${err.response.status}` : "",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-purple-600 font-semibold">
        ⏳ جاري تحميل بيانات المستخدم...
      </div>
    );

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-red-600 font-semibold">
        ❌ فشل تحميل بيانات المستخدم
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
        ✏️ تعديل بيانات المستخدم
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* الاسم */}
        <div>
          <label className="block font-semibold mb-1">الاسم</label>
          <input
            type="text"
            value={user.userName || ""}
            onChange={(e) => setUser({ ...user, userName: e.target.value })}
            className="w-full border p-2 rounded-md"
            required
          />
        </div>

        {/* البريد */}
        <div>
          <label className="block font-semibold mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            value={user.email || ""}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            className="w-full border p-2 rounded-md"
            required
          />
        </div>

        {/* الصورة */}
        <div>
          <label className="block font-semibold mb-1">الصورة</label>
          {user.imageURL && (
            <div className="mb-2">
              <img
                src={user.imageURL}
                alt="User"
                className="w-32 h-32 object-cover rounded-md border mb-2"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border p-2 rounded-md"
          />
        </div>

        {/* الدولة */}
        <div>
          <label className="block font-semibold mb-1">الدولة</label>
          <select
            value={user.countryId || 0}
            onChange={(e) =>
              setUser({ ...user, countryId: Number(e.target.value) })
            }
            className="w-full border p-2 rounded-md"
          >
            <option value={0}>اختر الدولة</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameCountry}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate("/react-app/admin/users")}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            رجوع
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </form>
    </div>
  );
}
