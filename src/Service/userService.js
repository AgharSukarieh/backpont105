import api from "./api";

/**
 * User Service - خدمة المستخدمين
 * جميع endpoints المستخدمين حسب التوثيق
 */

/**
 * Email Preferences Service - خدمة تفضيلات البريد الإلكتروني
 */

/**
 * جلب تفضيلات البريد الإلكتروني للمستخدم الحالي
 * @returns {Promise<boolean>} true إذا كان مسموح بإرسال الإشعارات عبر البريد
 */
export const getEmailPreferences = async () => {
  try {
    const response = await api.get("/api/users/me/email-preferences", {
      headers: {
        accept: "text/plain",
      },
    });
    // API قد ترجع boolean أو string "true"/"false"
    const result = response.data;
    if (typeof result === "boolean") return result;
    if (typeof result === "string") return result.toLowerCase() === "true";
    return false;
  } catch (error) {
    console.error("Error fetching email preferences:", error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب تفضيلات البريد الإلكتروني";
    throw new Error(errorMessage);
  }
};

/**
 * تحديث تفضيلات البريد الإلكتروني للمستخدم الحالي
 * @param {boolean} allowSendEmail - السماح بإرسال الإشعارات عبر البريد
 * @returns {Promise<void>}
 */
export const updateEmailPreferences = async (allowSendEmail) => {
  try {
    await api.put(`/api/users/me/email-preferences?allowSendEmail=${allowSendEmail}`, null, {
      headers: {
        accept: "text/plain",
      },
    });
    console.log("Email preferences updated successfully");
  } catch (error) {
    console.error("Error updating email preferences:", error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في تحديث تفضيلات البريد الإلكتروني";
    throw new Error(errorMessage);
  }
};

/**
 * جلب قائمة الدول
 * @returns {Promise<Array>} قائمة الدول
 */
export const getAllCountries = async () => {
  try {
    const response = await api.get("/api/countries", {
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
      "خطأ في جلب قائمة الدول";
    throw new Error(errorMessage);
  }
};

/**
 * جلب قائمة الجامعات
 * @returns {Promise<Array>} قائمة الجامعات
 */
export const getAllUniversities = async () => {
  try {
    const response = await api.get("/api/universities", {
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
      "خطأ في جلب قائمة الجامعات";
    throw new Error(errorMessage);
  }
};

/**
 * إرسال OTP لتغيير الإيميل
 * @param {string} email - البريد الإلكتروني الجديد
 * @returns {Promise<string>} رسالة نجاح
 */
export const sendOtpForEmailReset = async (email) => {
  try {
    const response = await api.post(
      `/api/users/email/reset?Email=${encodeURIComponent(email)}`,
      null,
      {
        headers: {
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
      "خطأ في إرسال رمز التحقق";
    throw new Error(errorMessage);
  }
};

/**
 * تحديث بيانات المستخدم
 * @param {number} userId - معرف المستخدم
 * @param {Object} data - بيانات التحديث
 * @param {string} data.email - البريد الإلكتروني (اختياري)
 * @param {string} data.userName - اسم المستخدم (اختياري)
 * @param {string} data.imageURL - رابط الصورة (اختياري)
 * @param {number} data.countryId - معرف الدولة (اختياري)
 * @param {number} data.universityId - معرف الجامعة (اختياري)
 * @param {string} data.otp - رمز التحقق (مطلوب فقط في حالة تغيير الإيميل)
 * @returns {Promise<string>} رسالة نجاح
 */
export const updateUser = async (userId, data) => {
  try {
    console.log("📤 Updating user:", userId, data);
    
    // بناء payload حسب curl command - يجب أن يحتوي على id في body
    const payload = {
      id: Number(userId),
      email: data.email || "",
      userName: data.userName || "",
      imageURL: data.imageURL || "",
      countryId: Number(data.countryId) || 0,
      universityId: Number(data.universityId) || 0,
      otp: data.otp !== undefined ? (data.otp || "") : "", // إضافة otp كـ string فارغ إذا لم يكن موجوداً
    };
    
    console.log("📤 Update payload:", JSON.stringify(payload, null, 2));
    
    const response = await api.put(
      `/api/users/${userId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "text/plain",
        },
      }
    );
    
    console.log("✅ User updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating user:", error);
    console.error("❌ Error details:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      url: error?.config?.url,
      method: error?.config?.method,
    });
    
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في تحديث بيانات المستخدم";
    throw new Error(errorMessage);
  }
};

/**
 * جلب معلومات مستخدم معين
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Object>} معلومات المستخدم
 */
export const getUserById = async (userId) => {
  try {
    console.log("📤 Fetching user by ID:", userId);
    console.log("📤 Token available:", !!localStorage.getItem("token"));
    
    const response = await api.get(`/api/users/${userId}`, {
      headers: {
        accept: "text/plain",
      },
    });
    
    console.log("✅ User data received:", response.data);
    
    if (!response.data) {
      throw new Error("لم يتم العثور على بيانات المستخدم");
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    console.error("❌ Error details:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      url: error?.config?.url,
      headers: error?.config?.headers,
    });
    
    // معالجة 404 بشكل خاص
    if (error?.response?.status === 404) {
      throw new Error("لم يتم العثور على المستخدم");
    }
    
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب معلومات المستخدم";
    throw new Error(errorMessage);
  }
};

/**
 * جلب أفضل المبرمجين (Top Coders)
 * @param {Object} filters - فلاتر البحث
 * @param {number} filters.CountryId - فلترة حسب الدولة (اختياري)
 * @param {string} filters.search - البحث بالاسم (اختياري)
 * @returns {Promise<Array>} قائمة أفضل المبرمجين
 */
export const getTopCoders = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.CountryId) {
      params.append("CountryId", filters.CountryId.toString());
    }
    if (filters.search) {
      params.append("search", filters.search);
    }

    const response = await api.get(
      `/api/users/top-coders/filter${params.toString() ? `?${params.toString()}` : ""}`,
      {
        headers: {
          accept: "text/plain",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب أفضل المبرمجين";
    throw new Error(errorMessage);
  }
};

// Functions for backward compatibility
export const loginUser = async (email, password) => {
  // سيتم استخدام authService بدلاً من ذلك
  const { login } = await import("./authService");
  return login(email, password);
};

export const sendOtp = async (email) => {
  // سيتم استخدام authService بدلاً من ذلك
  const { sendOtpForRegister } = await import("./authService");
  return sendOtpForRegister(email);
};

export const sendOtpForRestorePassword = async (email) => {
  // سيتم استخدام authService بدلاً من ذلك
  const { sendOtpForPasswordReset } = await import("./authService");
  return sendOtpForPasswordReset(email);
};

export const restorePassword = async (email, otp, newPassword) => {
  // سيتم استخدام authService بدلاً من ذلك
  const { confirmPasswordReset } = await import("./authService");
  return confirmPasswordReset({ email, otp, password: newPassword });
};

export const GetTopCoder = getTopCoders;

/**
 * رفع صورة المستخدم (للتوافق مع الكود القديم)
 * @param {File} imageFile - ملف الصورة
 * @param {string} currentImageURL - رابط الصورة الحالي (اختياري)
 * @returns {Promise<string>} رابط الصورة المرفوعة
 */
export const uploadUserImage = async (imageFile, currentImageURL = "") => {
  if (!imageFile) return currentImageURL;

  try {
    const { uploadImage } = await import("./uploadService");
    const result = await uploadImage(imageFile);
    const imageUrl = result?.url || result || currentImageURL;
    
    if (!imageUrl || imageUrl === currentImageURL) {
      throw new Error("فشل رفع الصورة: لم يتم الحصول على رابط الصورة");
    }
    
    return imageUrl;
  } catch (error) {
    console.error("❌ Error uploading user image:", error);
    // إعادة رمي الخطأ الأصلي إذا كان موجوداً
    if (error.message) {
      throw error;
    }
    throw new Error("خطأ في رفع الصورة");
  }
};

// ==================== Admin APIs ====================

/**
 * جلب جميع المستخدمين (للأدمن)
 * @returns {Promise<Array>} قائمة جميع المستخدمين
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get("/api/users", {
      headers: {
        accept: "*/*",
      },
    });
    return response.data || [];
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب المستخدمين";
    throw new Error(errorMessage);
  }
};

/**
 * إضافة مستخدم جديد (للأدمن)
 * @param {Object} userData - بيانات المستخدم
 * @param {string} userData.userName - اسم المستخدم
 * @param {string} userData.email - البريد الإلكتروني
 * @param {string} userData.password - كلمة المرور
 * @param {string} userData.role - الدور (user/admin)
 * @returns {Promise<Object>} بيانات المستخدم المُنشأ
 */
export const addUser = async (userData) => {
  try {
    const payload = {
      userName: userData.userName?.trim(),
      email: userData.email?.trim(),
      password: userData.password,
      role: userData.role || "user",
    };
    
    const response = await api.post("/api/Authantication/register", payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في إضافة المستخدم";
    throw new Error(errorMessage);
  }
};

/**
 * حذف مستخدم (للأدمن)
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  try {
    const numericUserId = Number(userId);
    if (isNaN(numericUserId) || numericUserId <= 0) {
      throw new Error("معرف المستخدم غير صحيح");
    }
    
    await api.delete(`/api/users/${numericUserId}`, {
      headers: {
        accept: "*/*",
      },
    });
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في حذف المستخدم";
    throw new Error(errorMessage);
  }
};
