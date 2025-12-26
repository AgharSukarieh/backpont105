import api from "./api";

/**
 * Notification Service - خدمة الإشعارات
 * جميع endpoints الإشعارات حسب التوثيق
 */

/**
 * جلب إشعارات مستخدم معين
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Array>} قائمة الإشعارات
 */
export const fetchNotificationsByUser = async (userId) => {
  if (!userId) return [];
  try {
    const response = await api.get(`/api/notifications/users/${userId}`, {
      headers: {
        accept: "*/*",
      },
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

/**
 * جلب عدد الإشعارات غير المقروءة
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Object>} { count: number }
 */
export const getUnreadNotificationsCount = async (userId) => {
  try {
    const response = await api.get(
      `/api/notifications/users/${userId}/unread-count`,
      {
        headers: {
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching unread notifications count:", error);
    return { count: 0 };
  }
};
