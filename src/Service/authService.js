import api from "./api";

/**
 * Authentication Service - خدمة المصادقة
 * جميع endpoints المصادقة حسب التوثيق
 */

/**
 * إرسال OTP للتسجيل
 * @param {string} email - البريد الإلكتروني
 * @returns {Promise<string>} رسالة نجاح
 */
export const sendOtpForRegister = async (email) => {
  try {
    const response = await api.post(
      `/api/auth/otp?Email=${encodeURIComponent(email)}`,
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
 * إنشاء حساب جديد (Register)
 * @param {Object} data - بيانات التسجيل
 * @param {string} data.email - البريد الإلكتروني
 * @param {string} data.password - كلمة المرور
 * @param {string} data.userName - اسم المستخدم
 * @param {number} data.countryId - معرف الدولة
 * @param {string} data.otp - رمز التحقق OTP
 * @param {File} imageFile - صورة المستخدم (اختياري)
 * @returns {Promise<Object>} بيانات المستخدم والـ Token
 */
export const register = async (data, imageFile = null) => {
  try {
    const formData = new FormData();
    
    // إضافة البيانات كـ query parameters
    const params = new URLSearchParams({
      Email: data.email,
      Password: data.password,
      UserName: data.userName,
      CountryId: data.countryId.toString(),
      otp: data.otp,
    });

    // إضافة الصورة إذا كانت موجودة
    if (imageFile) {
      formData.append("Image", imageFile);
    }

    const response = await api.post(
      `/api/auth/register?${params.toString()}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في إنشاء الحساب";
    throw new Error(errorMessage);
  }
};

/**
 * تسجيل الدخول (Login)
 * @param {string} email - البريد الإلكتروني
 * @param {string} password - كلمة المرور
 * @returns {Promise<Object>} بيانات المستخدم والـ Token
 * 
 * Response Structure:
 * - حالة 1: يحتاج OTP
 *   {
 *     otpRequired: true,
 *     message: "تم إرسال رمز التحقق إلى بريدك"
 *   }
 * 
 * - حالة 2: تسجيل دخول ناجح
 *   {
 *     isAuthenticated: true,
 *     token: "eyJhbGci...",
 *     responseUserDTO: {
 *       id: "123",
 *       userName: "أحمد",
 *       email: "user@example.com",
 *       role: "Admin" | "User",
 *       imageUrl: "https://..."
 *     }
 *   }
 */
export const login = async (email, password) => {
  try {
    console.log("📤 Logging in:", { email: email?.substring(0, 10) + "..." });
    
    const response = await api.post(
      "/api/auth/login",
      {
        Email: email,
        Password: password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    
    const data = response.data;
    console.log("✅ Login response:", {
      isAuthenticated: data?.isAuthenticated,
      otpRequired: data?.otpRequired,
      hasToken: !!data?.token,
      role: data?.responseUserDTO?.role,
    });
    
    // حفظ Token تلقائياً إذا كان موجوداً
    if (data?.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("token-expiration", Date.now() + 1000 * 60 * 60); // ساعة
      
      // حفظ role إذا كان موجوداً (من جميع الأماكن المحتملة)
      const role = data?.responseUserDTO?.role || 
                   data?.responseUserDTO?.Role || 
                   data?.role || 
                   data?.Role;
      
      if (role) {
        // Normalize role
        let normalizedRole = String(role).trim();
        if (normalizedRole.toLowerCase() === "admin") {
          normalizedRole = "Admin";
        } else if (normalizedRole.toLowerCase() === "user") {
          normalizedRole = "User";
        }
        localStorage.setItem("role", normalizedRole);
        console.log("💾 Saved role to localStorage:", normalizedRole);
      }
      
      // حفظ userName إذا كان موجوداً
      if (data?.responseUserDTO?.userName) {
        localStorage.setItem("userName", data.responseUserDTO.userName);
      }
      
      // حفظ idUser إذا كان موجوداً
      if (data?.responseUserDTO?.id) {
        localStorage.setItem("idUser", data.responseUserDTO.id);
      }
    }
    
    return data;
  } catch (error) {
    console.error("❌ Login error:", error?.response?.data || error?.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "خطأ في تسجيل الدخول، حاول مرة أخرى لاحقاً";
    throw new Error(errorMessage);
  }
};

/**
 * إرسال OTP لاستعادة كلمة المرور
 * @param {string} email - البريد الإلكتروني
 * @returns {Promise<string>} رسالة نجاح
 */
export const sendOtpForPasswordReset = async (email) => {
  try {
    const response = await api.post(
      `/api/auth/password/reset?Email=${encodeURIComponent(email)}`,
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
 * تأكيد استعادة كلمة المرور
 * @param {Object} data - بيانات استعادة كلمة المرور
 * @param {string} data.email - البريد الإلكتروني
 * @param {string} data.otp - رمز التحقق OTP
 * @param {string} data.password - كلمة المرور الجديدة
 * @returns {Promise<string>} رسالة نجاح
 */
export const confirmPasswordReset = async (data) => {
  try {
    const response = await api.post(
      "/api/auth/password/reset/confirm",
      {
        email: data.email,
        otp: data.otp,
        password: data.password,
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
      "خطأ في استعادة كلمة المرور";
    throw new Error(errorMessage);
  }
};

/**
 * تحديث Token (Refresh Token)
 * @returns {Promise<Object>} بيانات المستخدم والـ Token الجديد
 */
export const refreshToken = async () => {
  try {
    const response = await api.get("/api/auth/refresh-token", {
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
      "خطأ في تحديث Token";
    throw new Error(errorMessage);
  }
};

/**
 * إلغاء Token (تسجيل الخروج)
 * @param {string} token - الـ Token المراد إلغاؤه
 * @returns {Promise<string>} رسالة نجاح
 */
export const revokeToken = async (token) => {
  try {
    const response = await api.post(
      "/api/auth/revoke-token",
      { token },
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
      "خطأ في تسجيل الخروج";
    throw new Error(errorMessage);
  }
};

/**
 * التحقق من OTP (Verify OTP)
 * @param {string} email - البريد الإلكتروني
 * @param {string} otp - رمز التحقق
 * @returns {Promise<Object>} نتيجة التحقق
 */
export const verifyOtp = async (email, otp) => {
  try {
    console.log("📤 Verifying OTP for:", email?.substring(0, 10) + "...");
    
    const response = await api.post(
      "/api/Authantication/verify-otp",
      {
        email: email,
        otp: otp,
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );
    
    console.log("✅ OTP verification response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ OTP verification error:", error?.response?.data || error?.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في التحقق من OTP";
    throw new Error(errorMessage);
  }
};

