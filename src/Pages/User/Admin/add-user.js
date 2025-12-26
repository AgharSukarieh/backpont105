import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import Swal from "sweetalert2";
import { getAllCountries } from "../../../Service/CountryService";

const AddUser = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userName: "",
    countryId: 0,
    image: null,
  });

  // جلب الدول
  const fetchCountries = async () => {
    try {
      const data = await getAllCountries();
      setCountries(data);
      if (data.length > 0) setFormData((prev) => ({ ...prev, countryId: data[0].id }));
    } catch (err) {
      console.error("فشل جلب الدول:", err);
      Swal.fire("حدث خطأ أثناء تحميل الدول", "", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  // تحديث القيم
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  // إرسال البيانات
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.userName || !formData.countryId) {
      Swal.fire("الرجاء تعبئة كل الحقول", "", "warning");
      return;
    }

    const data = new FormData();
    data.append("Email", formData.email);
    data.append("Password", formData.password);
    data.append("UserName", formData.userName);
    data.append("CountryId", formData.countryId);
    if (formData.image) data.append("image", formData.image);

    try {
      await api.post("/Authantication/register", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire("تم إنشاء المستخدم بنجاح!", "", "success");
      navigate("/react-app/admin/users");
    } catch (err) {
      console.error("خطأ عند إضافة المستخدم:", err);
      Swal.fire("حدث خطأ أثناء إضافة المستخدم", "", "error");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-purple-600 font-semibold">
        جاري تحميل البيانات...
      </div>
    );

  return (
    <div className="p-8 min-h-screen bg-gray-100 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-purple-700">
          ➕ إضافة مستخدم جديد
        </h1>

        <label className="block mb-3">
          البريد الإلكتروني
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 w-full p-2 border rounded"
            required
          />
        </label>

        <label className="block mb-3">
          كلمة المرور
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 w-full p-2 border rounded"
            required
          />
        </label>

        <label className="block mb-3">
          اسم المستخدم
          <input
            type="text"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            className="mt-1 w-full p-2 border rounded"
            required
          />
        </label>

        <label className="block mb-3">
          الدولة
          <select
            name="countryId"
            value={formData.countryId}
            onChange={handleChange}
            className="mt-1 w-full p-2 border rounded"
          >
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameCountry}
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-6">
          صورة المستخدم
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 w-full"
          />
        </label>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition"
        >
          حفظ المستخدم
        </button>
      </form>
    </div>
  );
};

export default AddUser;
