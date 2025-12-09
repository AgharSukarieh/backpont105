import api from "./api";

/**
 * جلب جميع الوسوم المتاحة من السيرفر
 * @returns {Promise<Array>} مصفوفة من الوسوم [{id, tagName}, ...]
 */
export const getAllTags = async () => {
  try {
    const response = await api.get("/AllTags");
    // معالجة البيانات حسب شكل الاستجابة
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (Array.isArray(response.data?.data)) {
      return response.data.data;
    } else if (Array.isArray(response.data?.tags)) {
      return response.data.tags;
    } else {
      console.warn("getAllTags returned unexpected shape:", response.data);
      return [];
    }
  } catch (error) {
    console.error("خطأ أثناء جلب التاغات:", error);
    return [];
  }
};

/**
 * جلب تفاصيل خوارزمية/شرح معين بواسطة ID
 * @param {number|string} id - معرف الخوارزمية/الشرح
 * @returns {Promise<Object>} بيانات الخوارزمية/الشرح
 */
export const getExplaineTagById = async (id) => {
  try {
    const token = localStorage.getItem("token");
    const response = await api.get(`/ExplaineTag/GetExplaineTagById?id=${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error) {
    console.error("خطأ أثناء جلب تفاصيل الخوارزمية:", error);
    throw error;
  }
};

/**
 * جلب جميع الشروحات/الخوارزميات المرتبطة بوسم معين
 * @param {number|string} tagId - معرف الوسم
 * @returns {Promise<Array>} مصفوفة من الشروحات/الخوارزميات
 */
export const getExplaineTagsByTagId = async (tagId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await api.get(`/ExplaineTag/GetExplaineTagByTagId?id=${tagId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    // معالجة البيانات حسب شكل الاستجابة
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (Array.isArray(response.data?.data)) {
      return response.data.data;
    } else {
      console.warn("getExplaineTagsByTagId returned unexpected shape:", response.data);
      return [];
    }
  } catch (error) {
    console.error("خطأ أثناء جلب الخوارزميات للوسم:", error);
    return [];
  }
};
