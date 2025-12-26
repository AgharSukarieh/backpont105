import api from "./api";

/**
 * General Service - خدمة عامة
 * جميع endpoints العامة حسب التوثيق
 */

/**
 * جلب معلومات المستخدم العام (المستخدم الحالي)
 * @returns {Promise<Object>} معلومات المستخدم
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/api/general/User", {
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
      "خطأ في جلب معلومات المستخدم";
    throw new Error(errorMessage);
  }
};

/**
 * جلب الإحصائيات العامة (للأدمن)
 * @returns {Promise<Object>} الإحصائيات العامة
 */
export const getGeneralStats = async () => {
  try {
    const response = await api.get("/api/general", {
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
      "خطأ في جلب الإحصائيات";
    throw new Error(errorMessage);
  }
};

