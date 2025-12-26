import api from "./api";

/**
 * جلب بيانات المشكلة مع التقييمات
 * @param {number} problemId - ID المشكلة
 * @returns {Promise<Object>} بيانات المشكلة مع التقييمات
 */
export const getProblemWithRatings = async (problemId) => {
  try {
    console.log("📤 Fetching problem evaluations from:", `/api/problem-evaluations/problems/${problemId}`);
    const response = await api.get(`/api/problem-evaluations/problems/${problemId}`, {
      headers: { "accept": "text/plain" },
    });
    console.log("✅ Response received:", response);
    console.log("✅ Response data:", response.data);
    
    // التحقق من بنية البيانات
    const data = response.data;
    if (!data) {
      console.warn("⚠️ No data in response");
      return null;
    }
    
    // التحقق من بنية البيانات
    let evaluations = [];
    let isEvaluatedByCurrentUser = false;
    const currentUserId = Number(localStorage.getItem("idUser"));
    
    // إذا كانت البيانات array مباشرة
    if (Array.isArray(data)) {
      evaluations = data;
    } else if (data.problemEvaluationDTO && Array.isArray(data.problemEvaluationDTO)) {
      evaluations = data.problemEvaluationDTO;
      isEvaluatedByCurrentUser = data.isEvaluatedByCurrentUser || false;
    } else {
      console.warn("⚠️ Unexpected data structure, setting to empty array");
      evaluations = [];
    }
    
    // حساب الإحصائيات من التقييمات
    let averageScore = 0;
    let numberOfEvaluationsEasy = 0;
    let numberOfEvaluationsMedium = 0;
    let numberOfEvaluationsHard = 0;
    
    if (evaluations.length > 0) {
      // حساب متوسط التقييم (تحويل من 0-10 إلى 0-5)
      const totalScore = evaluations.reduce((sum, ev) => sum + (ev.evaluationScore || 0), 0);
      averageScore = (totalScore / evaluations.length) / 2; // تحويل من 0-10 إلى 0-5
      
      // حساب عدد التقييمات حسب الصعوبة
      evaluations.forEach((ev) => {
        if (ev.problemDifficulty === 1) numberOfEvaluationsEasy++;
        else if (ev.problemDifficulty === 2) numberOfEvaluationsMedium++;
        else if (ev.problemDifficulty === 3) numberOfEvaluationsHard++;
      });
      
      // التحقق من وجود تقييم للمستخدم الحالي
      if (currentUserId) {
        isEvaluatedByCurrentUser = evaluations.some((ev) => ev.userId === currentUserId);
      }
    }
    
    // بناء كائن البيانات النهائي
    const result = {
      id: Number(problemId),
      averageScore: data.averageScore !== undefined ? data.averageScore : averageScore,
      numberOfEvaluationsEasy: data.numberOfEvaluationsEasy !== undefined ? data.numberOfEvaluationsEasy : numberOfEvaluationsEasy,
      numberOfEvaluationsMedium: data.numberOfEvaluationsMedium !== undefined ? data.numberOfEvaluationsMedium : numberOfEvaluationsMedium,
      numberOfEvaluationsHard: data.numberOfEvaluationsHard !== undefined ? data.numberOfEvaluationsHard : numberOfEvaluationsHard,
      isEvaluatedByCurrentUser: data.isEvaluatedByCurrentUser !== undefined ? data.isEvaluatedByCurrentUser : isEvaluatedByCurrentUser,
      problemEvaluationDTO: evaluations,
    };
    
    console.log("📊 Final result:", result);
    return result;
  } catch (error) {
    console.error("❌ Error fetching problem with ratings:", error);
    console.error("❌ Error details:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      url: error?.config?.url,
    });
    throw error;
  }
};

/**
 * إضافة تقييم جديد
 * @param {number} problemId - ID المشكلة
 * @param {Object} ratingData - بيانات التقييم { score: 0-5, difficulty: 1-3, comment: string }
 * @returns {Promise<Object>} التقييم المُنشأ
 */
export const addProblemRating = async (problemId, ratingData) => {
  try {
    const userId = Number(localStorage.getItem("idUser"));
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // التحقق من القيم
    if (!ratingData.score || ratingData.score < 1 || ratingData.score > 5) {
      throw new Error("التقييم يجب أن يكون بين 1 و 5");
    }
    if (!ratingData.difficulty || ratingData.difficulty < 1 || ratingData.difficulty > 3) {
      throw new Error("الصعوبة يجب أن تكون بين 1 و 3");
    }

    const payload = {
      evaluationScore: Math.round(ratingData.score * 2), // تحويل من 0-5 إلى 0-10
      comments: ratingData.comment || "",
      userId: userId,
      problemId: Number(problemId),
      problemDifficulty: ratingData.difficulty, // 1=سهل، 2=متوسط، 3=صعب
      evaluatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("📤 Adding rating with payload:", JSON.stringify(payload, null, 2));
    console.log("📤 Endpoint: /api/problem-evaluations");
    console.log("📤 Full URL:", `${api.defaults.baseURL}/api/problem-evaluations`);
    console.log("📤 User ID:", userId);
    console.log("📤 Problem ID:", problemId);
    
    const response = await api.post("/api/problem-evaluations", payload, {
      headers: { 
        "Content-Type": "application/json",
        "accept": "text/plain"
      },
    });
    
    console.log("✅ Rating added successfully:", response.data);
    console.log("✅ Response status:", response.status);

    return response.data;
  } catch (error) {
    console.error("❌ Error adding rating:", error);
    console.error("❌ Error details:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      url: error?.config?.url,
      method: error?.config?.method,
      payload: error?.config?.data,
    });
    
    // إرجاع رسالة خطأ واضحة
    if (error?.response?.status === 404) {
      throw new Error("Endpoint غير موجود. يرجى التحقق من عنوان API.");
    } else if (error?.response?.status === 400) {
      throw new Error(error?.response?.data?.message || "بيانات غير صحيحة");
    } else if (error?.response?.status === 401) {
      throw new Error("غير مصرح. يرجى تسجيل الدخول مرة أخرى.");
    } else {
      throw error;
    }
  }
};

/**
 * تحديث تقييم موجود
 * @param {number} evaluationId - ID التقييم
 * @param {Object} ratingData - بيانات التقييم المحدثة
 * @returns {Promise<Object>} التقييم المحدث
 */
export const updateProblemRating = async (evaluationId, ratingData) => {
  try {
    // التحقق من القيم
    if (!ratingData.score || ratingData.score < 1 || ratingData.score > 5) {
      throw new Error("التقييم يجب أن يكون بين 1 و 5");
    }
    if (!ratingData.difficulty || ratingData.difficulty < 1 || ratingData.difficulty > 3) {
      throw new Error("الصعوبة يجب أن تكون بين 1 و 3");
    }
    if (!ratingData.userId) {
      throw new Error("معرف المستخدم مطلوب");
    }
    if (!ratingData.problemId) {
      throw new Error("معرف المشكلة مطلوب");
    }

    // التأكد من أن جميع القيم صحيحة
    const evaluationScore = Math.round(Number(ratingData.score) * 2); // تحويل من 0-5 إلى 0-10
    const userId = Number(ratingData.userId);
    const problemId = Number(ratingData.problemId);
    const problemDifficulty = Number(ratingData.difficulty);
    
    if (isNaN(evaluationScore) || evaluationScore < 2 || evaluationScore > 10) {
      throw new Error(`التقييم غير صحيح: ${evaluationScore} (يجب أن يكون بين 2 و 10)`);
    }
    if (isNaN(userId) || userId <= 0) {
      throw new Error(`معرف المستخدم غير صحيح: ${userId}`);
    }
    if (isNaN(problemId) || problemId <= 0) {
      throw new Error(`معرف المشكلة غير صحيح: ${problemId}`);
    }
    if (isNaN(problemDifficulty) || problemDifficulty < 1 || problemDifficulty > 3) {
      throw new Error(`الصعوبة غير صحيحة: ${problemDifficulty} (يجب أن تكون 1 أو 2 أو 3)`);
    }
    
    const payload = {
      evaluationScore: evaluationScore,
      comments: ratingData.comment || "",
      userId: userId,
      problemId: problemId,
      problemDifficulty: problemDifficulty,
      evaluatedAt: ratingData.evaluatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("📤 Updating rating:", evaluationId);
    console.log("📤 Payload:", JSON.stringify(payload, null, 2));
    console.log("📤 Endpoint: /api/problem-evaluations/" + evaluationId);
    console.log("📤 Full URL:", `${api.defaults.baseURL}/api/problem-evaluations/${evaluationId}`);
    
    const response = await api.put(`/api/problem-evaluations/${evaluationId}`, payload, {
      headers: { 
        "Content-Type": "application/json",
        "accept": "*/*"
      },
    });
    
    console.log("✅ Rating updated successfully:", response.data);
    console.log("✅ Response status:", response.status);

    return response.data;
  } catch (error) {
    console.error("❌ Error updating rating:", error);
    console.error("❌ Error details:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      url: error?.config?.url,
      method: error?.config?.method,
      payload: error?.config?.data,
    });
    
    // إرجاع رسالة خطأ واضحة
    if (error?.response?.status === 404) {
      throw new Error("Endpoint غير موجود. يرجى التحقق من عنوان API.");
    } else if (error?.response?.status === 400) {
      throw new Error(error?.response?.data?.message || "بيانات غير صحيحة");
    } else if (error?.response?.status === 401) {
      throw new Error("غير مصرح. يرجى تسجيل الدخول مرة أخرى.");
    } else {
      throw error;
    }
  }
};

/**
 * حذف تقييم
 * @param {number} evaluationId - ID التقييم
 * @returns {Promise<void>}
 */
export const deleteProblemRating = async (evaluationId) => {
  try {
    console.log("📤 Deleting rating:", evaluationId);
    console.log("📤 Endpoint: /api/problem-evaluations/" + evaluationId);
    await api.delete(`/api/problem-evaluations/${evaluationId}`, {
      headers: { "accept": "*/*" },
    });
    console.log("✅ Rating deleted successfully");
  } catch (error) {
    console.error("❌ Error deleting rating:", error);
    console.error("❌ Error details:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      url: error?.config?.url,
    });
    throw error;
  }
};

