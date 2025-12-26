import api from "./api";

const BASE_URL = "/api/problems";


export const getProblemsPaging = async (page = 1, perPage = 10, userId = 1) => {
  try {
    const response = await api.get(BASE_URL, {
    params: {
        page: page,
        pageSize: perPage,
    },
  });
    console.log("📦 Full API Response:", response);
    console.log("📦 Response data:", response.data);
    
    // معالجة الاستجابة - قد تكون البيانات في response.data مباشرة أو في property معينة
    const data = response.data;
    
    // إذا كانت البيانات في array مباشرة
    if (Array.isArray(data)) {
      return data;
    }
    
    // إذا كانت البيانات في property معينة
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    if (data?.items && Array.isArray(data.items)) {
      return data.items;
    }
    
    if (data?.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    // إذا لم تكن array، نعيد array فارغ
    console.warn("⚠️ Unexpected response structure:", data);
    return [];
  } catch (err) {
    console.error("❌ Error fetching problems:", err.response?.data || err.message);
    throw err;
  }
};




export const getProblemById = async (id) => {
  try {
    const numericProblemId = parseInt(String(id), 10);
    if (isNaN(numericProblemId) || numericProblemId <= 0 || !Number.isInteger(numericProblemId)) {
      throw new Error("معرف المشكلة غير صحيح");
    }
    
    console.log("📤 Fetching problem:", numericProblemId);
    
    // قائمة endpoints محتملة
    const endpoints = [
      `/api/problems/${numericProblemId}`,
      `/api/problem/${numericProblemId}`,
    ];
    
    let lastError = null;
    
    // محاولة كل endpoint حتى نجاح واحد
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        const response = await api.get(endpoint);
        console.log(`✅ Problem fetched successfully from: ${endpoint}`);
        console.log("📦 Problem details response:", response.data);
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with endpoint: ${endpoint}`, error?.response?.status);
        lastError = error;
        // إذا كان الخطأ 404، جرب endpoint التالي
        if (error?.response?.status === 404) {
          continue;
        }
        // إذا كان خطأ آخر (401, 403, 500, etc)، أرمي الخطأ مباشرة
        throw error;
      }
    }
    
    // إذا فشلت جميع المحاولات
    if (lastError?.response?.status === 404) {
      throw new Error("المشكلة غير موجودة");
    }
    
    throw lastError || new Error("خطأ في جلب بيانات المشكلة");
  } catch (err) {
    console.error("❌ Error fetching problem details:", err.response?.data || err.message);
    
    // معالجة أخطاء محددة
    if (err?.response?.status === 401) {
      throw new Error("غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.");
    }
    
    if (err?.response?.status === 403) {
      throw new Error("ليس لديك صلاحية للوصول إلى هذه المشكلة");
    }
    
    if (err?.response?.status === 404) {
      throw new Error("المشكلة غير موجودة");
    }
    
    // إعادة رمي الخطأ الأصلي إذا كان يحتوي على رسالة
    if (err.message) {
      throw err;
    }
    
    throw new Error(err?.response?.data?.message || err?.message || "خطأ في جلب بيانات المشكلة");
  }
};

/**
 * جلب قائمة جميع المشاكل (مع فلاتر اختيارية)
 * @param {Object} filters - فلاتر البحث (اختياري)
 * @param {number} filters.page - رقم الصفحة
 * @param {number} filters.pageSize - عدد العناصر في الصفحة
 * @param {string} filters.difficulty - مستوى الصعوبة (Easy, Medium, Hard)
 * @param {number} filters.tagId - معرف التاغ
 * @param {string} filters.search - نص البحث
 * @param {string} filters.sortBy - ترتيب حسب (title, createdAt, etc)
 * @param {string} filters.sortOrder - اتجاه الترتيب (asc, desc)
 * @returns {Promise<Array>} قائمة المشاكل
 */
export const getProblemsList = async (filters = {}) => {
  try {
    console.log("📤 Fetching problems list...", filters);
    
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());
    if (filters.difficulty) params.append("difficulty", filters.difficulty);
    if (filters.tagId) params.append("tagId", filters.tagId.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    
    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;
    
    let response;
    try {
      response = await api.get(url);
    } catch (error) {
      // جرب endpoint بديل
      const altUrl = queryString ? `/api/problem?${queryString}` : "/api/problem";
      response = await api.get(altUrl);
    }
    
    const problems = Array.isArray(response.data) ? response.data : [];
    console.log(`✅ Fetched ${problems.length} problems`);
    return problems;
  } catch (error) {
    console.error("❌ Error fetching problems list:", error?.response?.data || error?.message);
    throw new Error(error?.response?.data?.message || error?.message || "خطأ في جلب قائمة المشاكل");
  }
};

/**
 * جلب جميع المسائل (للأدمن) - للتوافق مع الكود القديم
 * @returns {Promise<Array>} قائمة جميع المسائل
 */
export const getAllProblems = async () => {
  try {
    // محاولة endpoints مختلفة
    const endpoints = ["/api/problems/all", BASE_URL, "/api/problem"];
    
    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint, {
          headers: {
            accept: "*/*",
          },
        });
        const data = response.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching all problems:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * جلب تفاصيل مسألة مع التقييمات
 * @param {number} problemId - معرف المسألة
 * @returns {Promise<Object>} تفاصيل المسألة مع التقييمات
 */
export const getProblemDetails = async (problemId) => {
  try {
    const response = await api.get(`/api/problems/${problemId}/details`, {
      headers: {
        accept: "*/*",
      },
    });
  return response.data;
  } catch (error) {
    console.error("❌ Error fetching problem details:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * جلب قائمة المسائل (للاختيار)
 * @returns {Promise<Array>} قائمة المسائل
 */
export const getAllProblemList = async () => {
  try {
    const response = await api.get("/api/Problem/GetAllProblemList", {
      headers: {
        accept: "*/*",
      },
    });
    return response.data || [];
  } catch (error) {
    console.error("❌ Error fetching problem list:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * إضافة مسألة جديدة
 * @param {Object} data - بيانات المسألة
 * @returns {Promise<Object>} بيانات المسألة المُنشأة
 */
export const addProblem = async (data) => {
  try {
    console.log("📤 Creating new problem...", data);
    
    const endpoints = ["/api/problems", "/api/problem"];
    
    let lastError;
    for (const endpoint of endpoints) {
      try {
        const response = await api.post(endpoint, data, {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
        });
        console.log("✅ Problem created successfully");
        return response.data;
      } catch (error) {
        lastError = error;
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }
    
    throw lastError || new Error("خطأ في إنشاء المشكلة");
  } catch (error) {
    console.error("❌ Error creating problem:", error?.response?.data || error?.message);
    
    if (error?.response?.status === 401) {
      throw new Error("غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.");
    }
    
    if (error?.response?.status === 403) {
      throw new Error("ليس لديك صلاحية لإنشاء مشاكل");
    }
    
    if (error?.response?.status === 400) {
      throw new Error(error?.response?.data?.message || "البيانات المرسلة غير صحيحة");
    }
    
    throw new Error(error?.response?.data?.message || error?.message || "خطأ في إنشاء المشكلة");
  }
};

/**
 * إنشاء مشكلة جديدة (اسم بديل)
 */
export const createProblem = addProblem;

/**
 * تحديث مسألة
 * @param {number} problemId - معرف المسألة
 * @param {Object} data - بيانات التحديث
 * @returns {Promise<Object>} بيانات المسألة المحدثة
 */
export const updateProblem = async (problemId, data) => {
  try {
    console.log("📤 Updating problem:", problemId, data);
    
    const numericProblemId = parseInt(String(problemId), 10);
    if (isNaN(numericProblemId) || numericProblemId <= 0) {
      throw new Error("معرف المشكلة غير صحيح");
    }
    
    // التأكد من أن id في body يطابق problemId
    const updateData = {
      ...data,
      id: numericProblemId,
    };
    
    const endpoints = [
      `/api/problems/${numericProblemId}`,
      `/api/problem/${numericProblemId}`,
    ];
    
    let lastError;
    for (const endpoint of endpoints) {
      try {
        const response = await api.put(endpoint, updateData, {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
        });
        console.log("✅ Problem updated successfully");
  return response.data;
      } catch (error) {
        lastError = error;
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }
    
    throw lastError || new Error("خطأ في تحديث المشكلة");
  } catch (error) {
    console.error("❌ Error updating problem:", error?.response?.data || error?.message);
    
    if (error?.response?.status === 404) {
      throw new Error("المشكلة غير موجودة");
    }
    
    if (error?.response?.status === 401) {
      throw new Error("غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.");
    }
    
    if (error?.response?.status === 403) {
      throw new Error("ليس لديك صلاحية لتعديل هذه المشكلة");
    }
    
    if (error?.response?.status === 400) {
      throw new Error(error?.response?.data?.message || "البيانات المرسلة غير صحيحة");
    }
    
    throw new Error(error?.response?.data?.message || error?.message || "خطأ في تحديث المشكلة");
  }
};

/**
 * حذف مسألة
 * @param {number} problemId - معرف المسألة
 * @returns {Promise<void>}
 */
export const deleteProblem = async (problemId) => {
  try {
    console.log("📤 Deleting problem:", problemId);
    
    const numericProblemId = parseInt(String(problemId), 10);
    if (isNaN(numericProblemId) || numericProblemId <= 0) {
      throw new Error("معرف المشكلة غير صحيح");
    }
    
    const endpoints = [
      `/api/problems/${numericProblemId}`,
      `/api/problem/${numericProblemId}`,
    ];
    
    let lastError;
    for (const endpoint of endpoints) {
      try {
        await api.delete(endpoint, {
          headers: {
            accept: "*/*",
          },
        });
        console.log("✅ Problem deleted successfully");
        return;
      } catch (error) {
        lastError = error;
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }
    
    throw lastError || new Error("خطأ في حذف المشكلة");
  } catch (error) {
    console.error("❌ Error deleting problem:", error?.response?.data || error?.message);
    
    if (error?.response?.status === 404) {
      throw new Error("المشكلة غير موجودة");
    }
    
    if (error?.response?.status === 401) {
      throw new Error("غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.");
    }
    
    if (error?.response?.status === 403) {
      throw new Error("ليس لديك صلاحية لحذف هذه المشكلة");
    }
    
    throw new Error(error?.response?.data?.message || error?.message || "خطأ في حذف المشكلة");
  }
};

export const searchProblems = async (params) => {
  try {
    // تحويل المعاملات القديمة إلى الجديدة
    const apiParams = {
      page: params.numberPage || params.page || 1,
      pageSize: params.perPage || params.pageSize || 10,
    };
    
    // إضافة userId إذا كان موجوداً
    if (params.idUser) apiParams.userId = params.idUser;
    if (params.userId) apiParams.userId = params.userId;
    
    // إضافة معاملات البحث إذا كانت موجودة
    if (params.search) apiParams.query = params.search;
    if (params.query) apiParams.query = params.query;
    if (params.difficulty) apiParams.difficulty = params.difficulty;
    if (params.tagId) apiParams.tagId = params.tagId;
    
    console.log("🌐 API Search Request:", apiParams);
    console.log("📍 Full URL:", `${BASE_URL}/search?${new URLSearchParams(apiParams).toString()}`);
    
    const response = await api.get(`${BASE_URL}/search`, { params: apiParams });
    
    console.log("✅ API Response:", response);
    console.log("✅ Response data:", response.data);
    
    const data = response.data;
    
    // معالجة الاستجابة - قد تكون البيانات في response.data مباشرة أو في property معينة
    if (Array.isArray(data)) {
      console.log("📊 Total results:", data.length);
      return data;
    }
    
    if (data?.data && Array.isArray(data.data)) {
      console.log("📊 Total results:", data.data.length);
      return data.data;
    }
    
    if (data?.items && Array.isArray(data.items)) {
      console.log("📊 Total results:", data.items.length);
      return data.items;
    }
    
    if (data?.results && Array.isArray(data.results)) {
      console.log("📊 Total results:", data.results.length);
      return data.results;
    }
    
    console.warn("⚠️ Unexpected response structure:", data);
    console.log("📊 Total results: 0 (unexpected structure)");
    return [];
  } catch (err) {
    console.error("❌ API Error:", err.response?.data || err.message);
    console.error("❌ Error details:", {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      errors: err.response?.data?.errors
    });
    console.error("❌ Full error:", err);
    throw err;
  }
};

export const getAllGeneralInfoUser = async () => {
  try {
    console.log("📤 Fetching general user statistics from /api/general/User");
    const response = await api.get("/api/general/User", {
      headers: {
        accept: "*/*",
      },
    });
    console.log("✅ General user statistics:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Error fetching general info:", err);
    console.error("Error details:", {
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      data: err?.response?.data,
      message: err?.message,
    });
    throw err;
  }
};

/**
 * تقييم/تقييم مشكلة
 * @param {Object} data - بيانات التقييم
 * @param {number} data.problemId - معرف المشكلة
 * @param {number} data.rating - التقييم (1-5)
 * @param {string} data.comment - تعليق اختياري
 * @param {number} data.difficultyRating - تقييم الصعوبة (1-5) اختياري
 * @param {number} data.qualityRating - تقييم الجودة (1-5) اختياري
 * @param {number} data.usefulnessRating - تقييم الفائدة (1-5) اختياري
 * @returns {Promise<Object>} التقييم المحفوظ
 */
export const rateProblem = async (data) => {
  try {
    console.log("📤 Rating problem:", data);
    
    const endpoints = [
      `/api/problems/${data.problemId}/rating`,
      `/api/problem/${data.problemId}/rating`,
      "/api/problem-ratings",
    ];
    
    let lastError;
    for (const endpoint of endpoints) {
      try {
        const method = endpoint.includes("/rating") ? "put" : "post";
        const response = await api[method](endpoint, data);
        console.log("✅ Problem rated successfully");
        return response.data;
      } catch (error) {
        lastError = error;
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }
    
    throw lastError || new Error("خطأ في تقييم المشكلة");
  } catch (error) {
    console.error("❌ Error rating problem:", error?.response?.data || error?.message);
    
    if (error?.response?.status === 401) {
      throw new Error("غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.");
    }
    
    if (error?.response?.status === 400) {
      throw new Error(error?.response?.data?.message || "البيانات المرسلة غير صحيحة");
    }
    
    throw new Error(error?.response?.data?.message || error?.message || "خطأ في تقييم المشكلة");
  }
};

/**
 * جلب تقييمات مشكلة
 * @param {number} problemId - معرف المشكلة
 * @returns {Promise<Array>} قائمة التقييمات
 */
export const getProblemRatings = async (problemId) => {
  try {
    console.log("📤 Fetching problem ratings:", problemId);
    
    const endpoints = [
      `/api/problems/${problemId}/ratings`,
      `/api/problem/${problemId}/ratings`,
      `/api/problem-ratings?problemId=${problemId}`,
    ];
    
    let lastError;
    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        const ratings = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ Fetched ${ratings.length} ratings`);
        return ratings;
      } catch (error) {
        lastError = error;
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }
    
    throw lastError || new Error("خطأ في جلب التقييمات");
  } catch (error) {
    console.error("❌ Error fetching ratings:", error?.response?.data || error?.message);
    throw new Error(error?.response?.data?.message || error?.message || "خطأ في جلب التقييمات");
  }
};
