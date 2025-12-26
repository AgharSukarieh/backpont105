import api from "./api";

/**
 * Search Service - خدمة البحث
 * جميع endpoints البحث حسب التوثيق
 */

/**
 * البحث عن المنشورات والمستخدمين
 * @param {string} query - نص البحث
 * @returns {Promise<Object>} { posts: Array, users: Array }
 */
export const search = async (query) => {
  try {
    const response = await api.get(`/api/search?query=${encodeURIComponent(query)}`, {
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
      "خطأ في البحث";
    throw new Error(errorMessage);
  }
};

