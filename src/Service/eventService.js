import api from "./api";

/**
 * Event Service - خدمة الفعاليات
 * جميع endpoints الفعاليات حسب التوثيق
 */

/**
 * جلب جميع الفعاليات
 * @returns {Promise<Array>} قائمة الفعاليات
 */
export const getAllEvents = async () => {
  try {
    const response = await api.get("/api/events", {
      headers: {
        accept: "text/plain",
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب الفعاليات";
    throw new Error(errorMessage);
  }
};

/**
 * جلب فعالية معينة
 * @param {number} eventId - معرف الفعالية
 * @returns {Promise<Object>} بيانات الفعالية
 */
export const getEventById = async (eventId) => {
  try {
    const response = await api.get(`/api/events/${eventId}`, {
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
      "خطأ في جلب الفعالية";
    throw new Error(errorMessage);
  }
};

/**
 * حذف فعالية
 * @param {number} eventId - معرف الفعالية
 * @returns {Promise<void>}
 */
export const deleteEvent = async (eventId) => {
  try {
    await api.delete(`/api/events/${eventId}`, {
      headers: {
        accept: "*/*",
      },
    });
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في حذف الفعالية";
    throw new Error(errorMessage);
  }
};

