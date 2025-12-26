import api from "./api";

/**
 * Message Service - خدمة الرسائل
 * جميع endpoints الرسائل حسب التوثيق
 */

/**
 * إرسال رسالة
 * @param {Object} data - بيانات الرسالة
 * @param {string} data.message - نص الرسالة
 * @param {number} data.senderId - معرف المرسل
 * @param {number} data.receiverId - معرف المستقبل
 * @param {Array} data.videos - مصفوفة الفيديوهات (اختياري)
 * @param {Array} data.images - مصفوفة روابط الصور (اختياري)
 * @returns {Promise<Object>} بيانات الرسالة المرسلة
 */
export const sendMessage = async (data) => {
  try {
    const response = await api.post(
      "/api/messages",
      {
        message: data.message,
        senderId: data.senderId,
        receiverId: data.receiverId,
        videos: data.videos || [],
        images: data.images || [],
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في إرسال الرسالة";
    throw new Error(errorMessage);
  }
};

/**
 * جلب رسائل مستخدم معين
 * @param {number} userId - معرف المستخدم (المستقبل)
 * @returns {Promise<Array>} قائمة الرسائل
 */
export const getMessagesByUser = async (userId) => {
  try {
    const response = await api.get(`/api/messages/users/${userId}`, {
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
      "خطأ في جلب الرسائل";
    throw new Error(errorMessage);
  }
};

/**
 * تحديث رسالة
 * @param {number} messageId - معرف الرسالة
 * @param {Object} data - بيانات التحديث
 * @param {number} data.id - معرف الرسالة
 * @param {string} data.message - نص الرسالة
 * @param {number} data.senderId - معرف المرسل
 * @param {number} data.receiverId - معرف المستقبل
 * @param {Array} data.videos - مصفوفة الفيديوهات (اختياري)
 * @param {Array} data.images - مصفوفة روابط الصور (اختياري)
 * @returns {Promise<Object>} بيانات الرسالة المحدثة
 */
export const updateMessage = async (messageId, data) => {
  try {
    const response = await api.put(
      `/api/messages/${messageId}`,
      {
        id: messageId,
        message: data.message,
        senderId: data.senderId,
        receiverId: data.receiverId,
        videos: data.videos || [],
        images: data.images || [],
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في تحديث الرسالة";
    throw new Error(errorMessage);
  }
};

/**
 * حذف رسالة
 * @param {number} messageId - معرف الرسالة
 * @returns {Promise<string>} رسالة نجاح
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`/api/messages/${messageId}`, {
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
      "خطأ في حذف الرسالة";
    throw new Error(errorMessage);
  }
};

/**
 * جلب قائمة المستخدمين المرسل إليهم رسائل
 * @returns {Promise<Array>} قائمة المستخدمين مع معلومات الرسائل
 */
export const getSentMessagesUsers = async () => {
  try {
    const response = await api.get("/api/messages/sent", {
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
      "خطأ في جلب قائمة المحادثات";
    throw new Error(errorMessage);
  }
};

