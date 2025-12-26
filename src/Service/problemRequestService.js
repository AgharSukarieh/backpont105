import api from "./api";

/**
 * Problem Request Service - خدمة طلبات المسائل
 * جميع endpoints طلبات المسائل حسب التوثيق
 */

/**
 * جلب جميع طلبات المسائل (للأدمن)
 * @returns {Promise<Array>} قائمة جميع الطلبات
 */
export const getAllProblemRequests = async () => {
  try {
    const response = await api.get("/api/problem-requests", {
      headers: {
        accept: "*/*",
      },
    });
    return response.data || [];
  } catch (error) {
    console.error("❌ Error fetching problem requests:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * جلب طلب مسألة محدد
 * @param {number} requestId - معرف الطلب
 * @returns {Promise<Object>} بيانات الطلب
 */
export const getProblemRequestById = async (requestId) => {
  try {
    const response = await api.get(`/api/problem-requests/${requestId}`, {
      headers: {
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching problem request:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * الموافقة على طلب مسألة (للأدمن)
 * @param {number} requestId - معرف الطلب
 * @returns {Promise<Object>} بيانات الطلب المحدث
 */
export const approveProblemRequest = async (requestId) => {
  try {
    const response = await api.post(`/api/problem-requests/${requestId}/approve`, null, {
      headers: {
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error approving problem request:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * رفض طلب مسألة (للأدمن)
 * @param {number} requestId - معرف الطلب
 * @returns {Promise<Object>} بيانات الطلب المحدث
 */
export const rejectProblemRequest = async (requestId) => {
  try {
    const response = await api.post(`/api/problem-requests/${requestId}/reject`, null, {
      headers: {
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error rejecting problem request:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * تحديث طلب مسألة (للأدمن)
 * @param {number} requestId - معرف الطلب
 * @param {Object} requestData - بيانات التحديث
 * @returns {Promise<Object>} بيانات الطلب المحدث
 */
export const updateProblemRequest = async (requestId, requestData) => {
  try {
    const response = await api.put(`/api/problem-requests/${requestId}`, requestData, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error updating problem request:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * إضافة طلب مسألة جديد (من المستخدم)
 * @param {Object} requestData - بيانات طلب المسألة
 * @returns {Promise<Object>} بيانات الطلب المُنشأ
 */
export const addProblemRequest = async (requestData) => {
  try {
    const response = await api.post("/api/problem-requests", requestData, {
      headers: {
        "Content-Type": "application/json",
        accept: "text/plain",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error adding problem request:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * جلب المسائل المقترحة من قبل مستخدم محدد
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Array>} قائمة المسائل المقترحة من قبل المستخدم
 */
export const getUserProposals = async (userId) => {
  try {
    const response = await api.get(`/api/problem-requests/users/${userId}`, {
      headers: {
        accept: "text/plain",
      },
    });
    // معالجة البيانات - قد تكون مصفوفة أو كائن واحد
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data) {
      return [data];
    }
    return [];
  } catch (error) {
    console.error("❌ Error fetching user proposals:", error?.response?.data || error?.message);
    throw error;
  }
};

