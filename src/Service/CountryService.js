import api from "./api";

/**
 * Country Service - خدمة الدول
 * استخدام API الجديد: GET /api/countries
 */

/**
 * جلب قائمة الدول
 * @returns {Promise<Array>} قائمة الدول
 */
export const getAllCountries = async () => {
  try {
    const response = await api.get("/api/countries", {
      headers: {
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب قائمة الدول";
    throw new Error(errorMessage);
  }
};

// ==================== Admin APIs ====================

/**
 * إضافة دولة جديدة (للأدمن)
 * @param {string} countryName - اسم الدولة
 * @param {File} imageFile - ملف صورة الدولة
 * @returns {Promise<Object>} بيانات الدولة المُنشأة
 */
export const addCountry = async (countryName, imageFile) => {
  try {
    const formData = new FormData();
    formData.append("nameCountry", countryName);
    formData.append("imageCountry", imageFile);

    const response = await api.post("/api/countries", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error adding country:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * تحديث دولة (للأدمن)
 * @param {number} countryId - معرف الدولة
 * @param {string} countryName - اسم الدولة
 * @param {File} imageFile - ملف صورة الدولة (اختياري)
 * @returns {Promise<Object>} بيانات الدولة المحدثة
 */
export const updateCountry = async (countryId, countryName, imageFile) => {
  try {
  const formData = new FormData();
  if (imageFile) {
    formData.append("imageCountry", imageFile);
  }

    const response = await api.put(`/api/countries/${countryId}`, formData, {
    params: {
        Id: countryId,
        nameCountry: countryName,
    },
      headers: {
        "Content-Type": "multipart/form-data",
        accept: "*/*",
      },
  });
    return response.data;
  } catch (error) {
    console.error("❌ Error updating country:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * حذف دولة (للأدمن)
 * @param {number} countryId - معرف الدولة
 * @returns {Promise<void>}
 */
export const deleteCountry = async (countryId) => {
  try {
    await api.delete(`/api/countries/${countryId}`, {
      headers: {
        accept: "*/*",
      },
    });
  } catch (error) {
    console.error("❌ Error deleting country:", error?.response?.data || error?.message);
    throw error;
  }
};

