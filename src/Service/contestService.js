import api from "./api";

/**
 * Contest Service - خدمة المسابقات
 * جميع endpoints المسابقات حسب التوثيق
 */

/**
 * جلب جميع المسابقات
 * @returns {Promise<Array>} قائمة المسابقات
 */
export const getAllContests = async () => {
  try {
    const response = await api.get("/api/contests", {
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
      "خطأ في جلب المسابقات";
    throw new Error(errorMessage);
  }
};

/**
 * جلب مسابقة معينة
 * @param {number} contestId - معرف المسابقة
 * @returns {Promise<Object>} بيانات المسابقة
 */
export const getContestById = async (contestId) => {
  try {
    console.log(`📤 Fetching contest ${contestId} from /api/contests/${contestId}`);
    
    // إضافة idUser كـ query parameter للأدمن
    const idUser = localStorage.getItem("idUser");
    const role = localStorage.getItem("role");
    const isAdmin = role && (role.toLowerCase() === "admin" || role === "Admin");
    
    let url = `/api/contests/${contestId}`;
    if (idUser) {
      url += `?idUser=${idUser}`;
    }
    
    const response = await api.get(url, {
      headers: {
        accept: "text/plain",
        'Content-Type': 'application/json',
      },
    });
    console.log(`✅ Contest ${contestId} response status:`, response.status);
    console.log(`📦 Contest ${contestId} data:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching contest ${contestId}:`, error);
    console.error(`❌ Error details:`, {
      message: error.message,
      code: error.code,
      response: error.response,
      request: error.request,
      config: error.config
    });
    
    // معالجة أفضل للأخطاء
    let errorMessage = "خطأ في جلب المسابقة";
    
    // معالجة CORS Error
    if (error?.message?.includes('CORS') || 
        error?.code === 'ERR_NETWORK' || 
        (!error?.response && error?.request)) {
      errorMessage = "خطأ في الاتصال بالخادم (CORS). يرجى التحقق من إعدادات الـ backend أو الاتصال بالمسؤول.";
      console.error("⚠️ CORS Error: الـ backend لا يرسل CORS headers بشكل صحيح");
    } else if (error?.response?.data) {
      // إذا كان error.response.data نص مباشر
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } 
      // إذا كان error.response.data كائن به message
      else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      // إذا كان error.response.data نص في property أخرى
      else if (typeof error.response.data === 'object') {
        errorMessage = JSON.stringify(error.response.data);
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    // الحفاظ على الكود الأصلي للخطأ
    const customError = new Error(errorMessage);
    customError.response = error.response;
    customError.request = error.request;
    customError.status = error?.response?.status;
    customError.code = error.code;
    throw customError;
  }
};

/**
 * جلب مسابقات مستخدم معين
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Array>} قائمة المسابقات
 */
export const getContestsByUser = async (userId) => {
  try {
    const response = await api.get(`/api/contests/by-user/${userId}`, {
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
      "خطأ في جلب مسابقات المستخدم";
    throw new Error(errorMessage);
  }
};

/**
 * التسجيل في مسابقة
 * @param {number} contestId - معرف المسابقة
 * @returns {Promise<string>} رسالة نجاح
 */
export const registerForContest = async (contestId) => {
  try {
    console.log(`📤 Registering for contest ${contestId}`);
    const response = await api.post(
      `/api/register?ContestId=${contestId}`,
      null, // body فارغ حسب curl command
      {
        headers: {
          accept: "*/*",
        },
      }
    );
    console.log(`✅ Registration response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error registering for contest ${contestId}:`, error);
    console.error(`❌ Error details:`, {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    });
    const errorMessage =
      error?.response?.data?.message ||
      (typeof error?.response?.data === 'string' ? error?.response?.data : null) ||
      error?.message ||
      "خطأ في التسجيل في المسابقة";
    throw new Error(errorMessage);
  }
};

/**
 * إلغاء التسجيل في مسابقة
 * @param {number} contestId - معرف المسابقة
 * @returns {Promise<string>} رسالة نجاح
 */
export const unregisterFromContest = async (contestId) => {
  try {
    const response = await api.delete(`/api/register?ContestId=${contestId}`, {
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
      "خطأ في إلغاء التسجيل في المسابقة";
    throw new Error(errorMessage);
  }
};

/**
 * التحقق من حالة التسجيل في مسابقة
 * @param {number} contestId - معرف المسابقة
 * @returns {Promise<boolean>} true إذا كان المستخدم مسجل في المسابقة
 */
export const checkContestRegistration = async (contestId) => {
  try {
    console.log(`📤 Checking registration for contest ${contestId}`);
    const response = await api.get(`/api/register?ContestId=${contestId}`, {
      headers: {
        accept: "*/*",
      },
    });
    console.log(`✅ Registration check response:`, response.data);
    // قد تكون الاستجابة boolean أو string أو object
    const data = response.data;
    if (typeof data === 'boolean') {
      return data;
    } else if (typeof data === 'string') {
      return data.toLowerCase() === 'true' || data === '1';
    } else if (data && typeof data === 'object') {
      return data.isRegistered === true || data.registered === true || data === true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error checking registration for contest ${contestId}:`, error);
    // في حالة الخطأ (مثل 404)، نعيد false
    return false;
  }
};

/**
 * إضافة مسابقة جديدة (للأدمن)
 * @param {Object} contestData - بيانات المسابقة
 * @returns {Promise<Object>} بيانات المسابقة المُنشأة
 */
export const addContest = async (contestData) => {
  try {
    // التحقق من الحقول المطلوبة
    if (!contestData.name?.trim()) {
      throw new Error("اسم المسابقة مطلوب");
    }
    if (!contestData.startTime) {
      throw new Error("وقت البداية مطلوب");
    }
    if (!contestData.endTime) {
      throw new Error("وقت النهاية مطلوب");
    }
    if (!contestData.createdById || Number(contestData.createdById) <= 0) {
      throw new Error("معرف المستخدم غير صحيح");
    }

    // تحويل التواريخ إلى ISO string إذا لم تكن كذلك
    const formatDate = (dateValue) => {
      if (!dateValue) return null;
      // إذا كان ISO string بالفعل، استخدمه كما هو
      if (typeof dateValue === 'string' && dateValue.includes('T') && dateValue.includes('Z')) {
        return dateValue;
      }
      // وإلا قم بتحويله
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        throw new Error(`تاريخ غير صحيح: ${dateValue}`);
      }
      return date.toISOString();
    };

    // بناء payload مطابق لـ curl command
    const payload = {
      name: contestData.name.trim(),
      startTime: formatDate(contestData.startTime),
      endTime: formatDate(contestData.endTime),
      createdById: Number(contestData.createdById),
      problemsId: Array.isArray(contestData.problemsId) 
        ? contestData.problemsId.map(Number).filter(id => !isNaN(id) && id > 0) 
        : [],
      isPublic: contestData.isPublic !== undefined ? Boolean(contestData.isPublic) : true,
      difficultyLevel: contestData.difficultyLevel !== undefined && contestData.difficultyLevel !== null && contestData.difficultyLevel !== "" 
        ? Number(contestData.difficultyLevel) 
        : 0,
      // الحقول الاختيارية - إرسالها حتى لو كانت فارغة (مطابق لـ curl command)
      universityId: contestData.universityId !== undefined && contestData.universityId !== null 
        ? Number(contestData.universityId) 
        : 0,
      imageURL: contestData.imageURL?.trim() || "",
      prizes: contestData.prizes?.trim() || "",
      location: contestData.location?.trim() || "",
      termsAndConditions: contestData.termsAndConditions?.trim() || "",
    };

    console.log("📤 Adding contest with payload:", payload);

    const response = await api.post("/api/contests", payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error adding contest:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * تحديث مسابقة (للأدمن)
 * @param {number} contestId - معرف المسابقة
 * @param {Object} contestData - بيانات التحديث
 * @returns {Promise<Object>} بيانات المسابقة المحدثة
 */
export const updateContest = async (contestId, contestData) => {
  try {
    const response = await api.put(`/api/contests/${contestId}`, contestData, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error updating contest:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * حذف مسابقة (للأدمن)
 * @param {number} contestId - معرف المسابقة
 * @returns {Promise<void>}
 */
export const deleteContest = async (contestId) => {
  try {
    await api.delete(`/api/contests/${contestId}`, {
      headers: {
        accept: "*/*",
      },
    });
  } catch (error) {
    console.error("❌ Error deleting contest:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * جلب مراحل المسابقة
 * @param {number} contestId - معرف المسابقة
 * @returns {Promise<Object>} مراحل المسابقة
 */
export const getContestStages = async (contestId) => {
  try {
    const response = await api.get(`/api/Contest/GetStageContest/${contestId}`, {
      headers: {
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching contest stages:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * جلب المسابقات القريبة (ستبدأ قريباً)
 * @returns {Promise<Array>} قائمة المسابقات القريبة
 */
export const getSoonContests = async () => {
  try {
    const response = await api.get("/api/contests/GetSoon", {
      headers: {
        accept: "*/*",
      },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("❌ Error fetching soon contests:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * جلب المسابقات الشغالة حالياً
 * @returns {Promise<Array>} قائمة المسابقات النشطة
 */
export const getRunningContests = async () => {
  try {
    const response = await api.get("/api/contests/GetRunning", {
      headers: {
        accept: "*/*",
      },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("❌ Error fetching running contests:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * جلب المسابقات المنتهية
 * @returns {Promise<Array>} قائمة المسابقات المنتهية
 */
export const getEndedContests = async () => {
  try {
    const response = await api.get("/api/contests/GetEnd", {
      headers: {
        accept: "*/*",
      },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("❌ Error fetching ended contests:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * جلب المسابقات المسجلة للمستخدم الحالي
 * @returns {Promise<Array>} قائمة المسابقات المسجلة
 */
export const getRegisteredContests = async () => {
  try {
    console.log("📤 Fetching registered contests from /api/contests/GetRegisterContest");
    const response = await api.get("/api/contests/GetRegisterContest", {
      headers: {
        accept: "*/*",
      },
    });
    console.log("✅ Registered contests response:", response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("❌ Error fetching registered contests:", error?.response?.data || error?.message);
    throw error;
  }
};

