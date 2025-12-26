import api from "./api";

/**
 * Admin Service - خدمة الأدمن
 * جميع APIs الخاصة بالأدمن (تقييمات، اقتباسات، إشعارات)
 */

// ==================== Problem Evaluations (Admin) ====================

/**
 * جلب تقييمات مسألة (للأدمن)
 * @param {number} problemId - معرف المسألة
 * @returns {Promise<Array>} قائمة التقييمات
 */
export const getProblemEvaluations = async (problemId) => {
  try {
    const response = await api.get(`/api/problem-evaluations/problems/${problemId}`, {
      headers: {
        accept: "*/*",
      },
    });
    return response.data || [];
  } catch (error) {
    console.error("❌ Error fetching problem evaluations:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * تحديث تقييم (للأدمن)
 * @param {number} evaluationId - معرف التقييم
 * @param {Object} evaluationData - بيانات التقييم
 * @returns {Promise<Object>} بيانات التقييم المحدث
 */
export const updateEvaluation = async (evaluationId, evaluationData) => {
  try {
    const payload = {
      evaluationScore: Math.round(evaluationData.score),
      comments: evaluationData.comments || "",
      userId: evaluationData.userId || 0,
      problemId: Number(evaluationData.problemId),
      problemDifficulty: evaluationData.difficulty, // 1=سهل، 2=متوسط، 3=صعب
      evaluatedAt: evaluationData.evaluatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const response = await api.put(`/api/ProblemEvaluation/Update/${evaluationId}`, payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error updating evaluation:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * حذف تقييم (للأدمن)
 * @param {number} evaluationId - معرف التقييم
 * @returns {Promise<void>}
 */
export const deleteEvaluation = async (evaluationId) => {
  try {
    await api.delete(`/api/ProblemEvaluation/Delete/${evaluationId}`, {
      headers: {
        accept: "*/*",
      },
    });
  } catch (error) {
    console.error("❌ Error deleting evaluation:", error?.response?.data || error?.message);
    throw error;
  }
};

// ==================== Motivational Quotes ====================

/**
 * جلب الاقتباسات حسب النوع
 * @param {number} typeId - نوع الاقتباس
 * @returns {Promise<Array>} قائمة الاقتباسات
 */
export const getQuotesByType = async (typeId) => {
  try {
    const response = await api.get(`/api/motivational-quotes?type=${typeId}`, {
      headers: {
        accept: "*/*",
      },
    });
    return response.data || [];
  } catch (error) {
    console.error("❌ Error fetching quotes:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * إضافة اقتباس جديد
 * @param {Object} quoteData - بيانات الاقتباس
 * @param {string} quoteData.title - عنوان الاقتباس
 * @param {string} quoteData.startMessage - الرسالة الأولى
 * @param {string} quoteData.endMessage - الرسالة الثانية
 * @param {number} quoteData.type - نوع الاقتباس
 * @returns {Promise<Object>} بيانات الاقتباس المُنشأ
 */
export const addQuote = async (quoteData) => {
  try {
    const payload = {
      title: quoteData.title?.trim(),
      startMessage: quoteData.startMessage?.trim(),
      endMessage: quoteData.endMessage?.trim(),
      type: Number(quoteData.type),
    };

    const response = await api.post("/api/motivational-quotes", payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error adding quote:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * تحديث اقتباس
 * @param {number} quoteId - معرف الاقتباس
 * @param {Object} quoteData - بيانات التحديث
 * @returns {Promise<Object>} بيانات الاقتباس المحدث
 */
export const updateQuote = async (quoteId, quoteData) => {
  try {
    const payload = {
      title: quoteData.title?.trim(),
      startMessage: quoteData.startMessage?.trim(),
      endMessage: quoteData.endMessage?.trim(),
      type: Number(quoteData.type),
    };

    const response = await api.put(`/api/motivational-quotes/${quoteId}`, payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error updating quote:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * حذف اقتباس
 * @param {number} quoteId - معرف الاقتباس
 * @returns {Promise<void>}
 */
export const deleteQuote = async (quoteId) => {
  try {
    await api.delete(`/api/motivational-quotes/${quoteId}`, {
      headers: {
        accept: "*/*",
      },
    });
  } catch (error) {
    console.error("❌ Error deleting quote:", error?.response?.data || error?.message);
    throw error;
  }
};

// ==================== Notifications ====================

/**
 * إرسال إشعار
 * @param {Object} notificationData - بيانات الإشعار
 * @param {number} notificationData.idUser - معرف المستخدم
 * @param {number} notificationData.idProblem - معرف المسألة (اختياري)
 * @param {number} notificationData.streakDays - أيام السلسلة (اختياري)
 * @param {number} notificationData.type - نوع الإشعار (1-6)
 * @param {string} notificationData.title - عنوان الإشعار
 * @param {string} notificationData.startMessage - الرسالة الأولى
 * @param {string} notificationData.endMessage - الرسالة الثانية
 * @returns {Promise<Object>} بيانات الإشعار المُرسل
 */
export const sendNotification = async (notificationData) => {
  try {
    const payload = {
      idUser: Number(notificationData.idUser),
      idProblem: notificationData.idProblem || 0,
      streakDays: notificationData.streakDays || 0,
      type: Number(notificationData.type), // 1-6
      title: notificationData.title?.trim(),
      startMessage: notificationData.startMessage?.trim(),
      endMessage: notificationData.endMessage?.trim(),
    };

    const response = await api.post("/api/notifications", payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error sending notification:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * جلب إحصائيات الإشعارات
 * @returns {Promise<Object>} إحصائيات الإشعارات
 */
export const getNotificationStats = async () => {
  try {
    const response = await api.get("/api/notifications/statistics", {
      headers: {
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching notification stats:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * أنواع الإشعارات:
 * 1 = For Register
 * 2 = Problem Request
 * 3 = Solve Problem (يحتاج streakDays)
 * 4 = Problem Report (يحتاج idProblem)
 * 5 = Streak Days
 * 6 = System
 */

